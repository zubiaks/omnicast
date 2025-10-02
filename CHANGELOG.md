# [1.5.0](https://github.com/zubiaks/omnicast/compare/v1.4.0...v1.5.0) (2025-10-02)


### Features

* **ci:** smoke test de métricas no InfluxDB e badge ([2b631f3](https://github.com/zubiaks/omnicast/commit/2b631f31258de4fa653f8265522f49897f6c0aed))

# Changelog

Todas as alterações significativas neste projeto são documentadas aqui.  
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)  
e as versões seguem [SemVer](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado
- _(nenhuma mudança ainda)_

### Alterado
- _(nenhuma mudança ainda)_

### Corrigido
- _(nenhuma mudança ainda)_

---

## [1.4.0] – 2025-10-01

### Bug Fixes
* **ci:** remover comentários do lhci-budgets.json para JSON válido ([a0fa6b3](https://github.com/zubiaks/omnicast/commit/a0fa6b33569d32e5fb921aad27b5fe526ffb2d4b))
* **monitoring:** carregar web-vitals dinamicamente para build funcionar ([4c9934e](https://github.com/zubiaks/omnicast/commit/4c9934e245e72823a28e6b004b4e7335b41d6a5c))

### Features
* **monitoring:** instrumentar Web Vitals e performance budgets ([96e4eb8](https://github.com/zubiaks/omnicast/commit/96e4eb8cee337dc555a1fb7fa084ed835f1f86a2))

---

## [1.3.0] – 2025-10-03

### Adicionado
- Instrumentação de Web Vitals (FCP, LCP, CLS, FID) com `web-vitals`
- Função `sendToMonitoring()` usando Beacon API para envio de métricas a `/api/metrics`
- Documentação de monitoring em `docs/monitoring.md`

### Alterado
- _(nenhuma mudança)_

### Corrigido
- _(nenhuma mudança)_

---

## [1.2.0] – 2025-10-02

### Adicionado
- Workflow `codeql-analysis.yml` com CodeQL Action v3.30.5 para varredura estática de segurança
- Configuração de performance budget via Lighthouse CI em `.lighthouserc.cjs`
- Upload de relatórios LHCI para `temporary-public-storage`

### Alterado
- Remoção de `--omit=optional` no `npm ci` para garantir instalação de binários nativos do Rollup
- Lighthouse workflow (`lighthouse.yml`) passando `LHCI_GITHUB_APP_TOKEN: ${{ secrets.GITHUB_TOKEN }}`
- Ajuste de permissões no CodeQL workflow (`contents: read`, `checks: write`, `security-events: write`)

### Corrigido
- Erro `MODULE_NOT_FOUND` para `@rollup/rollup-linux-x64-gnu`
- Aviso de “GitHub token not set” no LHCI
- Falha 422 ao fazer upload SARIF no CodeQL ativando Code Scanning em Settings
- Timeouts de startServer ajustados em `.lighthouserc.cjs`

---

## [1.1.0] – 2025-10-01

### Adicionado
- Workflow GitHub Actions para testes de acessibilidade em `accessibility.yml`
- Badge de Acessibilidade no README
- Stub de rede nativo do Playwright (`page.route`) para mock de `iptv-channels.json`
- Script `npm run setup` que instala dependências + browsers do Playwright
- Templates de Issue (`.github/ISSUE_TEMPLATE`) e Pull Request (`.github/PULL_REQUEST_TEMPLATE`)
- Documentos de troubleshooting (`docs/troubleshooting.md`) e CI setup (`docs/ci-setup.md`)

### Alterado
- Substituído o `http-server` pelo `serve -s dist` no script `serve:dist` para SPA‐fallback
- Atualizada seção “Primeiros Passos” no README
- Removida a dependência de MSW dos testes E2E

### Corrigido
- Violações de `document-title` e `html-has-lang` em rotas SPA (faltava `<title>` e `lang`)

---

## [1.0.0] – 2025-09-27

### Adicionado
- Testes de acessibilidade automatizados com Playwright e axe-core cobrindo WCAG2A/AA
- Pipeline de CI/E2E completo no GitHub Actions com cache de dependências e upload de artefatos
- Workflow Lighthouse CI (`lighthouse.yml`) e badge de Performance no README
- Badge de status de release e licença no README
- Stub de rede via Playwright em todos os testes E2E

### Alterado
- Script `serve:dist` agora usa `serve -s dist -l 5500` para suporte a SPA‐fallback
- Route stubbing nativo do Playwright substitui MSW nos testes E2E

---

## [0.1.1] – 2025-09-26

### Adicionado
- Integração de `vite-plugin-pwa` em `vite.config.js` com `registerType: 'autoUpdate'`
- `workbox.runtimeCaching` configurado para: HLS streams (`NetworkFirst`, cacheName `hls-streams`); Assets estáticos (`StaleWhileRevalidate`, cacheName `static-assets`)
- `navigateFallback: '/offline.html'` para SPA e fallback customizado
- Registro de SW em `js/main.js` usando `virtual:pwa-register` com `onNeedRefresh()` e `onOfflineReady()`
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
- Streaming demo em páginas IPTV, VOD, Rádio e Webcams com placeholders de thumbnail
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
- Sistema de Toast Notifications em `js/utils/toast.js` (`toast.css`)

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

[Unreleased]:     https://github.com/zubiaks/omnicast/compare/v1.4.0...HEAD  
[1.4.0]:          https://github.com/zubiaks/omnicast/compare/v1.3.0...v1.4.0  
[1.3.0]:          https://github.com/zubiaks/omnicast/releases/tag/v1.3.0  
[1.2.0]:          https://github.com/zubiaks/omnicast/compare/v1.2.0...v1.3.0  
[1.1.0]:          https://github.com/zubiaks/omnicast/releases/tag/v1.1.0  
[1.0.0]:          https://github.com/zubiaks/omnicast/releases/tag/v1.0.0  
[0.1.1]:          https://github.com/zubiaks/omnicast/releases/tag/v0.1.1  
[0.1.0]:          https://github.com/zubiaks/omnicast/releases/tag/v0.1.0  
[0.0.9]:          https://github.com/zubiaks/omnicast/releases/tag/v0.0.9  
[0.0.8]:          https://github.com/zubiaks/omnicast/releases/tag/v0.0.8  
[0.0.7]:          https://github.com/zubiaks/omnicast/releases/tag/v0.0.7  
[0.0.6]:          https://github.com/zubiaks/omnicast/releases/tag/v0.0.6  
[0.0.5]:          https://github.com/zubiaks/omnicast/releases/tag/v0.0.5  
[0.0.4]:          https://github.com/zubiaks/omnicast/releases/tag/v0.0.4  
[0.0.3]:          https://github.com/zubiaks/omnicast/releases/tag/v0.0.3  
[0.0.2]:          https://github.com/zubiaks/omnicast/releases/tag/v0.0.2  
[0.0.1]:          https://github.com/zubiaks/omnicast/releases/tag/v0.0.1
