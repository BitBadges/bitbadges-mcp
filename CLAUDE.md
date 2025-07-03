# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **BitBadges MCP (Model Context Protocol) Server** that provides AI assistants with access to the BitBadges blockchain API. The project consists of:

1. **MCP Server** (`src/index.ts`) - Main server implementing MCP protocol with 13 BitBadges API tools
2. **OpenAPI Updater** (`src/openapi-updater.ts`) - Auto-generates MCP tools from BitBadges OpenAPI spec
3. **Web Interface** (`web-interface/`) - Express.js server with Socket.IO for real-time testing

## Architecture

### MCP Server (src/index.ts)
- **Framework**: @modelcontextprotocol/sdk with stdio transport
- **Core Pattern**: Tool-based API proxy with configuration management
- **Key Components**:
  - `makeApiRequest()` - Central HTTP client with x-api-key auth
  - Global `config` object for API key/baseURL storage
  - 13 tools covering accounts, collections, search, claims, transactions, etc.

### Auto-Generation System (src/openapi-updater.ts)
- Fetches OpenAPI spec from BitBadges GitHub repository
- Generates MCP tool definitions and request handlers
- Overwrites `src/index.ts` with updated tools
- **Important**: Manual edits to `src/index.ts` will be lost when regenerating

### Web Interface (web-interface/src/server.ts)
- **Architecture**: Express.js + Socket.IO + child_process MCP integration
- **Key Classes**:
  - `MCPServerManager` - Manages MCP server subprocess via stdio
  - Real-time chat with simple command parsing
  - REST API endpoints for direct tool calls

## Common Development Commands

### Building and Running
```bash
# Build MCP server
npm run build

# Development mode (watch for changes)
npm run dev

# Start MCP server
npm start
```

### Web Interface Development
```bash
# Navigate to web interface
cd web-interface

# Install dependencies
npm install

# Build and start web interface
npm run build
npm start
```

### OpenAPI Updates
```bash
# Update tools from latest BitBadges OpenAPI spec
npm run update-openapi  # (if script exists)
# OR run directly:
node dist/openapi-updater.js
```

## Development Workflow

1. **Adding New Tools**: Use `openapi-updater.ts` rather than manually editing `src/index.ts`
2. **Testing**: Use the web interface at `http://localhost:3001` for interactive testing
3. **API Key**: Required for all tools except `bitbadges_configure` - get from BitBadges Developer Portal
4. **MCP Integration**: Server communicates via stdio - use `mcp.json` for MCP client configuration

## Tool Categories

- **Configuration**: `bitbadges_configure` (API key setup)
- **Core Data**: `bitbadges_get_account`, `bitbadges_get_collections`, `bitbadges_get_status`
- **Search**: `bitbadges_search`
- **Lists & Claims**: `bitbadges_get_address_lists`, `bitbadges_get_claims`, `bitbadges_get_attestations`
- **Transactions**: `bitbadges_broadcast_tx`, `bitbadges_simulate_tx`
- **Maps**: `bitbadges_get_maps`

## Key Files

- `src/index.ts` - Main MCP server (auto-generated, don't edit manually)
- `src/openapi-updater.ts` - Tool generation system
- `mcp.json` - MCP client configuration
- `web-interface/src/server.ts` - Test interface server
- `openapi-spec.yaml` - Cached OpenAPI specification

## Important Notes

- All API requests require authentication via `x-api-key` header
- 30-second timeout on all API requests
- Rate limiting varies by API key tier (10/10s free, up to 60k/min enterprise)
- Error handling includes network, API, and validation errors
- Web interface includes auto-restart for MCP server process