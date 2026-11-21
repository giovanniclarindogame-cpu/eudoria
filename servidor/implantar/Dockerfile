# Imagem do servidor de partidas. Contexto de construção = raiz do repositório (ver docker-compose.yml).
# Só entram index.html, js/ e servidor/: o servidor roda o jogo sem tela e não precisa de imagens nem de estilos.
FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=8787
WORKDIR /app
COPY servidor/package.json servidor/package.json
RUN cd servidor && npm install --omit=dev --no-audit --no-fund
COPY index.html ./
COPY js ./js
COPY servidor ./servidor
WORKDIR /app/servidor
USER node
EXPOSE 8787
CMD ["node", "servidor.cjs"]
