// vite.config.js
import { defineConfig } from 'vite'
import path from 'path'
import tsconfigPaths from 'vite-plugin-tsconfig-paths'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  root: '.',
  base: './',
  publicDir: 'public',
  server: {
    port: 5500,
    strictPort: true,
    open: true,
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'js')
    }
  },
  plugins: [
    tsconfigPaths(),
    legacy({ targets: ['defaults', 'not IE 11'] }),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      cleanupOutdatedCaches: true,
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'public/data/iptv-channels.json',
        'public/data/vod-videos.json',
        'public/data/radio-stations.json',
        'public/data/webcams.json'
      ],
      manifest: {
        name: 'OmniCast',
        short_name: 'OmniCast',
        start_url: './',
        display: 'standalone'
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,json,svg,png}'],
        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/test-streams\.mux\.dev\/.*\.m3u8$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'hls-streams',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 3600
              }
            }
          },
          {
            urlPattern: /\.(?:js|css|html|json)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html')
    }
  }
})
