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
  // OAuth client_credentials grant (machine-to-machine). The SDK discovers the
  // token endpoint from the MCP server's protected-resource metadata, fetches
  // and refreshes tokens, and retries on 401.
  const authProvider = new ClientCredentialsProvider({
    clientId: requireEnv("OAUTH_CLIENT_ID"),
    clientSecret: requireEnv("OAUTH_CLIENT_SECRET"),
    clientName: "m2m-mcp-client",
    scope: process.env.OAUTH_SCOPE, // optional, space-separated
    // Only ever present the credentials to our own authorization server.
    expectedIssuer: AUTH_SERVER,
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    authProvider,
  });

  const client = new Client({ name: "m2m-mcp-client", version: "1.0.0" });

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
