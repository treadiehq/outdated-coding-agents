import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // `server.hmr.*` connection options are deprecated in favor of `server.ws`
    ws: {
      protocol: 'wss',
      host: 'dev.example.com',
      // The browser connects to the proxy's port; the proxy forwards to Vite
      clientPort: 443,
    },
  },
})
