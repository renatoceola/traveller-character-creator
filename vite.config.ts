import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/traveller-character-creator/', // Replace with your repository name
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './config'),
      '@schemas': path.resolve(__dirname, './schemas'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});