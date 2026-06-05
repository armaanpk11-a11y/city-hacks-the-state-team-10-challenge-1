/**
 * Challenge 01 — 100 Trinity Place Work Order Dashboard
 * Backend server: handles OAuth2 Client Credentials, caches token, proxies GraphQL
 * 
 * The City Hacks The State · NYC Tech Week 2026
 */

import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ─── Config ───────────────────────────────────────────────────────────
const {
  CA_CLIENT_ID,
  CA_CLIENT_SECRET,
  CA_API_URL = 'https://100trinity.stg.criticalasset.com/api',
  PORT = 3000
} = process.env;

if (!CA_CLIENT_ID || !CA_CLIENT_SECRET) {
  console.error('❌ Missing CA_CLIENT_ID or CA_CLIENT_SECRET in .env');
  process.exit(1);
}

// ─── Token Cache ──────────────────────────────────────────────────────
let tokenCache = { accessToken: null, expiresAt: 0 };

async function getAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.accessToken;
  }

  console.log('🔑 Exchanging credentials for access token...');
  
  const response = await fetch(CA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation ApplicationToken($input: ApplicationClientCredentialsInput!) {
        applicationClientCredentialsToken(input: $input) {
          accessToken
          refreshToken
          tokenType
          expiresIn
          scope
        }
      }`,
      variables: {
        input: {
          clientId: CA_CLIENT_ID,
          clientSecret: CA_CLIENT_SECRET,
          scope: "workorders.read assets.read locations.read"
        }
      }
    })
  });

  const data = await response.json();
  
  if (data.errors) {
    console.error('❌ Token exchange failed:', data.errors[0].message);
    throw new Error(`Auth failed: ${data.errors[0].message}`);
  }

  const token = data.data.applicationClientCredentialsToken;
  tokenCache = {
    accessToken: token.accessToken,
    expiresAt: Date.now() + (token.expiresIn * 1000)
  };

  console.log('✅ Token acquired, expires in', token.expiresIn, 'seconds');
  return token.accessToken;
}

// ─── GraphQL Proxy ────────────────────────────────────────────────────
async function graphqlQuery(query, variables = {}) {
  const token = await getAccessToken();
  
  const response = await fetch(CA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });

  const data = await response.json();
  
  // If 401, clear cache and retry once
  if (data.errors && data.errors[0]?.message?.includes('Unauthorized')) {
    tokenCache = { accessToken: null, expiresAt: 0 };
    const freshToken = await getAccessToken();
    const retry = await fetch(CA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`
      },
      body: JSON.stringify({ query, variables })
    });
    return retry.json();
  }

  return data;
}

// ─── API Routes ───────────────────────────────────────────────────────

// GET /api/workorders — Pull work orders with linked assets
app.get('/api/workorders', async (req, res) => {
  try {
    const data = await graphqlQuery(`
      query {
        workOrders(limit: 50) {
          totalCount
          nodes {
            id
            title
            description
            severity
            stage
            workOrderType
            workOrderServiceCategory
            dueDate
            createdAt
            updatedAt
            workOrderAssets {
              asset {
                id
                name
                status
                category
              }
            }
            location {
              id
              locationName
            }
          }
        }
      }
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assets — Pull all assets
app.get('/api/assets', async (req, res) => {
  try {
    const data = await graphqlQuery(`
      query {
        assets(limit: 100) {
          total
          assets {
            id
            name
            status
            category
            locations {
              id
              locationName
            }
          }
        }
      }
    `);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/locations — Pull location tree
app.get('/api/locations', async (req, res) => {
  try {
    const data = await graphqlQuery(`query { locationsTree }`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/health — Check API connection status
app.get('/api/health', async (req, res) => {
  try {
    await getAccessToken();
    res.json({ status: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'disconnected', error: err.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║  100 Trinity Place — Work Order Dashboard               ║
  ║  Challenge 01 · The City Hacks The State                ║
  ║                                                         ║
  ║  🌐 http://localhost:${PORT}                              ║
  ║  📡 API Proxy: /api/workorders, /api/assets, /api/locations  ║
  ╚══════════════════════════════════════════════════════════╝
  `);
});
