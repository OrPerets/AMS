# Multi-stage build for AMS Backend
FROM node:18-alpine AS base

# Install dependencies for building
RUN apk add --no-cache libc6-compat openssl wget

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY tsconfig*.json ./

# Install production dependencies only
RUN npm ci --only=production --frozen-lockfile && npm cache clean --force

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY tsconfig*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build the application
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application and dependencies
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/apps/backend/prisma ./prisma
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Create necessary directories
RUN mkdir -p uploads && chown nestjs:nodejs uploads

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE $PORT

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/health || exit 1

# Start the application
CMD ["node", "-r", "dotenv/config", "dist/src/main.js"]
