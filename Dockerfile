# Multi-stage Dockerfile for Speedy Van unified application
FROM node:20.18.0-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.17.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY turbo.json ./

# Copy package.json files for all packages and the unified app
COPY packages/*/package.json ./packages/*/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm run prisma:generate

# Build stage
FROM base AS builder

# Build all packages and the unified app
RUN pnpm run build

# Production stage for unified web app
FROM node:20.18.0-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port 3000 for the unified application
EXPOSE 3000

# Start the unified application
CMD ["pnpm", "start", "--filter=@speedy-van/app"]

