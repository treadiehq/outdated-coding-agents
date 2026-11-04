import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    hmr: {
      protocol: 'wss',
      host: 'dev.example.com',
      clientPort: 443,
    },
  },
});
