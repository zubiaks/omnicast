[![CI](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml)
[![Acessibilidade](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml)
[![Performance](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse.yml)
[![Release](https://img.shields.io/github/v/release/zubiaks/omnicast?style=flat-square)](https://github.com/zubiaks/omnicast/releases/latest)
[![License](https://img.shields.io/github/license/zubiaks/omnicast?style=flat-square)](LICENSE)

# OmniCast

**Versão 1.3.0 – Instrumentação de Web Vitals, Monitoramento & Budgets**

O que há de novo:
- Coleta de Web Vitals (FCP, LCP, CLS, FID) usando `web-vitals`  
- Envio de métricas via Beacon API para `/api/metrics`  
- Budgets de performance definidos em `lhci-budgets.json`  
- Integrações de segurança: Dependabot, CodeQL, Snyk, npm audit  

---

## Sumário

- [Visão Geral](#visão-geral)  
- [Pré-requisitos](#pré-requisitos)  
- [Instalação](#instalação)  
  - [Com Docker Compose](#com-docker-compose)  
  - [Sem Docker (Node.js)](#sem-docker-nodejs)  
- [Variáveis de Ambiente](#variáveis-de-ambiente)  
- [API Endpoints](#api-endpoints)  
- [Exemplos de Uso](#exemplos-de-uso)  
- [Monitoramento & Web Vitals](#monitoramento--web-vitals)  
- [Performance Budgets](#performance-budgets)  
- [CI/CD & Workflows](#cicd--workflows)  
- [Segurança](#segurança)  
- [Troubleshooting](#troubleshooting)  
- [Contribuindo](#contribuindo)  
- [Código de Conduta](#código-de-conduta)  
- [Licença](#licença)  
- [Roadmap](#roadmap)  

---

## Visão Geral

OmniCast é uma Progressive Web App modular para demonstração de streaming de IPTV, VOD, rádio e webcams.  
No back-end Node.js, oferece rotas autenticadas via Supabase e coleta métricas de performance em InfluxDB.

---

## Pré-requisitos

- Docker Engine & Docker Compose v2+  
- Node.js 18+  
- Conta e projeto no Supabase  
- (Opcional) Grafana para visualização de métricas  

---

## Instalação

### Com Docker Compose

1. Clone o repositório:
   ```bash
   git clone https://github.com/zubiaks/omnicast.git
   cd omnicast
   ```
2. Defina variáveis em `.env` (veja [Variáveis de Ambiente](#variáveis-de-ambiente)).  
3. Inicie os serviços:
   ```bash
   docker compose up -d
   ```
4. Acesse:
   - API: http://localhost:5000  
   - InfluxDB Explorer: http://localhost:8086  
   - Grafana: http://localhost:3000  

### Sem Docker (Node.js)

1. Navegue até o servidor:
   ```bash
   cd omnicast/server
   ```
2. Instale dependências:
   ```bash
   npm ci
   npm run setup
   ```
3. Crie `.env` na raiz de `server/` (veja [Variáveis de Ambiente](#variáveis-de-ambiente)).  
4. Inicie:
   ```bash
   node index.js
   ```

---

## Variáveis de Ambiente

Crie `server/.env` com:

```ini
SUPABASE_URL=https://<SEU_PROJETO>.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
INFLUX_URL=http://influxdb:8086
INFLUX_TOKEN=<influx token>
INFLUX_ORG=<influx org>
INFLUX_BUCKET=metrics
PORT=5000
```

---

## API Endpoints

1. **Health Check**  
   `GET /`  
   Retorna `{ "status": "ok" }`

2. **Login Supabase**  
   `POST /auth/v1/token?grant_type=password`  
   - Headers:  
     - `apikey: SUPABASE_ANON_KEY`  
     - `Content-Type: application/json`  
   - Body:
     ```json
     { "email": "user@example.com", "password": "Password123" }
     ```
   - Resposta:  
     ```json
     { "access_token": "...", "refresh_token": "...", ... }
     ```

3. **Streams Protegidos**  
   `GET /streams`  
   - Header: `Authorization: Bearer <access_token>`  
   - Resposta:
     ```json
     [
       { "id":1, "title":"Canal A", "url":"https://.../x36xhzz.m3u8" },
       { "id":2, "title":"Canal B", "url":"https://.../stream.m3u8" }
     ]
     ```
   - Sem token ou inválido: `401 Unauthorized`

---

## Exemplos de Uso

### PowerShell

```powershell
# Carrega .env
Get-Content .\.env |
  Where-Object { $_ -and $_ -notmatch '^\s*#' } |
  ForEach-Object {
    $kv = $_ -split '=',2
    Set-Item Env:\$($kv[0]) $kv[1]
  }

# Login
$body = @{ email="user@example.com"; password="Password123" } | ConvertTo-Json
$resp = Invoke-RestMethod -Uri "$env:SUPABASE_URL/auth/v1/token?grant_type=password" `
  -Method POST -Headers @{ apikey=$env:SUPABASE_ANON_KEY; "Content-Type"="application/json" } `
  -Body $body
$token = $resp.access_token

# Chamada streams
curl.exe -H "Authorization: Bearer $token" http://localhost:5000/streams
```

### cURL (Linux/macOS)

```bash
curl -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  --data '{"email":"user@example.com","password":"Password123"}'
```

---

## Monitoramento & Web Vitals

1. Instale:
   ```bash
   npm install web-vitals --save
   ```
2. Em `js/main.js`:
   ```js
   import { getCLS, getFID, getLCP, getFCP } from 'web-vitals'

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
3. No InfluxDB Explorer:
   ```flux
   from(bucket:"metrics")
     |> range(start: -5m)
     |> filter(fn: (r) => r._measurement == "http_request")
   ```

---

## Performance Budgets

Arquivo `lhci-budgets.json`:

```json
[
  { "metric": "largest-contentful-paint", "budget": 2500 },
  { "metric": "cumulative-layout-shift",  "budget": 0.1   },
  { "metric": "first-input-delay",        "budget": 100   }
]
```

Configuração em `.lighthouserc.cjs`:

```js
module.exports = {
  ci: {
    collect: