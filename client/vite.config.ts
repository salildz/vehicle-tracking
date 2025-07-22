import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", 
    port: 9041,
        proxy: {
          "/api": {
            target: "http://server:9040",
          },
        },
    allowedHosts: ["localhost", "vehicle-tracking.yildizsalih.com"],
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
