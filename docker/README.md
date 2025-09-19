# Docker

Este diretório contém tudo o que é necessário para construir e rodar a imagem Docker que serve o frontend do OmniCast Dashboard via Nginx.

---

## Estrutura do diretório

- Dockerfile      – build multi-stage com Node e Nginx, inclui HEALTHCHECK  
- nginx.conf      – configuração customizada do Nginx  
- .dockerignore   – na raiz do projeto, para reduzir o contexto de build  

---

## Pré-requisitos

- Docker Engine ≥ 20.10  
- (Opcional) Docker Compose para orquestração  

---

## Construindo a imagem

Na raiz do projeto, execute:

```bash
docker build -f docker/Dockerfile -t omnicast-frontend .
Executando o container
bash
docker run -d \
  --name omnicast-frontend \
  -p 80:80 \
  omnicast-frontend
Acesse http://localhost para visualizar o dashboard.

Healthcheck
O container expõe um endpoint de saúde em /healthz. Para testar:

bash
curl http://localhost/healthz
A resposta esperada é:

Código
OK
O Docker marcará o container como “unhealthy” se esse endpoint não retornar HTTP 200 no tempo definido.

.dockerignore
Na raiz do projeto, crie um arquivo .dockerignore com pelo menos:

Código
frontend/node_modules
frontend/src
dist
.venv
backend/.venv
.git
*.log
Isso impede que arquivos de desenvolvimento sejam enviados ao build e mantém a imagem leve.

(Opcional) Docker Compose
Para subir frontend e backend juntos, crie docker-compose.yml na raiz:

yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    env_file:
      - .env
    ports:
      - "8081:8081"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8081/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy

networks:
  default:
    driver: bridge
Para subir tudo:

bash
docker-compose up --build
Este README cobre os passos básicos para construir, executar e monitorar a imagem Docker do frontend.