import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  css: {
    postcss: path.resolve(__dirname, "postcss.config.js"),
  },
  build: {
    outDir: path.resolve(__dirname, "../dist"), // ou "build" se preferir
    emptyOutDir: true,
  },
});
