# Monitoring & Web Vitals

Este documento mostra como instrumentar métricas de Web Vitals, configurar budgets de performance e integrá-los ao CI.

---

## 1. Instalação

No terminal, execute:

```bash
npm install web-vitals --save
```

---

## 2. Instrumentação de Web Vitals

No seu entrypoint (por exemplo `src/main.js`):

```js
import { getCLS, getFID, getLCP, getFCP } from 'web-vitals'

// função genérica para envio de métricas
function sendToMonitoring(metric) {
  const payload = {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    href: window.location.href,
    timestamp: Date.now()
  }
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
  navigator.sendBeacon('/api/metrics', blob)
}

getCLS(sendToMonitoring)
getFID(sendToMonitoring)
getLCP(sendToMonitoring)
getFCP(sendToMonitoring)
```

---

## 3. Envio de Métricas

Utilizamos a Beacon API para garantir o envio mesmo quando o usuário fecha a aba  
O endpoint back-end deve aceitar POST em `/api/metrics` com JSON contendo:

- `name`  
- `value`  
- `delta`  
- `href`  
- `timestamp`  

Exemplo de payload:

```json
{
  "name": "LCP",
  "value": 1734.27,
  "delta": 234.12,
  "href": "https://seu-dominio.com/home",
  "timestamp": 1696150201234
}
```

---

## 4. Performance Budgets

Crie o arquivo `lhci-budgets.json` na raiz do projeto com:

```bash
cat << 'EOF' > lhci-budgets.json
[
  {
    "path": "/",
    "budgets": [
      { "metric": "first-contentful-paint",  "maxNumericValue": 2000 },
      { "metric": "largest-contentful-paint", "maxNumericValue": 2500 },
      { "metric": "interactive",              "maxNumericValue": 5000 },
      { "metric": "total-blocking-time",       "maxNumericValue": 300  },
      { "metric": "cumulative-layout-shift",   "maxNumericValue": 0.10 }
    ]
  },
  {
    "path": "/iptv",
    "budgets": [ /* mesmos valores para cada rota */ ]
  },
  {
    "path": "/vod",
    "budgets": [ /* ... */ ]
  },
  {
    "path": "/radio",
    "budgets": [ /* ... */ ]
  },
  {
    "path": "/webcams",
    "budgets": [ /* ... */ ]
  }
]
EOF
```

---

## 5. Configuração do Lighthouse CI

Crie o arquivo `.lighthouserc.cjs` na raiz:

```js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:5500/',
        'http://localhost:5500/iptv',
        'http://localhost:5500/vod',
        'http://localhost:5500/radio',
        'http://localhost:5500/webcams'
      ],
      numberOfRuns:         3,
      startServerCommand:   'npm run build && npm run preview -- --port 5500',
      startServerReadyPattern: 'Local:',
      startServerTimeout:     120000,
      launchOptions: {
        chromeFlags: ['--no-sandbox','--headless']
      }
    },
    assert: {
      budgetsFile: './lhci-budgets.json'
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
```

---

## 6. Workflow de Performance Budget

Adicione `.github/workflows/lighthouse-ci.yml`:

```yaml
name: Performance Budget

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  lhci:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: npm
          cache-dependency-path: |
            package-lock.json
            .npmrc

      - run: npm ci --no-audit
      - run: npm install -g @lhci/cli

      - name: Run Lighthouse CI
        run: lhci autorun --config ./.lighthouserc.cjs
```

---

## 7. Badge de Performance

No `README.md`, adicione junto aos outros badges:

```markdown
![Performance Budget](https://github.com/omnicast-org/omnicast/actions/workflows/lighthouse-ci.yml/badge.svg)
```

---

## 8. Como Testar Localmente

1. Inicie em modo de desenvolvimento:  
   ```bash
   npm run dev
   ```
2. Ou faça build + preview:  
   ```bash
   npm run build && npm run preview -- --port 5500
   ```
3. Verifique no DevTools → aba Network → filtre por `/api/metrics`  
4. Execute Lighthouse localmente:  
   ```bash
   npx lhci autorun --config ./.lighthouserc.cjs
