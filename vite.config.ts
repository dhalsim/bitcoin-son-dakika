import path from "path";

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [reactRouter(), tailwindcss()].filter(Boolean),
  resolve: {
    alias: {
      "@/api": path.resolve(__dirname, "./api"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["nostr-tools"],
    include: ["react", "react-dom", "react-router", "react-router-dom"],
  },
}));
