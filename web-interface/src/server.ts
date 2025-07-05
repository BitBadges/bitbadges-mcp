import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// MCP Server Management
class MCPServerManager {
  private mcpProcess: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, (response: any) => void>();

  constructor() {
    this.startMCPServer();
  }

  private startMCPServer() {
    const mcpServerPath = path.join(__dirname, '../../dist/index.js');
    console.log('Starting MCP server at:', mcpServerPath);
    
    this.mcpProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (!this.mcpProcess.stdout || !this.mcpProcess.stdin) {
      throw new Error('Failed to create MCP server process streams');
    }

    // Handle MCP server output
    this.mcpProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('MCP Output:', output);
      
      // Try to parse JSON responses
      const lines = output.trim().split('\n').filter((line: string) => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('{')) {
          try {
            const response = JSON.parse(line);
            console.log('Parsed MCP response:', response);
            
            if (response.id && this.pendingRequests.has(response.id)) {
              const resolver = this.pendingRequests.get(response.id);
              if (resolver) {
                resolver(response);
                this.pendingRequests.delete(response.id);
              }
            }
          } catch (error) {
            console.error('Error parsing MCP response:', error);
          }
        }
      }
    });

    this.mcpProcess.stderr?.on('data', (data) => {
      console.log('MCP Server:', data.toString());
    });

    this.mcpProcess.on('close', (code) => {
      console.log(`MCP server exited with code ${code}`);
      this.mcpProcess = null;
      
      // Restart after a delay
      setTimeout(() => {
        console.log('Restarting MCP server...');
        this.startMCPServer();
      }, 2000);
    });

    this.mcpProcess.on('error', (error) => {
      console.error('MCP server error:', error);
    });
  }

  async sendRequest(method: string, params: any = {}): Promise<any> {
    if (!this.mcpProcess?.stdin) {
      throw new Error('MCP server not available');
    }

    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    console.log('Sending MCP request:', request);

    return new Promise((resolve, reject) => {
      if (!this.mcpProcess?.stdin) {
        reject(new Error('MCP server not available'));
        return;
      }

      this.pendingRequests.set(id, resolve);
      
      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);

      try {
        this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');
      } catch (error) {
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  async listTools() {
    return this.sendRequest('tools/list');
  }

  async callTool(name: string, arguments_: any) {
    return this.sendRequest('tools/call', { name, arguments: arguments_ });
  }

  async callToolWithApiKey(name: string, arguments_: any, apiKey?: string) {
    // If API key is provided, configure it first (unless it's the configure tool itself)
    if (apiKey && name !== 'bitbadges_configure') {
      await this.sendRequest('tools/call', { name: 'bitbadges_configure', arguments: { apiKey } });
    }
    return this.sendRequest('tools/call', { name, arguments: arguments_ });
  }

  stop() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
  }
}

const mcpManager = new MCPServerManager();

// Chat state management
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCall?: {
    name: string;
    arguments: any;
    result?: any;
    error?: string;
  };
}

// Session-based chat histories - each socket gets its own chat history
const chatSessions = new Map<string, ChatMessage[]>();

// Session-based API key storage - each socket gets its own API key
const apiKeySessions = new Map<string, string>();

