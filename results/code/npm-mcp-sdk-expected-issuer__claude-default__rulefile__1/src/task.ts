import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

// The project does not depend on @types/node.
declare const process: { env: Record<string, string | undefined> };

const MCP_SERVER_URL = 'https://mcp.example.com/mcp';
const AUTHORIZATION_SERVER_URL = 'https://auth.example.com';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable ${name}`);
    }
    return value;
}

const authProvider = new ClientCredentialsProvider({
    clientId: requireEnv('MCP_CLIENT_ID'),
    clientSecret: requireEnv('MCP_CLIENT_SECRET'),
    // Refuses to send the credentials to any other authorization server the MCP server advertises.
    expectedIssuer: AUTHORIZATION_SERVER_URL
});

const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL), { authProvider });
const client = new Client({ name: 'task-client', version: '1.0.0' });

await client.connect(transport);
try {
    const { tools } = await client.listTools();
    console.log(
        'Available tools:',
        tools.map(tool => tool.name)
    );
} finally {
    await client.close();
}
