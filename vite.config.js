import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'BelieversFlow - Christian Task Manager',
        short_name: 'BelieversFlow',
        description: 'Christian task manager, Bible reader, hymn book, and spiritual growth tracker',
        theme_color: '#1a1a2e',
        background_color: '#0a0a1a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        lang: 'en',
        categories: ['religion', 'productivity', 'education'],
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/bible-api\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bible-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/christian-task-manager\.vercel\.app\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react'
          if (id.includes('node_modules')) return 'vendor'
          if (id.includes('hymns.js')) return 'hymns-data'
          if (id.includes('devotional.js')) return 'devotional-data'
          if (id.includes('hymnFallbackTunes.js')) return 'hymn-tunes'
        },
      },
    },
    chunkSizeWarningLimit: 300,
  },
})
