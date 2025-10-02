## ✅ `docs/environment.md` — versão final `1.3.1`

```markdown
# 🌱 Ambiente de desenvolvimento

Este documento descreve os requisitos mínimos, configuração local e cuidados para garantir um ambiente reprodutível e compatível com o OmniCast.

---

## ✅ Requisitos mínimos

- Node.js `>=20.19.0 <21` (necessário para Vite 7+ e Rollup nativo)
- npm `>=10.x` (compatível com Node 20)
- Git `>=2.30`
- Navegador moderno (Chrome, Firefox, Safari)
- Sistema operacional: Windows 10+, macOS 12+, Linux com suporte a Playwright

---

## 📦 Instalação defensiva

Use o script `setup` para instalar dependências e navegadores do Playwright:

```bash
npm run setup
```

Esse comando executa:

```bash
npm install --no-audit --omit=optional
npx playwright install --with-deps
```

---

## 🔐 Configuração do `.env`

Crie um arquivo `.env` na raiz com:

```env
SUPABASE_URL=https://<teu-projeto>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

TEST_USER_EMAIL=teu@email.com
TEST_USER_PASSWORD=senha123
```

### Cuidados:
- Não usar aspas curvas ou reticências
- Evitar copiar de Slack, Word ou Notion
- Validar que os valores são reais e funcionam no Supabase

---

## 🧪 Testes locais

Após configurar o `.env`, execute:

```bash
npm run test:rls
npm run test:e2e
```

Para visualizar os resultados:

```bash
npm run test:e2e:report
```

---

## 🧰 Troubleshooting

### Erro: `ByteString` ou falha de login
- Verifique se o `.env` contém caracteres invisíveis
- Use VS Code ou Notepad para editar
- Remova espaços extras e quebras de linha no final

### Erro: `@rollup/rollup-win32-x64-msvc` ausente
- Execute:
  ```bash
  npm install --include=optional
  ```
- Ou aplique patch manual:
  ```bash
  npm install @rollup/rollup-linux-x64-gnu --no-save
  ```

### Erro: `vite requires Node >=20.19.0`
- Atualize o Node via `nvm`:
  ```bash
  nvm install 20.19.0
  nvm use 20.19.0
  ```

---

## 🧪 CI e compatibilidade

O CI valida automaticamente:

- Versões `16.x`, `18.x`, `20.19.0` via matrix
- Alinhamento com `.nvmrc`
- Segurança (`npm audit`)
- Build e testes E2E

---

## 📚 Referências

- [`CONTRIBUTING.md`](./contributing.md)
- [`docs/troubleshooting.md`](./troubleshooting.md)
- [`docs/security.md`](./security.md)
