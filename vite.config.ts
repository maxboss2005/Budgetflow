import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // These are the root-level files in your public folder
        includeAssets: ['icon-192.png', 'icon-512.png'],
        // We disable the auto-manifest because you already have a custom one
        manifest: false,
        workbox: {
          // IMPORTANT: ONLY cache JS, CSS, and HTML.
          // This keeps the sw.js TINY so it loads instantly on slow phones.
          globPatterns: ['**/*.{js,css,html}'],
          
          // Ignore files larger than 2MB to prevent bloating
          maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
          
          // These two lines make the SW take control immediately
          skipWaiting: true,
          clientsClaim: true,
          
          // Optional: cache external icons from icons8
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/img\.icons8\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'icons8-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});