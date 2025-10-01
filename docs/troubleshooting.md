# docs/troubleshooting.md

Este guia reúne os erros mais comuns ao configurar ou executar o OmniCast Streams API e como resolvê-los.

---

## 1. Arquivo `.env` não encontrado

Sintoma:  
```text
Get-Content .\.env : Cannot find path '...\server\.env' because it does not exist.
```

Causa:  
O arquivo `.env` não está na pasta `server/` ou você está em um diretório diferente.

Solução:  
1. Navegue para a pasta do servidor:
   ```powershell
   cd ./omnicast/omnicast/server
   ```
2. Verifique a presença de `.env`:
   ```powershell
   dir
   # deve listar: .env  index.js  metrics.js  Dockerfile …
   ```
3. Se não existir, crie e cole as variáveis:
   ```text
   SUPABASE_URL=…
   SUPABASE_ANON_KEY=…
   SUPABASE_SERVICE_ROLE_KEY=…
   INFLUX_URL=…
   INFLUX_TOKEN=…
   INFLUX_ORG=…
   INFLUX_BUCKET=…
   PORT=5000
   ```

---

## 2. Variáveis de ambiente não carregadas

Sintoma:
```powershell
Write-Host $env:SUPABASE_URL   # sai em branco
```

Causa:  
Você não executou o script para importar o `.env` ou ainda está no diretório errado.

Solução:  
Dentro de `server/`, rode:
```powershell
Get-Content .\.env |
  Where-Object { $_ -and $_ -notmatch '^\s*#' } |
  ForEach-Object {
    $kv = $_ -split '=', 2
    Set-Item -Path Env:\$($kv[0]) -Value $kv[1]
  }
```
Depois confirme com:
```powershell
Write-Host $env:SUPABASE_URL
Write-Host $env:SUPABASE_ANON_KEY
```

---

## 3. Erro “Invalid API key” ao obter o token Supabase

Sintoma:
```json
{"message":"Invalid API key","hint":"Double check your Supabase `anon` or `service_role` API key."}
```

Causa:  
- Copiou a `service_role` em vez da `anon key` (ou vice-versa).  
- `$SUPABASE_URL` está incorreto ou faltando.

Solução:  
1. No dashboard Supabase → **Project Settings > API**, copie:
   - **anon key** (para login na client API)  
   - **Project URL** (ex.: `https://xyz.supabase.co`)  
2. Garanta que no `.env`:
   ```text
   SUPABASE_URL=https://xyz.supabase.co
   SUPABASE_ANON_KEY=<anon key exata>
   ```
3. Reimporte o `.env` no PowerShell e tente novamente obter o token.

---

## 4. Comandos `curl` e PowerShell

Sintoma: erros como:
```text
Invoke-WebRequest : A parameter cannot be found that matches parameter name 'X'.
The term '-H' is not recognized as the name of a cmdlet…
```

Causa:  
O `curl` nativo do PowerShell não aceita as flags do `curl` Linux.

Solução:  
- Use o binário real:
  ```powershell
  curl.exe -X POST "URL" -H "apikey: …" -H "Content-Type: application/json" --data "{…}"
  ```
- Ou use `Invoke-RestMethod`:
  ```powershell
  $resp = Invoke-RestMethod -Uri "$env:SUPABASE_URL/auth/v1/token?grant_type=password" `
    -Method POST -Headers @{ apikey=$env:SUPABASE_ANON_KEY; "Content-Type"="application/json" } `
    -Body (@{ email="…"; password="…" } | ConvertTo-Json)
  ```

---

## 5. Erro “failed to execute bake: read |0: file already closed”

Sintoma:
```text
failed to execute bake: read |0: file already closed
```

Causa:  
Uma incompatibilidade ou bug no BuildKit ao usar `docker compose build --no-cache`.

Solução:  
1. Atualize o Docker Compose para a versão mais recente.  
2. Tente com fallback plain progress:
   ```bash
   DOCKER_BUILDKIT=0 docker compose build streams
   ```
3. Limpe recursos pendentes:
   ```bash
   docker builder prune --all
   ```

---

## 6. Chamada `/streams` sempre retorna 401

Sintoma:
```json
{"error":"Token missing"}
```

