import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    // Allow requests whose Host header is the proxied public hostname
    allowedHosts: ['dev.example.com'],
    hmr: {
      // The browser connects to the proxy, not to the Vite dev server directly
      protocol: 'wss',
      host: 'dev.example.com',
      clientPort: 443,
    },
  },
})
