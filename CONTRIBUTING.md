# CONTRIBUTING.md

Obrigado por considerar contribuir com o OmniCast!  
Este guia descreve nosso fluxo de issues, pull requests, convenções de commit e o que esperamos de uma contribuição.

---

## 1. Abrindo uma Issue

### Tipos de Issue
- **bug** – algo no código que está quebrado.
- **enhancement** – sugestão de melhoria ou nova funcionalidade.

### Como formatar
1. **Título** curto e descritivo (ex.: “Bug: player HLS não inicia em iOS”).
2. **Descrição**:
   - **Reprodução** – passos exatos para chegar no erro.
   - **Resultado esperado** – o que você esperava que acontecesse.
   - **Resultado atual** – o que aconteceu de fato.
   - **Ambiente** – sistema operacional, versão do Node, browser, etc.
3. Adicione a label automática (bug ou enhancement). Após criar, mantenha a issue atualizada com comentários e logs.

---

## 2. Padrão de Commits

Usamos Conventional Commits para gerar changelog automaticamente:

```
<tipo>(escopo?): <descrição curta>

[corpo opcional]

[rodapé opcional]
```

- **tipo**: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`, `ci`
- **escopo**: parte do código afetada (ex.: `router`, `pwa`, `e2e`)
- **rodapé**: referências de issue (#123), breaking changes

Exemplo:
```
feat(router): code-split das rotas IPTV e VOD

BREAKING CHANGE: a rota /iptv agora consome novo JSON de canais
```

---

## 3. Pull Requests

Antes de abrir um PR:

- [ ] Crie uma branch a partir de `main` com nome descritivo (`fix/hls-ios` ou `feat/pwa-notify`).
- [ ] Atualize o changelog (se aplicável) e incrementos de versão em `package.json`.
- [ ] Certifique-se de que `npm run setup` foi executado e que `npm run test:e2e` passa localmente.
- [ ] Rode `npm run lint` (se configurado) e garanta que não há warnings.
- [ ] Verifique se o PR possui:
  - Título claro e link para a issue correspondente.
  - Descrição do que foi feito, por quê e como testar.
  - Checklist preenchido (veja template abaixo).

Após isso, abra o PR e aguarde revisões.

---

## 4. Checklist de PR

Use este checklist no corpo do PR:

- [ ] Meu código segue o padrão de commit (Conventional Commits).
- [ ] Atualizei o changelog (`CHANGELOG.md`), README ou docs quando necessário.
- [ ] Rodei `npm run setup` e todos os testes passam.
- [ ] Documentei qualquer alteração de rota ou contrato de API.
- [ ] CI verde no GitHub Actions (E2E, acessibilidade, lighthouse).

---

## 5. Reviews e Merge

- Rebase com a `main` antes de mergear.
- Squash commits de feature/fix em um único commit coerente.
- Merges só são feitos por mantenedores após aprovação de pelo menos um revisor.

---

## 6. Suporte e Dúvidas

Se precisar de ajuda, acuione no Slack #omnicast ou abra uma issue com a tag `question`.  

Obrigado pela sua contribuição! 🚀
```

```yaml
# .github/ISSUE_TEMPLATE/bug_report.yml
name: "🐛 Bug report"
about: "Abra uma issue para reportar um bug no OmniCast"
title: "Bug: "
labels: ["bug"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        **Descreva o bug de forma clara e concisa.**
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
      description: "Sistema operacional, Node.js, browser e versões"

```

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE/pull_request_template.md -->
# Descrição

Por favor, inclua um resumo do que foi alterado e por quê.

## Checklist

- [ ] Segui o padrão de commits (Conventional Commits).
- [ ] Atualizei o changelog / README / docs conforme necessário.
- [ ] Rodei `npm run setup` e todos os testes passam.
- [ ] CI verde no GitHub Actions (E2E, acessibilidade, performance).
- [ ] Documentei alterações de API ou rota.

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

Adicional: adicione ao `package.json` o script **setup**:

```diff
  "scripts": {
    // …
+   "setup": "npm ci --no-audit --omit=optional && npx playwright install --with-deps",
    "dev": "vite",
    // …
  },
```

Com isso você terá:

- CONTRIBUTING.md detalhando o fluxo de contribuição  
- Issue template para reportar bugs  
- PR template com checklist  
- Script `npm run setup` deixando tudo pronto para rodar testes E2E  

Pronto para seguirmos para o próximo item?