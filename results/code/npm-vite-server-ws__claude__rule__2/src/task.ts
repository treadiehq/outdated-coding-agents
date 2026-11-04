import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    ws: {
      protocol: 'wss',
      host: 'dev.example.com',
      port: 443,
      clientPort: 443,
    },
  },
})
