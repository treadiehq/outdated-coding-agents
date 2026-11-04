import { env } from 'node:process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

function requiredEnv(name: string): string {
  const value = env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// SDK 1.32.1: omitting expectedIssuer is deprecated. Pin the credentials
// to their authorization server rather than trusting whichever issuer is advertised.
const authProvider = new ClientCredentialsProvider({
  clientId: requiredEnv('OAUTH_CLIENT_ID'),
  clientSecret: requiredEnv('OAUTH_CLIENT_SECRET'),
  expectedIssuer: 'https://auth.example.com',
});

const client = new Client({ name: 'machine-mcp-client', version: '1.0.0' });
const transport = new StreamableHTTPClientTransport(
  new URL('https://mcp.example.com/mcp'),
  { authProvider },
);

try {
  // The SDK discovers OAuth metadata and obtains a token using client_credentials
  // with client_secret_basic authentication; no browser or redirect is needed.
  await client.connect(transport);
  console.log(JSON.stringify(await client.listTools(), null, 2));
} finally {
  await client.close();
}
