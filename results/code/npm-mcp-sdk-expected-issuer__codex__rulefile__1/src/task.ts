import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main(): Promise<void> {
  const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('OAUTH_CLIENT_ID'),
    clientSecret: requiredEnv('OAUTH_CLIENT_SECRET'),
    // Pin credentials to the authorization server they were registered with.
    expectedIssuer: 'https://auth.example.com',
  });

  // The SDK discovers OAuth metadata and performs the client_credentials grant.
  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.example.com/mcp'),
    { authProvider },
  );
  const client = new Client({ name: 'machine-to-machine-client', version: '1.0.0' });

  try {
    await client.connect(transport);
    console.log('Connected to MCP server.');
    // Perform MCP operations here using client before the connection is closed.
  } finally {
    await client.close();
  }
}

void main().catch((error: unknown) => {
  // Avoid logging SDK errors that could contain credentials or token responses.
  const message = error instanceof Error && error.message.startsWith('Missing required environment variable: ')
    ? error.message
    : 'MCP connection failed. Check server availability and OAuth configuration.';
  console.error(message);
  process.exitCode = 1;
});
