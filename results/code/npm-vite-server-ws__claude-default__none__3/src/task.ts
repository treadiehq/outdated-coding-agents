import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // Vite rejects requests whose Host header isn't allowed, including WebSocket upgrades.
    allowedHosts: ["dev.example.com"],
    ws: {
      protocol: "wss",
      host: "dev.example.com",
      // clientPort only changes where the browser connects. Setting `port` instead
      // would make Vite open a separate WebSocket server on that port.
      clientPort: 443,
    },
  },
});
