# BitBadges MCP Server

A Model Context Protocol (MCP) server that provides access to the BitBadges API for AI assistants and other MCP clients.

## Overview

This MCP server exposes the BitBadges blockchain and indexer API through a set of tools that can be used by Claude and other AI assistants. It provides access to:

- Account and user information
- Badge collections and metadata
- Claims and attestations
- Address lists and maps
- Transaction broadcasting and simulation
- Search functionality
- Blockchain status information

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Configuration

Before using any BitBadges API tools, you must configure your API key using the `bitbadges_configure` tool.

You can obtain your API key from the [BitBadges Developer Portal](https://bitbadges.io/developer).

## Available Tools

### Configuration

- **`bitbadges_configure`**: Configure API key and base URL

### Core Data Access

- **`bitbadges_get_account`**: Get account information by address or username
- **`bitbadges_get_accounts`**: Get multiple accounts with detailed views (batch operation)
- **`bitbadges_get_collections`**: Get collection information with metadata and views
- **`bitbadges_get_status`**: Get API and blockchain status

### Search & Discovery

- **`bitbadges_search`**: Search for collections, badges, or accounts

### Lists & Claims

- **`bitbadges_get_address_lists`**: Get address lists with pagination
- **`bitbadges_get_claims`**: Get claim information with filtering
- **`bitbadges_get_maps`**: Get map data for key-value storage
- **`bitbadges_get_attestations`**: Get attestation information

### Transactions

- **`bitbadges_broadcast_tx`**: Broadcast a transaction to the blockchain
- **`bitbadges_simulate_tx`**: Simulate a transaction without broadcasting

## Usage Examples

### Basic Account Lookup
```json
{
  "tool": "bitbadges_get_account",
  "arguments": {
    "address": "bb1..."
  }
}
```

### Collection with Metadata
```json
{
  "tool": "bitbadges_get_collections",
  "arguments": {
    "collectionsToFetch": [
      {
        "collectionId": "1",
        "metadataToFetch": {
          "badgeIds": [
            {
              "start": "1",
              "end": "10"
            }
          ]
        },
        "fetchTotalBalances": true
      }
    ]
  }
}
```

### Search for Collections
```json
{
  "tool": "bitbadges_search",
  "arguments": {
    "searchValue": "BitBadges"
  }
}
```

## Development

### Run in Development Mode
```bash
npm run dev
```

This will start the TypeScript compiler in watch mode, automatically rebuilding when files change.

### Building
```bash
npm run build
```

### Running
```bash
npm start
```

## Error Handling

The server provides detailed error messages for common issues:

- **Configuration errors**: When API key is missing or invalid
- **Network errors**: When unable to connect to the BitBadges API
- **API errors**: When the API returns an error response with details
- **Validation errors**: When tool arguments don't match the expected schema

## Rate Limiting

The BitBadges API implements rate limiting based on your API key tier:

- **Free tier**: 10 requests per 10 seconds
- **Basic tier**: 1000 requests per minute
- **Pro tier**: 3000 requests per minute
- **Enterprise tier**: 60000 requests per minute

The MCP server includes a 30-second timeout for all API requests.

## API Documentation

For complete API documentation, see:
- [BitBadges API Documentation](https://docs.bitbadges.io/for-developers/bitbadges-api/api)
- [OpenAPI Specification](../combined_processed.yaml)

## Architecture

The MCP server is built using:
- **@modelcontextprotocol/sdk**: Core MCP functionality
- **axios**: HTTP client for API requests
- **zod**: Schema validation
- **TypeScript**: Type safety and development experience

## Contributing

This MCP server is based on the BitBadges Express.js backend and mirrors its API structure. When adding new tools, ensure they:

1. Follow the existing naming convention (`bitbadges_*`)
2. Include proper input validation using JSON Schema
3. Handle errors gracefully
4. Provide clear descriptions and examples
5. Match the corresponding OpenAPI specification

## License

MIT