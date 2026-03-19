
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve('./'),
    },
  },
  build: {
    target: 'esnext', // Required for WebGPU and Top-level await support
    outDir: 'dist',
    minify: 'esbuild'
  },
  server: {
    // Removed strict headers to allow CDN scripts (fixes 'Script error')
  }
});
