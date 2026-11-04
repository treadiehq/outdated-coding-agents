import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ClientCredentialsProvider } from "@modelcontextprotocol/sdk/client/auth-extensions.js";

const MCP_URL = "https://mcp.example.com/mcp";
const AUTH_SERVER = "https://auth.example.com";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const authProvider = new ClientCredentialsProvider({
    clientId: requireEnv("MCP_CLIENT_ID"),
    clientSecret: requireEnv("MCP_CLIENT_SECRET"),
    clientName: "mcp-m2m-client",
    scope: process.env.MCP_SCOPE,
    // Only present these credentials to our own authorization server.
    expectedIssuer: AUTH_SERVER,
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    authProvider,
  });

  const client = new Client({ name: "mcp-m2m-client", version: "1.0.0" });

  try {
    await client.connect(transport);

    const { tools } = await client.listTools();
    console.log(`Connected to ${MCP_URL}. Available tools (${tools.length}):`);
    for (const tool of tools) {
      console.log(`- ${tool.name}${tool.description ? `: ${tool.description}` : ""}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
