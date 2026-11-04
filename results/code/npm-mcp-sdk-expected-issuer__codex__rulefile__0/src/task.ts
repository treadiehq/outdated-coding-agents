import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Run with OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET in the environment.
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
    // Bind credentials to their issuer before the SDK performs OAuth discovery.
    expectedIssuer: 'https://auth.example.com',
  });

  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.example.com/mcp'),
    { authProvider },
  );
  const client = new Client({ name: 'machine-to-machine-client', version: '1.0.0' });

  try {
    // The SDK discovers the token endpoint and uses the client_credentials grant.
    await client.connect(transport);
    await client.ping();
    console.log('Connected to the MCP server successfully.');
    // Perform additional MCP operations here before closing the connection.
  } finally {
    await client.close();
  }
}

main().catch(() => {
  // Avoid printing OAuth error responses that might contain credentials or tokens.
  console.error('MCP connection failed. Check OAuth environment variables and server configuration.');
  process.exitCode = 1;
});
