// service-worker.js

const CACHE_NAME = 'omnicast-cache-v1';
const OFFLINE_URL = '/offline.html';

// Arquivos essenciais para abrir offline
const PRECACHE = [
  OFFLINE_URL,
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

// Detecta se está rodando no localhost
const isLocalhost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Instala e pré-carrega arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia de fetch adaptada
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (isLocalhost) {
    // 🔹 Modo desenvolvimento → sempre tenta buscar do servidor local primeiro
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match(OFFLINE_URL)))
    );
  } else {
    // 🔹 Modo produção → stale-while-revalidate
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(networkResponse => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => cached || caches.match(OFFLINE_URL));

        return cached || networkFetch;
      })
    );
  }
});
