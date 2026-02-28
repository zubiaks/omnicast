// web/service-worker.js

// Atualize este VERSION a cada release
const VERSION       = '1.5.2'
const PRECACHE      = `omnicast-shell-v${VERSION}`
const RUNTIME       = `omnicast-runtime-v${VERSION}`

// Recursos essenciais para o shell da app
const PRECACHE_URLS = [
  '/',                      // equivale a /index.html
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',

  // ícones PWA
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',

  // CSS
  '/assets/css/base.css',
  '/assets/css/layout.css',
  '/assets/css/theme.css',
  '/assets/css/spinner.css',
  '/assets/css/toast.css',
  '/assets/css/iptv.css',
  '/assets/css/vod.css',
  '/assets/css/radio.css',
  '/assets/css/webcams.css',
  '/assets/css/offline.css',

  // JS essenciais
  '/js/main.js',
  '/js/router.js',
  '/js/supabaseClient.js',

  // Utils
  '/js/utils/spinner.js',
  '/js/utils/toast.js',

  // Módulos de página para cold-start
  '/js/pages/home.js',
  '/js/pages/login.js',
  '/js/pages/signup.js',
  '/js/pages/iptv.js',
  '/js/pages/vod.js',
  '/js/pages/radio.js',
  '/js/pages/webcams.js',
  '/js/pages/not-found.js',

  // Dados estáticos
  '/data/iptv-channels.json',
  '/data/vod-videos.json',
  '/data/radio-stations.json',
  '/data/webcams.json'
]

// 1. Install: pré-cachear o shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// 2. Activate: limpar caches antigos e notificar nova versão
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== PRECACHE && key !== RUNTIME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({
          type: 'NEW_VERSION',
          version: VERSION
        }))
      }))
  )
})

// 3. Mensagens: permite forçar skipWaiting
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// 4. Fetch: estratégias por tipo de requisição
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // 4.a Navegação → NetworkFirst → fallback offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(RUNTIME).then(cache => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match('/offline.html'))
    )
    return
  }

  // 4.b Shell pré-cacheado → CacheFirst
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    )
    return
  }

  // 4.c Dados JSON / API → NetworkFirst → fallback cache
  if (url.pathname.startsWith('/data/') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(RUNTIME).then(cache => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // 4.d HLS streams (.m3u8) → NetworkFirst → cache fallback
  if (url.pathname.endsWith('.m3u8')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

  // 4.e Outros assets (imagens, fontes etc.) → CacheFirst
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  )
})
