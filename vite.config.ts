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
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ["nostr-tools"],
    include: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  build: {
    minify: process.env.NODE_ENV === "production", // Only minify in production
    sourcemap: process.env.NODE_ENV !== "production", // Source maps in development
    assetsInclude: ["**/*.xml"],
    rollupOptions: {
      output: {
        // Keep readable chunk names
        chunkFileNames:
          process.env.NODE_ENV === "production"
            ? "assets/[name]-[hash].js"
            : "assets/[name].js",
        entryFileNames:
          process.env.NODE_ENV === "production"
            ? "assets/[name]-[hash].js"
            : "assets/[name].js",
      },
    },
  },
}));
