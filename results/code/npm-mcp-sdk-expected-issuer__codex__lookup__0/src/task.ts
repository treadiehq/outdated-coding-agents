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
  // SDK 1.32.1: https://ts.sdk.modelcontextprotocol.io/client
  // expectedIssuer pins the credentials to their authorization server;
  // the SDK discovers its token endpoint and performs client_credentials.
  const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('OAUTH_CLIENT_ID'),
    clientSecret: requiredEnv('OAUTH_CLIENT_SECRET'),
    expectedIssuer: 'https://auth.example.com',
  });

  const client = new Client({ name: 'machine-to-machine-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.example.com/mcp'),
    { authProvider },
  );

  try {
    await client.connect(transport);
    console.log('Connected to the MCP server.');
    // Perform MCP operations with client here.
  } finally {
    await client.close();
  }
}

main().catch(() => {
  // Avoid printing authentication errors that could contain sensitive data.
  console.error('MCP connection failed. Check configuration and server availability.');
  process.exitCode = 1;
});
