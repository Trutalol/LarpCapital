import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev this is served under LarpCapital's /course (frontend/vite.config.ts proxies it);
// in production it's its own site at the root.
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/course/' : '/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
  },
}));
