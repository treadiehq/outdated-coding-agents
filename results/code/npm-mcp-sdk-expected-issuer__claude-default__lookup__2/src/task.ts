import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_SERVER_URL = 'https://mcp.example.com/mcp';
const AUTHORIZATION_SERVER_URL = 'https://auth.example.com';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} environment variable is required`);
    }
    return value;
}

async function main(): Promise<void> {
    const authProvider = new ClientCredentialsProvider({
        clientId: requireEnv('MCP_CLIENT_ID'),
        clientSecret: requireEnv('MCP_CLIENT_SECRET'),
        // The credentials are only sent to this authorization server; auth fails if the MCP server advertises another.
        expectedIssuer: AUTHORIZATION_SERVER_URL
    });

    const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL), { authProvider });
    const client = new Client({ name: 'task-client', version: '1.0.0' });

    await client.connect(transport);
    try {
        const { tools } = await client.listTools();
        console.log('Available tools:', tools.map(tool => tool.name).join(', ') || '(none)');
    } finally {
        await client.close();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
