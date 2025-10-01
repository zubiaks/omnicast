## 1. CONTRIBUTING.md

```markdown
# CONTRIBUTING.md

Obrigado por considerar contribuir com o OmniCast!  
Este guia descreve nosso fluxo de issues, pull requests, convenções de commit e o que esperamos de uma contribuição.

---

## 1. Abrindo uma Issue

### Tipos de Issue
- bug – algo no código que está quebrado  
- enhancement – sugestão de melhoria ou nova funcionalidade  

### Como formatar
1. Título curto e descritivo (ex.: “Bug: player HLS não inicia em iOS”)  
2. Descrição:
   - Reprodução – passos exatos para chegar no erro  
   - Resultado esperado – o que você esperava que acontecesse  
   - Resultado atual – o que aconteceu de fato  
   - Ambiente – sistema operacional, versão do Node, browser etc  
3. Adicione a label automática (bug ou enhancement).  
4. Mantenha a issue atualizada com comentários e logs.

---

## 2. Padrão de Commits

Usamos Conventional Commits para gerar changelog automaticamente:

```
<tipo>(escopo?): <descrição curta>

[corpo opcional]

[rodapé opcional]
```

- tipo: feat, fix, chore, docs, style, refactor, test, ci  
- escopo: parte afetada (ex.: router, pwa, e2e)  
- rodapé: referências de issue (#123), BREAKING CHANGE  

Exemplo:

```
feat(router): code-split das rotas IPTV e VOD

BREAKING CHANGE: a rota /iptv agora consome novo JSON de canais
```

---

## 3. Pull Requests

Antes de criar um PR:

- Crie uma branch a partir de `main` com nome descritivo (fix/hls-ios ou feat/pwa-notify)  
- Atualize o changelog (`CHANGELOG.md`) e a versão em `package.json`, se aplicável  
- Execute `npm run setup` e garanta que `npm run test:e2e` passe localmente  
- Rode `npm run lint` e corrija warnings  
- Verifique se o PR inclui:
  - Título claro e link para a issue correspondente  
  - Descrição do que foi feito, por quê e como testar  
  - Checklist preenchido (veja template abaixo)  

Após isso, abra o PR e aguarde revisões.

---

## 4. Checklist de Pull Request

Use este checklist no corpo do PR:

- [ ] Meu código segue o padrão de commit (Conventional Commits)  
- [ ] Atualizei o changelog, README ou docs quando necessário  
- [ ] Rodei `npm run setup` e todos os testes passam  
- [ ] Documentei alterações de rota ou contrato de API  
- [ ] CI verde no GitHub Actions (E2E, acessibilidade, performance)  

---

## 5. Reviews e Merge

- Faça rebase com a `main` antes de mergear  
- Squash commits de feature/fix em um único commit coerente  
- Apenas mantenedores podem mergear após aprovação de ≥1 revisor  

---

## 6. Suporte e Dúvidas

Se precisar de ajuda, acione no Slack `#omnicast` ou abra uma issue com a label `question`.  

Obrigado pela sua contribuição! 🚀
```

---

## 2. Issue Templates

### 2.1 Bug Report (`.github/ISSUE_TEMPLATE/bug_report.yml`)

```yaml
name: "🐛 Bug report"
about: "Abra uma issue para reportar um bug no OmniCast"
title: "Bug: "
labels: ["bug"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Descreva o bug de forma clara e concisa.
  - type: input
    id: steps
    attributes:
      label: "Passos para reproduzir"
      description: "Liste em ordem os passos para reproduzir o bug"
      placeholder: |
        1. Vá para '...'
        2. Clique em '...'
        3. Veja o erro
  - type: input
    id: expected
    attributes:
      label: "Resultado esperado"
      description: "O que esperava que acontecesse?"
  - type: input
    id: actual
    attributes:
      label: "Resultado atual"
      description: "O que aconteceu de fato?"
  - type: input
    id: environment
    attributes:
      label: "Ambiente"
      description: "SO, Node.js, browser e versões"
```

### 2.2 Feature Request (`.github/ISSUE_TEMPLATE/feature_request.yml`)

```yaml
name: "✨ Feature request"
about: "Sugestão de melhoria ou nova funcionalidade"
title: "Feature: "
labels: ["enhancement"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Descreva sua proposta de forma clara e concisa.
  - type: input
    id: motivation
    attributes:
      label: "Motivação"
      description: "Por que isso é importante?"
  - type: input
    id: specification
    attributes:
      label: "Especificação"
      description: "Como você imagina a implementação?"
```

---

## 3. Pull Request Template (`.github/PULL_REQUEST_TEMPLATE/pull_request_template.md`)

```markdown
# Descrição

Por favor, inclua um resumo do que foi alterado e porquê.

## Checklist

- [ ] Segui o padrão de commits (Conventional Commits)  
- [ ] Atualizei o changelog / README / docs conforme necessário  
- [ ] Rodei `npm run setup` e todos os testes passam  
- [ ] CI verde no GitHub Actions (E2E, acessibilidade, performance)  
- [ ] Documentei alterações de API ou rota  

---

## Como testar

1. Checkout desta branch  
2. `npm run setup`  
3. `npm run test:e2e`  
4. Verifique manualmente:
   - Fluxo de navegação  
   - SW/PWA  
   - Acessibilidade  
```

---

## 4. Código de Conduta (`CODE_OF_CONDUCT.md`)

```markdown
# Código de Conduta

Este projeto segue o **Contributor Covenant** para garantir um ambiente acolhedor.

## Nosso Compromisso

Queremos criar um espaço inclusivo e amigável para todos.  
Seja respeitoso, evite linguagem abusiva e tenha empatia pelas diferentes experiências.

## Como Reportar

Se você testemunhar ou for alvo de comportamentos inapropriados, denuncie:
- Abra uma issue com a label `security` ou `question`  
- Envie um e-mail para os mantenedores: maintainers@omnicast.org  

## Aplicação

Mantenedores podem remover comentários e banir participantes que violem essas diretrizes.

Para mais detalhes, leia o texto completo em https://www.contributor-covenant.org/version/2/0/code_of_conduct/
```

---

## 5. Ajuste em `package.json`

```diff
--- a/package.json
+++ b/package.json
@@ scripts
   "scripts": {
+    "setup": "npm ci --no-audit --omit=optional && npx playwright install --with-deps",
     "dev": "vite",
     "build": "vite build",
     "serve:dist": "serve -s dist -l 5500",
     "test:e2e": "playwright test",
     "lint": "eslint .",
     ...
   }
