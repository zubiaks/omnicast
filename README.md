[![CI](https://github.com/zubiaks/omnicast/actions/workflows/ci-main.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions)
[![Acessibilidade](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/accessibility.yml)
[![release](https://img.shields.io/github/v/release/zubiaks/omnicast?style=flat-square)](https://github.com/zubiaks/omnicast/releases/latest)
[![license](https://img.shields.io/github/license/zubiaks/omnicast?style=flat-square)](LICENSE)
[![Performance](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse.yml/badge.svg?branch=main)](https://github.com/zubiaks/omnicast/actions/workflows/lighthouse.yml)

# OmniCast

**Versão 1.1.0 – Documentação & Onboarding**

O que há de novo:
- [x] Script `npm run setup` para dependencies + Playwright browsers  
- [x] Seção “Primeiros Passos” no README  
- [x] CONTRIBUTING.md com guia de Issues/PRs e Conventional Commits  
- [x] Templates de Issue e Pull Request  
- [x] Docs de troubleshooting e CI setup em `docs/`  

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

OmniCast é uma Progressive Web App de streaming que reúne demos de IPTV, VOD, rádio e webcams.  
Esta release foca em tornar o projeto fácil de instalar, contribuir e manter, além de manter toda a infraestrutura de PWA, testes E2E e acessibilidade já estabelecida.

---

## Status da Versão

- Versão: 1.1.0  
- Data: 2025-10-01  
- Status: Documentação & Onboarding  

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
│  └─ PULL_REQUEST_TEMPLATE/
│     └─ pull_request_template.md
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
├─ CONTRIBUTING.md
├─ package.json
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

Siga estas etapas para deixar seu ambiente pronto:

1. Instalar dependências e omit optional deps  
   ```bash
   npm ci --no-audit --omit=optional
   ```

2. Executar o script de setup  
   ```bash
   npm run setup
   ```
   Isso roda:
   - `npm ci --no-audit --omit=optional`  
   - `npx playwright install --with-deps`

3. Iniciar servidor de desenvolvimento  
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000` (ou `http://localhost:5500` via `npm run dev:ci`).

4. Build & SPA-fallback  
   ```bash
   npm run build
   npm run serve:dist
   ```
   Acesse `http://localhost:5500`.

5. Rodar testes E2E e acessibilidade  
   ```bash
   npm run test:e2e
   npm run test:e2e:report
   ```

> 💡 Dica: sempre rode `npm run setup` após clonar para evitar problemas de dependências e Playwright.

---

## Scripts Úteis

```bash
npm run setup           # install deps + Playwright browsers
npm run dev             # dev server com Vite
npm run dev:ci          # dev server (porta 5500, clearScreen: false)
npm run build           # build de produção
npm run preview         # preview do build localmente
npm run serve:dist      # serve dist com SPA-fallback
npm run test:e2e        # E2E headless
npm run test:e2e:headed # E2E com interface
npm run test:e2e:report # abrir relatório HTML
```

---

## Testes E2E (Playwright)

Pré-requisitos: Node.js, npm sem optional deps

```bash
npm ci --no-audit --omit=optional
npm run setup
npm run test:e2e
```

Resultados JUnit em `test-results/junit`, relatório HTML em `html-report`.

---

## Testes de Acessibilidade

Automatizado com Playwright + axe-core (WCAG2A/AA):

```bash
npm install --save-dev @axe-core/playwright
```

Em `tests/accessibility.spec.js`:

```js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Acessibilidade WCAG2A/AA', () => {
  for (const path of ['/', '/iptv', '/vod', '/radio', '/webcams', '/404']) {
    test(`rota "${path}" sem violações`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();
      expect(results.violations).toHaveLength(0);
    });
  }
});
```

---

## Configuração do Vite

Veja `vite.config.js` para detalhes de PWA, code-split e output customizado. Plugins:
- `vite-plugin-tsconfig-paths`
- `@vitejs/plugin-legacy`
- `vite-plugin-pwa`

---

## Router Code-Split

Cada rota carrega seu módulo via import dinâmico em `js/router.js`.

---

## Lazy-Load de HLS

Loader em `js/hls-loader.js` faz import dinâmico de `hls.js`.

---

## PWA Avançada

Registro e auto-update do SW via `virtual:pwa-register` em `js/main.js`.

---

## Fallback Offline

`navigateFallback: '/offline.html'` configurado no Workbox.

---

## Spinner Global

Funções `showSpinner()` e `hideSpinner()` em `js/utils/spinner.js`.

---

## Toast Notifications

Função `showToast(message, type)` em `js/utils/toast.js`.

---

## Páginas do App

Módulos em `js/pages/*.js` exportam `renderXxx(container)` que retorna `cleanupFn`.

---

## Performance & Bundle Analysis

Use `rollup-plugin-visualizer` para gerar relatório de chunks.

---

## CI & E2E no GitHub Actions

Workflows:  
- `ci-main.yml` – testes E2E + build  
- `accessibility.yml` – testes de acessibilidade  
- `lighthouse.yml` – performance / Core Web Vitals  

 badge no topo do README.

---

## Contribuindo

Leia [CONTRIBUTING.md](CONTRIBUTING.md) e use os templates em `.github/ISSUE_TEMPLATE` e `.github/PULL_REQUEST_TEMPLATE`.

---

## Licença

MIT License. Veja [LICENSE](LICENSE).

---

## Roadmap

- [x] v0.1.0 – Streaming Demo  
- [x] v0.1.1 – PWA Automático & Code-Split  
- [x] v1.0.0 – Lançamento Estável  
- [x] v1.1.0 – Documentação & Onboarding  
- [ ] v1.2.0 – Segurança & Manutenção Automática  
- [ ] v1.3.0 – Monitoramento de Performance & Budgets  
- [ ] v1.4.0 – Acessibilidade Avançada (WCAG 2.1 AA/AAA)  
- [ ] v1.5.0 – Testes Unitários & Storybook  
- [ ] v1.6.0 – Regressão Visual (Playwright Snapshots)  
- [ ] v1.7.0 – PWA Avançado (Push, Background Sync, Web Share)  
- [ ] v2.0.0 – Novos Features (autenticação, favoritos, APIs externas)

Para acompanhar o progresso, veja nosso [GitHub Projects](https://github.com/zubiaks/omnicast/projects).  
```