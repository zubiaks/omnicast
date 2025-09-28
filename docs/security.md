# Segurança

Este documento explica como gerenciamos vulnerabilidades e dependências.

## Dependabot

Atualizações automáticas semanais de dependências via `.github/dependabot.yml`.

## npm audit

Executado no CI com `npm audit --audit-level=critical`.  
Falha se existirem vulnerabilidades críticas.

## Snyk

Instalação:
```bash
npm install --save-dev @snyk/cli

## GitHub CodeQL

Para análise de segurança estática, usamos o GitHub CodeQL.

- Workflow em `.github/workflows/codeql-analysis.yml`.  
- Executa em pushes, PRs na main e semanalmente.  
- Cobre JavaScript/TypeScript sem configuração extra de tokens.
