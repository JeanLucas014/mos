/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
  plugins: [
    react(),
    VitePWA({
      /* SW is registered manually in main.tsx — plugin only injects manifest */
      registerType: 'prompt',
      selfDestroying: false,
      /* Workbox: generate a minimal SW that caches the app shell */
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        /* Assets do build (JS/CSS/imagens) já vão pro precache acima.
           runtimeCaching cobre o que globPatterns não alcança: fontes do
           Google Fonts, carregadas via <link> em index.html a partir de
           um domínio externo. CacheFirst é seguro aqui — fontes não mudam. */
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      /* Don't add the inline registration snippet — we handle it manually */
      injectRegister: null,
      manifest: {
        name: 'MOS',
        short_name: 'MOS',
        description: 'MOS — seu sistema operacional pessoal',
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0EA5E9',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/MOS.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/MOS.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
    /* Gera stats.html com o breakdown do bundle. Rodar com ANALYZE=true npm run build */
    !!process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: true,
    }),
  ],
})
