import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const MCP_SERVER_URL = 'https://mcp.example.com/mcp';
const AUTHORIZATION_SERVER_URL = 'https://auth.example.com';

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

async function main(): Promise<void> {
    // On a 401 the transport discovers the token endpoint and runs the client_credentials grant.
    // expectedIssuer makes it refuse to send the secret to any other authorization server.
    const authProvider = new ClientCredentialsProvider({
        clientId: requireEnv('MCP_CLIENT_ID'),
        clientSecret: requireEnv('MCP_CLIENT_SECRET'),
        expectedIssuer: AUTHORIZATION_SERVER_URL
    });

    const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL), { authProvider });
    const client = new Client({ name: 'task-client', version: '1.0.0' });

    try {
        await client.connect(transport);

        const { tools } = await client.listTools();
        console.log(
            'Available tools:',
            tools.map(tool => tool.name)
        );
    } finally {
        await client.close();
    }
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
