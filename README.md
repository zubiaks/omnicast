[![CI](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions)
[![release](https://img.shields.io/github/v/release/zubiaks/omnicast?style=flat-square)](https://github.com/zubiaks/omnicast/releases/latest)
[![license](https://img.shields.io/github/license/zubiaks/omnicast?style=flat-square)](LICENSE)

# OmniCast

**Versão 1.0.0 – Lançamento Estável**


O que há de novo:  
- [x] PWA gerado automaticamente via `vite-plugin-pwa`  
- [x] Auto-update do Service Worker com notificação de nova versão  
- [x] Runtime caching inteligente para HLS streams e assets estáticos  
- [x] Fallback offline customizado em `/offline.html`  
- [x] Router com imports dinâmicos para cada página  
- [x] `hls.js` lazy-loaded em um chunk próprio  
- [x] Bundle inicial abaixo de 600 kB; chunks separados por pacote  
- [x] CI & E2E pipeline verde no GitHub Actions (omit optional deps + patch Rollup)  
- [x] v1.0.0 – Lançamento estável  

---

## Sumário

- [Visão Geral](#visão-geral)  
- [Status da Versão](#status-da-versão)  
- [Estrutura do Projeto](#estrutura-do-projeto)  
- [Instalação e Execução](#instalação-e-execução)  
- [Scripts Úteis](#scripts-úteis)  
- [Testes E2E (Playwright)](#testes-e2e-playwright)  
- [Configuração do Vite](#configuração-do-vite)  
- [Router Code-Split](#router-code-split)  
- [Lazy-Load de HLS](#lazy-load-de-hls)  
- [PWA Avançada](#pwa-avançada)  
- [Fallback Offline](#fallback-offline)  
- [Spinner Global](#spinner-global)  
- [Toast Notifications](#toast-notifications)  
- [Páginas do App](#páginas-do-app)  
- [Performance & Bundle Analysis](#performance--bundle-analysis)  
- [CI & E2E no GitHub Actions](#ci--e2e-no-github-actions)  
- [Contribuindo](#contribuindo)  
- [Licença](#licença)  
- [Roadmap](#roadmap)  

---

## Visão Geral

OmniCast é uma Progressive Web App de streaming que reúne demos de IPTV, VOD, rádio e webcams. Esta versão 1.0.0 consolida build otimizado, testes ponta a ponta e pipeline de CI estável.

---

## Status da Versão

- Versão: 1.0.0  
- Data: 2025-09-27  
- Status: Lançamento estável com PWA, cache inteligente, code-split e CI/E2E verde  

---

## Estrutura do Projeto

```
omnicast/
├─ index.html
├─ vite.config.js
├─ public/
│  ├─ manifest.webmanifest
│  ├─ offline.html
│  └─ assets/css/…
├─ js/
│  ├─ main.js
│  ├─ router.js
│  ├─ hls-loader.js
│  ├─ utils/
│  │  ├─ spinner.js
│  │  └─ toast.js
│  └─ pages/
│     ├─ home.js
│     ├─ iptv.js
│     ├─ vod.js
│     ├─ radio.js
│     ├─ webcams.js
│     └─ not-found.js
└─ package.json
```

---

## Instalação e Execução

Clone o repositório e instale dependências:

```bash
git clone https://github.com/zubiaks/omnicast.git
cd omnicast
npm install
```

---

## Scripts Úteis

```bash
# Desenvolvimento com Vite
npm run dev

# Preview de build estável em porta 5500
npm run preview

# Iniciar dev server para CI (porta 5500, sem clearScreen)
npm run dev:ci

# Testes E2E headless
npm run test:e2e

# Testes E2E com interface
npm run test:e2e:headed

# Abrir relatório HTML após E2E
npm run test:e2e:report
```

---

## Testes E2E (Playwright)

Pré-requisitos: Node.js, npm sem optional deps  

```bash
# Instala Playwright e browsers
npm ci --no-audit --omit=optional
npx playwright install --with-deps

# Executa os testes em todos os browsers (Chromium, Firefox, WebKit)
npm run test:e2e

# Executa os testes com GUI (ver cliques e navegações)
npm run test:e2e:headed

# Gera relatório HTML em 'html-report'
npm run test:e2e:report
```

---

## Configuração do Vite

```js
import { defineConfig } from 'vite'
import path from 'path'
import tsconfigPaths from 'vite-plugin-tsconfig-paths'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  root: '.',
  base: './',
  publicDir: 'public',
  resolve: {
    alias: { '@': path.resolve(__dirname, 'js') }
  },
  plugins: [
    tsconfigPaths(),
    legacy({ targets: ['defaults', 'not IE 11'] }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        navigateFallback: '/offline.html',
        runtimeCaching: [
          { urlPattern: /\/$/, handler: 'NetworkFirst' },
          { urlPattern: /\.(js|css)$/, handler: 'CacheFirst' }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.split('node_modules/')[1].split('/')[0]
          }
        },
        assetFileNames(assetInfo) {
          return assetInfo.name?.endsWith('.css')
            ? 'assets/css/[name]-[hash][extname]'
            : 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
```

---

## Router Code-Split

Em `js/router.js`, cada rota carrega sua página via import dinâmico:

```js
case 'iptv': {
  const { renderIptv } = await import('./pages/iptv.js')
  cleanupFn = await renderIptv(container)
  break
}
```

---

## Lazy-Load de HLS

Carregamento dinâmico em `js/hls-loader.js`:

```js
let HlsConstructor
export async function loadHls() {
  if (!HlsConstructor) {
    const mod = await import('hls.js')
    HlsConstructor = mod.default
  }
  return HlsConstructor
}
```

---

## PWA Avançada

Registro e auto-update do SW em `js/main.js`:

```js
import { registerSW } from 'virtual:pwa-register'
import { showToast } from '@/utils/toast.js'

const updateSW = registerSW({
  onNeedRefresh() {
    showToast('Nova versão disponível! Clique para atualizar.', 'info')
  },
  onOfflineReady() {
    showToast('App pronto para uso offline.', 'success')
})
document.addEventListener('click', e => {
  if (e.target.matches('.toast--info')) updateSW(true)
})
```

---

## Fallback Offline

Configurado em `vite.config.js`:

```js
workbox: {
  navigateFallback: '/offline.html'
}
```

Teste no DevTools simulando rede offline.

---

## Spinner Global

Em `js/utils/spinner.js`:

```js
export function showSpinner() {
  document.body.classList.add('spinner--visible')
}
export function hideSpinner() {
  document.body.classList.remove('spinner--visible')
}
```

Inclua o CSS em `index.html` com `spinner.css`.

---

## Toast Notifications

Em `js/utils/toast.js`:

```js
export function showToast(message, type) {
  const el = document.createElement('div')
  el.className = `toast toast--${type}`
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 5000)
}
```

Inclua `toast.css` em `index.html`.

---

## Páginas do App

Cada módulo em `js/pages/*.js` exporta:

```js
export async function renderXxx(container) {
  // ...
  return cleanupFn
}
```

Páginas suportadas: Home, IPTV, VOD, Rádio, Webcams, Not Found.

---

## Performance & Bundle Analysis

Para gerar relatório de chunks:

1. Instale o plugin:
   ```bash
   npm install --save-dev rollup-plugin-visualizer
   ```
2. Adicione no `vite.config.js`:
   ```js
   import visualizer from 'rollup-plugin-visualizer'
   // …
   plugins: [
     …,
     visualizer({ filename: './dist/stats.html' })
   ]
   ```
3. Rode:
   ```bash
   npm run build
   open dist/stats.html
   ```

---

## CI & E2E no GitHub Actions

Workflow `ci-main.yml` roda em pushes/PRs na `main`:

```yaml
name: CI on main

on:
  push: { branches: [ main ] }
  pull_request: { branches: [ main ] }
  workflow_dispatch:

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.19.0'
          cache: 'npm'
      - run: npm ci --no-audit --omit=optional
      - run: npm install @rollup/rollup-linux-x64-gnu --no-save
      - run: npm run build
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-results
          path: test-results/
```

---

## Contribuindo

Leia o guia em [CONTRIBUTING.md](.github/CONTRIBUTING.md) antes de abrir issues ou PRs. Use nosso template em `.github/ISSUE_TEMPLATE` e `.github/PULL_REQUEST_TEMPLATE`.

---

## Licença

MIT License. Veja o arquivo [LICENSE](LICENSE).

---

## Roadmap

- [x] v0.1.0 – Streaming Demo  
- [x] v0.1.1 – PWA Automático & Code-Split  
- [x] v1.0.0 – Lançamento Estável  
- [ ] v1.1.0 – Acessibilidade & Performance  
- [ ] v1.2.0 – Mocks de API & Testes de Componentes  
- [ ] v2.0.0 – Novas funcionalidades de usuário  

Para acompanhar o progresso, veja nosso [GitHub Projects](https://github.com/zubiaks/omnicast/projects).  
```