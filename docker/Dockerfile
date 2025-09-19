# docker/Dockerfile

# Stage 1: build da UI (contexto = raiz do projeto)
FROM node:20-alpine AS ui-build
WORKDIR /app

# 1. Copia package files da raiz
COPY package.json package-lock.json ./

# 2. Instala dependências
RUN npm ci

# 3. Copia todo o código (inclui frontend/)
COPY . ./

# 4. Gera o bundle estático em /app/dist
RUN npm run build

# Stage 2: runtime Nginx
FROM nginx:alpine
# Remove a configuração default
RUN rm /etc/nginx/conf.d/default.conf

# Usa a tua configuração customizada
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copia apenas os estáticos gerados
COPY --from=ui-build /app/dist/ /usr/share/nginx/html/

# Permissões e porta
RUN chmod -R 755 /usr/share/nginx/html
EXPOSE 80

# Healthcheck para orquestradores
HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -f http://localhost/healthz || exit 1

# Inicia o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
