import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // Accept requests forwarded by the reverse proxy with this Host header
    allowedHosts: ['dev.example.com'],
    // The browser connects to the proxy, not to Vite's own port
    ws: {
      protocol: 'wss',
      host: 'dev.example.com',
      clientPort: 443,
    },
  },
})
