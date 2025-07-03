#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { z } from 'zod';

const server = new Server(
    {
        name: 'bitbadges-mcp',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Configuration
const DEFAULT_BASE_URL = 'https://api.bitbadges.io';
const API_VERSION = 'v0';

// Configuration schema
const ConfigSchema = z.object({
    apiKey: z.string().min(1, 'API key is required'),
    baseUrl: z.string().url().optional().default(DEFAULT_BASE_URL),
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
        throw new Error(
            'API key not configured. Use bitbadges_configure tool first.'
        );
    }

    const url = new URL(`/api/${API_VERSION}${endpoint}`, config.baseUrl);

    // Add query parameters
    if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, String(value));
            }
        });
    }

    const axiosConfig = {
        method,
        url: url.toString(),
        headers: {
            'x-api-key': config.apiKey,
            'Content-Type': 'application/json',
        },
        data,
        timeout: 30000,
    };

    try {
        const response = await axios(axiosConfig);
        return response.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(
                `API Error ${error.response.status}: ${
                    error.response.data?.message || error.response.statusText
                }`
            );
        } else if (error.request) {
            throw new Error('Network error: No response received from API');
        } else {
            throw new Error(`Request error: ${error.message}`);
        }
    }
}

// Configure tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'bitbadges_configure',
                description: 'Configure the BitBadges API connection',
                inputSchema: {
                    type: 'object',
                    properties: {
                        apiKey: {
                            type: 'string',
                            description: 'Your BitBadges API key',
                        },
                        baseUrl: {
                            type: 'string',
                            description:
                                'Base URL for BitBadges API (optional, defaults to https://api.bitbadges.io)',
                        },
                    },
                    required: ['apiKey'],
                },
            },
            {
                name: 'bitbadges_get_status',
                description: 'Get BitBadges API status',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'bitbadges_configure':
                const validatedConfig = ConfigSchema.parse(args);
                config = validatedConfig;
                return {
                    content: [
                        {
                            type: 'text',
                            text: `BitBadges API configured successfully with base URL: ${config.baseUrl}`,
                        },
                    ],
                };

            case 'bitbadges_get_status':
                const statusResponse = await makeApiRequest('/status');
                return {
                    content: [
                        {
                            type: 'text',
                            text: `BitBadges API Status: ${JSON.stringify(
                                statusResponse,
                                null,
                                2
                            )}`,
                        },
                    ],
                };

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error: any) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

// HTTP Server setup
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: any, res: any) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// SSE endpoint for MCP
app.get('/sse', async (req: any, res: any) => {
    const transport = new SSEServerTransport('/sse', res);
    await server.connect(transport);
});

// Start HTTP server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`BitBadges MCP server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
});
