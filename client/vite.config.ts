import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // Hapus plugin yang tidak diperlukan jika tidak diinstall
    // runtimeErrorOverlay(),
    // nodePolyfills({ protocolImports: true }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"), 23q 
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    // Add this if you need specific server options
  },
  optimizeDeps: {
    exclude: ["mongodb"], // Prevent Vite from bundling MongoDB for the client
  },
});
