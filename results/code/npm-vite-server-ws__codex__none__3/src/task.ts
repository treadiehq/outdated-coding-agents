import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: ['dev.example.com'],
    hmr: {
      protocol: 'wss',
      host: 'dev.example.com',
      clientPort: 443,
    },
  },
});
