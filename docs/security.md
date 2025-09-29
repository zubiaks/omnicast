```markdown
# Segurança

Este documento descreve como o OmniCast protege seu código, dependências e detecta vulnerabilidades.

---

## Dependabot

Atualizações automáticas de dependências e alertas de vulnerabilidades via Dependabot.

- Arquivo de configuração: `.github/dependabot.yml`  
- Atualizações de versão e de segurança rodando semanalmente  
- Recebimento de PRs automáticos para corrigir dependências vulneráveis  

Exemplo de `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## npm audit

Verificação de vulnerabilidades de runtime no pipeline de CI.

- Step no GitHub Actions:

  ```yaml
  - name: npm audit
    run: npm audit --audit-level=critical
  ```

- Se existirem vulnerabilidades críticas, o CI falha  

---

## Snyk

Scanner complementar que encontra vulnerabilidades em dependências e sugere correções.

### Instalação local

```bash
npm install --save-dev @snyk/cli
```

### Configuração de token

1. Gere um token em https://app.snyk.io/account  
2. Adicione um segredo no repositório em **Settings → Secrets and variables → Actions**  
   - Nome: `SNYK_TOKEN`  
   - Valor: token copiado da sua conta Snyk  

### Exemplo de step no CI

```yaml
- name: Snyk test
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  run: npx snyk test --severity-threshold=high
```

---

## GitHub CodeQL

Análise estática de código em busca de vulnerabilidades e más práticas.

### Requisitos

- Repositório **público** ou com **GitHub Advanced Security** habilitado  
- Permissões no workflow:

  ```yaml
  permissions:
    contents: read
    checks: write
    security-events: write
  ```
- Token: `${{ secrets.GITHUB_TOKEN }}` (gerado automaticamente)  

### Workflow

Localização: `.github/workflows/codeql-analysis.yml`

Gatilhos:

- `push` na `main`  
- `pull_request` na `main`  
- Cron semanal (`'0 0 * * 0'`)  

Principais steps:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    token: ${{ secrets.GITHUB_TOKEN }}

- uses: github/codeql-action/init@v3
  with:
    languages: javascript

- uses: github/codeql-action/autobuild@v3

- uses: github/codeql-action/analyze@v3
```

Se o repositório for privado e não tiver Advanced Security, o upload SARIF falhará com 422. Neste caso você pode:

- Tornar o repositório público  
- Executar o CodeQL localmente:

  ```bash
  gh repo clone zubiaks/omnicast
  cd omnicast
  gh codeql analyze \
    --language javascript \
    --output results.sarif
  ```

---

## Resumo das proteções

- Dependabot: atualização automática de dependências e alertas  
- npm audit: falha no CI para vulnerabilidades críticas  
- Snyk: análise complementar com relatórios e PRs de correção  
- CodeQL: varredura estática de código (via GitHub Actions ou CLI)