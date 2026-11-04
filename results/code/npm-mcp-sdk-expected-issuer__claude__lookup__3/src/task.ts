import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ClientCredentialsProvider } from "@modelcontextprotocol/sdk/client/auth-extensions.js";

const MCP_URL = "https://mcp.example.com/mcp";
const AUTH_SERVER_ISSUER = "https://auth.example.com";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  // OAuth client_credentials grant (client_secret_basic). expectedIssuer pins the
  // credentials to our authorization server so they are never sent elsewhere.
  const authProvider = new ClientCredentialsProvider({
    clientId: requireEnv("OAUTH_CLIENT_ID"),
    clientSecret: requireEnv("OAUTH_CLIENT_SECRET"),
    expectedIssuer: AUTH_SERVER_ISSUER,
    ...(process.env.OAUTH_SCOPE ? { scope: process.env.OAUTH_SCOPE } : {}),
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    authProvider,
  });

  const client = new Client({ name: "task-client", version: "1.0.0" });

  try {
    await client.connect(transport);

    const { tools } = await client.listTools();
    console.log(`Connected. ${tools.length} tool(s) available:`);
    for (const tool of tools) {
      console.log(`- ${tool.name}${tool.description ? `: ${tool.description}` : ""}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
