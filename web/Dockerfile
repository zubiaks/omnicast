# Stage 1: build da aplicação Vite com Node 20 LTS
FROM node:20-alpine AS builder
WORKDIR /app

# Declaração de variáveis de build lidas do docker-compose
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Exporta para o ambiente de build do Vite
ENV VITE_API_URL=https://xmajrjhxegnbnskfrsnp.supabase.co
ENV VITE_SUPABASE_URL=https://xmajrjhxegnbnskfrsnp.supabase.co
ENV VITE_SUPABASE_ANON_KEY=pk.eyJhbGciOiJIUzI1NiI…R2Y4AsSGi9l4R7jj7muiWA_eJTB6o7o

# Instala dependências e gera a pasta dist/
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve os assets estáticos via Nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
