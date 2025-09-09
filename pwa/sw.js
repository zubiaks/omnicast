// pwa/sw.js

const CACHE_NAME        = 'omnicast-v6';
const MAX_DYNAMIC_ITEMS = 50;

// Lista de recursos essenciais para pré-cache
const CORE_ASSETS = [
  '/', '/index.html', '/manifest.json', '/favicon.ico',

  // CSS
  '/assets/css/theme.css', '/assets/css/player.css', '/assets/css/home.css',
  '/assets/css/favoritos.css', '/assets/css/radio.css',
  '/assets/css/dashboard.css',

  // JS
  '/assets/js/utils.js', '/assets/js/player.js', '/assets/js/favs.js',
  '/assets/js/favoritos.js', '/assets/js/radio.js', '/assets/js/display-settings.js',
  '/assets/js/dashboard.js',

  // Logos e ícones
  '/assets/img/logo-omnicast.svg', '/assets/img/logo-omnicast-icon.svg',
  '/assets/img/icon-iptv.svg', '/assets/img/icon-webcam.svg',
  '/assets/img/icon-vod.svg', '/assets/img/icon-radio.svg',
  '/assets/img/icon-fav.svg',

  // Ícones PWA
  '/assets/img/icons/icon-symbol-192.png',
  '/assets/img/icons/icon-symbol-256.png',
  '/assets/img/icons/icon-symbol-384.png',
  '/assets/img/icons/icon-symbol-512.png',
  '/assets/img/icons/icon-symbol-maskable.png',
  '/assets/img/icons/icon-text-192.png',
  '/assets/img/icons/icon-text-256.png',
  '/assets/img/icons/icon-text-384.png',
  '/assets/img/icons/icon-text-512.png',
  '/assets/img/icons/icon-text-maskable.png',

  // Headers
  '/assets/img/header-index.jpg', '/assets/img/header-favoritos.jpg',
  '/assets/img/header-radios.jpg', '/assets/img/header-webcams.jpg',
  '/assets/img/header-vod.jpg',

  // Páginas internas
  '/pages/favoritos.html', '/pages/radio.html',
  '/pages/iptv.html', '/pages/webcams.html',
  '/pages/vod.html', '/pages/dashboard.html',

  // Offline fallback
  '/offline.html'
];

/** Limita o número de entradas num cache dinâmico */
async function limitCache(name, maxItems) {
  const cache = await caches.open(name);
  const keys  = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await limitCache(name, maxItems);
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
  );
  self.clients.claim();
  // Notifica todos os clientes que há uma nova versão pronta
  self.clients.matchAll().then(clients => {
    clients.forEach(client =>
      client.postMessage({ type: 'UPDATE_READY' })
    );
  });
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;

  // Ignorar media streams
  if (url.match(/\.(m3u8|mp4|mpd)$/) || url.includes('/stream/')) {
    return;
  }

  // Dados dinâmicos (API), network-first + fallback offline.html
  if (url.includes('/assets/data/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Navegação HTML -> network-first + fallback offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // CSS & JS -> stale-while-revalidate
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.match(request).then(cacheRes => {
        const networkFetch = fetch(request).then(netRes => {
          if (netRes.ok) {
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, netRes.clone()));
          }
          return netRes;
        });
        return cacheRes || networkFetch;
      })
    );
    return;
  }

  // Demais recursos -> cache-first, depois network + update cache dinamicamente
  event.respondWith(
    caches.match(request).then(cacheRes => {
      const networkFetch = fetch(request)
        .then(netRes => {
          if (netRes && netRes.status === 200) {
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, netRes.clone());
                limitCache(CACHE_NAME, MAX_DYNAMIC_ITEMS);
              });
          }
          return netRes;
        })
        .catch(() => cacheRes);

      return cacheRes || networkFetch;
    })
  );
});

// Opcional: ouve mensagens do cliente se quiseres alguma interação via postMessage
self.addEventListener('message', event => {
  // Por exemplo, podes forçar skipWaiting() ao receber um comando do UI
});
