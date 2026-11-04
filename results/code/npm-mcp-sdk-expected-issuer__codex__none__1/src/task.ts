import process from 'node:process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  // The SDK discovers the token endpoint and uses client_credentials with
  // client_secret_basic. Pin the issuer before presenting client credentials.
  const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('OAUTH_CLIENT_ID'),
    clientSecret: requiredEnv('OAUTH_CLIENT_SECRET'),
    expectedIssuer: 'https://auth.example.com',
    ...(process.env.OAUTH_SCOPE ? { scope: process.env.OAUTH_SCOPE } : {}),
  });

  const client = new Client({ name: 'machine-to-machine-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.example.com/mcp'),
    { authProvider },
  );

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    console.log(JSON.stringify(tools, null, 2));
  } finally {
    await client.close();
  }
}

void main().catch(() => {
  // Avoid logging SDK errors that might contain credentials or token responses.
  console.error('MCP client failed. Check OAuth configuration and server availability.');
  process.exitCode = 1;
});
