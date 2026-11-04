import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // The reverse proxy forwards requests with Host: dev.example.com
    allowedHosts: ['dev.example.com'],
    ws: {
      protocol: 'wss',
      host: 'dev.example.com',
      // clientPort only changes what the browser connects to; `port` would
      // make Vite open a separate WebSocket listener instead.
      clientPort: 443,
    },
  },
})
