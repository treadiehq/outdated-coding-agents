import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const SERVER_URL = new URL('https://mcp.example.com/mcp');
const AUTHORIZATION_SERVER = 'https://auth.example.com';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} environment variable is required`);
    }
    return value;
}

export async function connect(): Promise<Client> {
    const authProvider = new ClientCredentialsProvider({
        clientId: requireEnv('MCP_CLIENT_ID'),
        clientSecret: requireEnv('MCP_CLIENT_SECRET'),
        // Refuses to send the credentials if the MCP server advertises a different authorization server.
        expectedIssuer: AUTHORIZATION_SERVER
    });

    const client = new Client({ name: 'task-client', version: '1.0.0' });
    await client.connect(new StreamableHTTPClientTransport(SERVER_URL, { authProvider }));
    return client;
}

async function main(): Promise<void> {
    const client = await connect();
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
