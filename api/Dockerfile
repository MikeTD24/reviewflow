# L'étape de compilation garde TypeScript et les outils de développement hors de l'image finale.
FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY api/package.json api/tsconfig.json ./api/
COPY extension/package.json ./extension/package.json

RUN npm ci --workspace api --include-workspace-root

COPY api/src ./api/src

RUN npm run build --workspace api

# L'API s'exécute avec un utilisateur non privilégié et uniquement ses dépendances de production.
FROM node:24-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY package.json package-lock.json ./
COPY api/package.json ./api/package.json
COPY extension/package.json ./extension/package.json

RUN npm ci --omit=dev --workspace api && npm cache clean --force

COPY --from=build --chown=node:node /app/api/dist ./api/dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(response => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["node", "api/dist/src/index.js"]
