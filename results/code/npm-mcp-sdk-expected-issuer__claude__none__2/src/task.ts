import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = "https://mcp.example.com/mcp";
const AUTH_SERVER = "https://auth.example.com";

type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

/** Looks up the token endpoint from the authorization server's metadata (RFC 8414, then OIDC). */
async function discoverTokenEndpoint(): Promise<string> {
  const candidates = [
    `${AUTH_SERVER}/.well-known/oauth-authorization-server`,
    `${AUTH_SERVER}/.well-known/openid-configuration`,
  ];
  for (const url of candidates) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) continue;
    const meta = (await res.json()) as { token_endpoint?: string };
    if (meta.token_endpoint) return meta.token_endpoint;
  }
  throw new Error(`Could not discover token endpoint from ${AUTH_SERVER}`);
}

/** OAuth 2.0 client_credentials grant with in-memory caching of the access token. */
class ClientCredentialsTokenSource {
  private token?: { value: string; expiresAt: number };
  private tokenEndpoint?: string;
  private inflight?: Promise<string>;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly scope?: string,
  ) {}

  async getToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.token && Date.now() < this.token.expiresAt - 30_000) {
      return this.token.value;
    }
    this.inflight ??= this.fetchToken().finally(() => {
      this.inflight = undefined;
    });
    return this.inflight;
  }

  private async fetchToken(): Promise<string> {
    this.tokenEndpoint ??= await discoverTokenEndpoint();

    const body = new URLSearchParams({ grant_type: "client_credentials" });
    if (this.scope) body.set("scope", this.scope);

    const basic = Buffer.from(
      `${encodeURIComponent(this.clientId)}:${encodeURIComponent(this.clientSecret)}`,
    ).toString("base64");

    const res = await fetch(this.tokenEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });
    if (!res.ok) {
      throw new Error(`Token request failed (${res.status}): ${await res.text()}`);
    }
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) throw new Error("Token response did not include access_token");

    this.token = {
      value: json.access_token,
      expiresAt: Date.now() + (json.expires_in ?? 300) * 1000,
    };
    return this.token.value;
  }
}

/** Wraps fetch to attach a bearer token, refreshing and retrying once on 401. */
function withBearerAuth(tokens: ClientCredentialsTokenSource): FetchLike {
  const send = async (url: string | URL, init: RequestInit | undefined, token: string) => {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...init, headers });
  };

  return async (url, init) => {
    const res = await send(url, init, await tokens.getToken());
    if (res.status !== 401) return res;
    await res.body?.cancel();
    return send(url, init, await tokens.getToken(true));
  };
}

async function main() {
  const tokens = new ClientCredentialsTokenSource(
    requireEnv("OAUTH_CLIENT_ID"),
    requireEnv("OAUTH_CLIENT_SECRET"),
    process.env.OAUTH_SCOPE,
  );

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    fetch: withBearerAuth(tokens),
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
