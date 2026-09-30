import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In development the API runs on :4000. Proxying /api and /uploads through Vite makes the
// admin panel and API the same origin, so the refresh-token cookie just works.
const API_TARGET = process.env.API_TARGET || 'http://localhost:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': API_TARGET,
      '/uploads': API_TARGET,
    },
  },
});
