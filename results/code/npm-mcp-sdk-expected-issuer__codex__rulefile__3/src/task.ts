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
  // The SDK discovers OAuth endpoints and obtains tokens without a browser.
  const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('MCP_CLIENT_ID'),
    clientSecret: requiredEnv('MCP_CLIENT_SECRET'),
    // Bind credentials to our authorization server before trusting discovery.
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
    // Make MCP requests here while the connection is open.
  } finally {
    await client.close();
  }
}

main().catch((error: unknown) => {
  // Avoid logging OAuth responses, which can contain credentials or tokens.
  if (error instanceof Error && error.message.startsWith('Missing required environment variable:')) {
    console.error(error.message);
  } else {
    console.error('MCP connection or authentication failed.');
  }
  process.exitCode = 1;
});
