# CONTRIBUTING.md

Obrigado por considerar contribuir com o OmniCast!  
Antes de tudo, leia nosso [Código de Conduta](CODE_OF_CONDUCT.md).

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

- **tipo**: feat, fix, chore, docs, style, refactor, test, ci  
- **escopo**: parte afetada (ex.: router, pwa, e2e)  
- **rodapé**: referências de issue (#123), BREAKING CHANGE  

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
  - Checklist preenchido (veja seção abaixo)  

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
