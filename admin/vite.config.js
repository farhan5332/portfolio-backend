import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In development the API runs on :4000. Proxying /api and /uploads through Vite makes the
// admin panel and API the same origin, so the refresh-token cookie just works.
const API_TARGET = process.env.API_TARGET || 'http://localhost:4000';

// The production build is served by the API at /admin (see src/app.js).
// Hosting it on its own domain instead? Build with ADMIN_BASE=/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? process.env.ADMIN_BASE || '/admin/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': API_TARGET,
      '/uploads': API_TARGET,
    },
  },
}));
