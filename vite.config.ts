import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "client"), // aponta para a pasta client
  css: {
    postcss: path.resolve(__dirname, "client/postcss.config.cjs"),
  },
  plugins: [react()],
});
