# Changelog

Todas as alterações significativas neste projeto são documentadas aqui.  
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)  
e as versões seguem [SemVer](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado
- _(nenhuma mudança ainda)_

### Alterado
- _(nenhuma mudança ainda)_

### Corrigido
- _(nenhuma mudança ainda)_

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

---

_(restante do changelog permanece inalterado)_

---
