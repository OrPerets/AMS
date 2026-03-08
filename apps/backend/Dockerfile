FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl wget

WORKDIR /app

COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/

RUN npm ci

COPY . .

WORKDIR /app/apps/backend

RUN npm run build

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs \
  && mkdir -p uploads \
  && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD sh -c 'wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT:-3000}/health" || exit 1'

CMD ["sh", "-c", "npx prisma migrate deploy && PORT=${PORT:-3000} node -r dotenv/config dist/src/main.js"]
