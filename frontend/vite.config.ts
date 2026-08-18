import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
const { version } = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL ?? "http://backend:8000",
        rewrite: (path) => path.replace(/^\/api/, ""),
        changeOrigin: true,
      },
    },
  },
});
