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
  const authProvider = new ClientCredentialsProvider({
    clientId: requireEnv('OAUTH_CLIENT_ID'),
    clientSecret: requireEnv('OAUTH_CLIENT_SECRET'),
    // Only present the credentials to our own authorization server.
    expectedIssuer: AUTH_SERVER_ISSUER,
    ...(process.env.OAUTH_SCOPE ? { scope: process.env.OAUTH_SCOPE } : {})
  });

  const client = new Client({ name: 'task-client', version: '1.0.0' }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL), { authProvider });

  await client.connect(transport);
  try {
    const { tools } = await client.listTools();
    console.log(`Connected to ${MCP_SERVER_URL}. Available tools:`);
    for (const tool of tools) {
      console.log(`- ${tool.name}${tool.description ? `: ${tool.description}` : ''}`);
    }
  } finally {
    await client.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
