import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({ mode }) => {
  loadEnv(mode, ".", "");
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Proxy /api/gemini to `vercel dev` (default :3000) when running `npm run dev` alone.
      proxy: {
        '/api/gemini': {
          target: process.env.VERCEL_DEV_API_URL || 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
