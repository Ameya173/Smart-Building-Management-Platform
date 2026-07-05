import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const srcAlias = new URL("./src", import.meta.url).pathname.replace(/^\/([A-Za-z]:\/)/, "$1");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": srcAlias,
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});
