# Multi-stage build for AMS Frontend
FROM node:18-alpine AS base

# Install dependencies for building
RUN apk add --no-cache libc6-compat wget

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY tsconfig*.json ./

# Install production dependencies only
RUN npm ci --only=production --frozen-lockfile && npm cache clean --force

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY tsconfig*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Build the application
WORKDIR /app/apps/frontend
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/apps/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/ || exit 1

# Start the application
CMD ["node", "server.js"]
