import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative Pfade: Die App läuft so unter jeder Adresse, auch in einem Unterordner wie
  // https://<name>.github.io/kraft-tracker/ (GitHub Pages). Der Hash-Router braucht keine Server-Regeln.
  base: './',
  plugins: [
    react(),
    // Macht die App installierbar ("Zum Home-Bildschirm") und offline nutzbar:
    // Der Service Worker legt alle Build-Dateien beim ersten Besuch in den Cache.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Kraft-Tracker',
        short_name: 'Kraft',
        description: 'Krafttraining tracken – Pläne, Tagebuch, Pausentimer, 1RM-Statistik',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111317',
        theme_color: '#111317',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
});
