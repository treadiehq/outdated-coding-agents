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
  const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('OAUTH_CLIENT_ID'),
    clientSecret: requiredEnv('OAUTH_CLIENT_SECRET'),
    // Pin credentials to the authorization server where they were registered.
    expectedIssuer: 'https://auth.example.com',
  });

  // The SDK discovers the token endpoint and performs the client_credentials
  // grant using client_secret_basic, without a browser or redirect callback.
  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.example.com/mcp'),
    { authProvider },
  );
  const client = new Client({ name: 'machine-to-machine-client', version: '1.0.0' });

  try {
    await client.connect(transport);
    console.log('Connected to the MCP server.');
    // Perform MCP operations here while the connection is open.
  } finally {
    await client.close();
  }
}

main().catch(() => {
  // Avoid logging authentication errors that could contain sensitive responses.
  console.error('MCP connection failed. Check OAuth configuration and server availability.');
  process.exitCode = 1;
});
