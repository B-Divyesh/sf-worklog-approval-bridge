import { defineConfig } from "vite";

export default defineConfig({
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
