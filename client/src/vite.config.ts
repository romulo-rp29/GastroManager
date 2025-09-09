import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "client"), // define a pasta client como root
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, "dist/client"), // saída do build na raiz do projeto
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
