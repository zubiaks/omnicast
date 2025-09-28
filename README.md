[![CI](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions)
[![Acessibilidade](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml)
[![release](https://img.shields.io/github/v/release/zubiaks/omnicast?style=flat-square)](https://github.com/zubiaks/omnicast/releases/latest)
[![license](https://img.shields.io/github/license/zubiaks/omnicast?style=flat-square)](LICENSE)
[![Performance](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse.yml)

# OmniCast

**Versão 1.2.0 – Segurança & Manutenção Automática**

O que há de novo:
- [x] Integração do CodeQL Action v3.30.5 para varredura estática de segurança  
- [x] Budget de performance via Lighthouse CI com `.lighthouserc.cjs`  
- [x] Ajustes no workflow de CI e de performance para Windows e Linux  
- [x] Documentação do fluxo de segurança e performance no CHANGELOG.md  

---

## Sumário

- [Visão Geral](#vis%C3%A3o-geral)  
- [Status da Versão](#status-da-vers%C3%A3o)  
- [Estrutura do Projeto](#estrutura-do-projeto)  
- [Instalação e Execução](#instala%C3%A7%C3%A3o-e-execu%C3%A7%C3%A3o)  
- [Primeiros Passos](#primeiros-passos)  
- [Scripts Úteis](#scripts-%C3%BAteis)  
- [Testes E2E (Playwright)](#testes-e2e-playwright)  
- [Testes de Acessibilidade](#testes-de-acessibilidade)  
- [Configuração do Vite](#configura%C3%A7%C3%A3o-do-vite)  
- [Router Code-Split](#router-code-split)  
- [Lazy-Load de HLS](#lazy-load-de-hls)  
- [PWA Avançada](#pwa-avançada)  
- [Fallback Offline](#fallback-offline)  
- [Spinner Global](#spinner-global)  
- [Toast Notifications](#toast-notifications)  
- [Páginas do App](#p%C3%A1ginas-do-app)  
- [Performance & Bundle Analysis](#performance--bundle-analysis)  
- [CI & E2E no GitHub Actions](#ci--e2e-no-github-actions)  
- [Contribuindo](#contribuindo)  
- [Licença](#licen%C3%A7a)  
- [Roadmap](#roadmap)  

---

## Visão Geral

OmniCast é uma Progressive Web App de streaming que reúne demos de IPTV, VOD, rádio e webcams.  
Esta release adiciona fluxo automático de segurança e performance no CI, mantendo facilidade de instalação e contribuição.

---

## Status da Versão

- Versão: 1.2.0  
- Data: 2025-10-01  
- Status: Segurança & Manutenção Automática  

---

## Estrutura do Projeto

```
omnicast/
├─ docs/
│  ├─ troubleshooting.md
│  └─ ci-setup.md
├─ .github/
│  ├─ ISSUE_TEMPLATE/
│  │  └─ bug_report.yml
│  ├─ PULL_REQUEST_TEMPLATE/
│  │  └─ pull_request_template.md
│  ├─ workflows/
│  │  ├─ ci-main.yml
│  │  ├─ accessibility.yml
│  │  ├─ lighthouse.yml
│  │  └─ codeql-analysis.yml
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
├─ .lighthouserc.cjs
├─ CONTRIBUTING.md
├─ package.json
├─ CHANGELOG.md
└─ README.md
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

## Primeiros Passos

1. Instale dependências sem optional  
   ```bash
   npm ci --no-audit --omit=optional
   ```
2. Execute setup (inclui Playwright browsers)  
   ```bash
   npm run setup
   ```
3. Inicie servidor de dev  
   ```bash
   npm run dev
   ```
4. Build & preview  
   ```bash
   npm run build
   npm run serve:dist
   ```
5. Rode testes E2E e relatório  
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
*sem mudanças*

---

## Testes de Acessibilidade
*sem mudanças*

---

## Configuração do Vite
*sem mudanças*

---

## Router Code-Split
*sem mudanças*

---

## Lazy-Load de HLS
*sem mudanças*

---

## PWA Avançada
*sem mudanças*

---

## Fallback Offline
*sem mudanças*

---

## Spinner Global
*sem mudanças*

---

## Toast Notifications
*sem mudanças*

---

## Páginas do App
*sem mudanças*

---

## Performance & Bundle Analysis
*sem mudanças*

---

## CI & E2E no GitHub Actions

Workflows principais:
- **ci-main.yml** – build + E2E  
- **accessibility.yml** – testes de acessibilidade  
- **lighthouse.yml** – performance budget  
- **codeql-analysis.yml** – análise estática de segurança  

---

## Contribuindo

Leia [CONTRIBUTING.md](CONTRIBUTING.md) e siga os templates em `.github/`.

---

## Licença

MIT License. Veja [LICENSE](LICENSE).

---

## Roadmap

- [x] v0.1.0 – Streaming Demo  
- [x] v0.1.1 – PWA Automático & Code-Split  
- [x] v1.0.0 – Lançamento Estável  
- [x] v1.1.0 – Documentação & Onboarding  
- [x] v1.2.0 – Segurança & Manutenção Automática  
- [ ] v1.3.0 – Monitoramento de Performance & Budgets  
- [ ] v1.4.0 – Acessibilidade Avançada (WCAG 2.1 AA/AAA)  
- [ ] v1.5.0 – Testes Unitários & Storybook  
- [ ] v1.6.0 – Regressão Visual (Playwright Snapshots)  
- [ ] v1.7.0 – PWA Avançado (Push, Background Sync, Web Share)  
- [ ] v2.0.0 – Novos Features (autenticação, favoritos, APIs externas)

Para acompanhar o progresso, veja [Projects](https://github.com/zubiaks/omnicast/projects).