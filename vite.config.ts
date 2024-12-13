import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@solana/web3.js": "@solana/web3.js/lib/index.browser.esm.js",
    },
  },
  build: {
    rollupOptions: {
      external: ["rpc-websockets/dist/lib/client", "rpc-websockets/dist/lib/client/websocket.browser"],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
    },
  },
});
