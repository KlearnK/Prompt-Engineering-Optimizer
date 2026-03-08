# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install all dependencies (including devDeps needed for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend (Vite) + backend (esbuild)
RUN pnpm build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Install pnpm for production deps
RUN npm install -g pnpm

# Copy package files and install production deps only
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/public ./client/dist

# Copy drizzle migrations (needed for db:push at startup)
COPY --from=builder /app/drizzle ./drizzle
COPY drizzle.config.ts ./drizzle.config.ts

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/api/health 2>/dev/null || exit 1

# Expose default port
EXPOSE 3000

# Start production server
CMD ["node", "dist/index.js"]
