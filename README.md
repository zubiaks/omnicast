```markdown
# OmniCast

**Versão 0.1.1 – PWA Automático**

O que há de novo:  
- [x] PWA gerado automaticamente via `vite-plugin-pwa`  
- [x] Auto-update do Service Worker com notificação de nova versão  
- [x] Runtime caching inteligente para HLS streams e assets estáticos  
- [x] Fallback offline customizado em `/offline.html`  

---

## Sumário

- [Visão Geral](#visão-geral)  
- [Status da Versão](#status-da-versão)  
- [Estrutura do Projeto](#estrutura-do-projeto)  
- [Instalação e Execução](#instalação-e-execução)  
- [Configurando o Vite](#configurando-o-vite)  
- [Uso da PWA Avançada](#uso-da-pwa-avançada)  
- [Atualização Automática (SW)](#atualização-automática-sw)  
- [Fallback Offline](#fallback-offline)  
- [Uso do Spinner Global](#uso-do-spinner-global)  
- [Uso das Toast Notifications](#uso-das-toast-notifications)  
- [Uso da página IPTV](#uso-da-página-iptv)  
- [Uso da página VOD](#uso-da-página-vod)  
- [Uso da página Rádio](#uso-da-página-rádio)  
- [Uso da página Webcams](#uso-da-página-webcams)  
- [Dicas de Troubleshooting](#dicas-de-troubleshooting)  
- [Contribuindo](#contribuindo)  
- [Licença](#licença)  
- [Roadmap](#roadmap)  

---

## Visão Geral

Esta release consolida a demo de streaming (v0.1.0) e adiciona uma PWA totalmente autônoma:  
o service worker é gerado e atualizado automaticamente, media e assets são cacheados em runtime,  
e um fallback offline customizado garante boa experiência mesmo sem conexão.

---

## Status da Versão

- Versão: 0.1.1  
- Data de Lançamento: 2025-09-26  
- Status: PWA com update automático, cache inteligente e offline fallback  

---

## Estrutura do Projeto

```
omnicast/
├─ index.html
├─ vite.config.js
├─ public/
│  ├─ manifest.webmanifest
│  ├─ offline.html
│  └─ assets/
│     ├─ css/
│     │  ├─ base.css
│     │  ├─ layout.css
│     │  ├─ spinner.css
│     │  ├─ toast.css
│     │  ├─ iptv.css
│     │  ├─ vod.css
│     │  ├─ radio.css
│     │  └─ webcams.css
│     └─ data/
│        ├─ iptv-channels.json
│        ├─ vod-videos.json
│        ├─ radio-stations.json
│        └─ webcams.json
├─ js/
│  ├─ main.js
│  ├─ router.js
│  ├─ sw.js         ← gerado/atualizado pelo plugin PWA
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

1. Clone o repositório.  
2. No diretório raiz, instale dependências e inicie em dev:
   ```bash
   npm install
   npm run dev
   ```  
3. Para forçar cache limpo e atualizar SW:
   ```bash
   npm run dev -- --force
   ```  
4. Acesse `http://localhost:5500/`.  

---

## Configurando o Vite

No `vite.config.js`, certifique-se de ter:

```js
import path from 'path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-plugin-tsconfig-paths'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // ... root, base, publicDir, server, resolve ...
  plugins: [
    tsconfigPaths(),
    legacy({ targets: ['defaults', 'not IE 11'] }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'robots.txt',
        'data/iptv-channels.json',
        'data/vod-videos.json',
        'data/radio-stations.json',
        'data/webcams.json'
      ],
      manifest: {
        name: 'OmniCast', short_name: 'OmniCast',
        start_url: './', display: 'standalone'
      },
      workbox: {
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,json,svg,png}'],
        navigateFallback: '/offline.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/test-streams\.mux\.dev\/.*\.m3u8$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'hls-streams', expiration: { maxEntries: 20, maxAgeSeconds: 3600 } }
          },
          {
            urlPattern: /\.(?:js|css|html|json)$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'static-assets', expiration: { maxEntries: 100, maxAgeSeconds: 86400 } }
          }
        ]
      }
    })
  ],
  build: { /* unchanged */ }
})
```

---

## Uso da PWA Avançada

### Atualização Automática (SW)

No `js/main.js`:

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
  if (e.target.matches('.toast--info')) {
    updateSW(true) // skipWaiting + reload
  }
})
```

### Fallback Offline

- Garanta que em `vite.config.js` você tenha `navigateFallback: '/offline.html'`.  
- Em `public/offline.html`, use paths root-relative nos links de CSS:

  ```html
  <link rel="stylesheet" href="/assets/css/base.css" />
  <link rel="stylesheet" href="/assets/css/layout.css" />
  <link rel="stylesheet" href="/assets/css/offline.css" />
  ```

- Teste com rede “Offline” no DevTools: qualquer rota deve exibir o `offline.html`.

---

## Uso do Spinner Global

Em `index.html`:

```html
<link rel="stylesheet" href="./assets/css/spinner.css" />
```

Módulos:

```js
import { showSpinner, hideSpinner } from '@/utils/spinner.js'
showSpinner()
await fetchData()
hideSpinner()
```

---

## Uso das Toast Notifications

Em `index.html`:

```html
<link rel="stylesheet" href="./assets/css/toast.css" />
```

Módulos:

```js
import { showToast } from '@/utils/toast.js'
showToast('Sucesso!', 'success')
showToast('Erro!', 'error')
```

---

## Uso da página IPTV

1. Importe `assets/css/iptv.css`.  
2. Configure `public/data/iptv-channels.json`.  
3. Acesse `#/iptv` e selecione um canal.

---

## Uso da página VOD

1. Importe `assets/css/vod.css`.  
2. Configure `public/data/vod-videos.json`.  
3. Acesse `#/vod` e reproduza vídeos.

---

## Uso da página Rádio

1. Importe `assets/css/radio.css`.  
2. Configure `public/data/radio-stations.json`.  
3. Acesse `#/radio` e toque rádio.

---

## Uso da página Webcams

1. Importe `assets/css/webcams.css`.  
2. Configure `public/data/webcams.json`.  
3. Acesse `#/webcams` e veja câmeras.

---

## Dicas de Troubleshooting

- Hard reload (Ctrl + Shift + R) após build.  
- Unregister SW e limpe Cache Storage em DevTools.  
- Teste offline e atualizações de SW.

---

## Contribuindo

1. Fork & clone.  
2. `npm install` e `npm run dev`.  
3. Abra PR com descrições e screenshots.

---

## Licença

Distributed under the MIT License. See `LICENSE`.

---

## Roadmap

- [x] v0.1.0 – Streaming Demo  
- [x] v0.1.1 – PWA Automático (vite-plugin-pwa)  
- [ ] v1.0.0 – Testes E2E e CI  
- [ ] v1.1.0 – Acessibilidade & Performance  
```

Altere seu `README.md` para este conteúdo e marque a entrada v0.1.1 no Roadmap. Assim sua documentação refletirá a nova PWA automática e os fluxos de atualização/fallback.