import process from 'node:process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ClientCredentialsProvider } from '@modelcontextprotocol/sdk/client/auth-extensions.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value || !value.trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

// Uses the client_credentials grant without browser redirects or user interaction.
const authProvider = new ClientCredentialsProvider({
    clientId: requiredEnv('OAUTH_CLIENT_ID'),
    clientSecret: requiredEnv('OAUTH_CLIENT_SECRET'),
    expectedIssuer: 'https://auth.example.com'
});

const client = new Client({ name: 'machine-to-machine-client', version: '1.0.0' });
const transport = new StreamableHTTPClientTransport(
    new URL('https://mcp.example.com/mcp'),
    { authProvider }
);

try {
    // The transport discovers OAuth metadata and obtains and attaches access tokens.
    await client.connect(transport);
    console.log('Connected to the MCP server.');
    // Add MCP operations here, for example: await client.listTools().
} finally {
    await client.close();
}
