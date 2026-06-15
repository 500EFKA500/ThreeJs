FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV PORT=7000
ENV DATA_DIR=/app/data

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY index.html style.css server.js ./
COPY src ./src
COPY models ./models
COPY textures ./textures

RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 7000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:7000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
