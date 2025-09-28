# docs/troubleshooting.md

Este guia reúne os erros mais comuns que podem ocorrer ao configurar ou executar o OmniCast, e como solucioná-los.

---

## 1. Erro “Invalid package.json: Unexpected token”

Sintoma:  
```text
npm ERR! JSON.parse Invalid package.json: JSONParseError: Unexpected token '/' ...
```

Causa:  
Seu `package.json` continha comentários, chaves extras ou JSONC. O npm aceita somente JSON puro.

Solução:  
1. Remova todos os comentários (`// …`) e chaves fora de aspas.  
2. Valide o JSON em https://jsonlint.com.  
3. Confirme rodando `npm install` sem erros.

---

## 2. Dependências faltando ou optional deps

Sintoma: ao rodar Playwright ou Vite, erros de módulo não encontrado.

Causa: optionalDependencies foram omitidas ou o cache do npm está corrompido.

Solução:  
```bash
npm ci --no-audit --omit=optional
npm run setup
```
O `npm run setup` garante que as optionalDeps e browsers do Playwright sejam instalados.

---

## 3. SPA-fallback não funciona

Sintoma: navegando em `/iptv` ou `/vod` o servidor retorna 404 ou uma página vazia.

Causa: uso de `http-server dist` em vez de `serve -s dist`.

Solução:  
- No `package.json`, garanta:
  ```json
  "serve:dist": "serve -s dist -l 5500"
  ```
- Reinstale: `npm install serve --save-dev`.  
- Rode: `npm run build && npm run serve:dist`.

---

## 4. Playwright “NS_ERROR_NET_EMPTY_RESPONSE”

Sintoma:  
```text
Error: page.goto: NS_ERROR_NET_EMPTY_RESPONSE
```

Causa: o servidor não respondeu dentro do timeout ou não serviu o SPA-fallback.

Solução:  
1. Confirme que `npm run build && npm run serve:dist` subiu na porta 5500.  
2. Ajuste o timeout em `playwright.config.js`:
   ```js
   webServer: { timeout: 120_000, … }
   ```
3. Rode localmente `npm run serve:dist` e abra `http://localhost:5500/iptv` no browser para confirmar.

---

## 5. Violações de Axe (“document-title”, “html-has-lang”)

Sintoma: testes de acessibilidade acusam falta de `<title>` ou `lang`.

Causa: página servida sem HTML da aplicação (arquivo vazio ou 404).

Solução:  
- Certifique-se de usar `serve -s dist` (SPA-fallback).  
- No seu `index.html`, inclua:
  ```html
  <html lang="pt">
    <head>
      <title>OmniCast – Streaming Demo</title>
      …
    </head>
  ```
- Rebuild e reteste.

---

## 6. Erros de CI no GitHub Actions

Sintoma: falhas em jobs de CI: e2e, accessibility ou lighthouse.

Causa: falta de cache ou comandos fora de ordem.

Solução geral:
1. No job, sempre rode:
   ```yaml
   - run: npm ci --no-audit --omit=optional
   - run: npm run setup
   ```
2. Para Playwright:  
   ```yaml
   - run: npm run build
   - run: npm run serve:dist
   - run: npx playwright install --with-deps
   - run: npm run test:e2e
   ```
3. Para Lighthouse:  
   - Confirme thresholds no `lighthouse.yml`.  
   - Use `lhci autorun` ou ação oficial “lighthouse-action”.

---

## 7. Outros problemas

- **Porta já em uso**: ajuste porta em `serve:dist` ou mate o processo.  
- **Import dinâmico falha**: verifique `build.rollupOptions.output.manualChunks` no Vite.  
- **SW não atualiza**: limpe cache do Service Worker no DevTools > Application > Clear storage.



---

# docs/ci-setup.md

Este documento explica o que cada workflow faz, onde encontrar relatórios e como depurar falhas no CI.

---

## 1. Workflow `ci-main.yml`

Localização: `.github/workflows/ci-main.yml`

O que faz:
- Checkout do código
- Instalação de dependências (`npm ci --no-audit --omit=optional`)
- Build de produção (`npm run build`)
- Instalação de navegadores (`npx playwright install --with-deps`)
- Execução de testes E2E (`npm run test:e2e`)
- Upload de artefatos (`test-results/`) para análise

Onde ver:
- Acesse Actions > CI on main > Job e clique em **Artifacts**  
- Relatórios JUnit em `test-results/junit/results.xml`  
- Relatório HTML em `html-report/index.html` (faça download e abra localmente)

Como depurar:
1. Reproduza localmente os passos do job.  
2. Compare versões de Node e dependências.  
3. Adicione `--debug` ao Playwright:  
   ```yaml
   - run: DEBUG=pw:api npm run test:e2e
   ```

---

## 2. Workflow `accessibility.yml`

Localização: `.github/workflows/accessibility.yml`

O que faz:
- Instala dependências e browsers
- Executa apenas os testes de acessibilidade (`tests/accessibility.spec.js`)

Onde ver:
- Logs inline mostram falhas de Axe  
- Badges no README apontam para status

Como depurar:
- Use `npx playwright test tests/accessibility.spec.js --headed --debug`  
- Abra `error-context.md` em `test-results` para ver HTML capturado

---

## 3. Workflow `lighthouse.yml`

Localização: `.github/workflows/lighthouse.yml`

O que faz:
- Usa ação de Lighthouse ou `lhci` para gerar relatório de performance  
- Avalia Core Web Vitals e bundle size  
- Falha se thresholds não forem atendidos

Onde ver:
- Badge de Performance no README  
- Artefato JSON ou HTML gerado pelo workflow

Como depurar:
- Rode localmente:
  ```bash
  npx lhci autorun --config=lhci.config.js
  ```
- Ajuste thresholds em `lighthouse.yml` ou `lhci.config.js`

---

## 4. Re-execução de jobs

- No GitHub Actions, abra o job e clique em **Re-run jobs**  
- Para debug interativo, use o [GitHub Runner local](https://github.com/actions/runner)

---

## 5. Secrets e configurações

- Não há secrets necessários para estes workflows  
- Caso queira adicionar token de scan de vulnerabilidades (Snyk), configure em Settings > Secrets

---

Com estes documentos você terá tudo registrado para resolver problemas comuns e entender o fluxo de CI end-to-end.  

```