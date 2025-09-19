// sw.js (colocar no root público, ex.: /sw.js)

const CACHE_NAME        = "omnicast-v9";
const MAX_DYNAMIC_ITEMS = 50;

// Recursos essenciais (paths absolutos a partir da raiz HTTP)
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/config.html",
  "/manifest.webmanifest",
  "/favicon.ico",

  // CSS
  "/assets/css/theme.css",
  "/assets/css/home.css",

  // JS
  "/assets/js/oc-utils.js",
  "/assets/js/ocfavs.js",
  "/assets/js/display-settings.js",
  "/assets/js/player.js",
  "/assets/js/home.js",
  "/assets/js/validators/validator-core.js",
  "/assets/js/modules/configManager.js",
  "/assets/js/modules/configUI.js",

  // Dados (backups para offline)
  "/assets/data/master_list.json",
  "/assets/data/home_backup.json",
  "/assets/data/iptv_backup.json",
  "/assets/data/webcam_backup.json",
  "/assets/data/vod_backup.json",
  "/assets/data/radio_backup.json",

  // Imagens
  "/assets/img/logo.png",
  "/assets/img/favicon.png",
  "/assets/img/header-index.jpg",
  "/assets/img/icons/iptv.png",
  "/assets/img/icons/webcam.png",
  "/assets/img/icons/vod.png",
  "/assets/img/icons/radio.png",
  "/assets/img/icons/icon-symbol-192.png",
  "/assets/img/icons/icon-symbol-512.png",
  "/assets/img/icons/icon-iptv.svg",
  "/assets/img/icons/icon-webcam.svg",
  "/assets/img/icons/icon-vod.svg",
  "/assets/img/icons/icon-radio.svg",
  "/assets/img/icons/icon-fav.svg",
  "/assets/img/fallback.png"
];

/**
 * Limita o número de entradas num cache dinâmico.
 */
async function limitCache(name, maxItems) {
  const cache = await caches.open(name);
  const keys  = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return limitCache(name, maxItems);
  }
}

// Instalação — pré-cache resiliente (não falha toda por um 404 isolado)
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(
      CORE_ASSETS.map(asset =>
        cache.add(asset).catch(err => console.warn("Falha ao pré-cachear:", asset, err))
      )
    );
    // Novo SW ativo imediatamente
    await self.skipWaiting();
  })());
});

// Ativação — limpeza de caches antigos, Navigation Preload e notificação de update
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    // 1) Limpar caches obsoletos
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));

    // 2) Ativar Navigation Preload
    if ("navigationPreload" in self.registration) {
      await self.registration.navigationPreload.enable();
    }

    // 3) Reivindicar controlo imediato
    await self.clients.claim();

    // 4) Notificar todas as clients que o SW novo está pronto
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach(client => client.postMessage({ type: "UPDATE_READY" }));
  })());
});

// Estratégias de cache por tipo de recurso
self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Ignorar media streams e manifest HLS/DASH
  if (/\.(m3u8|mp4|mpd|mp3|wav|aac|ts)$/i.test(url.pathname) || url.pathname.includes("/stream/")) {
    return;
  }

  // Navegação HTML — network-first + fallback a cache/offline.html
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;

        const networkRes = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkRes.clone());
        return networkRes;
      } catch {
        const cached = await caches.match(request);
        return cached || (await caches.match("/offline.html"));
      }
    })());
    return;
  }

  // Dados JSON — network-first + fallback JSON vazio
  if (url.pathname.startsWith("/assets/data/")) {
    event.respondWith((async () => {
      try {
        return await fetch(request, { cache: "no-store" });
      } catch {
        const cached = await caches.match(request);
        return cached || new Response("{}", { headers: { "Content-Type": "application/json" } });
      }
    })());
    return;
  }

  // Imagens — cache-first + fallback
  if (request.destination === "image") {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        if (res.ok && res.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, res.clone());
          limitCache(CACHE_NAME, MAX_DYNAMIC_ITEMS);
        }
        return res;
      } catch {
        return caches.match("/assets/img/fallback.png");
      }
    })());
    return;
  }

  // CSS & JS — stale-while-revalidate
  if (request.destination === "style" || request.destination === "script") {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      const networkFetch = fetch(request).then(async res => {
        if (res.ok && res.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, res.clone());
        }
        return res;
      }).catch(() => undefined);
      return cached || networkFetch || new Response("", { status: 504 });
    })());
    return;
  }

  // Outros recursos — cache-first + atualização em background
  event.respondWith((async () => {
    const cached = await caches.match(request);
    const networkFetch = fetch(request)
      .then(async res => {
        if (res && res.ok && res.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, res.clone());
          limitCache(CACHE_NAME, MAX_DYNAMIC_ITEMS);
        }
        return res;
      })
      .catch(() => cached);
    return cached || networkFetch;
  })());
});

// Mensagens do cliente — SKIP_WAITING
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
