const CACHE_NAME        = 'omnicast-v9';
const MAX_DYNAMIC_ITEMS = 50;

// Recursos essenciais para pré-cache
const CORE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './config.html', // painel de configurações
  './manifest.webmanifest',
  './favicon.ico',
  './assets/css/theme.css',
  './assets/css/home.css',
  './assets/js/oc-utils.js',
  './assets/js/ocfavs.js',
  './assets/js/display-settings.js',
  './assets/js/player.js',
  './assets/js/home.js',
  './assets/js/validators/validator-core.js',
  './assets/js/modules/configManager.js', // gestor de config
  './assets/js/modules/configUI.js',      // UI de config
  './assets/data/master_list.json',
  './assets/data/home_backup.json',
  './assets/data/iptv_backup.json',
  './assets/data/webcam_backup.json',
  './assets/data/vod_backup.json',
  './assets/data/radio_backup.json',
  './assets/img/logo.png',
  './assets/img/favicon.png',
  './assets/img/header-index.jpg',
  './assets/img/icons/iptv.png',
  './assets/img/icons/webcam.png',
  './assets/img/icons/vod.png',
  './assets/img/icons/radio.png',
  './assets/img/icons/icon-symbol-192.png',
  './assets/img/icons/icon-symbol-512.png',
  './assets/img/icons/icon-iptv.svg',
  './assets/img/icons/icon-webcam.svg',
  './assets/img/icons/icon-vod.svg',
  './assets/img/icons/icon-radio.svg',
  './assets/img/icons/icon-fav.svg',
  './assets/img/fallback.png' // imagem de fallback
];

// Limita o número de entradas num cache dinâmico
async function limitCache(name, maxItems) {
  const cache = await caches.open(name);
  const keys  = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await limitCache(name, maxItems);
  }
}

// Instalação — pré-cache paralelo
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        CORE_ASSETS.map(asset =>
          cache.add(asset).catch(err => console.warn('Falha ao pré-cachear:', asset, err))
        )
      )
    )
  );
  self.skipWaiting();
});

// Ativação — limpeza de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
  self.clients.matchAll().then(clients => {
    clients.forEach(client =>
      client.postMessage({ type: 'UPDATE_READY' })
    );
  });
});

// Fetch — estratégias por tipo de recurso
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;

  // Ignorar media streams
  if (url.match(/\.(m3u8|mp4|mpd|mp3)$/) || url.includes('/stream/')) return;

  // Dados JSON — network-first + fallback JSON vazio
  if (url.includes('/assets/data/')) {
    event.respondWith(
      fetch(request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // Navegação HTML — network-first + fallback offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('./offline.html'))
    );
    return;
  }

  // Imagens — cache-first + fallback imagem
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(res => res || fetch(request).catch(() => caches.match('./assets/img/fallback.png')))
    );
    return;
  }

  // CSS & JS — stale-while-revalidate
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.match(request).then(cacheRes => {
        const networkFetch = fetch(request).then(netRes => {
          if (netRes.ok && netRes.type === 'basic') {
            caches.open(CACHE_NAME).then(cache => cache.put(request, netRes.clone()));
          }
          return netRes;
        });
        return cacheRes || networkFetch;
      })
    );
    return;
  }

  // Outros recursos — cache-first + atualização em background
  event.respondWith(
    caches.match(request).then(cacheRes => {
      const networkFetch = fetch(request)
        .then(netRes => {
          if (netRes && netRes.status === 200 && netRes.type === 'basic') {
            caches.open(CACHE_NAME).then(cache => {
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

// Receber mensagens do cliente
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
