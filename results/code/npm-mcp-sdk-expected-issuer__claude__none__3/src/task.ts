import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ClientCredentialsProvider } from "@modelcontextprotocol/sdk/client/auth-extensions.js";

const MCP_SERVER_URL = "https://mcp.example.com/mcp";
// Expected authorization server (advertised by the MCP server via
// protected-resource metadata; the SDK discovers its token endpoint from there).
const AUTH_SERVER_URL = "https://auth.example.com";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const clientId = requireEnv("MCP_CLIENT_ID");
  const clientSecret = requireEnv("MCP_CLIENT_SECRET");

  // Machine-to-machine OAuth 2.0 client_credentials grant. The SDK fetches and
  // caches the access token, and re-authenticates on 401.
  const authProvider = new ClientCredentialsProvider({
    clientId,
    clientSecret,
    clientName: "mcp-m2m-client",
  });

  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL), {
    authProvider,
  });

  const client = new Client({ name: "mcp-m2m-client", version: "1.0.0" });

  try {
    await client.connect(transport);
    console.log(`Connected to ${MCP_SERVER_URL} (auth server: ${AUTH_SERVER_URL})`);

    const { tools } = await client.listTools();
    console.log(`Available tools (${tools.length}):`);
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
