// vite.config.js
import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import tsconfigPaths from 'vite-plugin-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  root: 'web',
  base: '/', // usar '/' durante dev para resolver corretamente /js/... e evitar /@fs/... paths
  publicDir: false,

  server: {
    port: 5500,
    strictPort: true,
    open: '/#/',
    headers: { 'Cache-Control': 'no-store, max-age=0' }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'web/js'),
      '@assets': path.resolve(__dirname, 'web/assets') // novo alias para assets estáticos
    }
  },

  plugins: [
    tsconfigPaths(),
    legacy({ targets: ['defaults', 'not IE 11'] }),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: '.', // relativo ao root: 'web'
      filename: 'service-worker.js',
      injectManifest: {
        globPatterns: [
          '**/*.{js,css,html,json,svg,png,webmanifest}'
        ]
      },
      includeAssets: [
        'offline.html',
        'assets/icons/icon-192.png',
        'assets/icons/icon-512.png'
      ],
      manifest: {
        short_name: 'OmniCast',
        name: 'OmniCast PWA',
        description: 'Centralize IPTV, VOD, rádio e webcams num app PWA leve e offline-first.',
        lang: 'pt-BR',
        dir: 'ltr',
        scope: '/',
        start_url: '/?utm_source=install',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#222831',
        icons: [
          {
            src: 'assets/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'assets/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'IPTV ao Vivo',
            short_name: 'IPTV',
            description: 'Assista canais de TV ao vivo',
            url: '/#/iptv',
            icons: [{ src: 'assets/icons/shortcut-iptv.png', sizes: '96x96', type: 'image/png' }]
          },
          {
            name: 'Vídeos On-Demand',
            short_name: 'VOD',
            description: 'Acesse sua biblioteca de vídeos',
            url: '/#/vod',
            icons: [{ src: 'assets/icons/shortcut-vod.png', sizes: '96x96', type: 'image/png' }]
          },
          {
            name: 'Rádio Online',
            short_name: 'Rádio',
            description: 'Ouça estações ao vivo',
            url: '/#/radio',
            icons: [{ src: 'assets/icons/shortcut-radio.png', sizes: '96x96', type: 'image/png' }]
          },
          {
            name: 'Webcams Mundo',
            short_name: 'Webcams',
            description: 'Confira câmeras ao vivo pelo mundo',
            url: '/#/webcams',
            icons: [{ src: 'assets/icons/shortcut-webcams.png', sizes: '96x96', type: 'image/png' }]
          }
        ]
      },
      workbox: {
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api\//]
      }
    })
  ],

  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app:     path.resolve(__dirname, 'web/index.html'),
        offline: path.resolve(__dirname, 'web/offline.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.split('node_modules/')[1].split('/')[0]
          }
        },
        assetFileNames(assetInfo) {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/css/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false
  }
})
