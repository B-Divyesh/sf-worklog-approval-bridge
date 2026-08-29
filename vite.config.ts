import { defineConfig } from "vite";

declare const process: { env: { npm_package_version?: string } };

const version = process.env.npm_package_version;
if (!version) throw new Error("Vite must run through an npm package script so the release version is available.");

export default defineConfig({
  define: { __WORKLOG_VERSION__: JSON.stringify(version) },
  build: {
    outDir: "dist/site",
    target: "es2022",
    sourcemap: true,
    assetsInlineLimit: 2048,
    rollupOptions: { output: { manualChunks: undefined } }
  },
  server: { strictPort: true, port: 1420 },
  clearScreen: false
});
