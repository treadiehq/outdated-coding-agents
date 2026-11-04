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
  // Uses client_credentials with client_secret_basic; no browser flow is needed.
  const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('OAUTH_CLIENT_ID'),
    clientSecret: requiredEnv('OAUTH_CLIENT_SECRET'),
    // Pin credentials to the authorization server they were registered with.
    expectedIssuer: 'https://auth.example.com',
  });

  const client = new Client({ name: 'machine-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.example.com/mcp'),
    { authProvider },
  );

  try {
    // The SDK discovers OAuth metadata and obtains a token when challenged.
    await client.connect(transport);
    console.log('Connected to MCP server.');
    // Perform MCP operations with client here.
  } finally {
    await client.close();
  }
}

main().catch(() => {
  // Avoid logging SDK/server errors that could contain credentials or tokens.
  console.error('MCP connection failed. Check OAuth configuration and connectivity.');
  process.exitCode = 1;
});
