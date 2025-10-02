[![CI on main](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml)
[![Acessibilidade](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml)
[![Performance Budget](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse-ci.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse-ci.yml)
[![Release](https://img.shields.io/github/v/release/zubiaks/omnicast?style=flat-square)](https://github.com/zubiaks/omnicast/releases/latest)
[![License](https://img.shields.io/github/license/zubiaks/omnicast?style=flat-square)](LICENSE)
[![Metrics Smoke](https://github.com/zubiaks/omnicast/actions/workflows/metrics-smoke.yml/badge.svg)](https://github.com/zubiaks/omnicast/actions/workflows/metrics-smoke.yml)

# OmniCast v1.5.1

![Demonstração do OmniCast](docs/assets/screenshot.gif)

OmniCast é uma Progressive Web App modular para streaming de IPTV, VOD, rádio e webcams, com back-end em Node.js, autenticação via Supabase e métricas em InfluxDB.

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
- [Smoke Metrics](#smoke-metrics)  
- [Testes e Qualidade](#testes-e-qualidade)  
- [Contribuindo](#contribuindo)  
- [Branches & Versionamento](#branches--versionamento)  
- [Código de Conduta](#código-de-conduta)  
- [Licença](#licença)  
- [Roadmap](#roadmap)  
- [O que vem na v1.5.1](#o-que-vem-na-v151)  

---

## Prerequisitos

- Node.js `>=20.19.0 <21` (use `nvm`)  
- npm `>=10.x`  
- Git `>=2.30`  
- Navegador moderno (Chrome, Firefox, Safari)  
- Docker Compose v2+ (recomendado) ou Docker CLI  

---

## Instalação

### Com Docker Compose

1. Defina variáveis em `.env` (veja [Variáveis de Ambiente](#variáveis-de-ambiente)).  
2. Inicie todos os serviços:
   ```bash
   docker compose up -d
   ```
3. Acesse:
   - API: http://localhost:5000  
   - InfluxDB Explorer: http://localhost:8086  
   - Grafana (opcional): http://localhost:3000  

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

Crie um `.env` na raiz do projeto:

```ini
SUPABASE_URL=https://<SEU_PROJETO>.supabase.co
SUPABASE_ANON_KEY=<anon_key>
TEST_USER_EMAIL=<email>
TEST_USER_PASSWORD=<senha>
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=<influx_token>
INFLUX_ORG=<influx_org>
INFLUX_BUCKET=<bucket>
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
| Relatório E2E                 | npm run test:e2e:report          |
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

## Smoke Metrics

Este script faz um write+read em um bucket InfluxDB para validar sua pipeline de métricas.

### Pré-requisitos

- InfluxDB (via Docker ou Compose) rodando  
- Node.js (v16+) e npm/yarn disponíveis  
- `.env` com:
  - `INFLUX_URL` (ex.: `http://localhost:8086`)
  - `INFLUX_TOKEN` (token de leitura/escrita)
  - `INFLUX_ORG` (ex.: `omnicast`)
  - `INFLUX_BUCKET` (ex.: `metrics`)

### 1. Subir o InfluxDB

#### Docker Run

```bash
docker run -d \
  --name influxdb \
  -p 8086:8086 \
  -v influxdb_data:/var/lib/influxdb2 \
  influxdb:2.6
```

#### Docker Compose

```yaml
version: '3.8'
services:
  influxdb:
    image: influxdb:2.6
    container_name: influxdb
    ports:
      - 8086:8086
    volumes:
      - influxdb_data:/var/lib/influxdb2

volumes:
  influxdb_data:
```
```bash
docker-compose up -d
```

### 2. Setup (apenas na primeira vez)

```bash
docker exec -it influxdb influx setup --force \
  --token omnicast123 \
  --bucket metrics \
  --org omnicast \
  --username zubiaks \
  --password '1000Fonte$'
```

Saída esperada:

```
Setup Successful!
Your initial user is: zubiaks
Your initial organization is: omnicast
Your initial bucket is: metrics
```

### 3. Executar o Smoke Metrics

```bash
node scripts/smoke-metrics.js
```

Saída esperada:

```
✅ Métricas chegando normalmente no InfluxDB
```

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

Este projeto segue GitFlow e SemVer. Veja detalhes em [docs/branches.md](docs/branches.md).

---

## Código de Conduta

Este projeto adota o Contributor Covenant 2.0.  
Leia [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## Licença

MIT © 2025 OmniCast Team

---

## Roadmap

- v1.5.1: consolidar smoke metrics, documentar README, CI merge smoke workflow  
- v1.6.0: login biométrico e notificações PWA  
- v2.0.0: contratos de API revisados (breaking changes) e mobile PWA offline  

---

## O que vem na v1.5.1

- Fluxo de smoke metrics integrado ao CI (`metrics-smoke.yml`)  
- Seção Smoke Metrics completa no README  
- `docker-compose.yml` oficial para InfluxDB  
- Atualização do pipeline de CI para rodar smoke tests  
- Ajustes no `scripts/smoke-metrics.js` (write+read)
