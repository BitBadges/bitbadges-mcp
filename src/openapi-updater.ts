#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OpenAPIOperation {
  operationId: string;
  summary: string;
  description: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: any;
    description?: string;
  }>;
  requestBody?: {
    content: {
      'application/json': {
        schema: any;
      };
    };
  };
  responses: Record<string, any>;
  tags?: string[];
}

interface OpenAPISpec {
  openapi: string;
  info: any;
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    schemas?: Record<string, any>;
  };
}

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/BitBadges/bitbadgesjs/main/packages/bitbadgesjs-sdk/openapi/combined_processed.yaml';

async function fetchOpenAPISpec(): Promise<OpenAPISpec> {
  console.log('🔄 Fetching latest OpenAPI spec from GitHub...');

  try {
    const response = await fetch(GITHUB_RAW_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const yamlText = await response.text();
    const spec = yaml.load(yamlText) as OpenAPISpec;

    console.log('✅ Successfully fetched OpenAPI spec');
    console.log(`📊 Found ${Object.keys(spec.paths).length} endpoints`);

    return spec;
  } catch (error) {
    console.error('❌ Failed to fetch OpenAPI spec:', error);
    throw error;
  }
}

function generateMCPTools(spec: OpenAPISpec): Array<any> {
  const tools: Array<any> = [];

  // Always include the configure tool
  tools.push({
    name: 'bitbadges_configure',
    description: 'Configure the BitBadges API key and base URL',
    inputSchema: {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          description: 'Your BitBadges API key from the developer portal'
        },
        baseUrl: {
          type: 'string',
          description: 'Base URL for the BitBadges API (optional, defaults to https://api.bitbadges.io)'
        }
      },
      required: ['apiKey']
    }
  });

  // Process each path in the OpenAPI spec
  for (const [pathPattern, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (typeof operation !== 'object' || !operation.operationId) continue;

      const toolName = `bitbadges_${operation.operationId}`;

      // Skip if tool already exists or if it's an internal/auth endpoint
      if (tools.find((t) => t.name === toolName)) continue;
      if (pathPattern.includes('/auth/') || pathPattern.includes('/oauth/')) continue;

      // Generate input schema based on parameters and request body
      const inputSchema: any = {
        type: 'object',
        properties: {},
        required: []
      };

      // Add path parameters
      if (operation.parameters) {
        for (const param of operation.parameters) {
          if (param.in === 'path' || param.in === 'query') {
            inputSchema.properties[param.name] = {
              type: param.schema?.type || 'string',
              description: param.description || `${param.name} parameter`
            };

            if (param.required) {
              inputSchema.required.push(param.name);
            }
          }
        }
      }

      // Add request body schema
      if (operation.requestBody?.content?.['application/json']?.schema) {
        const bodySchema = operation.requestBody.content['application/json'].schema;

        if (bodySchema.properties) {
          Object.assign(inputSchema.properties, bodySchema.properties);
          if (bodySchema.required) {
            inputSchema.required.push(...bodySchema.required);
          }
        } else {
          // If the entire body is the schema, add it as a single property
          inputSchema.properties.body = bodySchema;
          inputSchema.required.push('body');
        }
      }

      const tool = {
        name: toolName,
        description: operation.summary || operation.description || `Execute ${operation.operationId}`,
        inputSchema: inputSchema,
        metadata: {
          path: pathPattern,
          method: method.toUpperCase(),
          operationId: operation.operationId,
          tags: operation.tags || []
        }
      };

      tools.push(tool);
    }
  }

  console.log(`🔧 Generated ${tools.length} MCP tools`);
  return tools;
}

