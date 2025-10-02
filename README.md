[![CI on main](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml)
[![Acessibilidade](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml)
[![Performance Budget](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse-ci.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse-ci.yml)
[![Release](https://img.shields.io/github/v/release/zubiaks/omnicast?style=flat-square)](https://github.com/zubiaks/omnicast/releases/latest)
[![License](https://img.shields.io/github/license/zubiaks/omnicast?style=flat-square)](LICENSE)
[![Metrics Smoke](https://github.com/zubiaks/omnicast/actions/workflows/metrics-smoke.yml/badge.svg)](https://github.com/zubiaks/omnicast/actions/workflows/metrics-smoke.yml)

# OmniCast

![Demonstração do OmniCast](docs/assets/screenshot.gif)

OmniCast é uma Progressive Web App modular para streaming de IPTV, VOD, rádio e webcams, com back-end em Node.js, autenticação via Supabase e métricas em InfluxDB.

---

## Getting Started

Siga estes passos para ter o OmniCast rodando localmente em minutos.

1. Clone o repositório e entre na pasta:
   ```bash
   git clone https://github.com/zubiaks/omnicast.git
   cd omnicast
   ```
2. Alinhe sua versão de Node.js:
   ```bash
   nvm install
   nvm use
   ```
3. Instale dependências e navegadores Playwright:
   ```bash
   npm run setup
   ```
4. Execute em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## Sumário

- [Prerequisitos](#prerequisitos)  
- [Instalação](#instalação)  
- [Variáveis de Ambiente](#variáveis-de-ambiente)  
- [Comandos Principais](#comandos-principais)  
- [API Endpoints](#api-endpoints)  
- [Monitoramento & Web Vitals](#monitoramento--web-vitals)  
- [Performance Budgets](#performance-budgets)  
- [CI/CD & Workflows](#cicd--workflows)  
- [Testes e Qualidade](#testes-e-qualidade)  
- [Contribuindo](#contribuindo)  
- [Branches & Versionamento](#branches--versionamento)  
- [Código de Conduta](#código-de-conduta)  
- [Licença](#licença)  
- [Roadmap](#roadmap)  
- [O que falta na v1.3.1](#o-que-falta-na-v131)  

---

## Prerequisitos

- Node.js `>=20.19.0 <21` (use `nvm`)  
- npm `>=10.x`  
- Git `>=2.30`  
- Navegador moderno (Chrome, Firefox, Safari)  
- Opcional: Docker Compose v2+, Grafana  

---

## Instalação

### Com Docker Compose

1. Defina variáveis em `.env` (veja [Variáveis de Ambiente](#variáveis-de-ambiente)).  
2. Inicie os serviços:
   ```bash
   docker compose up -d
   ```
3. Acesse:
   - API: http://localhost:5000  
   - InfluxDB Explorer: http://localhost:8086  
   - Grafana: http://localhost:3000  

### Sem Docker (Node.js)

1. Navegue até o servidor:
   ```bash
   cd server
   ```
2. Instale dependências e Playwright:
   ```bash
   npm ci
   npm run setup
   ```
3. Crie `server/.env` (veja [Variáveis de Ambiente](#variáveis-de-ambiente)).  
4. Inicie a API:
   ```bash
   node index.js
   ```

---

## Variáveis de Ambiente

Crie `.env` na raiz:

```ini
SUPABASE_URL=https://<SEU_PROJETO>.supabase.co
SUPABASE_ANON_KEY=<anon_key>
TEST_USER_EMAIL=<email>
TEST_USER_PASSWORD=<senha>
```

Crie `server/.env`:

```ini
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
INFLUX_URL=http://influxdb:8086
INFLUX_TOKEN=<influx_token>
INFLUX_ORG=<influx_org>
INFLUX_BUCKET=<bucket>
PORT=5000
```

---

## Comandos Principais

| Tarefa                        | Comando                          |
|-------------------------------|----------------------------------|
| Instalar dependências         | npm run setup                    |
| Desenvolvimento               | npm run dev                      |
| Build                         | npm run build                    |
| Preview                       | npm run preview -- --port 5500   |
| Testes RLS                    | npm run test:rls                 |
| Testes E2E                    | npm run test:e2e                 |
| Mostrar relatório Playwright  | npm run test:e2e:report          |
| Testes completos              | npm test                         |
| Release                       | npm run release                  |

---

## API Endpoints

- **GET /**  
  Retorna `{ "status": "ok" }`.

- **POST /auth/v1/token?grant_type=password**  
  - Headers: `apikey: SUPABASE_ANON_KEY`  
  - Body: `{ "email":"...","password":"..." }`  
  - Retorna tokens de acesso e refresh.

- **GET /streams**  
  - Header: `Authorization: Bearer <token>`  
  - Retorna JSON de streams; sem token → `401 Unauthorized`.

---

## Monitoramento & Web Vitals

Instrumentação via `web-vitals` e Beacon API.  
Detalhes em [docs/monitoring.md](docs/monitoring.md).

---

## Performance Budgets

Validação de budgets com Lighthouse CI.  
Veja `lhci-budgets.json`, `.lighthouserc.cjs` e workflow em [`.github/workflows/lighthouse-ci.yml`](.github/workflows/lighthouse-ci.yml).

---

## CI/CD & Workflows

- **ci-main.yml**: build, audit, patch Rollup, E2E, artefatos  
- **ci.yml**: audit produção, testes com secrets  
- **lighthouse-ci.yml**: budgets de performance  
- **accessibility.yml**: testes de acessibilidade  
- **metrics-smoke.yml**: smoke tests de métricas  

---

## Testes e Qualidade

- Lint: `npm run lint`  
- Audit: `npm audit --audit-level=critical`  
- Unit/Integration: `npm test`  
- E2E: `npm run test:e2e`  
- Acessibilidade: badge “Acessibilidade” no topo  

---

## Contribuindo

Consulte templates em [`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE) e o guia completo em [docs/contributing.md](docs/contributing.md).

---

## Branches & Versionamento

Veja políticas e SemVer em [docs/branches.md](docs/branches.md).

---

## Código de Conduta

Este projeto adota o Contributor Covenant 2.0.  
Leia [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Licença

MIT © 2025 OmniCast Team

---

## Roadmap

- v1.4.0: login biométrico e notificações PWA  
- v2.0.0: contratos de API revisados (breaking changes)  
- Mobile PWA offline e stream failover inteligente  
