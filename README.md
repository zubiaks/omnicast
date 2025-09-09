# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto segue [SemVer](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2025-10-01

### Adicionado
- Modo DEMO: gera dados fictícios para exibição quando o backend está offline.
- Gestão de erros no UI: banners de erro não intrusivos com opção de retry.
- Internacionalização (i18n): suporte a PT (padrão) e EN.
- Novo campo de seleção de idioma no painel de configurações globais.
- Documento técnico atualizado com novas instruções de uso do modo DEMO e i18n.

### Alterado
- Refatoração de `dashboard.js` para modularizar funções relacionadas ao modo DEMO.
- Ajustes no CSS (`dashboard.css`) para comportar textos em múltiplos idiomas.
- Comunicação com o Service Worker otimizada para exibir banners de erro de cache.

### Corrigido
- Corrigido bug onde o `setInterval` de atualização era duplicado ao abrir o painel de configurações.
- Correção no cálculo de latência exibida quando a API retorna status não-ok.

### Removido
- Código legado de `dashboard-pre-modo-demo.js`.
- Dependência desnecessária de polyfill de `fetch`.

### Notas
- A seleção de idioma persiste em `localStorage` e atualiza imediatamente a interface.
- O modo DEMO pode ser desativado via query string `?demo=false` na URL.

## [1.0.0] - 2025-09-09

### Adicionado
- Estrutura inicial de pastas e ficheiros:
  - `pages/dashboard.html`, `assets/css/dashboard.css`, `assets/js/dashboard.js`
  - PWA: `pwa/manifest.webmanifest`, `pwa/sw.js`
  - Dev server: `scripts/dev-server.js`
  - Docker: `docker/Dockerfile`, `docker/nginx.conf`
- Dashboard com três painéis principais:
  1. Métricas do sistema
  2. Gráficos de performance (Chart.js)
  3. Destaques e alertas
- Painel de configurações globais:
  - Alertas sonoros (critical, warning, info)
  - Notificações de atualização
  - Tema claro/escuro
  - Atualização automática/manual
- Atualização periódica de métricas (5s) e auto-ciclo de painéis (10s).
- Alertas sonoros e visuais:
  - `alert-critical.mp3`, `alert-warning.mp3`, `alert-info.mp3`
  - Efeito `piscar` em elementos com classe `.alerta`
- Integração com Service Worker para:
  - Pré-cache de assets (CSS, JS, Chart.js)
  - Estratégia network-first para endpoint `/status`
  - Banner de aviso de nova versão via mensagem `UPDATE_READY`
- Configurações de build e deploy:
  - `package.json` com scripts `dev`, `build` e `serve`
  - Docker + Nginx configurados para app estática e PWA
- Documentação inicial: `README.md`, `CHANGELOG.md`

### Notas
- Versão inicial, estabelecendo base sólida para iterações futuras.
