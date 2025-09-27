![CI](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml/badge.svg?branch=main)

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
- [Configuração do Vite](#configuração-do-vite)  
- [Router Code-Split](#router-code-split)  
- [Lazy-Load de HLS](#lazy-load-de-hls)  
- [Uso da PWA Avançada](#uso-da-pwa-avançada)  
- [Fallback Offline](#fallback-offline)  
- [Uso do Spinner Global](#uso-do-spinner-global)  
- [Uso das Toast Notifications](#uso-das-toast-notifications)  
- [Páginas: Home, IPTV, VOD, Rádio, Webcams](#páginas-home-iptv-vod-rádio-webcams)  
- [CI & E2E](#ci--e2e)  
- [Dicas de Troubleshooting](#dicas-de-troubleshooting)  
- [Contribuindo](#contribuindo)  
- [Licença](#licença)  
- [Roadmap](#roadmap)  

---

## Visão Geral

OmniCast é uma PWA de streaming que agrupa demos de IPTV, VOD, rádio e webcams.  
Esta versão 1.0.0 consolida build otimizado, testes ponta a ponta e pipeline de CI estável.

---

## Status da Versão

- **Versão**: 1.0.0  
- **Data**: 2025-09-27  
- **Status**: Lançamento estável com PWA, cache inteligente, code-split, CI/E2E verde  

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
│  └─ data/…
├─ js/
│  ├─ main.js
│  ├─ router.js
│  ├─ hls-loader.js
│  ├─ sw.js           ← gerado pelo plugin PWA
│  ├─ utils/
│  │  ├─ spinner.js
│  │  └─ toast.js
│  └─ pages/
│     ├─ home.js
│     ├─ not-found.js
│     ├─ iptv.js
│     ├─ vod.js
│     ├─ radio.js
│     └─ webcams.js
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

Para desenvolvimento:

```bash
npm run dev
# com cache forçado:
npm run dev -- --force
```

Abra `http://localhost:5500/` no navegador.

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
          {
            urlPattern: /\/$/,
            handler: 'NetworkFirst'
          },
          {
            urlPattern: /\.(js|css)$/,
            handler: 'CacheFirst'
          }
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

No `js/router.js`, cada rota carrega sua página via import dinâmico:

```js
case 'iptv': {
  const { renderIptv } = await import('./pages/iptv.js')
  cleanupFn = await renderIptv(container)
  break
}
// mesmo padrão para vod.js, radio.js, webcams.js, home.js, not-found.js
```

Isso gera um chunk separado por página, mantendo o bundle inicial mínimo.

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

E em `js/pages/iptv.js`:

```js
import { loadHls } from '../hls-loader.js'

const Hls = await loadHls()
const hls = new Hls()
```

`hls.js` fica em um chunk próprio, baixado apenas quando necessário.

---

## Uso da PWA Avançada

### Registro e Auto-Update do SW

Em `js/main.js`:

```js
import { registerSW } from 'virtual:pwa-register'
import { showToast } from '@/utils/toast.js'

const updateSW = registerSW({
  onNeedRefresh() {
    showToast('Nova versão disponível! Clique para atualizar.', 'info')
  },
  onOfflineReady() {
    showToast('App pronto para uso offline.', 'success')
  }
})
document.addEventListener('click', e => {
  if (e.target.matches('.toast--info')) updateSW(true)
})
```

---

## Fallback Offline

- `navigateFallback: '/offline.html'` configurado no `vite.config.js`.  
- Em `public/offline.html`, use caminhos root-relative:

  ```html
  <link rel="stylesheet" href="/assets/css/base.css" />
  ```

Teste no DevTools simulando rede offline.

---

## Uso do Spinner Global

Em `index.html`:

```html
<link rel="stylesheet" href="./assets/css/spinner.css" />
```

Em `js/utils/spinner.js`:

```js
export function showSpinner() {
  document.body.classList.add('spinner--visible')
}
export function hideSpinner() {
  document.body.classList.remove('spinner--visible')
}
```

Chame antes e depois de requisições para exibir o spinner.

---

## Uso das Toast Notifications

Em `index.html`:

```html
<link rel="stylesheet" href="./assets/css/toast.css" />
```

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

---

## Páginas: Home, IPTV, VOD, Rádio, Webcams

Cada módulo em `js/pages/*.js` exporta `renderXxx(container)` e retorna uma função de cleanup.

---

## CI & E2E

A pipeline de CI roda em pushes ou PRs na branch `main` e executa testes ponta a ponta via Playwright, garantindo build estável e relatórios:

```yaml
name: CI on main

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4
        with:
          submodules: false
          fetch-depth: 0

      - name: Setup Node.js 20.19.0
        uses: actions/setup-node@v4
        with:
          node-version: '20.19.0'
          cache: 'npm'
          cache-dependency-path: |
            package-lock.json
            .npmrc

      - name: Install dependencies (omit optional deps)
        run: npm ci --no-audit --omit=optional

      - name: Patch Rollup native module
        run: npm install @rollup/rollup-linux-x64-gnu --no-save

      - name: Build
        run: npm run build

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-results
          path: test-results/
          retention-days: 5
```

E no `playwright.config.js`:

```js
webServer: {
  command: 'npm run build && npm run preview -- --port 5500',
  port: 5500,
  reuseExistingServer: true
},
```

---

## Dicas de Troubleshooting

- Hard reload (Ctrl+Shift+R) após build.  
- Unregister SW e limpe Cache Storage no DevTools.  
- Execute `npm run dev -- --force` para forçar rebuild.  
- Use Rollup Visualizer para analisar chunks.

---

## Contribuindo

1. Fork & clone o repositório  
2. `npm install` & `npm run dev`  
3. Abra uma PR com descrição clara, prints e testes se aplicável  

---

## Licença

MIT License. Consulte o arquivo `LICENSE` para detalhes.

---

## Roadmap

- [x] v0.1.0 – Streaming Demo  
- [x] v0.1.1 – PWA Automático & Code-Split  
- [x] v1.0.0 – Lançamento Estável  
- [ ] v1.1.0 – Acessibilidade & Performance  
```