Causa:  
Você não enviou o header `Authorization: Bearer <JWT>` ou o token expirou.

Solução:  
1. Garanta que tem o JWT:
   ```powershell
   Write-Host $response.access_token
   ```
2. Faça:
   ```powershell
   curl.exe -H "Authorization: Bearer YOUR_JWT" http://localhost:5000/streams
   ```
3. Se expirou, renove com `/auth/v1/token?grant_type=refresh_token`.

---

## 7. Grafana não conecta ao InfluxDB

Sintoma:  
Falha ao testar Data Source: “connection refused” ou timeout.

Causa:  
- URL incorreta (use `http://influxdb:8086` dentro do Docker Compose).  
- Usuário/senha inválidos.

Solução:  
1. Em Grafana → Data Sources → InfluxDB:
   - URL: `http://influxdb:8086`  
   - Organization: `<INFLUX_ORG>`  
   - Default Bucket: `<INFLUX_BUCKET>`  
   - Basic Auth: user=`omnicast`, password=`<INFLUX_TOKEN>`  
2. Salve e teste.

---

# docs/ci-setup.md

Este documento explica cada workflow, onde encontrar relatórios e dicas de depuração no CI.

---

## 1. Workflow `ci-main.yml`

Local: `.github/workflows/ci-main.yml`

Faz:
- Checkout do código  
- `npm ci --no-audit --omit=optional`  
- `npm run setup` (Playwright browsers)  
- `npm run build`  
- `npx playwright install --with-deps`  
- `npm run test:e2e`  
- Upload de artefatos em `test-results/`

Onde ver:
- Actions > CI on main > Artifacts  
- `test-results/junit/results.xml` (JUnit)  
- `test-results/html-report/index.html` (Playwright)

Depuração:
1. Reproduza localmente:  
   ```bash
   npm ci --no-audit --omit=optional
   npm run setup
   npm run build
   npm run test:e2e
   ```
2. Ative debug:
   ```yaml
   - run: DEBUG=pw:api npm run test:e2e
   ```

---

## 2. Workflow `accessibility.yml`

Local: `.github/workflows/accessibility.yml`

Faz:
- Instala dependências + browsers  
- Executa `tests/accessibility.spec.js`

Onde ver:
- Logs inline com violações de Axe  
- Badge no README

Depuração:
- Rode local:
  ```bash
  npx playwright test tests/accessibility.spec.js --headed --debug
  ```
- Abra `test-results/error-context.md`

---

## 3. Workflow `lighthouse.yml`

Local: `.github/workflows/lighthouse.yml`

Faz:
- Gera relatório de performance via `lhci` ou ação oficial  
- Verifica thresholds de Core Web Vitals e bundle size  
- Upload de JSON/HTML como artefato

Onde ver:
- Badge de Performance no README  
- Artefato JSON/HTML no job

Depuração:
1. Local:
   ```bash
   npx lhci autorun --config=lhci.config.js
   ```
2. Ajuste thresholds em `lighthouse.yml`

---

## 4. Workflow `metrics-smoke.yml` *(novo)*

Local: `.github/workflows/metrics-smoke.yml`

Faz:
- Inicia serviços via Docker Compose (`streams`, `influxdb`)  
- Dispara chamadas de teste a `/` e `/streams`  
- Consulta InfluxDB via Flux API para garantir métricas gravadas  
- Falha se não encontrar pontos `http_request`

Onde ver:
- Logs do job com respostas HTTP  
- Artefato de consulta Flux ou JSON de verificação

Depuração:
- Rode local:
  ```bash
  docker compose up -d streams influxdb
  # depois, use script de smoke tests em local/scripts/smoke-metrics.sh
  ```
- Verifique no InfluxDB Explorer manualmente

---

## 5. Re-execução e debug interativo

- No GitHub Actions, clique em “Re-run jobs”  
- Use o runner local para simular o ambiente CI  
- Para adicionar tempo de debug no container:
  ```yaml
  - run: docker exec -it <container> /bin/sh
  ```

---

## 6. Secrets e variáveis

- Nenhum secret extra é necessário (Flux queries usam token embutido no container)  
- Para adicionar Snyk ou outros scanners, configure em Settings > Secrets
