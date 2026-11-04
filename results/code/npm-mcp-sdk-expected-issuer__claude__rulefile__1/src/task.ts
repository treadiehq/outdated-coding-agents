import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';

const MCP_URL = 'https://mcp.example.com/mcp';
const AUTH_SERVER = 'https://auth.example.com';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const authProvider = new ClientCredentialsProvider({
    clientId: requireEnv('OAUTH_CLIENT_ID'),
    clientSecret: requireEnv('OAUTH_CLIENT_SECRET'),
    // Only send credentials to our authorization server.
    expectedIssuer: AUTH_SERVER,
    ...(process.env.OAUTH_SCOPE ? { scope: process.env.OAUTH_SCOPE } : {})
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), { authProvider });
  const client = new Client({ name: 'task-client', version: '1.0.0' }, { capabilities: {} });

  await client.connect(transport);
  try {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      console.log(`${tool.name}${tool.description ? `: ${tool.description}` : ''}`);
    }
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
