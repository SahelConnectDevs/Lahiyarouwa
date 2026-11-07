import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En dev, /api est relayé vers l'API locale (npm run dev dans backend/) :
    // même origine qu'en prod, où nginx fait ce relais.
    proxy: {
      '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:3000',
    },
  },
  build: {
    // Pas de source maps publiques en prod.
    sourcemap: false,
  },
  test: {
    environment: 'node',
  },
});
