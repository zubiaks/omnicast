// vite.config.js
import { defineConfig }     from 'vite'
import legacy               from '@vitejs/plugin-legacy'
import { VitePWA }          from 'vite-plugin-pwa'
import path                 from 'path'
import { visualizer }       from 'rollup-plugin-visualizer'

export default defineConfig(({ command }) => {
  const isBuild = command === 'build'

  return {
    base:    isBuild ? './' : '/',
    root:    path.resolve(__dirname, 'frontend'),
    publicDir: path.resolve(__dirname, 'frontend/public'),

    resolve: {
      alias: {
        '@':           path.resolve(__dirname, 'frontend/js'),
        '@modules':    path.resolve(__dirname, 'frontend/js/modules'),
        '@pages':      path.resolve(__dirname, 'frontend/js/pages'),
        '@components': path.resolve(__dirname, 'frontend/components'),
        '@assets':     path.resolve(__dirname, 'frontend/assets'),
      }
    },

    server: {
      port:       5500,
      strictPort: true,
      open:       true,
      host:       '0.0.0.0',
    },

    build: {
      outDir:            path.resolve(__dirname, 'dist'),
      emptyOutDir:       true,
      assetsInlineLimit: 4096,
      rollupOptions: {
        input: {
          index:     path.resolve(__dirname, 'frontend/index.html'),
          offline:   path.resolve(__dirname, 'frontend/offline.html'),
          dashboard: path.resolve(__dirname, 'frontend/pages/dashboard.html'),
          config:    path.resolve(__dirname, 'frontend/pages/config.html'),
          help:      path.resolve(__dirname, 'frontend/pages/help.html'),
          favoritos: path.resolve(__dirname, 'frontend/pages/favoritos.html'),
          iptv:      path.resolve(__dirname, 'frontend/pages/iptv.html'),
          vod:       path.resolve(__dirname, 'frontend/pages/vod.html'),
          webcams:   path.resolve(__dirname, 'frontend/pages/webcams.html'),
          radio:     path.resolve(__dirname, 'frontend/pages/radio.html'),
        },
        plugins: [
          visualizer({
            filename: path.resolve(__dirname, 'dist/bundle-analysis.html'),
            open:     false,
            gzipSize: true,
          })
        ],
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor'
            }
            if (id.includes('/js/modules/dashboard')) {
              return 'dashboard-modules'
            }
            if (id.includes('/js/pages/config.js')) {
              return 'config-page'
            }
          }
        }
      }
    },

    plugins: [
      legacy({
        targets: ['defaults', 'not IE 11']
      }),

      // PWA: usa injectManifest para aproveitar o SW customizado em /sw.js
      VitePWA({
        strategies: 'injectManifest',
        srcDir:     'public',      // relativo a root → frontend/public
        filename:   'sw.js',       // saída em /dist/sw.js
        injectRegister: false,     // registro manual via registerServiceWorker.js
        manifestFilename: 'manifest.webmanifest',
        injectManifest: {
          swSrc: path.resolve(__dirname, 'frontend/public/sw.js'),
          globPatterns: ['**/*.{js,css,html,png,svg,json}']
        },
        manifest: {
          // Pode ser mantido vazio para usar manifest.webmanifest em public,
          // ou redefinido aqui caso prefiras gerar via plugin
        }
      })
    ]
  }
})
