import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/jiyibi/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg'],
      manifest: {
        name: '记一笔',
        short_name: '记一笔',
        description: '付完随手记一笔，钱花得明明白白',
        lang: 'zh-CN',
        start_url: '/jiyibi/',
        scope: '/jiyibi/',
        display: 'standalone',
        theme_color: '#16a34a',
        background_color: '#f6f7f9',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/jiyibi/index.html',
      },
    }),
  ],
})
