# Branches e Versionamento

Este documento define nossas políticas de branch e a disciplina de versionamento SemVer para garantir releases previsíveis e colaboração organizada.

---

## 1. Políticas de Branches

### 🟢 main (estável)
- Representa sempre o estado pronto para produção  
- CI deve estar verde (build, testes, lint, audit, performance)  
- Releases oficiais são geradas a partir de `main`  
- PRs para `main` exigem revisão, checklist completo e squash merge  

### 🟡 next (release candidate)
- Prepara a próxima versão Minor ou Major  
- Pode conter mudanças ainda não 100% validadas em produção  
- CI deve estar verde, mas testes experimentais podem ser autorizados  
- Publicação opcional como `npm install omnicast@next` ou pre-release GitHub  

### 🔶 feat/*, fix/*, chore/* (branches de contribuição)
- Baseadas em `main` (ou em `next` para experimentos)  
- Nomeação clara:  
  - `feat/pwa-notify`  
  - `fix/hls-ios`  
  - `chore/ci-rollup-patch`  
- Sempre acompanhe o escopo no nome para facilitar a revisão  

---

## 2. Fluxo de Merge

1. Crie branch a partir de `main` ou `next` com nome descritivo  
2. Faça commits seguindo Conventional Commits  
3. Execute localmente `npm run setup` e `npm run test`  
4. Abra PR contra a branch de destino (`main` ou `next`)  
5. Preencha o template de PR e aguarde revisões  
6. Após aprovação:
   - Rebase interativo para limpar histórico  
   - Squash commits em um único commit coerente  
   - Merge e tag automática pela GitHub Action (via `semantic-release`)  

---

## 3. Versionamento SemVer

Adotamos [SemVer 2.0.0](https://semver.org/lang/pt-BR/):

```
MAJOR.MINOR.PATCH
```

- MAJOR: mudanças incompatíveis na API (breaking changes)  
- MINOR: novas funcionalidades compatíveis com versões anteriores  
- PATCH: correções de bugs e ajustes internos  

### Exemplos práticos
- `1.3.1`: ajustes de ambiente, CI, docs, compatibilidade  
- `1.4.0`: introdução de nova funcionalidade (ex.: login biométrico)  
- `2.0.0`: reformulação de contrato de API ou quebra de compatibilidade  

---

## 4. Referências cruzadas

- Veja também [CONTRIBUTING.md](contributing.md) para fluxo de PRs e commits  
- Consulte o [CHANGELOG.md](../CHANGELOG.md) para histórico de versões  
