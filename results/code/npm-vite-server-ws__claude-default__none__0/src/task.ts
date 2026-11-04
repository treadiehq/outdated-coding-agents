import { defineConfig } from "vite";

export default defineConfig({
  server: {
    ws: {
      protocol: "wss",
      host: "dev.example.com",
      // Browser-facing port only: `port: 443` would make Vite start a separate
      // WebSocket server on 443 instead of sharing the dev server's port.
      clientPort: 443,
    },
  },
});
