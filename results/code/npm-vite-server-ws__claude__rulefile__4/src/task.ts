import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // Accept requests forwarded by the reverse proxy under this hostname.
    allowedHosts: ['dev.example.com'],
    ws: {
      // The browser connects to the proxy, not to the Vite dev server directly.
      protocol: 'wss',
      host: 'dev.example.com',
      clientPort: 443,
    },
  },
})
