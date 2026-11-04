import process from 'node:process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main(): Promise<void> {
  // Uses the client_credentials grant with client_secret_basic authentication.
  // Pin the issuer so discovery cannot send credentials to another server.
  const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('MCP_CLIENT_ID'),
    clientSecret: requiredEnv('MCP_CLIENT_SECRET'),
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
    // Perform MCP operations here while the connection is open.
  } finally {
    await client.close();
  }
}

void main().catch(() => {
  // Avoid logging SDK errors that could contain authentication response data.
  console.error('MCP client failed. Check credentials and server configuration.');
  process.exitCode = 1;
});
