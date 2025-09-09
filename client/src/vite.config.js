import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'client',      // Define que a pasta do frontend é client
  plugins: [react()],
  build: {
    outDir: '../dist/client', // Saída do build
    emptyOutDir: true
  }
})
