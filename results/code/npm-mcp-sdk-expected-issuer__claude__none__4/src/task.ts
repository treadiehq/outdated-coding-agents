import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = "https://mcp.example.com/mcp";
const AUTH_SERVER = "https://auth.example.com";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

/**
 * OAuth 2.0 client-credentials token source. Discovers the token endpoint from
 * the authorization server's metadata and caches the access token until shortly
 * before it expires.
 */
class ClientCredentialsTokenSource {
  private tokenEndpoint?: string;
  private token?: { value: string; expiresAt: number };

  constructor(
    private readonly issuer: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly scope?: string,
  ) {}

  private async discoverTokenEndpoint(): Promise<string> {
    if (this.tokenEndpoint) return this.tokenEndpoint;

    const base = this.issuer.replace(/\/+$/, "");
    const candidates = [
      `${base}/.well-known/oauth-authorization-server`,
      `${base}/.well-known/openid-configuration`,
    ];
    for (const url of candidates) {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) continue;
      const meta = (await res.json()) as { token_endpoint?: string };
      if (meta.token_endpoint) {
        this.tokenEndpoint = meta.token_endpoint;
        return this.tokenEndpoint;
      }
    }
    throw new Error(`Could not discover token endpoint for ${this.issuer}`);
  }

  async getToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.token && Date.now() < this.token.expiresAt) {
      return this.token.value;
    }

    const endpoint = await this.discoverTokenEndpoint();
    const body = new URLSearchParams({ grant_type: "client_credentials" });
    if (this.scope) body.set("scope", this.scope);

    // client_secret_basic (RFC 6749 §2.3.1): credentials are form-urlencoded, then Base64'd.
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

    const ttlMs = (json.expires_in ?? 300) * 1000;
    this.token = {
      value: json.access_token,
      // Refresh 30s early (or at half-life for very short-lived tokens).
      expiresAt: Date.now() + Math.max(ttlMs - 30_000, ttlMs / 2),
    };
    return this.token.value;
  }
}

/** fetch wrapper that attaches a bearer token and retries once on 401 with a fresh one. */
function authenticatedFetch(tokens: ClientCredentialsTokenSource): typeof fetch {
  return async (input, init) => {
    const send = async (token: string) => {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${token}`);
      return fetch(input, { ...init, headers });
    };

    const res = await send(await tokens.getToken());
    if (res.status !== 401) return res;
    await res.body?.cancel();
    return send(await tokens.getToken(true));
  };
}

async function main(): Promise<void> {
  const tokens = new ClientCredentialsTokenSource(
    AUTH_SERVER,
    requireEnv("OAUTH_CLIENT_ID"),
    requireEnv("OAUTH_CLIENT_SECRET"),
    process.env.OAUTH_SCOPE,
  );

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    fetch: authenticatedFetch(tokens),
  });
  const client = new Client({ name: "task-client", version: "1.0.0" });

  await client.connect(transport);
  try {
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
  console.error(err);
  process.exit(1);
});