// Socket.IO connection handling
io.on('connection', (socket: any) => {
  console.log('Client connected:', socket.id);

  // Initialize empty chat history for new session
  chatSessions.set(socket.id, []);
  
  // Send empty chat history to new clients (fresh conversation)
  socket.emit('chat_history', []);
  
  // Check if API key is configured for this session
  const hasApiKey = apiKeySessions.has(socket.id);
  socket.emit('api_key_status', { configured: hasApiKey });

  // Handle chat messages
  socket.on('chat_message', async (data: { message: string }) => {
    const sessionHistory = chatSessions.get(socket.id) || [];
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: data.message,
      timestamp: new Date()
    };

    sessionHistory.push(userMessage);
    chatSessions.set(socket.id, sessionHistory);
    socket.emit('new_message', userMessage);

    try {
      // Process the message and determine if it's a tool call
      const response = await processUserMessage(data.message, socket.id);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        toolCall: response.toolCall
      };

      sessionHistory.push(assistantMessage);
      chatSessions.set(socket.id, sessionHistory);
      socket.emit('new_message', assistantMessage);

    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      };

      sessionHistory.push(errorMessage);
      chatSessions.set(socket.id, sessionHistory);
      socket.emit('new_message', errorMessage);
    }
  });

  // Handle direct tool calls
  socket.on('tool_call', async (data: { toolName: string; arguments: any }) => {
    const sessionHistory = chatSessions.get(socket.id) || [];
    
    try {
      const result = await mcpManager.callToolWithApiKey(data.toolName, data.arguments, apiKeySessions.get(socket.id));
      
      const toolMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Tool "${data.toolName}" executed successfully`,
        timestamp: new Date(),
        toolCall: {
          name: data.toolName,
          arguments: data.arguments,
          result: result
        }
      };

      sessionHistory.push(toolMessage);
      chatSessions.set(socket.id, sessionHistory);
      socket.emit('new_message', toolMessage);

    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: `Tool error: ${error.message}`,
        timestamp: new Date(),
        toolCall: {
          name: data.toolName,
          arguments: data.arguments,
          error: error.message
        }
      };

      sessionHistory.push(errorMessage);
      chatSessions.set(socket.id, sessionHistory);
      socket.emit('new_message', errorMessage);
    }
  });

  // Handle tool list request
  socket.on('get_tools', async () => {
    try {
      const tools = await mcpManager.listTools();
      socket.emit('tools_list', tools);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  // Handle API key configuration
  socket.on('configure_api_key', (data: { apiKey: string }) => {
    if (data.apiKey && data.apiKey.trim()) {
      apiKeySessions.set(socket.id, data.apiKey.trim());
      socket.emit('api_key_configured', { success: true });
      
      // Add system message about successful configuration
      const sessionHistory = chatSessions.get(socket.id) || [];
      const configMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'system',
        content: '🔑 API key configured successfully! You can now use BitBadges tools.',
        timestamp: new Date()
      };
      sessionHistory.push(configMessage);
      chatSessions.set(socket.id, sessionHistory);
      socket.emit('new_message', configMessage);
    } else {
      socket.emit('api_key_configured', { success: false, error: 'Invalid API key' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Clean up session data when client disconnects
    chatSessions.delete(socket.id);
    apiKeySessions.delete(socket.id);
  });
});

// Process user messages and determine tool calls
async function processUserMessage(message: string, socketId: string): Promise<{ content: string; toolCall?: any }> {
  const userApiKey = apiKeySessions.get(socketId);
  const lowerMessage = message.toLowerCase();

  // Simple command parsing
  if (lowerMessage.includes('configure') && lowerMessage.includes('api key')) {
    const apiKeyMatch = message.match(/api[_\s]?key[:\s]+([a-zA-Z0-9\-_]+)/i);
    if (apiKeyMatch) {
      const apiKey = apiKeyMatch[1];
      apiKeySessions.set(socketId, apiKey);
      const result = await mcpManager.callTool('bitbadges_configure', { apiKey });
      return {
        content: 'API key configured successfully! You can now use BitBadges tools.',
        toolCall: {
          name: 'bitbadges_configure',
          arguments: { apiKey: '***' }, // Hide the actual key
          result
        }
      };
    }
    return {
      content: 'Please provide your API key in the format: "configure api key YOUR_API_KEY"'
    };
  }

  // Check if API key is configured for non-configure commands
  if (!userApiKey && !lowerMessage.includes('configure')) {
    return {
      content: '🔑 Please configure your API key first using the setup form above or by typing: "configure api key YOUR_API_KEY"'
    };
  }

  if (lowerMessage.includes('status') || lowerMessage.includes('health')) {
    const result = await mcpManager.callToolWithApiKey('bitbadges_get_status', {}, userApiKey);
    return {
      content: 'Fetched BitBadges API status.',
      toolCall: {
        name: 'bitbadges_get_status',
        arguments: {},
        result
      }
    };
  }

  if (lowerMessage.includes('search')) {
    const searchMatch = message.match(/search[:\s]+(.+)/i);
    if (searchMatch) {
      const searchValue = searchMatch[1].trim();
      const result = await mcpManager.callToolWithApiKey('bitbadges_search', { searchValue }, userApiKey);
      return {
        content: `Searched for "${searchValue}"`,
        toolCall: {
          name: 'bitbadges_search',
          arguments: { searchValue },
          result
        }
      };
    }
    return {
      content: 'Please specify what to search for: "search YOUR_QUERY"'
    };
  }

  if (lowerMessage.includes('account') || lowerMessage.includes('user')) {
    const addressMatch = message.match(/bb1[a-z0-9]+/i);
    const usernameMatch = message.match(/username[:\s]+([a-zA-Z0-9_]+)/i);
    
    if (addressMatch) {
      const address = addressMatch[0];
      const result = await mcpManager.callToolWithApiKey('bitbadges_get_account', { address }, userApiKey);
      return {
        content: `Fetched account information for ${address}`,
        toolCall: {
          name: 'bitbadges_get_account',
          arguments: { address },
          result
        }
      };
    } else if (usernameMatch) {
      const username = usernameMatch[1];
      const result = await mcpManager.callToolWithApiKey('bitbadges_get_account', { username }, userApiKey);
      return {
        content: `Fetched account information for username: ${username}`,
        toolCall: {
          name: 'bitbadges_get_account',
          arguments: { username },
          result
        }
      };
    }
    return {
      content: 'Please provide an address (bb1...) or username to look up an account.'
    };
  }

  if (lowerMessage.includes('collection')) {
    const collectionMatch = message.match(/collection[:\s]+(\d+)/i);
    if (collectionMatch) {
      const collectionId = collectionMatch[1];
      const result = await mcpManager.callToolWithApiKey('bitbadges_get_collections', {
        collectionsToFetch: [{ collectionId }]
      }, userApiKey);
      return {
        content: `Fetched information for collection ${collectionId}`,
        toolCall: {
          name: 'bitbadges_get_collections',
          arguments: { collectionsToFetch: [{ collectionId }] },
          result
        }
      };
    }
    return {
      content: 'Please specify a collection ID: "collection 1"'
    };
  }

  // Default response with available commands
  if (!userApiKey) {
    return {
      content: '🔑 Please configure your API key first using the setup form above or by typing: "configure api key YOUR_API_KEY"'
    };
  }

  return {
    content: `I can help you interact with BitBadges! Try these commands:

📊 **Status & Search:**
- "status" - Check API health
- "search QUERY" - Search collections/accounts

👤 **Accounts:**
- "account bb1..." - Look up by address
- "account username USERNAME" - Look up by username

🏆 **Collections:**
- "collection 1" - Get collection info

Or use the tool interface below to make direct API calls!`
  };
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/tools', async (req, res) => {
  try {
    const tools = await mcpManager.listTools();
    res.json(tools);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tool/:toolName', async (req, res) => {
  try {
    const { toolName } = req.params;
    const { arguments: args } = req.body;
    
    const result = await mcpManager.callTool(toolName, args);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  mcpManager.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  mcpManager.stop();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`🚀 BitBadges MCP Web Interface running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready for real-time chat`);
});