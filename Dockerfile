# syntax=docker/dockerfile:1.7
# Image de production : Next.js en mode « standalone », utilisateur non root.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Dépendances (mises en cache tant que package-lock.json ne change pas)
FROM base AS dependances
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2. Compilation
FROM base AS compilation
COPY --from=dependances /app/node_modules ./node_modules
COPY . .
# Adresse publique du site : utilisée dans le sitemap et les balises de partage.
ARG SITE_URL=https://example.com
ENV SITE_URL=$SITE_URL
RUN npm run build \
 && npx esbuild scripts/create-admin.ts --bundle --platform=node --format=esm --packages=external --outfile=scripts-dist/create-admin.mjs

# 3. Exécution
FROM base AS execution
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=compilation --chown=app:app /app/.next/standalone ./
COPY --from=compilation --chown=app:app /app/.next/static ./.next/static
COPY --from=compilation --chown=app:app /app/public ./public
COPY --from=compilation --chown=app:app /app/drizzle ./drizzle
COPY --from=compilation --chown=app:app /app/scripts-dist ./scripts
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/sante || exit 1
CMD ["node", "server.js"]
