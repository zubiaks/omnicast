# OmniCast Dashboard Turbo

Hub multimédia integrado para IPTV, VOD, Webcams e Rádio. Esta aplicação fornece uma interface rápida e responsiva para gestão de streams em tempo real, com suporte offline via PWA.

---

## Tabela de Conteúdos

- [Estrutura do Projeto](#estrutura-do-projeto)  
- [Iniciando](#iniciando)  
- [Variáveis de Ambiente](#variáveis-de-ambiente)  
- [Scripts Disponíveis](#scripts-disponíveis)  
- [Arquitetura e Fluxo de Dados](#arquitetura-e-fluxo-de-dados)  
- [Qualidade de Código](#qualidade-de-código)  
- [Testes](#testes)  
- [Suporte PWA](#suporte-pwa)  
- [Deployment e Docker](#deployment-e-docker)  
- [Contribuição](#contribuição)  
- [Licença](#licença)  

---

## Estrutura do Projeto

| Caminho       | Descrição                                                      |
| ------------- | -------------------------------------------------------------- |
| `.husky/`     | Hooks Git (pre-commit, commit-msg, pre-push)                   |
| `backend/`    | API Python, scripts agendados e ingestão de payloads           |
| `docs/`       | Documentação de arquitetura e decisões de projeto              |
| `frontend/`   | Código da interface (Vite, CSS, JS)                            |
| `lib/`        | Módulos de negócio, validações (AJV) e helpers comuns          |
| `public/`     | Conteúdo estático (JSON, manifest, ícones)                     |
| `schemas/`    | JSON Schemas para validação de payloads                        |
| `tests/`      | Testes unitários (Jest) e end-to-end (Cypress)                 |
| `README.md`   | Documentação raiz                                              |
| `package.json`| Configuração de scripts e dependências                        |
| `vite.config.js` | Configuração Vite                                            |

---

## Iniciando

1. Clone o repositório e acesse a pasta raiz:
   ```bash
   git clone https://github.com/seu-usuario/omnicast-dashboard.git
   cd omnicast-dashboard
Instale as dependências:

bash
npm install
Copie o arquivo de exemplo de variáveis de ambiente:

bash
cp .env.example .env
Preencha as chaves dentro de .env.

Inicie em modo desenvolvimento:

bash
npm run dev
Acesse em http://localhost:5500.

Variáveis de Ambiente
Edite o arquivo .env na raiz com as seguintes chaves:

NODE_ENV → ambiente (development ou production)

PORT → porta do backend (ex.: 3000)

DATABASE_URL → string de conexão PostgreSQL

API_KEY → chave para serviços externos

PWA_DISABLE → desativa PWA em dev (true/false)

Scripts Disponíveis
Comando	Descrição
npm run dev	Inicia o servidor Vite em modo desenvolvimento (porta 5500)
npm run watch:schema	Observa mudanças em schemas/ e revalida payloads
npm run dev:full	Executa watch:schema e dev em paralelo
npm run build	Gera build de produção em dist/
npm run preview	Servidor estático para dist/ (porta 5500)
npm run lint	Executa ESLint e Stylelint
npm run lint:js	Executa apenas ESLint
npm run lint:css	Executa apenas Stylelint
npm run test:unit	Roda testes unitários com Jest
npm run test:e2e	Roda testes Cypress em modo headless
npm run test:e2e:open	Abre interface do Cypress para debug
npm run docker:build	Gera imagem Docker
npm run docker:up	Sobe containers com Docker Compose
Arquitetura e Fluxo de Dados
Dados estáticos e históricos ficam em public/data/*.json.

Frontend utiliza Vite com aliases (@, @modules, @css, @img).

Backend (Node/Python) expõe endpoints REST e jobs agendados com node-cron.

Validação e configuração de payloads usam JSON Schemas em schemas/.

Qualidade de Código
Hooks Git em .husky/ garantem lint, formatação e testes antes de commit/push.

Convenções de commit via Commitlint (Conventional Commits).

Lint-staged formata apenas arquivos staged (ESLint, Stylelint, Prettier).

Coverage thresholds no Jest falham build com cobertura abaixo de 80%.

Testes
Unitários: Jest com cobertura mínima de 80% para branches, linhas e funções.

E2E: Cypress em tests/e2e/.

Execute localmente:

bash
npm run test:unit
npm run test:e2e:open
Suporte PWA
Manifesto em public/manifest.webmanifest.

Ícones em public/img/icons/.

Service Worker gerado pelo vite-plugin-pwa em sw.js.

Modo standalone, cache de recursos e fallback offline configurados.

Deployment e Docker
Gere a build de produção:

bash
npm run build
Suba via Docker:

bash
npm run docker:build
npm run docker:up
Certifique-se de definir variáveis de ambiente no container ou no seu sistema de orquestração.

Contribuição
Faça um fork e clone este repositório.

Crie uma branch com a feature ou bugfix (feat/escopo-descricao).

Commit seguindo a convenção (feat(frontend): adicionar carrossel).

Abra um Pull Request descrevendo as mudanças e resultados de testes locais.

Licença
Este projeto está licenciado sob a MIT License.