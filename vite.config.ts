import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: {
        name: 'Quran Hafiz',
        short_name: 'Quran Hafiz',
        description: 'Al-Quran dan hafalan dengan akses surah tersimpan secara offline',
        lang: 'id',
        start_url: '/',
        display: 'standalone',
        theme_color: '#F5F2EA',
        background_color: '#F5F2EA',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'quran-hafiz-fonts',
            cacheableResponse: { statuses: [0, 200] },
            expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
          },
        }],
      },
    })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
