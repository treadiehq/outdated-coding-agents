import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const SERVER_URL = 'https://mcp.example.com/mcp';
const AUTHORIZATION_SERVER = 'https://auth.example.com';

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
        // Refuse to send the credentials to any other authorization server the MCP server advertises.
        expectedIssuer: AUTHORIZATION_SERVER
    });

    const transport = new StreamableHTTPClientTransport(new URL(SERVER_URL), { authProvider });
    const client = new Client({ name: 'task-client', version: '1.0.0' }, { capabilities: {} });

    try {
        await client.connect(transport);

        const { tools } = await client.listTools();
        console.log('Available tools:', tools.map(tool => tool.name).join(', ') || '(none)');
    } finally {
        await client.close();
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
