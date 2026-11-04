import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// Set MCP_CLIENT_ID and MCP_CLIENT_SECRET before running this file.
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main(): Promise<void> {
  const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('MCP_CLIENT_ID'),
    clientSecret: requiredEnv('MCP_CLIENT_SECRET'),
    // Bind credentials to the authorization server they were registered with.
    expectedIssuer: 'https://auth.example.com',
  });

  const client = new Client({ name: 'machine-to-machine-client', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.example.com/mcp'),
    { authProvider },
  );

  try {
    // The SDK discovers the token endpoint and uses the client_credentials grant.
    await client.connect(transport);
    console.log('Connected to the MCP server.');
    // Perform MCP operations here using client.callTool(), client.listTools(), etc.
  } finally {
    await client.close();
  }
}

main().catch(() => {
  // Do not print authentication errors that might contain credentials or tokens.
  console.error('MCP client failed. Check configuration and server availability.');
  process.exitCode = 1;
});
