import { defineConfig } from "vite";

export default defineConfig({
  server: {
    allowedHosts: ["dev.example.com"],
    ws: {
      protocol: "wss",
      host: "dev.example.com",
      // clientPort, not port: the browser connects to the proxy on 443, while
      // Vite keeps serving the WebSocket on its own HTTP server behind it.
      clientPort: 443,
    },
  },
});
