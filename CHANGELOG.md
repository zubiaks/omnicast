# Changelog

Todas as alterações significativas neste projeto são documentadas aqui.  
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)  
e as versões seguem [SemVer](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado
- Workflow `codeql-analysis.yml` com CodeQL Action v3.30.5 para varredura estática de segurança
- Configuração de *performance budget* via Lighthouse CI em `.lighthouserc.cjs`
- Upload de relatórios LHCI para `temporary-public-storage`
- Permissões no workflow: `contents: read`, `checks: write`, `security-events: write`
- `launchOptions` para Chrome headless (`--no-sandbox`, `--headless`)

### Alterado
- Remoção de `--omit=optional` no `npm ci` para garantir instalação de binários nativos do Rollup
- `lighthouse.yml` agora passa `LHCI_GITHUB_APP_TOKEN: ${{ secrets.GITHUB_TOKEN }}`
- `codeql-analysis.yml` refatorado para checkout sem hard-coded `repository:`  
- Ajuste de caminhos de cache em `setup-node` (`package-lock.json`, `.npmrc` na raiz)  
- Debug steps (ex.: `ls -R .`, `echo GITHUB_REPOSITORY`) removidos dos workflows

### Corrigido
- Erro `MODULE_NOT_FOUND` para `@rollup/rollup-linux-x64-gnu`
- Avisos de “GitHub token not set” no LHCI  
- Falha 422 ao fazer upload SARIF no CodeQL ativando Code Scanning no Settings  
- Timeouts de startServer ajustados em `.lighthouserc.cjs` (`startServerReadyPattern` e `startServerTimeout`)

---

## [1.2.0] – 2025-10-02

### Adicionado
- CodeQL Action v3.30.5 para análise de JavaScript e workflows de segurança  
- Lighthouse CI budget para performance, LCP, CLS e TBT  
- Upload temporário de relatórios de performance (HTML)  
- Gatilhos para push, pull_request e execução manual no workflow de performance

### Alterado
- Workflow de CI principal (`ci-main.yml`) com atualização de permissões e limpeza de debug  
- Lighthouse workflow (`lighthouse.yml`) com token e dependências ajustadas  
- Projeto unificado: todas as configurações de segurança e performance documentadas em `CHANGELOG.md`

### Corrigido
- Paths de cache quebrados no setup-node  
- Configuração de serve para SPA fallback em `npm run preview -- --port 5500`  
- Thresholds de performance realistas no Lighthouse CI  

---

## [1.1.0] – 2025-10-01

### Adicionado
- Workflow GitHub Actions para testes de acessibilidade em `accessibility.yml`  
- Badge de Acessibilidade no README  
- Stub de rede nativo do Playwright (`page.route`) para mock de `iptv-channels.json`  
- Script `npm run setup` que instala dependências + browsers do Playwright  
- Templates de Issue (`.github/ISSUE_TEMPLATE`) e Pull Request (`.github/PULL_REQUEST_TEMPLATE`)  
- Documentos de troubleshooting (`docs/troubleshooting.md`) e CI setup (`docs/ci-setup.md`)

### Alterado
- Substituído o `http-server` pelo `serve -s dist` no script `serve:dist` para SPA-fallback  
- Atualizada seção “Primeiros Passos” no README  
- Removida a dependência de MSW dos testes E2E

### Corrigido
- Violações de `document-title` e `html-has-lang` em rotas SPA (faltava `<title>` e `lang`)

---

## [1.0.0] – 2025-09-27

### Adicionado
- Testes de acessibilidade automatizados com Playwright e axe-core cobrindo WCAG2A/AA  
- Pipeline de CI/E2E completo no GitHub Actions com cache de dependências e upload de artefatos  
- Workflow Lighthouse CI (`lighthouse.yml`) e badge de Performance no README  
- Badge de status de release e licença no README  
- Stub de rede via Playwright em todos os testes E2E

### Alterado
- Script `serve:dist` agora usa `serve -s dist -l 5500` para suporte a SPA-fallback  
- Route stubbing nativo do Playwright substitui MSW nos testes E2E
