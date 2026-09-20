import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// package.json is the one place the version lives; the app is handed it at build time so the
// number on screen can't drift from the one in the repo.
const { version } = JSON.parse(readFileSync("./package.json", "utf8")) as { version: string };

export default defineConfig({
  plugins: [react()],

  define: { __APP_VERSION__: JSON.stringify(version) },

  /**
   * Published as a project site at https://tobyandzuzka.com/dress-up-world/, so asset URLs
   * need that prefix or the browser asks the domain root for them and gets nothing back.
   *
   * The custom domain belongs to the tobydoig.github.io user-site repo, and every project site
   * is served under it automatically — which is why there is no CNAME file here. Adding one
   * would claim the apex domain for this repo and take the other sites down with it.
   *
   * Set unconditionally, so `npm run dev` and `npm run preview` both serve from the same path
   * the real site does — http://localhost:5273/dress-up-world/. Applying it only to builds
   * left `preview` serving from the root, where it quietly handed back index.html for every
   * asset and rendered a blank page.
   */
  base: "/dress-up-world/",

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
