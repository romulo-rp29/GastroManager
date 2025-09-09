import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve('client'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'), // Points to the root shared folder
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
    rollupOptions: {
      external: ['@prisma/client'], // Add any Node.js built-ins or other external dependencies here
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'date-fns', 'lucide-react'],
  },
  define: {
    'process.env': {},
  },
});
