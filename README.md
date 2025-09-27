[![CI](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions)
[![Acessibilidade](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml)
[![release](https://img.shields.io/github/v/release/zubiaks/omnicast?style=flat-square)](https://github.com/zubiaks/omnicast/releases/latest)
[![license](https://img.shields.io/github/license/zubiaks/omnicast?style=flat-square)](LICENSE)
[![Performance](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse.yml)

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
- [x] Testes de acessibilidade automatizados (axe-core + Playwright)  
- [x] v1.0.0 – Lançamento estável  

---

## Sumário

- [Visão Geral](#visão-geral)  
- [Status da Versão](#status-da-versão)  
- [Estrutura do Projeto](#estrutura-do-projeto)  
- [Instalação e Execução](#instalação-e-execução)  
- [Scripts Úteis](#scripts-úteis)  
- [Testes E2E (Playwright)](#testes-e2e-playwright)  
- [Testes de Acessibilidade](#testes-de-acessibilidade)  
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

OmniCast é uma Progressive Web App de streaming que reúne demos de IPTV, VOD, rádio e webcams.  
Esta versão 1.0.0 consolida build otimizado, testes ponta a ponta, acessibilidade automatizada e pipeline de CI estável.  

---

## Status da Versão

- Versão: 1.0.0  
- Data: 2025-09-27  
- Status: Lançamento estável com PWA, cache inteligente, code-split, CI/E2E e acessibilidade verde  

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
npm run dev                # desenvolvimento com Vite
npm run dev:ci             # dev server para CI (porta 5500, sem clearScreen)
npm run build              # build de produção
npm run preview            # preview do build em localhost
npm run test:e2e           # testes E2E headless (Playwright)
npm run test:e2e:headed    # testes E2E com interface
npm run test:e2e:report    # abrir relatório HTML
```

---

## Testes E2E (Playwright)

Pré-requisitos: Node.js, npm sem optional deps

```bash
npm ci --no-audit --omit=optional
npx playwright install --with-deps
npm run test:e2e
```

Os resultados JUnit são gerados em `test-results/junit`, o relatório HTML em `html-report`.  

---

## Testes de Acessibilidade

Os testes automatizados usam Playwright + axe-core para garantir conformidade WCAG2A/AA.

Instalação:

```bash
npm install --save-dev @axe-core/playwright
```

Em `tests/accessibility.spec.js`:

```js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Acessibilidade Básica', () => {
  test('home sem violações WCAG2AA', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations).toHaveLength(0);
  });
});
```

Workflow em `.github/workflows/accessibility.yml`:

```yaml
name: Acessibilidade

on:
  push: { branches: [ main ] }
  pull_request: { branches: [ main ] }

jobs:
  axe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      - run: npm ci --no-audit --omit=optional
      - run: npx playwright install --with-deps
      - run: npx playwright test tests/accessibility.spec.js
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

Em `js/hls-loader.js`:

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

Testar no DevTools simulando rede offline.

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

Inclua o CSS em `index.html`.

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

Inclua o CSS em `index.html`.

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

1. Instale:
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

Leia o guia em [CONTRIBUTING.md](.github/CONTRIBUTING.md) antes de abrir issues ou PRs. Use nossos templates em `.github/ISSUE_TEMPLATE` e `.github/PULL_REQUEST_TEMPLATE`.  

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