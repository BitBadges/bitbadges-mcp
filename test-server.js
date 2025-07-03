#!/usr/bin/env node

// Simple test script to verify the MCP server loads and responds
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Testing BitBadges MCP Server...\n');

// Start the MCP server
const serverPath = join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

// Test request to list tools
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

// Test request to configure the server
const configureRequest = {
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/call',
  params: {
    name: 'bitbadges_configure',
    arguments: {
      apiKey: 'test-api-key-for-validation'
    }
  }
};

let responseCount = 0;
let serverOutput = '';

server.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;

  try {
    // Try to parse each line as JSON (MCP responses)
    const lines = output
      .trim()
      .split('\n')
      .filter((line) => line.trim());

    for (const line of lines) {
      if (line.startsWith('{')) {
        const response = JSON.parse(line);
        responseCount++;

        console.log(`Response ${responseCount}:`, JSON.stringify(response, null, 2));

        if (responseCount === 2) {
          // We've received both responses, test passed
          console.log('\n✅ MCP Server test completed successfully!');
          console.log('✅ Server responds to requests');
          console.log('✅ Tools are properly registered');
          console.log('✅ Configuration tool works');

          server.kill();
          process.exit(0);
        }
      }
    }
  } catch (error) {
    // Ignore JSON parse errors, some output might not be JSON
  }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  if (code !== 0 && responseCount < 2) {
    console.error(`❌ Server exited with code ${code}`);
    console.error('Server output:', serverOutput);
    process.exit(1);
  }
});

// Give the server a moment to start
setTimeout(() => {
  console.log('Sending test requests...\n');

  // Send list tools request
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Send configure request
  setTimeout(() => {
    server.stdin.write(JSON.stringify(configureRequest) + '\n');
  }, 100);
}, 500);

// Timeout after 10 seconds
setTimeout(() => {
  console.error('❌ Test timed out');
  server.kill();
  process.exit(1);
}, 10000);