function generateToolHandlers(tools: Array<any>): string {
  const handlers: string[] = [];

  for (const tool of tools) {
    if (tool.name === 'bitbadges_configure') continue; // Skip configure, it's handled separately

    const { path: pathPattern, method, operationId } = tool.metadata;

    // Convert path parameters like {id} to :id for our API calls
    let endpoint = pathPattern.replace(/\{([^}]+)\}/g, '${args?.$1}');

    // Remove /api/v0 prefix if present since we add it in makeApiRequest
    endpoint = endpoint.replace(/^\/api\/v[0-9]+/, '');

    const handlerCode = `
      case '${tool.name}': {
        const endpoint = \`${endpoint}\`;
        const response = await makeApiRequest(endpoint, '${method}', ${method === 'GET' ? 'undefined' : 'args || {}'});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }`;

    handlers.push(handlerCode);
  }

  return handlers.join('\n');
}

async function updateMCPServer(tools: Array<any>): Promise<void> {
  console.log('🔄 Updating MCP server with new tools...');

  const serverPath = path.join(__dirname, '../src/index.ts');
  const toolHandlers = generateToolHandlers(tools);

  // Generate the tools array code
  const toolsCode = `const tools: Tool[] = ${JSON.stringify(tools, null, 2)};`;

  // Generate the complete server code
  const serverCode = `#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosRequestConfig } from 'axios';
import { z } from 'zod';

const server = new Server(
  {
    name: 'bitbadges-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Configuration
const DEFAULT_BASE_URL = 'https://api.bitbadges.io';
const API_VERSION = 'v0';

// Configuration schema
const ConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  baseUrl: z.string().url().optional().default(DEFAULT_BASE_URL)
});

type Config = z.infer<typeof ConfigSchema>;

// Global configuration
let config: Config | null = null;

// Helper function to make API requests
async function makeApiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  queryParams?: Record<string, any>
): Promise<any> {
  if (!config) {
    throw new Error('API key not configured. Use bitbadges_configure tool first.');
  }

  const url = new URL(\`/api/\${API_VERSION}\${endpoint}\`, config.baseUrl);

  // Add query parameters
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const requestConfig: AxiosRequestConfig = {
    method,
    url: url.toString(),
    headers: {
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json'
    },
    timeout: 30000 // 30 second timeout
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    requestConfig.data = data;
  }

  try {
    const response = await axios(requestConfig);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(\`API Error (\${error.response.status}): \${error.response.data?.errorMessage || error.response.statusText}\`);
    } else if (error.request) {
      throw new Error('Network Error: No response received from API');
    } else {
      throw new Error(\`Request Error: \${error.message}\`);
    }
  }
}

// Tool definitions (auto-generated from OpenAPI spec)
${toolsCode}

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'bitbadges_configure': {
        const parsed = ConfigSchema.parse(args);
        config = parsed;
        return {
          content: [
            {
              type: 'text',
              text: \`BitBadges API configured successfully with base URL: \${config.baseUrl}\`
            }
          ]
        };
      }
${toolHandlers}

      default:
        throw new Error(\`Unknown tool: \${name}\`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: \`Error: \${error.message}\`
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('BitBadges MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});`;

  await fs.writeFile(serverPath, serverCode);
  console.log('✅ Updated MCP server with auto-generated tools');
}

async function saveOpenAPISpec(spec: OpenAPISpec): Promise<void> {
  const specPath = path.join(__dirname, '../openapi-spec.yaml');
  const yamlContent = yaml.dump(spec);
  await fs.writeFile(specPath, yamlContent);
  console.log('💾 Saved OpenAPI spec locally');
}

async function main() {
  try {
    console.log('🚀 Starting OpenAPI spec update process...\n');

    // Fetch the latest spec
    const spec = await fetchOpenAPISpec();

    // Save it locally
    await saveOpenAPISpec(spec);

    // Generate MCP tools
    const tools = generateMCPTools(spec);

    // Update the MCP server
    await updateMCPServer(tools);

    console.log('\n🎉 Successfully updated BitBadges MCP server!');
    console.log(`📊 Generated ${tools.length} tools from OpenAPI spec`);
    console.log('🔄 Rebuild the server with: npm run build');
  } catch (error) {
    console.error('\n❌ Update process failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fetchOpenAPISpec, generateMCPTools, updateMCPServer };
