import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Em desenvolvimento, /api (inclusive o WebSocket /api/ao-vivo) vai para a API (apps/api, porta 3001).
// Em produção, a própria API serve este painel compilado (npm start na raiz).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { chunkSizeWarningLimit: 900 },
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://localhost:3001", changeOrigin: true, ws: true } },
  },
});
