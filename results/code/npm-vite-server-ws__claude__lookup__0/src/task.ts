import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // The proxy terminates TLS and forwards plain HTTP, so Vite's host check applies.
    allowedHosts: ['dev.example.com'],
    // Live-reload socket as seen by the browser (server.hmr.* is deprecated in favor of server.ws.*).
    ws: {
      protocol: 'wss',
      host: 'dev.example.com',
      clientPort: 443,
    },
  },
})
