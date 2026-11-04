import process from 'node:process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  // Uses client_credentials with client_secret_basic; no browser or callback.
  const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('OAUTH_CLIENT_ID'),
    clientSecret: requiredEnv('OAUTH_CLIENT_SECRET'),
    // Pin discovery to the authorization server that issued these credentials.
    expectedIssuer: 'https://auth.example.com',
  });

  const client = new Client({ name: 'machine-mcp-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.example.com/mcp'),
    { authProvider },
  );

  try {
    // The SDK discovers OAuth metadata and obtains and attaches the access token.
    await client.connect(transport);
    console.log(JSON.stringify(await client.listTools(), null, 2));
  } finally {
    await client.close();
  }
}

void main().catch(() => {
  // Avoid logging OAuth responses, which may contain credentials or tokens.
  console.error('MCP client failed. Check OAuth environment variables, server configuration, and connectivity.');
  process.exitCode = 1;
});
