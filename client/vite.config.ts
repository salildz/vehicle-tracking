import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Docker için gerekli
    port: 3000,
    watch: {
      usePolling: true, // Docker volume'lar için
    },
    hmr: {
      host: "localhost",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
