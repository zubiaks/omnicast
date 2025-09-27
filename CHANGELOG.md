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

… (restante inalterado) …

---

[Unreleased]: https://github.com/zubiaks/omnicast/compare/v1.0.0...HEAD  
[1.0.0]:     https://github.com/zubiaks/omnicast/releases/tag/v1.0.0  
[0.1.1]:     https://github.com/zubiaks/omnicast/releases/tag/v0.1.1  
[0.1.0]:     https://github.com/zubiaks/omnicast/releases/tag/v0.1.0  
… (demais links) …
