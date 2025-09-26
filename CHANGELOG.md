# Changelog

Todas as alterações significativas neste projeto são documentadas aqui.

## [0.1.1] – 2025-09-26

### Adicionado
- `vite-plugin-pwa` integrado ao `vite.config.js` com `registerType: 'autoUpdate'`  
- `workbox.runtimeCaching` configurado para:
  - HLS streams (`NetworkFirst`, cacheName: `hls-streams`)  
  - Assets estáticos js/css/html/json (`StaleWhileRevalidate`, cacheName: `static-assets`)  
- `navigateFallback: '/offline.html'` para rota SPA e fallback customizado  
- Import de `virtual:pwa-register` em `js/main.js` com:
  - `onNeedRefresh()` → toast “Nova versão disponível! Clique para atualizar.”  
  - `onOfflineReady()` → toast “App pronto para uso offline.”  
- Handler de clique no toast de info para chamar `updateSW(true)` (skipWaiting + reload)  

### Corrigido
- Paths de `includeAssets` apontando corretamente para `public/data/*.json`  
- Fallback offline customizado em `/offline.html` com estilos e links root-relative  
- Garantido cache-control `no-store` em dev server para evitar 304 em JSON  

---

## [0.1.0] – 2025-09-25

### Adicionado
- JSON de demonstração em `public/data/iptv-channels.json`, `vod-videos.json`, `radio-stations.json` e `webcams.json` com streams públicos de teste (HLS, MP4, Icecast, snapshot)  
- Streaming Demo em todas as páginas:  
  - IPTV, VOD, Rádio e Webcams consumindo URLs de exemplo  
  - Placeholders de thumbnail e snapshot via `picsum.photos`  
- Logs de início/fim de renderização em `home.js` e `not-found.js`  
- Console logs de fetch e refresh em `js/pages/*` para diagnóstico de erros  
- Feedback de sucesso e erro via toast ao carregar listas e reproduzir mídia  

### Corrigido
- Removido comentário no topo de `public/data/iptv-channels.json` para evitar erro de parse  

---

## [0.0.9] – 2025-09-25

### Adicionado
- Manifesto PWA em `public/manifest.webmanifest`  
- Link para o manifesto e meta `theme-color` no `<head>` de `index.html`  
- Service Worker em `js/sw.js` com caching de shell (HTML, CSS, JS, `offline.html`)  
- Página de fallback offline em `public/offline.html` e styles em `public/assets/css/offline.css`  
- Registro do SW em `js/main.js` (aguarda `load` e loga status)  

### Corrigido
- Fallback offline só em modo de navegação (`event.request.mode === 'navigate'`)  
- Cache busting: ativação limpa caches antigos via evento `activate`  
- Garantido pré-cache de todos os CSS necessários à página offline  

---

## [0.0.8] – 2025-09-25

### Adicionado
- Spinner global de carregamento em `js/utils/spinner.js`  
- CSS do spinner em `public/assets/css/spinner.css`  
- Integração do spinner no roteamento (`js/router.js`)  
- Spinner acionado automaticamente durante fetchs nas páginas  

### Corrigido
- Garantido cleanup de intervalos e listeners após cada renderização  

---

## [0.0.7] – 2025-09-25

### Adicionado
- JSON de webcams em `public/data/webcams.json`  
- Estilos em `public/assets/css/webcams.css`  
- Página Webcams em `js/pages/webcams.js` com grid, atualização de snapshots e player de stream  
- Cleanup automático do intervalo de atualização ao trocar de rota  

### Corrigido
- Imports no `js/router.js` ajustados para caminhos relativos (`./pages/...`)  
- Adicionados módulos `js/pages/home.js` e `js/pages/not-found.js` para rota inicial e fallback 404  
- Ajustada configuração do Vite (`root` e `base`) para servir corretamente a pasta `js/`  

---

## [0.0.6] – 2025-09-25

### Adicionado
- JSON de estações em `public/data/radio-stations.json`  
- Estilos Rádio em `public/assets/css/radio.css`  
- Página Rádio em `js/pages/radio.js` com botões de estação e player `<audio>`  
- Feedback de sucesso e erro no carregamento de estações e reprodução via toasts  

---

## [0.0.5] – 2025-09-25

### Adicionado
- JSON de vídeos em `public/data/vod-videos.json`  
- Estilos VOD em `public/assets/css/vod.css`  
- Página VOD em `js/pages/vod.js` com cards de miniaturas e player HTML5  
- Feedback de sucesso e erro no carregamento e reprodução via toasts  

---

## [0.0.4] – 2025-09-25

### Adicionado
- JSON estático de canais em `public/data/iptv-channels.json`  
- Estilos em `public/assets/css/iptv.css`  
- Integração HLS.js em `js/pages/iptv.js` para reprodução de streams  
- Estado ativo em botões de canal e tratamento de erros de stream  

---

## [0.0.3] – 2025-09-25

### Adicionado
- Sistema de Toast Notifications em `js/utils/toast.js`  
- Estilos em `public/assets/css/toast.css`  
- Uso de toasts em `js/pages/iptv.js` para indicar sucesso ou erro no fetch de canais  

### Removido
- Import de `toast.css` em `js/main.js`  

---

## [0.0.2] – 2025-09-25

### Adicionado
- Roteamento hash e renderização dinâmica de seções em `js/router.js`  
- Funções `renderHome` e `renderNotFound` para conteúdo fallback  
- Destaque de link ativo no menu via `highlightNav`  

---

## [0.0.1] – 2025-09-25

### Adicionado
- Configuração inicial do Vite (dev server e build)  
- Layout com header superior e navegação para categorias  
- `index.html` e `js/main.js` com baseline de renderização  
- Módulos de página placeholder em `js/pages/iptv.js`, `vod.js`, `radio.js`, `webcams.js`  
- Scripts npm:  
  - `npm run dev` para iniciar o servidor de desenvolvimento  
  - `npm run build` para gerar o build de produção  
- Estrutura de estilos base em `public/assets/css/base.css` e `layout.css`  
