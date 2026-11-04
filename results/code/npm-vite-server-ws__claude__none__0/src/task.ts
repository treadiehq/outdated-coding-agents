import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['dev.example.com'],
    hmr: {
      protocol: 'wss',
      host: 'dev.example.com',
      clientPort: 443,
    },
  },
})
