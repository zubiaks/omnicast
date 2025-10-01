# Monitoring & Web Vitals

Este documento mostra como instrumentar métricas de Web Vitals e configurar budgets de performance.

---

## 1. Instalação

No terminal, execute:

```bash
npm install web-vitals --save
```

---

## 2. Instrumentação

No seu entrypoint (por exemplo `js/main.js`), importe e chame as funções de Web Vitals:

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
  const blob = new Blob(
    [JSON.stringify(payload)],
    { type: 'application/json' }
  )
  navigator.sendBeacon('/api/metrics', blob)
}

// dispara coleta de cada métrica
getCLS(sendToMonitoring)
getFID(sendToMonitoring)
getLCP(sendToMonitoring)
getFCP(sendToMonitoring)
```

---

## 3. Envio de Métricas

Utilizamos a Beacon API para garantir o envio mesmo quando o usuário fecha a aba. O endpoint back-end deve aceitar requisições POST em `/api/metrics` com um JSON no corpo contendo `name`, `value`, `delta`, `href` e `timestamp`.

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

Os budgets de performance ficam em `lhci-budgets.json`. Se algum critério for ultrapassado, o Lighthouse CI falha o build.

Exemplo de conteúdo de `lhci-budgets.json`:

```json
[
  { "metric": "largest-contentful-paint", "budget": 2500 },
  { "metric": "cumulative-layout-shift",  "budget": 0.1   },
  { "metric": "first-input-delay",        "budget": 100   }
]
```

---

## 5. Como Testar

1. Inicie a aplicação em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
2. Ou faça build e preview:
   ```bash
   npm run build && npm run preview
   ```
3. Abra o DevTools do navegador → aba Network → filtre por `/api/metrics`.
4. Navegue pela aplicação e confira os requests enviados com os Web Vitals.
