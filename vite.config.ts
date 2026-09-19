import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // 5273 so this can run alongside other local projects (friday-quiz uses 5173).
  server: {
    port: 5273,
    // Bind all interfaces, and let LAN devices reach it by hostname — Vite 5's DNS-rebinding
    // protection otherwise rejects anything that isn't localhost or an IP.
    host: true,
    allowedHosts: [".internal"],
  },
  build: { outDir: "dist" },
});
