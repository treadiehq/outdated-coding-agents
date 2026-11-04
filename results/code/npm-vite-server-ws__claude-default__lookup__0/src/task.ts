import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: ['dev.example.com'],
    ws: {
      protocol: 'wss',
      host: 'dev.example.com',
      clientPort: 443,
    },
  },
})
