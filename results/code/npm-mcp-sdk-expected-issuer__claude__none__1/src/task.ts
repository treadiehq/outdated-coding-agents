import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = "https://mcp.example.com/mcp";
const AUTH_SERVER = "https://auth.example.com";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

/** OAuth 2.0 client-credentials grant (RFC 6749 §4.4) with in-memory token caching. */
class ClientCredentialsTokenSource {
  private token?: { value: string; expiresAt: number };
  private tokenEndpoint?: string;

  constructor(
    private readonly issuer: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly scope?: string,
  ) {}

  private async discoverTokenEndpoint(): Promise<string> {
    if (this.tokenEndpoint) return this.tokenEndpoint;
    const candidates = [
      `${this.issuer}/.well-known/oauth-authorization-server`,
      `${this.issuer}/.well-known/openid-configuration`,
    ];
    for (const url of candidates) {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const meta = (await res.json()) as { issuer?: string; token_endpoint?: string };
      if (meta.issuer && meta.issuer.replace(/\/$/, "") !== this.issuer) {
        throw new Error(`Issuer mismatch in ${url}: ${meta.issuer}`);
      }
      if (meta.token_endpoint) {
        this.tokenEndpoint = meta.token_endpoint;
        return this.tokenEndpoint;
      }
    }
    throw new Error(`Could not discover token endpoint for ${this.issuer}`);
  }

  async getToken(forceRefresh = false): Promise<string> {
    // Refresh 30s early to avoid using a token that expires in flight.
    if (!forceRefresh && this.token && Date.now() < this.token.expiresAt - 30_000) {
      return this.token.value;
    }

    const endpoint = await this.discoverTokenEndpoint();
    const body = new URLSearchParams({ grant_type: "client_credentials" });
    if (this.scope) body.set("scope", this.scope);

    // client_secret_basic: credentials are form-urlencoded, then base64'd (RFC 6749 §2.3.1).
    const basic = Buffer.from(
      `${encodeURIComponent(this.clientId)}:${encodeURIComponent(this.clientSecret)}`,
    ).toString("base64");

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
    if (!res.ok) {
      throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) throw new Error("Token response missing access_token");

    this.token = {
      value: json.access_token,
      expiresAt: Date.now() + (json.expires_in ?? 300) * 1000,
    };
    return this.token.value;
  }
}

/** Wraps fetch to attach a bearer token, retrying once with a fresh token on 401. */
function authedFetch(tokens: ClientCredentialsTokenSource): typeof fetch {
  const send = async (input: Parameters<typeof fetch>[0], init: RequestInit | undefined, token: string) => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };
  return async (input, init) => {
    const res = await send(input, init, await tokens.getToken());
    if (res.status !== 401) return res;
    await res.body?.cancel();
    return send(input, init, await tokens.getToken(true));
  };
}

async function main() {
  const tokens = new ClientCredentialsTokenSource(
    AUTH_SERVER,
    requireEnv("MCP_CLIENT_ID"),
    requireEnv("MCP_CLIENT_SECRET"),
    process.env.MCP_SCOPE,
  );

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    fetch: authedFetch(tokens),
  });
  const client = new Client({ name: "task-client", version: "1.0.0" });

  await client.connect(transport);
  try {
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
