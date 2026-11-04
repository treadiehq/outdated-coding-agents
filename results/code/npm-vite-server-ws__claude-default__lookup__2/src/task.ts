import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // Requests arrive with the proxy's Host header, which Vite rejects unless listed.
    allowedHosts: ["dev.example.com"],
    ws: {
      protocol: "wss",
      host: "dev.example.com",
      // clientPort, not port: port would make Vite bind its WebSocket server to 443.
      clientPort: 443,
    },
  },
});
