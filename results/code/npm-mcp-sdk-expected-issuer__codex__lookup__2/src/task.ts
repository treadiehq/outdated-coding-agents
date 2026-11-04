import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main(): Promise<void> {
  // SDK v1 client credentials documentation: https://ts.sdk.modelcontextprotocol.io/client
  // Pin the issuer so discovery cannot send these credentials to another server.
  const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('MCP_CLIENT_ID'),
    clientSecret: requiredEnv('MCP_CLIENT_SECRET'),
    expectedIssuer: 'https://auth.example.com',
  });

  const client = new Client({ name: 'machine-to-machine-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.example.com/mcp'),
    { authProvider },
  );

  try {
    // The SDK discovers the token endpoint and performs the client_credentials
    // grant using client_secret_basic when the MCP server requests authentication.
    await client.connect(transport);
    console.log('Connected to the MCP server.');
    // Perform MCP operations with client here.
  } finally {
    await client.close();
  }
}

main().catch(() => {
  // Avoid logging OAuth responses or errors that might contain credentials.
  console.error('MCP connection failed. Check credentials and server configuration.');
  process.exitCode = 1;
});
