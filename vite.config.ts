import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // 5273 so this can run alongside other local projects (friday-quiz uses 5173).
  server: { port: 5273, host: true },
  build: { outDir: "dist" },
});
