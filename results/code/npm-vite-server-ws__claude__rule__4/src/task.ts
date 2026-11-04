import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    ws: {
      protocol: 'wss',
      host: 'dev.example.com',
      clientPort: 443,
    },
  },
})
