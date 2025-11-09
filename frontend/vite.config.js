import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), svgr()],
  server: { // TODO check
    watch: { usePolling: true },
    host: true,
    strictPort: true,
    port: process.env.APP_PORT
  }
});
