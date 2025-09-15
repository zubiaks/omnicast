# Imagem base leve com Nginx
FROM nginx:alpine

# Apaga configuração default do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a nossa configuração otimizada
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copia apenas o frontend para a pasta pública do Nginx
# (evita levar ficheiros de desenvolvimento para a imagem)
COPY frontend/ /usr/share/nginx/html

# Define permissões corretas (opcional, mas recomendado)
RUN chmod -R 755 /usr/share/nginx/html

# Expõe a porta padrão HTTP
EXPOSE 80

# Comando para iniciar o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
