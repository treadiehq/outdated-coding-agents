import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // Accept requests forwarded by the reverse proxy with this Host header
    allowedHosts: ['dev.example.com'],
    // Live-reload socket as seen by the browser: wss://dev.example.com:443
    ws: {
      protocol: 'wss',
      host: 'dev.example.com',
      clientPort: 443,
    },
  },
})
