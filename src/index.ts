#!/usr/bin/env node

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

  const url = new URL(`/api/${API_VERSION}${endpoint}`, config.baseUrl);

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
      throw new Error(`API Error (${error.response.status}): ${error.response.data?.errorMessage || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Network Error: No response received from API');
    } else {
      throw new Error(`Request Error: ${error.message}`);
    }
  }
}

// Tool definitions (auto-generated from OpenAPI spec)
const tools: Tool[] = [
  {
    "name": "bitbadges_configure",
    "description": "Configure the BitBadges API key and base URL",
    "inputSchema": {
      "type": "object",
      "properties": {
        "apiKey": {
          "type": "string",
          "description": "Your BitBadges API key from the developer portal"
        },
        "baseUrl": {
          "type": "string",
          "description": "Base URL for the BitBadges API (optional, defaults to https://api.bitbadges.io)"
        }
      },
      "required": [
        "apiKey"
      ]
    }
  },
  {
    "name": "bitbadges_getAccount",
    "description": "Get Account",
    "inputSchema": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string",
          "description": "address parameter"
        },
        "username": {
          "type": "string",
          "description": "username parameter"
        }
      },
      "required": []
    },
    "metadata": {
      "path": "/user",
      "method": "GET",
      "operationId": "getAccount",
      "tags": [
        "Accounts"
      ]
    }
  },
  {
    "name": "bitbadges_getAccounts",
    "description": "Get Accounts - Batch",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGetAccountsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/users",
      "method": "POST",
      "operationId": "getAccounts",
      "tags": [
        "Accounts"
      ]
    }
  },
  {
    "name": "bitbadges_getCollection",
    "description": "Get Collection",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "string",
          "description": "Collection ID"
        }
      },
      "required": [
        "collectionId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}",
      "method": "GET",
      "operationId": "getCollection",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getBadgeMetadata",
    "description": "Get Badge Metadata",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "string",
          "description": "Collection ID"
        },
        "badgeId": {
          "type": "string",
          "description": "Badge ID"
        }
      },
      "required": [
        "collectionId",
        "badgeId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/{badgeId}/metadata",
      "method": "GET",
      "operationId": "getBadgeMetadata",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getCollectionsBatch",
    "description": "Get Collections - Batch",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGetCollectionsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/collections",
      "method": "POST",
      "operationId": "getCollectionsBatch",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getBadgeBalanceByAddressSpecificBadge",
    "description": "Get Badge Balance By Address - Specific Badge",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "integer",
          "description": "The ID of the collection containing the badge."
        },
        "address": {
          "type": "string",
          "description": "The address for which the badge balance is to be retrieved. Can be \"Total\" for the circulating supply."
        },
        "badgeId": {
          "type": "integer",
          "description": "The ID of the badge for which the balance is to be retrieved."
        }
      },
      "required": [
        "collectionId",
        "address",
        "badgeId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/balance/{address}/{badgeId}",
      "method": "GET",
      "operationId": "getBadgeBalanceByAddressSpecificBadge",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getBadgeBalanceByAddress",
    "description": "Get Badge Balances By Address",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "integer",
          "description": "The ID of the collection containing the badge."
        },
        "address": {
          "type": "string",
          "description": "The address for which the badge balance is to be retrieved. Can be \"Total\" for the circulating supply."
        },
        "fetchPrivateParams": {
          "type": "boolean",
          "description": "fetchPrivateParams parameter"
        },
        "forceful": {
          "type": "boolean",
          "description": "forceful parameter"
        }
      },
      "required": [
        "collectionId",
        "address"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/balance/{address}",
      "method": "GET",
      "operationId": "getBadgeBalanceByAddress",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getClaim",
    "description": "Get Claim",
    "inputSchema": {
      "type": "object",
      "properties": {
        "claimId": {
          "type": "string",
          "description": "Claim ID"
        },
        "fetchPrivateParams": {
          "type": "boolean",
          "description": "fetchPrivateParams parameter"
        },
        "fetchAllClaimedUsers": {
          "type": "boolean",
          "description": "fetchAllClaimedUsers parameter"
        },
        "privateStatesToFetch": {
          "type": "array",
          "description": "privateStatesToFetch parameter"
        }
      },
      "required": [
        "claimId"
      ]
    },
    "metadata": {
      "path": "/claim/{claimId}",
      "method": "GET",
      "operationId": "getClaim",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_checkClaimSuccess",
    "description": "Check Claim Successes By User",
    "inputSchema": {
      "type": "object",
      "properties": {
        "claimId": {
          "type": "string",
          "description": "claimId parameter"
        },
        "address": {
          "type": "string",
          "description": "address parameter"
        }
      },
      "required": [
        "claimId",
        "address"
      ]
    },
    "metadata": {
      "path": "/claims/success/{claimId}/{address}",
      "method": "GET",
      "operationId": "checkClaimSuccess",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_getAttestation",
    "description": "Get Attestation",
    "inputSchema": {
      "type": "object",
      "properties": {
        "attestationId": {
          "type": "string",
          "description": "Attestation ID"
        }
      },
      "required": [
        "attestationId"
      ]
    },
    "metadata": {
      "path": "/attestation/{attestationId}",
      "method": "GET",
      "operationId": "getAttestation",
      "tags": [
        "Attestations"
      ]
    }
  },
  {
    "name": "bitbadges_getDeveloperApp",
    "description": "Get OAuth App",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clientId": {
          "type": "string",
          "description": "Client ID"
        }
      },
      "required": [
        "clientId"
      ]
    },
    "metadata": {
      "path": "/developerApp/{clientId}",
      "method": "GET",
      "operationId": "getDeveloperApp",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_createDeveloperApp",
    "description": "Create OAuth App",
    "inputSchema": {
      "type": "object",
      "properties": {},
      "required": []
    },
    "metadata": {
      "path": "/developerApps",
      "method": "POST",
      "operationId": "createDeveloperApp",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_updateDeveloperApp",
    "description": "Update OAuth App",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clientId": {
          "type": "string",
          "description": "Client ID"
        }
      },
      "required": [
        "clientId"
      ]
    },
    "metadata": {
      "path": "/developerApps",
      "method": "PUT",
      "operationId": "updateDeveloperApp",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_deleteDeveloperApp",
    "description": "Delete OAuth App",
    "inputSchema": {
      "type": "object",
      "properties": {
        "clientId": {
          "type": "string",
          "description": "Client ID"
        }
      },
      "required": [
        "clientId"
      ]
    },
    "metadata": {
      "path": "/developerApps",
      "method": "DELETE",
      "operationId": "deleteDeveloperApp",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_getPlugin",
    "description": "Get Plugin",
    "inputSchema": {
      "type": "object",
      "properties": {
        "pluginId": {
          "type": "string",
          "description": "Plugin ID"
        }
      },
      "required": [
        "pluginId"
      ]
    },
    "metadata": {
      "path": "/plugin/{pluginId}",
      "method": "GET",
      "operationId": "getPlugin",
      "tags": [
        "Plugins"
      ]
    }
  },
  {
    "name": "bitbadges_getUtilityListing",
    "description": "Get Utility Listing",
    "inputSchema": {
      "type": "object",
      "properties": {
        "utilityListingId": {
          "type": "string",
          "description": "Utility listing ID"
        }
      },
      "required": [
        "utilityListingId"
      ]
    },
    "metadata": {
      "path": "/utilityListing/{utilityListingId}",
      "method": "GET",
      "operationId": "getUtilityListing",
      "tags": [
        "Utility Listings"
      ]
    }
  },
  {
    "name": "bitbadges_getDynamicDataStore",
    "description": "Get Dynamic Data Store",
    "inputSchema": {
      "type": "object",
      "properties": {
        "dynamicStoreId": {
          "type": "string",
          "description": "Dynamic data store ID"
        },
        "dataSecret": {
          "type": "string",
          "description": "dataSecret parameter"
        }
      },
      "required": [
        "dynamicStoreId"
      ]
    },
    "metadata": {
      "path": "/dynamicStore/{dynamicStoreId}",
      "method": "GET",
      "operationId": "getDynamicDataStore",
      "tags": [
        "Dynamic Stores"
      ]
    }
  },
  {
    "name": "bitbadges_getDynamicDataStoreValue",
    "description": "Get Dynamic Data Store Value",
    "inputSchema": {
      "type": "object",
      "properties": {
        "dynamicStoreId": {
          "type": "string",
          "description": "Dynamic data store ID"
        },
        "key": {
          "type": "string",
          "description": "key parameter"
        },
        "dataSecret": {
          "type": "string",
          "description": "dataSecret parameter"
        },
        "lookupType": {
          "type": "string",
          "description": "lookupType parameter"
        }
      },
      "required": [
        "dynamicStoreId",
        "key"
      ]
    },
    "metadata": {
      "path": "/dynamicStore/{dynamicStoreId}/value",
      "method": "GET",
      "operationId": "getDynamicDataStoreValue",
      "tags": [
        "Dynamic Stores"
      ]
    }
  },
  {
    "name": "bitbadges_getDynamicDataStoreValuesPaginated",
    "description": "Get Dynamic Data Store Values Paginated",
    "inputSchema": {
      "type": "object",
      "properties": {
        "dynamicStoreId": {
          "type": "string",
          "description": "Dynamic data store ID"
        },
        "dataSecret": {
          "type": "string",
          "description": "dataSecret parameter"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "lookupType": {
          "type": "string",
          "description": "lookupType parameter"
        }
      },
      "required": [
        "dynamicStoreId"
      ]
    },
    "metadata": {
      "path": "/dynamicStore/{dynamicStoreId}/values",
      "method": "GET",
      "operationId": "getDynamicDataStoreValuesPaginated",
      "tags": [
        "Dynamic Stores"
      ]
    }
  },
  {
    "name": "bitbadges_createDynamicDataStore",
    "description": "Create Dynamic Data Store",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iCreateDynamicDataStorePayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/dynamicStores",
      "method": "POST",
      "operationId": "createDynamicDataStore",
      "tags": [
        "Dynamic Stores"
      ]
    }
  },
  {
    "name": "bitbadges_updateDynamicDataStore",
    "description": "Update Dynamic Data Store",
    "inputSchema": {
      "type": "object",
      "properties": {
        "dynamicStoreId": {
          "type": "string",
          "description": "Dynamic data store ID"
        },
        "body": {
          "$ref": "#/components/schemas/iUpdateDynamicDataStorePayload"
        }
      },
      "required": [
        "dynamicStoreId",
        "body"
      ]
    },
    "metadata": {
      "path": "/dynamicStores",
      "method": "PUT",
      "operationId": "updateDynamicDataStore",
      "tags": [
        "Dynamic Stores"
      ]
    }
  },
  {
    "name": "bitbadges_deleteDynamicDataStore",
    "description": "Delete Dynamic Data Store",
    "inputSchema": {
      "type": "object",
      "properties": {
        "dynamicStoreId": {
          "type": "string",
          "description": "Dynamic data store ID"
        },
        "body": {
          "$ref": "#/components/schemas/iDeleteDynamicDataStorePayload"
        }
      },
      "required": [
        "dynamicStoreId",
        "body"
      ]
    },
    "metadata": {
      "path": "/dynamicStores",
      "method": "DELETE",
      "operationId": "deleteDynamicDataStore",
      "tags": [
        "Dynamic Stores"
      ]
    }
  },
  {
    "name": "bitbadges_getApplication",
    "description": "Get Application",
    "inputSchema": {
      "type": "object",
      "properties": {
        "applicationId": {
          "type": "string",
          "description": "Application ID"
        }
      },
      "required": [
        "applicationId"
      ]
    },
    "metadata": {
      "path": "/application/{applicationId}",
      "method": "GET",
      "operationId": "getApplication",
      "tags": [
        "Applications"
      ]
    }
  },
  {
    "name": "bitbadges_getAddressList",
    "description": "Get Address List",
    "inputSchema": {
      "type": "object",
      "properties": {
        "addressListId": {
          "type": "string",
          "description": "Address list ID"
        }
      },
      "required": [
        "addressListId"
      ]
    },
    "metadata": {
      "path": "/addressList/{addressListId}",
      "method": "GET",
      "operationId": "getAddressList",
      "tags": [
        "Address Lists"
      ]
    }
  },
  {
    "name": "bitbadges_getStatus",
    "description": "Get Status",
    "inputSchema": {
      "type": "object",
      "properties": {
        "withOutOfSyncCheck": {
          "type": "boolean",
          "description": "withOutOfSyncCheck parameter"
        }
      },
      "required": []
    },
    "metadata": {
      "path": "/status",
      "method": "GET",
      "operationId": "getStatus",
      "tags": [
        "Miscellanous"
      ]
    }
  },
  {
    "name": "bitbadges_getOwnersForBadge",
    "description": "Get Badge Owners",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "integer",
          "description": "The numeric collection ID."
        },
        "badgeId": {
          "type": "integer",
          "description": "The numeric badge ID to retrieve owners for."
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "sortBy": {
          "type": "string",
          "description": "sortBy parameter"
        }
      },
      "required": [
        "collectionId",
        "badgeId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/{badgeId}/owners",
      "method": "GET",
      "operationId": "getOwnersForBadge",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getBadgeActivity",
    "description": "Get Badge Activity",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "integer",
          "description": "The ID of the collection containing the badge."
        },
        "badgeId": {
          "type": "integer",
          "description": "The ID of the badge for which activity is to be retrieved."
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "bitbadgesAddress": {
          "type": "string",
          "description": "bitbadgesAddress parameter"
        }
      },
      "required": [
        "collectionId",
        "badgeId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/{badgeId}/activity",
      "method": "GET",
      "operationId": "getBadgeActivity",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_completeClaim",
    "description": "Complete Claim",
    "inputSchema": {
      "type": "object",
      "properties": {
        "claimId": {
          "type": "string",
          "description": "The ID of the claim."
        },
        "address": {
          "type": "string",
          "description": "The address of the user making the claim."
        },
        "body": {
          "$ref": "#/components/schemas/iCompleteClaimPayload"
        }
      },
      "required": [
        "claimId",
        "address",
        "body"
      ]
    },
    "metadata": {
      "path": "/claims/complete/{claimId}/{address}",
      "method": "POST",
      "operationId": "completeClaim",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_simulateClaim",
    "description": "Simulate Claim",
    "inputSchema": {
      "type": "object",
      "properties": {
        "claimId": {
          "type": "string",
          "description": "The ID of the claim."
        },
        "address": {
          "type": "string",
          "description": "The address of the user making the claim."
        },
        "body": {
          "$ref": "#/components/schemas/iSimulateClaimPayload"
        }
      },
      "required": [
        "claimId",
        "address",
        "body"
      ]
    },
    "metadata": {
      "path": "/claims/simulate/{claimId}/{address}",
      "method": "POST",
      "operationId": "simulateClaim",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_getReservedCodes",
    "description": "Get Reserved Claim Codes",
    "inputSchema": {
      "type": "object",
      "properties": {
        "claimId": {
          "type": "string",
          "description": "The ID of the claim."
        },
        "address": {
          "type": "string",
          "description": "The address of the user making the claim."
        },
        "body": {
          "$ref": "#/components/schemas/iGetReservedClaimCodesPayload"
        }
      },
      "required": [
        "claimId",
        "address",
        "body"
      ]
    },
    "metadata": {
      "path": "/claims/reserved/{claimId}/{address}",
      "method": "POST",
      "operationId": "getReservedCodes",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_getClaimAttemptStatus",
    "description": "Get Claim Attempt Status",
    "inputSchema": {
      "type": "object",
      "properties": {
        "claimAttemptId": {
          "type": "string",
          "description": "The transaction ID of the claim attempt."
        }
      },
      "required": [
        "claimAttemptId"
      ]
    },
    "metadata": {
      "path": "/claims/status/{claimAttemptId}",
      "method": "GET",
      "operationId": "getClaimAttemptStatus",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_broadcastTx",
    "description": "Broadcast Transaction",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "oneOf": [
            {
              "$ref": "#/components/schemas/iBroadcastTxPayload"
            },
            {
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/broadcast",
      "method": "POST",
      "operationId": "broadcastTx",
      "tags": [
        "Transactions"
      ]
    }
  },
  {
    "name": "bitbadges_simulateTx",
    "description": "Simulate Transaction",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "oneOf": [
            {
              "$ref": "#/components/schemas/iSimulateTxPayload"
            },
            {
              "type": "string"
            }
          ]
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/simulate",
      "method": "POST",
      "operationId": "simulateTx",
      "tags": [
        "Transactions"
      ]
    }
  },
  {
    "name": "bitbadges_createAddressLists",
    "description": "Creates Address Lists",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iCreateAddressListsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/addressLists",
      "method": "POST",
      "operationId": "createAddressLists",
      "tags": [
        "Address Lists"
      ]
    }
  },
  {
    "name": "bitbadges_deleteAddressLists",
    "description": "Delete Address Lists",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iDeleteAddressListsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/addressLists",
      "method": "DELETE",
      "operationId": "deleteAddressLists",
      "tags": [
        "Address Lists"
      ]
    }
  },
  {
    "name": "bitbadges_updateAddressListCoreDetails",
    "description": "Update Address List Core Details",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iUpdateAddressListCoreDetailsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/addressLists/coreDetails",
      "method": "PUT",
      "operationId": "updateAddressListCoreDetails",
      "tags": [
        "Address Lists"
      ]
    }
  },
  {
    "name": "bitbadges_updateAddressListAddresses",
    "description": "Update Address List Addresses",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iUpdateAddressListAddressesPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/addressLists/addresses",
      "method": "PUT",
      "operationId": "updateAddressListAddresses",
      "tags": [
        "Address Lists"
      ]
    }
  },
  {
    "name": "bitbadges_getAddressLists",
    "description": "Get Address Lists - Batch",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGetAddressListsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/addressLists/fetch",
      "method": "POST",
      "operationId": "getAddressLists",
      "tags": [
        "Address Lists"
      ]
    }
  },
  {
    "name": "bitbadges_exchangeSIWBBAuthorizationCode",
    "description": "Exchange SIWBB Code",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iExchangeSIWBBAuthorizationCodePayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/siwbb/token",
      "method": "POST",
      "operationId": "exchangeSIWBBAuthorizationCode",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_revokeOauthAuthorization",
    "description": "Revoke Authorization",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iOauthRevokePayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/siwbb/token/revoke",
      "method": "POST",
      "operationId": "revokeOauthAuthorization",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_rotateSIWBBRequest",
    "description": "Rotate SIWBB Request",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iRotateSIWBBRequestPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/siwbbRequest/rotate",
      "method": "POST",
      "operationId": "rotateSIWBBRequest",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_deleteSIWBBRequest",
    "description": "Delete SIWBB Request",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iDeleteSIWBBRequestPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/siwbbRequest",
      "method": "DELETE",
      "operationId": "deleteSIWBBRequest",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_createSIWBBRequest",
    "description": "Create SIWBB Request",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iCreateSIWBBRequestPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/siwbbRequest",
      "method": "POST",
      "operationId": "createSIWBBRequest",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_getSIWBBRequestsForDeveloperApp",
    "description": "Get SIWBB Requests For Developer App",
    "inputSchema": {
      "type": "object",
      "properties": {
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "clientId": {
          "type": "string",
          "description": "clientId parameter"
        }
      },
      "required": [
        "clientId"
      ]
    },
    "metadata": {
      "path": "/developerApps/siwbbRequests",
      "method": "GET",
      "operationId": "getSIWBBRequestsForDeveloperApp",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_sendClaimAlert",
    "description": "Sends Claim Alert",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iSendClaimAlertsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/claimAlerts/send",
      "method": "POST",
      "operationId": "sendClaimAlert",
      "tags": [
        "Claim Alerts"
      ]
    }
  },
  {
    "name": "bitbadges_getRefreshStatus",
    "description": "Get Refresh Status",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "string",
          "description": "The collection ID"
        }
      },
      "required": [
        "collectionId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/refreshStatus",
      "method": "GET",
      "operationId": "getRefreshStatus",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getMap",
    "description": "Get Map",
    "inputSchema": {
      "type": "object",
      "properties": {
        "mapId": {
          "type": "string",
          "description": "The map ID"
        }
      },
      "required": [
        "mapId"
      ]
    },
    "metadata": {
      "path": "/maps/{mapId}",
      "method": "GET",
      "operationId": "getMap",
      "tags": [
        "Maps and Protocols"
      ]
    }
  },
  {
    "name": "bitbadges_getMaps",
    "description": "Get Maps - Batch",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGetMapsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/maps",
      "method": "POST",
      "operationId": "getMaps",
      "tags": [
        "Maps and Protocols"
      ]
    }
  },
  {
    "name": "bitbadges_getMapValues",
    "description": "Get Map Values - Batch",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGetMapValuesPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/mapValues",
      "method": "POST",
      "operationId": "getMapValues",
      "tags": [
        "Maps and Protocols"
      ]
    }
  },
  {
    "name": "bitbadges_getMapValue",
    "description": "Get Map Value",
    "inputSchema": {
      "type": "object",
      "properties": {
        "mapId": {
          "type": "string",
          "description": "The map ID"
        },
        "key": {
          "type": "string",
          "description": "The key to get the value for"
        }
      },
      "required": [
        "mapId",
        "key"
      ]
    },
    "metadata": {
      "path": "/mapValue/{mapId}/{key}",
      "method": "GET",
      "operationId": "getMapValue",
      "tags": [
        "Maps and Protocols"
      ]
    }
  },
  {
    "name": "bitbadges_createAttestation",
    "description": "Create Attestation",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iCreateAttestationPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/attestations",
      "method": "POST",
      "operationId": "createAttestation",
      "tags": [
        "Attestations"
      ]
    }
  },
  {
    "name": "bitbadges_updateAttestation",
    "description": "Update Attestation",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iUpdateAttestationPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/attestations",
      "method": "PUT",
      "operationId": "updateAttestation",
      "tags": [
        "Attestations"
      ]
    }
  },
  {
    "name": "bitbadges_deleteAttestation",
    "description": "Delete Attestation",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iDeleteAttestationPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/attestations",
      "method": "DELETE",
      "operationId": "deleteAttestation",
      "tags": [
        "Attestations"
      ]
    }
  },
  {
    "name": "bitbadges_searchClaims",
    "description": "Search Claims",
    "inputSchema": {
      "type": "object",
      "properties": {
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "fetchPrivateParams": {
          "type": "boolean",
          "description": "fetchPrivateParams parameter"
        },
        "searchValue": {
          "type": "string",
          "description": "searchValue parameter"
        }
      },
      "required": []
    },
    "metadata": {
      "path": "/claims/search",
      "method": "GET",
      "operationId": "searchClaims",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_getClaims",
    "description": "Get Claims - Batch",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGetClaimsPayloadV1"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/claims/fetch",
      "method": "POST",
      "operationId": "getClaims",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_createClaim",
    "description": "Create Claim",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iCreateClaimPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/claims",
      "method": "POST",
      "operationId": "createClaim",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_updateClaim",
    "description": "Update Claim",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iUpdateClaimPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/claims",
      "method": "PUT",
      "operationId": "updateClaim",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_deleteClaim",
    "description": "Delete Claim",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iDeleteClaimPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/claims",
      "method": "DELETE",
      "operationId": "deleteClaim",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_generateAppleWalletPass",
    "description": "Generate Apple Wallet Pass",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGenerateAppleWalletPassPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/siwbbRequest/appleWalletPass",
      "method": "POST",
      "operationId": "generateAppleWalletPass",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_generateGoogleWalletPass",
    "description": "Generate Google Wallet Pass",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGenerateGoogleWalletPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/siwbbRequest/googleWalletPass",
      "method": "POST",
      "operationId": "generateGoogleWalletPass",
      "tags": [
        "Sign In with BitBadges"
      ]
    }
  },
  {
    "name": "bitbadges_generateCode",
    "description": "Get Code (Codes Plugin)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "seedCode": {
          "type": "string",
          "description": "The seed used to generate the code"
        },
        "idx": {
          "type": "integer",
          "description": "The index of the code to generate"
        }
      },
      "required": [
        "seedCode",
        "idx"
      ]
    },
    "metadata": {
      "path": "/codes",
      "method": "GET",
      "operationId": "generateCode",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_getClaimAttempts",
    "description": "Get Claim Attempts",
    "inputSchema": {
      "type": "object",
      "properties": {
        "claimId": {
          "type": "string",
          "description": "The ID of the claim"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "includeErrors": {
          "type": "boolean",
          "description": "includeErrors parameter"
        },
        "address": {
          "type": "string",
          "description": "address parameter"
        },
        "includeRequestBinAttemptData": {
          "type": "boolean",
          "description": "includeRequestBinAttemptData parameter"
        }
      },
      "required": [
        "claimId"
      ]
    },
    "metadata": {
      "path": "/claims/{claimId}/attempts",
      "method": "GET",
      "operationId": "getClaimAttempts",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_getGatedContentForClaim",
    "description": "Get Gated Content for Claim",
    "inputSchema": {
      "type": "object",
      "properties": {
        "claimId": {
          "type": "string",
          "description": "The ID of the claim"
        }
      },
      "required": [
        "claimId"
      ]
    },
    "metadata": {
      "path": "/claims/gatedContent/{claimId}",
      "method": "GET",
      "operationId": "getGatedContentForClaim",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_verifyAttestation",
    "description": "Verify Attestation",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iVerifyAttestationPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/attestations/verify",
      "method": "POST",
      "operationId": "verifyAttestation",
      "tags": [
        "Attestations"
      ]
    }
  },
  {
    "name": "bitbadges_performStoreActionSingleWithBodyAuth",
    "description": "Perform Single Store Action (Body Auth)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iPerformStoreActionSingleWithBodyAuthPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/storeActions/single",
      "method": "POST",
      "operationId": "performStoreActionSingleWithBodyAuth",
      "tags": [
        "Dynamic Stores"
      ]
    }
  },
  {
    "name": "bitbadges_performStoreActionBatchWithBodyAuth",
    "description": "Perform Batch Store Actions (Body Auth)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iPerformStoreActionBatchWithBodyAuthPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/storeActions/batch",
      "method": "POST",
      "operationId": "performStoreActionBatchWithBodyAuth",
      "tags": [
        "Dynamic Stores"
      ]
    }
  },
  {
    "name": "bitbadges_getDynamicDataStores",
    "description": "Fetch Dynamic Data Stores - Batch",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGetDynamicDataStoresPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/dynamicStores/fetch",
      "method": "POST",
      "operationId": "getDynamicDataStores",
      "tags": [
        "Dynamic Stores"
      ]
    }
  },
  {
    "name": "bitbadges_searchDynamicDataStores",
    "description": "Search Dynamic Data Stores For User",
    "inputSchema": {
      "type": "object",
      "properties": {
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        }
      },
      "required": []
    },
    "metadata": {
      "path": "/dynamicStores/search",
      "method": "GET",
      "operationId": "searchDynamicDataStores",
      "tags": [
        "Dynamic Stores"
      ]
    }
  },
  {
    "name": "bitbadges_getDynamicDataActivity",
    "description": "Get Dynamic Data Activity",
    "inputSchema": {
      "type": "object",
      "properties": {
        "dynamicDataId": {
          "type": "string",
          "description": "dynamicDataId parameter"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "dataSecret": {
          "type": "string",
          "description": "dataSecret parameter"
        }
      },
      "required": [
        "dynamicDataId"
      ]
    },
    "metadata": {
      "path": "/dynamicStores/activity",
      "method": "GET",
      "operationId": "getDynamicDataActivity",
      "tags": [
        "Dynamic Stores"
      ]
    }
  },
  {
    "name": "bitbadges_searchApplications",
    "description": "Search Applications",
    "inputSchema": {
      "type": "object",
      "properties": {
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        }
      },
      "required": []
    },
    "metadata": {
      "path": "/applications/search",
      "method": "GET",
      "operationId": "searchApplications",
      "tags": [
        "Applications"
      ]
    }
  },
  {
    "name": "bitbadges_getApplications",
    "description": "Get Applications - Batch",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGetApplicationsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/applications/fetch",
      "method": "POST",
      "operationId": "getApplications",
      "tags": [
        "Applications"
      ]
    }
  },
  {
    "name": "bitbadges_createApplication",
    "description": "Create Application",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iCreateApplicationPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/applications",
      "method": "POST",
      "operationId": "createApplication",
      "tags": [
        "Applications"
      ]
    }
  },
  {
    "name": "bitbadges_updateApplication",
    "description": "Update Application",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iUpdateApplicationPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/applications",
      "method": "PUT",
      "operationId": "updateApplication",
      "tags": [
        "Applications"
      ]
    }
  },
  {
    "name": "bitbadges_deleteApplication",
    "description": "Delete Application",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iDeleteApplicationPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/applications",
      "method": "DELETE",
      "operationId": "deleteApplication",
      "tags": [
        "Applications"
      ]
    }
  },
  {
    "name": "bitbadges_calculatePoints",
    "description": "Calculate Points",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iCalculatePointsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/applications/points",
      "method": "POST",
      "operationId": "calculatePoints",
      "tags": [
        "Applications"
      ]
    }
  },
  {
    "name": "bitbadges_getPointsActivity",
    "description": "Get Points Activity",
    "inputSchema": {
      "type": "object",
      "properties": {
        "applicationId": {
          "type": "string",
          "description": "applicationId parameter"
        },
        "pageId": {
          "type": "string",
          "description": "pageId parameter"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "address": {
          "type": "string",
          "description": "address parameter"
        }
      },
      "required": [
        "applicationId",
        "pageId"
      ]
    },
    "metadata": {
      "path": "/applications/points/activity",
      "method": "GET",
      "operationId": "getPointsActivity",
      "tags": [
        "Applications"
      ]
    }
  },
  {
    "name": "bitbadges_getPlugins",
    "description": "Get Plugins - Batch",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGetPluginsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/plugins/fetch",
      "method": "POST",
      "operationId": "getPlugins",
      "tags": [
        "Plugins"
      ]
    }
  },
  {
    "name": "bitbadges_searchPlugins",
    "description": "Search Plugins",
    "inputSchema": {
      "type": "object",
      "properties": {
        "pluginsForSignedInUser": {
          "type": "boolean",
          "description": "pluginsForSignedInUser parameter"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "searchValue": {
          "type": "string",
          "description": "searchValue parameter"
        },
        "locale": {
          "type": "string",
          "description": "locale parameter"
        }
      },
      "required": []
    },
    "metadata": {
      "path": "/plugins/search",
      "method": "GET",
      "operationId": "searchPlugins",
      "tags": [
        "Plugins"
      ]
    }
  },
  {
    "name": "bitbadges_getUtilityListings",
    "description": "Get Utility Listings - Batch",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iGetUtilityListingsPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/utilityListings/fetch",
      "method": "POST",
      "operationId": "getUtilityListings",
      "tags": [
        "Utility Listings"
      ]
    }
  },
  {
    "name": "bitbadges_searchUtilityListings",
    "description": "Search Utility Listings",
    "inputSchema": {
      "type": "object",
      "properties": {
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        }
      },
      "required": []
    },
    "metadata": {
      "path": "/utilityListings/search",
      "method": "GET",
      "operationId": "searchUtilityListings",
      "tags": [
        "Utility Listings"
      ]
    }
  },
  {
    "name": "bitbadges_createUtilityListing",
    "description": "Create Utility Listing",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iCreateUtilityListingPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/utilityListings",
      "method": "POST",
      "operationId": "createUtilityListing",
      "tags": [
        "Utility Listings"
      ]
    }
  },
  {
    "name": "bitbadges_updateUtilityListing",
    "description": "Update Utility Listing",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iUpdateUtilityListingPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/utilityListings",
      "method": "PUT",
      "operationId": "updateUtilityListing",
      "tags": [
        "Utility Listings"
      ]
    }
  },
  {
    "name": "bitbadges_deleteUtilityListing",
    "description": "Delete Utility Listing",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iDeleteUtilityListingPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/utilityListings",
      "method": "DELETE",
      "operationId": "deleteUtilityListing",
      "tags": [
        "Utility Listings"
      ]
    }
  },
  {
    "name": "bitbadges_getAddressListsForUser",
    "description": "Get Address Lists For User",
    "inputSchema": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string",
          "description": "Account address"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        },
        "viewType": {
          "type": "string",
          "description": "viewType parameter"
        }
      },
      "required": [
        "address"
      ]
    },
    "metadata": {
      "path": "/account/{address}/lists",
      "method": "GET",
      "operationId": "getAddressListsForUser",
      "tags": [
        "Accounts"
      ]
    }
  },
  {
    "name": "bitbadges_getSiwbbRequestsForUser",
    "description": "Get SIWBB Requests For User",
    "inputSchema": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string",
          "description": "Account address"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        }
      },
      "required": [
        "address"
      ]
    },
    "metadata": {
      "path": "/account/{address}/requests/siwbb",
      "method": "GET",
      "operationId": "getSiwbbRequestsForUser",
      "tags": [
        "Accounts"
      ]
    }
  },
  {
    "name": "bitbadges_getTransferActivityForUser",
    "description": "Get Transfer Activity For User",
    "inputSchema": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string",
          "description": "Account address"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        }
      },
      "required": [
        "address"
      ]
    },
    "metadata": {
      "path": "/account/{address}/activity/badges",
      "method": "GET",
      "operationId": "getTransferActivityForUser",
      "tags": [
        "Accounts"
      ]
    }
  },
  {
    "name": "bitbadges_GetBadgesViewForUser",
    "description": "Get Badges For User",
    "inputSchema": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string",
          "description": "Account address"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        },
        "collectionId": {
          "type": "string",
          "description": "collectionId parameter"
        },
        "viewType": {
          "type": "string",
          "description": "viewType parameter"
        }
      },
      "required": [
        "address"
      ]
    },
    "metadata": {
      "path": "/account/{address}/badges/",
      "method": "GET",
      "operationId": "GetBadgesViewForUser",
      "tags": [
        "Accounts"
      ]
    }
  },
  {
    "name": "bitbadges_getListActivityForUser",
    "description": "Get Lists Activity For User",
    "inputSchema": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string",
          "description": "Account address"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        }
      },
      "required": [
        "address"
      ]
    },
    "metadata": {
      "path": "/account/{address}/activity/lists",
      "method": "GET",
      "operationId": "getListActivityForUser",
      "tags": [
        "Accounts"
      ]
    }
  },
  {
    "name": "bitbadges_getAttestationsForUser",
    "description": "Get Attestations For User",
    "inputSchema": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string",
          "description": "Account address"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        },
        "viewType": {
          "type": "string",
          "description": "viewType parameter"
        }
      },
      "required": [
        "address"
      ]
    },
    "metadata": {
      "path": "/account/{address}/attestations/",
      "method": "GET",
      "operationId": "getAttestationsForUser",
      "tags": [
        "Accounts"
      ]
    }
  },
  {
    "name": "bitbadges_getClaimActivityForUser",
    "description": "Get Claim Activity For User",
    "inputSchema": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string",
          "description": "Account address"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        },
        "viewType": {
          "type": "string",
          "description": "viewType parameter"
        }
      },
      "required": [
        "address"
      ]
    },
    "metadata": {
      "path": "/account/{address}/activity/claims",
      "method": "GET",
      "operationId": "getClaimActivityForUser",
      "tags": [
        "Accounts"
      ]
    }
  },
  {
    "name": "bitbadges_getPointsActivityForUser",
    "description": "Get Points Activity For User",
    "inputSchema": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string",
          "description": "Account address"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        }
      },
      "required": [
        "address"
      ]
    },
    "metadata": {
      "path": "/account/{address}/activity/points",
      "method": "GET",
      "operationId": "getPointsActivityForUser",
      "tags": [
        "Accounts"
      ]
    }
  },
  {
    "name": "bitbadges_getClaimAlertsForUser",
    "description": "Get Claim Alerts For User",
    "inputSchema": {
      "type": "object",
      "properties": {
        "address": {
          "type": "string",
          "description": "Account address"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        },
        "viewType": {
          "type": "string",
          "description": "viewType parameter"
        }
      },
      "required": [
        "address"
      ]
    },
    "metadata": {
      "path": "/account/{address}/claimAlerts",
      "method": "GET",
      "operationId": "getClaimAlertsForUser",
      "tags": [
        "Accounts"
      ]
    }
  },
  {
    "name": "bitbadges_getAddressListActivity",
    "description": "Get Address List Activity",
    "inputSchema": {
      "type": "object",
      "properties": {
        "addressListId": {
          "type": "string",
          "description": "Address list ID"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        }
      },
      "required": [
        "addressListId"
      ]
    },
    "metadata": {
      "path": "/addressLists/{addressListId}/activity",
      "method": "GET",
      "operationId": "getAddressListActivity",
      "tags": [
        "Address Lists"
      ]
    }
  },
  {
    "name": "bitbadges_getAddressListListings",
    "description": "Get Address List Listings",
    "inputSchema": {
      "type": "object",
      "properties": {
        "addressListId": {
          "type": "string",
          "description": "Address list ID"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        }
      },
      "required": [
        "addressListId"
      ]
    },
    "metadata": {
      "path": "/addressLists/{addressListId}/listings",
      "method": "GET",
      "operationId": "getAddressListListings",
      "tags": [
        "Address Lists"
      ]
    }
  },
  {
    "name": "bitbadges_getCollectionOwners",
    "description": "Get Collection Owners",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "string",
          "description": "Collection ID"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        }
      },
      "required": [
        "collectionId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/owners",
      "method": "GET",
      "operationId": "getCollectionOwners",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getCollectionTransferActivity",
    "description": "Get Collection Transfer Activity",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "string",
          "description": "Collection ID"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        },
        "address": {
          "type": "string",
          "description": "address parameter"
        }
      },
      "required": [
        "collectionId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/activity",
      "method": "GET",
      "operationId": "getCollectionTransferActivity",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getCollectionChallengeTrackers",
    "description": "Get Collection Challenge Trackers",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "string",
          "description": "Collection ID"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        }
      },
      "required": [
        "collectionId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/challengeTrackers",
      "method": "GET",
      "operationId": "getCollectionChallengeTrackers",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getCollectionAmountTrackers",
    "description": "Get Collection Amount Trackers",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "string",
          "description": "Collection ID"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        }
      },
      "required": [
        "collectionId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/amountTrackers",
      "method": "GET",
      "operationId": "getCollectionAmountTrackers",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getCollectionAmountTrackerById",
    "description": "Get Collection Amount Tracker By ID",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "string",
          "description": "collectionId parameter"
        },
        "approvalId": {
          "type": "string",
          "description": "approvalId parameter"
        },
        "amountTrackerId": {
          "type": "string",
          "description": "amountTrackerId parameter"
        },
        "approvalLevel": {
          "type": "string",
          "description": "approvalLevel parameter"
        },
        "approverAddress": {
          "type": "string",
          "description": "approverAddress parameter"
        },
        "trackerType": {
          "type": "string",
          "description": "trackerType parameter"
        },
        "approvedAddress": {
          "type": "string",
          "description": "approvedAddress parameter"
        }
      },
      "required": [
        "collectionId",
        "approvalId",
        "amountTrackerId",
        "approvalLevel",
        "approverAddress",
        "trackerType",
        "approvedAddress"
      ]
    },
    "metadata": {
      "path": "/api/v0/collection/amountTracker",
      "method": "GET",
      "operationId": "getCollectionAmountTrackerById",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getCollectionChallengeTrackerById",
    "description": "Get Collection Challenge Tracker By ID",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "string",
          "description": "collectionId parameter"
        },
        "approvalId": {
          "type": "string",
          "description": "approvalId parameter"
        },
        "challengeTrackerId": {
          "type": "string",
          "description": "challengeTrackerId parameter"
        },
        "approvalLevel": {
          "type": "string",
          "description": "approvalLevel parameter"
        },
        "approverAddress": {
          "type": "string",
          "description": "approverAddress parameter"
        }
      },
      "required": [
        "collectionId",
        "approvalId",
        "challengeTrackerId",
        "approvalLevel",
        "approverAddress"
      ]
    },
    "metadata": {
      "path": "/api/v0/collection/challengeTracker",
      "method": "GET",
      "operationId": "getCollectionChallengeTrackerById",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getCollectionListings",
    "description": "Get Collection Listings",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "string",
          "description": "Collection ID"
        },
        "bookmark": {
          "type": "string",
          "description": "bookmark parameter"
        },
        "oldestFirst": {
          "type": "boolean",
          "description": "oldestFirst parameter"
        },
        "badgeId": {
          "type": "string",
          "description": "badgeId parameter"
        }
      },
      "required": [
        "collectionId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/listings",
      "method": "GET",
      "operationId": "getCollectionListings",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getCollectionClaims",
    "description": "Get Collection Claims",
    "inputSchema": {
      "type": "object",
      "properties": {
        "collectionId": {
          "type": "string",
          "description": "Collection ID"
        }
      },
      "required": [
        "collectionId"
      ]
    },
    "metadata": {
      "path": "/collection/{collectionId}/claims",
      "method": "GET",
      "operationId": "getCollectionClaims",
      "tags": [
        "Badges"
      ]
    }
  },
  {
    "name": "bitbadges_getAddressListClaims",
    "description": "Get Address List Claims",
    "inputSchema": {
      "type": "object",
      "properties": {
        "addressListId": {
          "type": "string",
          "description": "Address list ID"
        }
      },
      "required": [
        "addressListId"
      ]
    },
    "metadata": {
      "path": "/addressLists/{addressListId}/claims",
      "method": "GET",
      "operationId": "getAddressListClaims",
      "tags": [
        "Address Lists"
      ]
    }
  },
  {
    "name": "bitbadges_getAttemptDataFromRequestBin",
    "description": "Get Attempt Data (Request Bin)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "claimId": {
          "type": "string",
          "description": "Claim ID"
        },
        "claimAttemptId": {
          "type": "string",
          "description": "Claim attempt ID"
        },
        "instanceId": {
          "type": "string",
          "description": "instanceId parameter"
        }
      },
      "required": [
        "claimId",
        "claimAttemptId"
      ]
    },
    "metadata": {
      "path": "/api/v0/requestBin/attemptData/{claimId}/{claimAttemptId}",
      "method": "GET",
      "operationId": "getAttemptDataFromRequestBin",
      "tags": [
        "Claims"
      ]
    }
  },
  {
    "name": "bitbadges_uploadBalances",
    "description": "Upload Balances",
    "inputSchema": {
      "type": "object",
      "properties": {
        "body": {
          "$ref": "#/components/schemas/iUploadBalancesPayload"
        }
      },
      "required": [
        "body"
      ]
    },
    "metadata": {
      "path": "/api/v0/uploadBalances",
      "method": "POST",
      "operationId": "uploadBalances",
      "tags": [
        "Badges"
      ]
    }
  }
];

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
              text: `BitBadges API configured successfully with base URL: ${config.baseUrl}`
            }
          ]
        };
      }

      case 'bitbadges_getAccount': {
        const endpoint = `/user`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getAccounts': {
        const endpoint = `/users`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getCollection': {
        const endpoint = `/collection/${args?.collectionId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getBadgeMetadata': {
        const endpoint = `/collection/${args?.collectionId}/${args?.badgeId}/metadata`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getCollectionsBatch': {
        const endpoint = `/collections`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getBadgeBalanceByAddressSpecificBadge': {
        const endpoint = `/collection/${args?.collectionId}/balance/${args?.address}/${args?.badgeId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getBadgeBalanceByAddress': {
        const endpoint = `/collection/${args?.collectionId}/balance/${args?.address}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getClaim': {
        const endpoint = `/claim/${args?.claimId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_checkClaimSuccess': {
        const endpoint = `/claims/success/${args?.claimId}/${args?.address}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getAttestation': {
        const endpoint = `/attestation/${args?.attestationId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getDeveloperApp': {
        const endpoint = `/developerApp/${args?.clientId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_createDeveloperApp': {
        const endpoint = `/developerApps`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_updateDeveloperApp': {
        const endpoint = `/developerApps`;
        const response = await makeApiRequest(endpoint, 'PUT', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_deleteDeveloperApp': {
        const endpoint = `/developerApps`;
        const response = await makeApiRequest(endpoint, 'DELETE', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getPlugin': {
        const endpoint = `/plugin/${args?.pluginId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getUtilityListing': {
        const endpoint = `/utilityListing/${args?.utilityListingId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getDynamicDataStore': {
        const endpoint = `/dynamicStore/${args?.dynamicStoreId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getDynamicDataStoreValue': {
        const endpoint = `/dynamicStore/${args?.dynamicStoreId}/value`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getDynamicDataStoreValuesPaginated': {
        const endpoint = `/dynamicStore/${args?.dynamicStoreId}/values`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_createDynamicDataStore': {
        const endpoint = `/dynamicStores`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_updateDynamicDataStore': {
        const endpoint = `/dynamicStores`;
        const response = await makeApiRequest(endpoint, 'PUT', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_deleteDynamicDataStore': {
        const endpoint = `/dynamicStores`;
        const response = await makeApiRequest(endpoint, 'DELETE', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getApplication': {
        const endpoint = `/application/${args?.applicationId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getAddressList': {
        const endpoint = `/addressList/${args?.addressListId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getStatus': {
        const endpoint = `/status`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getOwnersForBadge': {
        const endpoint = `/collection/${args?.collectionId}/${args?.badgeId}/owners`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getBadgeActivity': {
        const endpoint = `/collection/${args?.collectionId}/${args?.badgeId}/activity`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_completeClaim': {
        const endpoint = `/claims/complete/${args?.claimId}/${args?.address}`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_simulateClaim': {
        const endpoint = `/claims/simulate/${args?.claimId}/${args?.address}`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getReservedCodes': {
        const endpoint = `/claims/reserved/${args?.claimId}/${args?.address}`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getClaimAttemptStatus': {
        const endpoint = `/claims/status/${args?.claimAttemptId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_broadcastTx': {
        const endpoint = `/broadcast`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_simulateTx': {
        const endpoint = `/simulate`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_createAddressLists': {
        const endpoint = `/addressLists`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_deleteAddressLists': {
        const endpoint = `/addressLists`;
        const response = await makeApiRequest(endpoint, 'DELETE', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_updateAddressListCoreDetails': {
        const endpoint = `/addressLists/coreDetails`;
        const response = await makeApiRequest(endpoint, 'PUT', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_updateAddressListAddresses': {
        const endpoint = `/addressLists/addresses`;
        const response = await makeApiRequest(endpoint, 'PUT', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getAddressLists': {
        const endpoint = `/addressLists/fetch`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_exchangeSIWBBAuthorizationCode': {
        const endpoint = `/siwbb/token`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_revokeOauthAuthorization': {
        const endpoint = `/siwbb/token/revoke`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_rotateSIWBBRequest': {
        const endpoint = `/siwbbRequest/rotate`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_deleteSIWBBRequest': {
        const endpoint = `/siwbbRequest`;
        const response = await makeApiRequest(endpoint, 'DELETE', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_createSIWBBRequest': {
        const endpoint = `/siwbbRequest`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getSIWBBRequestsForDeveloperApp': {
        const endpoint = `/developerApps/siwbbRequests`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_sendClaimAlert': {
        const endpoint = `/claimAlerts/send`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getRefreshStatus': {
        const endpoint = `/collection/${args?.collectionId}/refreshStatus`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getMap': {
        const endpoint = `/maps/${args?.mapId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getMaps': {
        const endpoint = `/maps`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getMapValues': {
        const endpoint = `/mapValues`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getMapValue': {
        const endpoint = `/mapValue/${args?.mapId}/${args?.key}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_createAttestation': {
        const endpoint = `/attestations`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_updateAttestation': {
        const endpoint = `/attestations`;
        const response = await makeApiRequest(endpoint, 'PUT', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_deleteAttestation': {
        const endpoint = `/attestations`;
        const response = await makeApiRequest(endpoint, 'DELETE', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_searchClaims': {
        const endpoint = `/claims/search`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getClaims': {
        const endpoint = `/claims/fetch`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_createClaim': {
        const endpoint = `/claims`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_updateClaim': {
        const endpoint = `/claims`;
        const response = await makeApiRequest(endpoint, 'PUT', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_deleteClaim': {
        const endpoint = `/claims`;
        const response = await makeApiRequest(endpoint, 'DELETE', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_generateAppleWalletPass': {
        const endpoint = `/siwbbRequest/appleWalletPass`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_generateGoogleWalletPass': {
        const endpoint = `/siwbbRequest/googleWalletPass`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_generateCode': {
        const endpoint = `/codes`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getClaimAttempts': {
        const endpoint = `/claims/${args?.claimId}/attempts`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getGatedContentForClaim': {
        const endpoint = `/claims/gatedContent/${args?.claimId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_verifyAttestation': {
        const endpoint = `/attestations/verify`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_performStoreActionSingleWithBodyAuth': {
        const endpoint = `/storeActions/single`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_performStoreActionBatchWithBodyAuth': {
        const endpoint = `/storeActions/batch`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getDynamicDataStores': {
        const endpoint = `/dynamicStores/fetch`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_searchDynamicDataStores': {
        const endpoint = `/dynamicStores/search`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getDynamicDataActivity': {
        const endpoint = `/dynamicStores/activity`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_searchApplications': {
        const endpoint = `/applications/search`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getApplications': {
        const endpoint = `/applications/fetch`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_createApplication': {
        const endpoint = `/applications`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_updateApplication': {
        const endpoint = `/applications`;
        const response = await makeApiRequest(endpoint, 'PUT', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_deleteApplication': {
        const endpoint = `/applications`;
        const response = await makeApiRequest(endpoint, 'DELETE', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_calculatePoints': {
        const endpoint = `/applications/points`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getPointsActivity': {
        const endpoint = `/applications/points/activity`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getPlugins': {
        const endpoint = `/plugins/fetch`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_searchPlugins': {
        const endpoint = `/plugins/search`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getUtilityListings': {
        const endpoint = `/utilityListings/fetch`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_searchUtilityListings': {
        const endpoint = `/utilityListings/search`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_createUtilityListing': {
        const endpoint = `/utilityListings`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_updateUtilityListing': {
        const endpoint = `/utilityListings`;
        const response = await makeApiRequest(endpoint, 'PUT', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_deleteUtilityListing': {
        const endpoint = `/utilityListings`;
        const response = await makeApiRequest(endpoint, 'DELETE', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getAddressListsForUser': {
        const endpoint = `/account/${args?.address}/lists`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getSiwbbRequestsForUser': {
        const endpoint = `/account/${args?.address}/requests/siwbb`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getTransferActivityForUser': {
        const endpoint = `/account/${args?.address}/activity/badges`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_GetBadgesViewForUser': {
        const endpoint = `/account/${args?.address}/badges/`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getListActivityForUser': {
        const endpoint = `/account/${args?.address}/activity/lists`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getAttestationsForUser': {
        const endpoint = `/account/${args?.address}/attestations/`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getClaimActivityForUser': {
        const endpoint = `/account/${args?.address}/activity/claims`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getPointsActivityForUser': {
        const endpoint = `/account/${args?.address}/activity/points`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getClaimAlertsForUser': {
        const endpoint = `/account/${args?.address}/claimAlerts`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getAddressListActivity': {
        const endpoint = `/addressLists/${args?.addressListId}/activity`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getAddressListListings': {
        const endpoint = `/addressLists/${args?.addressListId}/listings`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getCollectionOwners': {
        const endpoint = `/collection/${args?.collectionId}/owners`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getCollectionTransferActivity': {
        const endpoint = `/collection/${args?.collectionId}/activity`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getCollectionChallengeTrackers': {
        const endpoint = `/collection/${args?.collectionId}/challengeTrackers`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getCollectionAmountTrackers': {
        const endpoint = `/collection/${args?.collectionId}/amountTrackers`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getCollectionAmountTrackerById': {
        const endpoint = `/collection/amountTracker`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getCollectionChallengeTrackerById': {
        const endpoint = `/collection/challengeTracker`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getCollectionListings': {
        const endpoint = `/collection/${args?.collectionId}/listings`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getCollectionClaims': {
        const endpoint = `/collection/${args?.collectionId}/claims`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getAddressListClaims': {
        const endpoint = `/addressLists/${args?.addressListId}/claims`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_getAttemptDataFromRequestBin': {
        const endpoint = `/requestBin/attemptData/${args?.claimId}/${args?.claimAttemptId}`;
        const response = await makeApiRequest(endpoint, 'GET', undefined);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      case 'bitbadges_uploadBalances': {
        const endpoint = `/uploadBalances`;
        const response = await makeApiRequest(endpoint, 'POST', args || {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
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
});