# 📜 CHANGELOG — Omnicast

Todas as alterações relevantes ao projeto **Omnicast** serão documentadas aqui.  
O formato segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e as versões usam [SemVer](https://semver.org/lang/pt-BR/).

---

## [1.0.2] — *Planeada*
### ✨ Novidades
- *(A preencher)*

### 🔧 Melhorias
- *(A preencher)*

### 🐞 Correções
- *(A preencher)*

---

## [1.0.1] — *Planeada*
### 🔧 Melhorias previstas
- Preencher ficheiros de backup (`home_backup.json`, `iptv_backup.json`, `radio_backup.json`, `vod_backup.json`, `webcam_backup.json`).
- Adicionar sons ausentes (`info.mp3`, `warning.mp3`, `critical.mp3`).
- Rever integração `display-settings.js` ↔ `configUI.js`.
- Otimizar imagens e rever `manifest.webmanifest`.
- Melhorar responsividade e acessibilidade no CSS.

---

## [1.0.0] — 2025‑09‑11
### 🚀 Lançamento inicial estável
- Estrutura base do **dashboard PWA** com suporte a IPTV, VOD, Webcams e Rádio.
- **PWA completa**: manifest, service worker, cache offline e instalação.
- **Temas claro/escuro** com persistência.
- **Favoritos** persistentes em `localStorage`.
- **Pesquisa avançada** e filtros combinados.
- **Fallback offline** com `offline.html` e dados de backup.
- **Integração Chart.js** para gráficos dinâmicos.
- **Configurações persistentes** via `configManager.js` e interface `configUI.js`.
- **Ciclo automático de painéis** (`dashboardCycle.js`) com intervalo configurável.
- **Feedback visual** em campos de configuração (`.field-saved` / `.field-error`).
- **Validação de campos numéricos** com tooltip para valores inválidos.
- **Estrutura de pastas organizada** com separação clara de CSS, JS, dados, imagens e sons.
- **Documentação inicial** (`README.md`) com funcionalidades, instalação e fluxo da PWA.

---

## 📌 Notas
- **Licença**: Projeto privado — uso interno.
- **Histórico completo**: este ficheiro será atualizado a cada release.
