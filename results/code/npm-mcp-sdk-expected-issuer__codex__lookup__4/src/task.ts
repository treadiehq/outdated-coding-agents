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
  // The SDK discovers the token endpoint and performs the client_credentials
  // grant with client_secret_basic, without a browser or redirect callback.
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
    await client.connect(transport);
    await client.ping();
    console.log('Connected to MCP server.');
    // Perform application-specific MCP operations here.
  } finally {
    await client.close();
  }
}

main().catch(() => {
  // Avoid logging OAuth responses or exceptions that could contain credentials.
  console.error('MCP client failed. Check credentials and server configuration.');
  process.exitCode = 1;
});
