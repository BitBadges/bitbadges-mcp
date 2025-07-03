# BitBadges MCP Server Usage Guide

## Quick Start

1. **Install and Build**:
```bash
npm install
npm run build
```

2. **Configure Your MCP Client**

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "bitbadges": {
      "command": "node",
      "args": ["/path/to/bitbadges-mcp/dist/index.js"]
    }
  }
}
```

3. **Get Your API Key**

Visit [BitBadges Developer Portal](https://bitbadges.io/developer) to get your API key.

4. **Configure the Server**

First tool call should always be configuration:

```json
{
  "tool": "bitbadges_configure",
  "arguments": {
    "apiKey": "your-api-key-here"
  }
}
```

## Common Use Cases

### 1. Look Up User Information

```json
{
  "tool": "bitbadges_get_account",
  "arguments": {
    "address": "bb1qxy2mlz19ecl4xyqx9krq2sg8wkv30dzn4v7qm6"
  }
}
```

Or by username:
```json
{
  "tool": "bitbadges_get_account",
  "arguments": {
    "username": "trevormil"
  }
}
```

### 2. Get Collection Information

Basic collection info:
```json
{
  "tool": "bitbadges_get_collections",
  "arguments": {
    "collectionsToFetch": [
      {
        "collectionId": "1"
      }
    ]
  }
}
```

Collection with badge metadata:
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
              "end": "20"
            }
          ]
        },
        "fetchTotalBalances": true
      }
    ]
  }
}
```

### 3. Search for Content

```json
{
  "tool": "bitbadges_search",
  "arguments": {
    "searchValue": "developer"
  }
}
```

### 4. Get Detailed Account Views

Get account with specific activity views:
```json
{
  "tool": "bitbadges_get_accounts",
  "arguments": {
    "accountsToFetch": [
      {
        "address": "bb1qxy2mlz19ecl4xyqx9krq2sg8wkv30dzn4v7qm6",
        "viewsToFetch": [
          {
            "viewType": "badgesCollected",
            "viewId": "badgesCollected",
            "bookmark": ""
          },
          {
            "viewType": "transferActivity",
            "viewId": "transferActivity",
            "bookmark": ""
          }
        ]
      }
    ]
  }
}
```

### 5. Check API Status

```json
{
  "tool": "bitbadges_get_status",
  "arguments": {}
}
```

### 6. Get Claims Information

```json
{
  "tool": "bitbadges_get_claims",
  "arguments": {
    "claimsToFetch": [
      {
        "claimId": "claim-id-here"
      }
    ]
  }
}
```

### 7. Transaction Operations

Simulate a transaction (dry run):
```json
{
  "tool": "bitbadges_simulate_tx",
  "arguments": {
    "tx": {
      // Transaction object here
    }
  }
}
```

Broadcast a transaction:
```json
{
  "tool": "bitbadges_broadcast_tx",
  "arguments": {
    "tx": {
      // Transaction object here
    }
  }
}
```

## Pagination

Many APIs support pagination through the `bookmark` parameter:

```json
{
  "viewsToFetch": [
    {
      "viewType": "transferActivity",
      "viewId": "transferActivity",
      "bookmark": ""  // Empty for first page
    }
  ]
}
```

Use the bookmark returned in the response for the next page:

```json
{
  "bookmark": "returned-bookmark-value"
}
```

## Error Handling

The server will return helpful error messages:

- **Configuration not set**: "API key not configured. Use bitbadges_configure tool first."
- **API errors**: "API Error (401): Unauthorized request. Invalid API key."
- **Network errors**: "Network Error: No response received from API"
- **Validation errors**: Schema validation failures for tool arguments

## Rate Limits

Be aware of your API tier's rate limits:

- **Free**: 10 requests per 10 seconds
- **Basic**: 1000 requests per minute  
- **Pro**: 3000 requests per minute
- **Enterprise**: 60000 requests per minute

## Tips

1. **Always configure first**: The `bitbadges_configure` tool must be called before any other API tools.

2. **Use batch operations**: Use `bitbadges_get_accounts` and `bitbadges_get_collections` for better performance when fetching multiple items.

3. **Specify what you need**: Use the `viewsToFetch` and `metadataToFetch` parameters to only get the data you need.

4. **Handle pagination**: For large datasets, use the bookmark system to paginate through results.

5. **Check status**: Use `bitbadges_get_status` to verify API connectivity and blockchain status.

6. **Test transactions**: Always use `bitbadges_simulate_tx` before `bitbadges_broadcast_tx` to verify transactions.

## Complete Workflow Example

Here's a complete workflow to get information about a user and their badge collection:

1. **Configure the server**:
```json
{
  "tool": "bitbadges_configure",
  "arguments": {
    "apiKey": "your-api-key"
  }
}
```

2. **Get user info**:
```json
{
  "tool": "bitbadges_get_account",
  "arguments": {
    "username": "trevormil"
  }
}
```

3. **Get detailed account views**:
```json
{
  "tool": "bitbadges_get_accounts",
  "arguments": {
    "accountsToFetch": [
      {
        "address": "bb1qxy2mlz19ecl4xyqx9krq2sg8wkv30dzn4v7qm6",
        "viewsToFetch": [
          {
            "viewType": "badgesCollected",
            "viewId": "badges",
            "bookmark": ""
          }
        ]
      }
    ]
  }
}
```

4. **Get collection details for interesting collections**:
```json
{
  "tool": "bitbadges_get_collections",
  "arguments": {
    "collectionsToFetch": [
      {
        "collectionId": "1",
        "metadataToFetch": {
          "badgeIds": [{"start": "1", "end": "10"}]
        },
        "fetchTotalBalances": true
      }
    ]
  }
}
```

This workflow gives you a complete picture of a user and their badge activities!