import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import path from 'path'

export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  base: './',
  publicDir: path.resolve(__dirname, 'frontend/assets'),

  server: {
    port: 5500,
    strictPort: true,
    open: '/index.html',
    proxy: { '/api': { /* … */ } }
  },

  resolve: {
    alias: {
      '@':    path.resolve(__dirname, 'frontend/js'),
      '~css': path.resolve(__dirname, 'frontend/css'),
      '~img': path.resolve(__dirname, 'frontend/img')
    }
  },

  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index:     path.resolve(__dirname, 'frontend/index.html'),
        dashboard: path.resolve(__dirname, 'frontend/dashboard.html'),
        config:    path.resolve(__dirname, 'frontend/config.html'),
        offline:   path.resolve(__dirname, 'frontend/offline.html'),
        help:      path.resolve(__dirname, 'frontend/pages/help.html'),
        favoritos: path.resolve(__dirname, 'frontend/pages/favoritos.html'),
        iptv:      path.resolve(__dirname, 'frontend/pages/iptv.html'),
        vod:       path.resolve(__dirname, 'frontend/pages/vod.html'),
        webcams:   path.resolve(__dirname, 'frontend/pages/webcams.html'),
        radio:     path.resolve(__dirname, 'frontend/pages/radio.html')
      }
    }
  },

  plugins: [
    legacy({ targets: ['defaults', 'not IE 11'] })
  ]
})
