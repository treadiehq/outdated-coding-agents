import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';

const MCP_SERVER_URL = 'https://mcp.example.com/mcp';
const AUTH_SERVER_ISSUER = 'https://auth.example.com';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  // client_credentials grant with client_secret_basic. expectedIssuer pins the
  // credentials to our authorization server so they are never sent elsewhere.
  const authProvider = new ClientCredentialsProvider({
    clientId: requireEnv('MCP_CLIENT_ID'),
    clientSecret: requireEnv('MCP_CLIENT_SECRET'),
    clientName: 'task-mcp-client',
    scope: process.env.MCP_SCOPE,
    expectedIssuer: AUTH_SERVER_ISSUER,
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL), {
    authProvider,
  });

  const client = new Client({ name: 'task-mcp-client', version: '1.0.0' });

  try {
    await client.connect(transport);

    const { tools } = await client.listTools();
    console.log(`Connected. ${tools.length} tool(s) available:`);
    for (const tool of tools) {
      console.log(`- ${tool.name}${tool.description ? `: ${tool.description}` : ''}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
