import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // The proxy forwards the public hostname, which Vite rejects unless allowed.
    allowedHosts: ["dev.example.com"],
    ws: {
      protocol: "wss",
      host: "dev.example.com",
      // clientPort, not port: the proxy listens on 443, while Vite keeps
      // serving the WebSocket from its own HTTP server behind it.
      clientPort: 443,
    },
  },
});
