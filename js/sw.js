const CACHE_NAME = 'omnicast-shell-v0.1.0'
const ASSETS = [
  './',
  './index.html',
  './offline.html',

  // páginas e scripts
  './js/main.js',
  './js/router.js',
  './js/utils/spinner.js',
  './js/utils/toast.js',

  // dados de demo
  './data/iptv-channels.json',
  './data/vod-videos.json',
  './data/radio-stations.json',
  './data/webcams.json',

  // estilos
  './assets/css/base.css',
  './assets/css/layout.css',
  './assets/css/spinner.css',
  './assets/css/toast.css',
  './assets/css/iptv.css',
  './assets/css/vod.css',
  './assets/css/radio.css',
  './assets/css/webcams.css',
  './assets/css/offline.css'
]

// Instala e pré-cacheia todos os assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Limpa caches antigos na ativação
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Intercepta requisições
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Retorna do cache ou faz fetch à rede
        return cachedResponse || fetch(event.request)
      })
      .catch(() => {
        // Se falhar (offline) e for navegação, retorna offline.html
        if (event.request.mode === 'navigate') {
          return caches.match('./offline.html')
        }
      })
  )
})
