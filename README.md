[![CI](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml)
[![Acessibilidade](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml)
[![Performance](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse.yml)
[![release](https://img.shields.io/github/v/release/zubiaks/omnicast?style=flat-square)](https://github.com/zubiaks/omnicast/releases/latest)
[![license](https://img.shields.io/github/license/zubiaks/omnicast?style=flat-square)](LICENSE)

# OmniCast

**Versão 1.2.0 – Segurança & Manutenção Automática**

O que há de novo:  
- [x] Integração do CodeQL Action v3.30.5 para análise estática de segurança  
- [x] Budget de performance via Lighthouse CI com arquivo de budgets JSON  
- [x] Ajustes nos workflows de CI e performance para Windows e Linux  
- [x] Documentação de segurança e performance no CHANGELOG.md  

---

## Sumário

- [Visão Geral](#visão-geral)  
- [Status da Versão](#status-da-versão)  
- [Estrutura do Projeto](#estrutura-do-projeto)  
- [Instalação e Execução](#instalação-e-execução)  
- [Primeiros Passos](#primeiros-passos)  
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

OmniCast é uma Progressive Web App modular para streaming de IPTV, VOD, rádio e webcams, desenhada para ser leve, extensível e fácil de contribuir.

---

## Status da Versão

- Versão: **1.2.0**  
- Data de Release: **2025-10-01**  
- Foco: Segurança & Manutenção Automática  

---

## Estrutura do Projeto

```
omnicast/
├─ docs/
│  ├─ troubleshooting.md
│  └─ ci-setup.md
├─ .github/
│  ├─ ISSUE_TEMPLATE/
│  ├─ PULL_REQUEST_TEMPLATE/
│  └─ workflows/
│     ├─ ci-main.yml
│     ├─ accessibility.yml
│     ├─ lighthouse.yml
│     └─ codeql-analysis.yml
├─ index.html
├─ vite.config.js
├─ public/
│  ├─ manifest.webmanifest
│  ├─ offline.html
│  └─ assets/css/
├─ js/
│  ├─ main.js
│  ├─ router.js
│  ├─ hls-loader.js
│  ├─ utils/
│  └─ pages/
├─ .lighthouserc.cjs
├─ lhci-budgets.json
├─ CONTRIBUTING.md
├─ package.json
├─ CHANGELOG.md
└─ README.md
```

---

## Instalação e Execução

Clone e instale dependências:

```bash
git clone https://github.com/zubiaks/omnicast.git
cd omnicast
npm install
```

---

## Primeiros Passos

1. Instale sem opcionais  
   ```bash
   npm ci --no-audit --omit=optional
   ```
2. Setup (Playwright browsers)  
   ```bash
   npm run setup
   ```
3. Desenvolvimento  
   ```bash
   npm run dev
   ```
4. Build & Preview  
   ```bash
   npm run build
   npm run preview -- --port 5500
   ```
5. Testes E2E  
   ```bash
   npm run test:e2e
   npm run test:e2e:report
   ```

---

## Scripts Úteis

```bash
npm run setup
npm run dev
npm run dev:ci
npm run build
npm run preview
npm run serve:dist
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:report
```

---

## Testes E2E (Playwright)

Cobertura de fluxos críticos, sem alterações nesta versão.

---

## Testes de Acessibilidade

Integrado ao CI via axe-core, sem alterações nesta versão.

---

## Configuração do Vite

Otimizações padrão para dev e prod, sem alterações nesta versão.

---

## Router Code-Split

Roteamento modular por página, sem alterações nesta versão.

---

## Lazy-Load de HLS

Carregamento dinâmico do módulo HLS, sem alterações nesta versão.

---

## PWA Avançada

Service Worker e manifest configurados, sem alterações nesta versão.

---

## Fallback Offline

Página offline personalizada, sem alterações nesta versão.

---

## Spinner Global

Indicador de carregamento global reutilizável, sem alterações nesta versão.

---

## Toast Notifications

Sistema de notificações leve, sem alterações nesta versão.

---

## Páginas do App

- Home  
- IPTV  
- VOD  
- Rádio  
- Webcams  
- Not Found  

---

## Performance & Bundle Analysis

Implementamos budgets de performance versionados com LHCI:

1. **Budget File** na raiz: `lhci-budgets.json`  
   ```json
   [
     {
       "path": "/",
       "timings": [
         { "metric": "first-contentful-paint",    "budget": 2000 },
         { "metric": "largest-contentful-paint",  "budget": 2500 },
         { "metric": "interactive",               "budget": 5000 },
         { "metric": "total-blocking-time",       "budget": 300  },
         { "metric": "cumulative-layout-shift",   "budget": 0.10 }
       ]
     },
     { "path": "/iptv",   "timings": [ … ] },
     { "path": "/vod",    "timings": [ … ] },
     { "path": "/radio",  "timings": [ … ] },
     { "path": "/webcams","timings": [ … ] }
   ]
   ```

2. **Configuração LHCI**: `.lighthouserc.cjs`
   ```js
   module.exports = {
     ci: {
       collect: { /* URLs e comandos */ },
       assert: {
         budgetsFile: './lhci-budgets.json'
       },
       upload: { target: 'temporary-public-storage' }
     }
   };
   ```

3. **Workflow**: `.github/workflows/lighthouse.yml`
   ```yaml
   name: Performance Budget
   on: [ push, pull_request, workflow_dispatch ]
   jobs:
     lhci:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20.x'
             cache: npm
         - run: npm ci --no-audit
         - run: npm install -g @lhci/cli
         - run: lhci autorun --config ./.lighthouserc.cjs
   ```

**Rodando local**:
```bash
npx lhci autorun --config ./.lighthouserc.cjs
```
Falha apenas se algum timing ultrapassar o budget.

---

## CI & E2E no GitHub Actions

- **ci-main.yml** – build, lint e E2E  
- **accessibility.yml** – acessibilidade  
- **lighthouse.yml** – performance budget  
- **codeql-analysis.yml** – segurança estática  

---

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) e use os templates em `.github`.

---

## Licença

MIT License. Veja [LICENSE](LICENSE).

---

## Roadmap

- [x] v0.1.0 – Streaming Demo  
- [x] v0.1.1 – PWA & Code-Split  
- [x] v1.0.0 – Lançamento Estável  
- [x] v1.1.0 – Documentação & Onboarding  
- [x] v1.2.0 – Segurança & Performance Automática  
- [ ] v1.3.0 – Monitoramento de Performance & Budgets  
- [ ] v1.4.0 – Acessibilidade Avançada (WCAG 2.1 AA/AAA)  
- [ ] v1.5.0 – Testes Unitários & Storybook  
- [ ] v1.6.0 – Regressão Visual (Playwright Snapshots)  
- [ ] v1.7.0 – PWA Avançado (Push, Background Sync, Web Share)  
- [ ] v2.0.0 – Autenticação, Favoritos, APIs Externas  

Para acompanhar, veja [Projects](https://github.com/zubiaks/omnicast/projects).