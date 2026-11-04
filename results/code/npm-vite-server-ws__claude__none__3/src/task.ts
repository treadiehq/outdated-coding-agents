import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    hmr: {
      protocol: 'wss',
      host: 'dev.example.com',
      clientPort: 443,
    },
  },
})
