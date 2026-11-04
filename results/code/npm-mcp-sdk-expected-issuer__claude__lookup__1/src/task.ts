import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ClientCredentialsProvider } from "@modelcontextprotocol/sdk/client/auth-extensions.js";

const MCP_SERVER_URL = "https://mcp.example.com/mcp";
const AUTH_SERVER_ISSUER = "https://auth.example.com";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

async function main(): Promise<void> {
  // OAuth client_credentials grant (client_secret_basic). expectedIssuer pins
  // the credentials to our authorization server so they are never sent to
  // whichever server the MCP server happens to advertise.
  const authProvider = new ClientCredentialsProvider({
    clientId: requireEnv("MCP_CLIENT_ID"),
    clientSecret: requireEnv("MCP_CLIENT_SECRET"),
    expectedIssuer: AUTH_SERVER_ISSUER,
    clientName: "m2m-mcp-client",
    ...(process.env.MCP_SCOPE ? { scope: process.env.MCP_SCOPE } : {}),
  });

  const client = new Client({ name: "m2m-mcp-client", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL), {
    authProvider,
  });

  try {
    await client.connect(transport);
    console.log("Connected to", MCP_SERVER_URL);

    const { tools } = await client.listTools();
    console.log(
      "Available tools:",
      tools.map((t) => t.name).join(", ") || "(none)",
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
