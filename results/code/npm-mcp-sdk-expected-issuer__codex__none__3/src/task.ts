import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main(): Promise<void> {
  // The SDK discovers OAuth metadata and obtains/renews tokens using
  // client_credentials with client_secret_basic; no browser is involved.
  const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('MCP_CLIENT_ID'),
    clientSecret: requiredEnv('MCP_CLIENT_SECRET'),
    // Pin the issuer so discovery cannot send these credentials to another AS.
    expectedIssuer: 'https://auth.example.com',
  });

  const client = new Client({ name: 'machine-mcp-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.example.com/mcp'),
    { authProvider },
  );

  try {
    await client.connect(transport);
    console.log('Connected to MCP server.');
    // Make MCP requests here, for example: await client.listTools().
  } finally {
    await client.close();
  }
}

void main().catch(() => {
  // Avoid logging OAuth error objects that might contain credentials or tokens.
  console.error('MCP connection failed. Check MCP_CLIENT_ID, MCP_CLIENT_SECRET, and server configuration.');
  process.exitCode = 1;
});
