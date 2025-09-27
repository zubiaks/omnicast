# Changelog

Todas as alterações significativas neste projeto são documentadas aqui.  
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)  
e as versões seguem [SemVer](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado
- *(nenhuma mudança ainda)*

---

## [1.0.0] – 2025-09-27

### Adicionado
- Pipeline de CI/E2E completo no GitHub Actions com cache de dependências e upload de artefatos  
- Badge de status do CI no `README.md` apontando para a branch `main`  
- Versão 1.0.0 – lançamento estável  

---

## [0.1.1] – 2025-09-26

### Adicionado
- Integração de `vite-plugin-pwa` em `vite.config.js` com `registerType: 'autoUpdate'`  
- `workbox.runtimeCaching` configurado para:
  - HLS streams (`NetworkFirst`, cacheName `hls-streams`)  
  - Assets estáticos (js/css/html/json) (`StaleWhileRevalidate`, cacheName `static-assets`)  
- `navigateFallback: '/offline.html'` para SPA e fallback customizado  
- Registro de SW em `js/main.js` usando `virtual:pwa-register` com:
  - `onNeedRefresh()` → toast “Nova versão disponível! Clique para atualizar.”  
  - `onOfflineReady()` → toast “App pronto para uso offline.”  
- Mapeamento de clique no toast de informação para `updateSW(true)` (skipWaiting + reload)  
- Router refatorado para imports dinâmicos, gerando chunks separados por página  
- Lazy-load de `hls.js` isolado em chunk próprio  

### Corrigido
- Caminhos de `includeAssets` apontando corretamente para `public/data/*.json`  
- Fallback offline customizado em `/offline.html` com links root-relative  
- Cache-Control `no-store` no dev server para evitar respostas 304 em JSON  

---

## [0.1.0] – 2025-09-25

### Adicionado
- Dados de demonstração em JSON (`iptv-channels.json`, `vod-videos.json`, `radio-stations.json`, `webcams.json`)  
- Streaming Demo em páginas IPTV, VOD, Rádio e Webcams com placeholders de thumbnail  
- Logs de início/fim de renderização em `home.js` e `not-found.js`  
- Console logs de fetch em `js/pages/*` para diagnóstico  
- Feedback via toast ao carregar listas e reproduzir mídia  

### Corrigido
- Remoção de comentário em `public/data/iptv-channels.json` para evitar falha de parse  

---

## [0.0.9] – 2025-09-25

### Adicionado
- Manifesto PWA em `public/manifest.webmanifest`  
- Link do manifesto e meta `theme-color` em `<head>` de `index.html`  
- Service Worker em `js/sw.js` com pré-cache de shell e `offline.html`  
- Página de fallback em `public/offline.html` e estilos em `public/assets/css/offline.css`  
- Registro do SW em `js/main.js` no evento `load`  

### Corrigido
- Fallback offline apenas em `event.request.mode === 'navigate'`  
- Cache busting no evento `activate` para remover caches antigos  
- Garantia de pré-cache de CSS necessários à página offline  

---

## [0.0.8] – 2025-09-25

### Adicionado
- Spinner global de carregamento em `js/utils/spinner.js` e `public/assets/css/spinner.css`  
- Integração do spinner no roteamento (`js/router.js`)  

### Corrigido
- Cleanup de intervalos e listeners após cada renderização  

---

## [0.0.7] – 2025-09-25

### Adicionado
- JSON de webcams em `public/data/webcams.json`  
- Estilos em `public/assets/css/webcams.css`  
- Página Webcams em `js/pages/webcams.js` com grid e atualização automática de snapshots  

### Corrigido
- Imports relativos no `js/router.js`  
- Adição de módulos `home.js` e `not-found.js` para fallback de rota  
- Ajuste de `root` e `base` no `vite.config.js` para servir pasta `js/`  

---

## [0.0.6] – 2025-09-25

### Adicionado
- JSON de estações em `public/data/radio-stations.json`  
- Estilos Rádio em `public/assets/css/radio.css`  
- Página Rádio em `js/pages/radio.js` com player `<audio>`  

---

## [0.0.5] – 2025-09-25

### Adicionado
- JSON de vídeos em `public/data/vod-videos.json`  
- Estilos VOD em `public/assets/css/vod.css`  
- Página VOD em `js/pages/vod.js` com cards e player HTML5  

---

## [0.0.4] – 2025-09-25

### Adicionado
- JSON estático de canais em `public/data/iptv-channels.json`  
- Estilos IPTV em `public/assets/css/iptv.css`  
- Integração HLS.js em `js/pages/iptv.js`  

---

## [0.0.3] – 2025-09-25

### Adicionado
- Sistema de Toast Notifications em `js/utils/toast.js` e `public/assets/css/toast.css`  

### Removido
- Import de `toast.css` em `js/main.js`  

---

## [0.0.2] – 2025-09-25

### Adicionado
- Roteamento hash e funções de renderização em `js/router.js`  
- Destaque de link ativo no menu via `highlightNav`  

---

## [0.0.1] – 2025-09-25

### Adicionado
- Configuração inicial do Vite e scaffold do projeto  
- Layout básico em `index.html` e `js/main.js`  
- Páginas placeholder em `js/pages/*.js`  
- Scripts NPM (`npm run dev`, `npm run build`)  
- Estrutura de estilos em `public/assets/css/base.css` e `layout.css`  

---

[Unreleased]: https://github.com/zubiaks/omnicast/compare/v1.0.0...HEAD  
[1.0.0]:     https://github.com/zubiaks/omnicast/releases/tag/v1.0.0  
[0.1.1]:     https://github.com/zubiaks/omnicast/releases/tag/v0.1.1  
[0.1.0]:     https://github.com/zubiaks/omnicast/releases/tag/v0.1.0  
[0.0.9]:     https://github.com/zubiaks/omnicast/releases/tag/v0.0.9  
[0.0.8]:     https://github.com/zubiaks/omnicast/releases/tag/v0.0.8  
[0.0.7]:     https://github.com/zubiaks/omnicast/releases/tag/v0.0.7  
[0.0.6]:     https://github.com/zubiaks/omnicast/releases/tag/v0.0.6  
[0.0.5]:     https://github.com/zubiaks/omnicast/releases/tag/v0.0.5  
[0.0.4]:     https://github.com/zubiaks/omnicast/releases/tag/v0.0.4  
[0.0.3]:     https://github.com/zubiaks/omnicast/releases/tag/v0.0.3  
[0.0.2]:     https://github.com/zubiaks/omnicast/releases/tag/v0.0.2  
[0.0.1]:     https://github.com/zubiaks/omnicast/releases/tag/v0.0.1  
