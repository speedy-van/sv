#!/bin/bash

set -euo pipefail

npm install -g pnpm@10.17.0 --force
pnpm install --frozen-lockfile

# Clear ALL caches to prevent corruption
echo "🧹 Clearing all caches..."
rm -rf apps/web/.next
rm -rf apps/web/node_modules/.cache
rm -rf node_modules/.cache
rm -rf .next
echo "✅ All caches cleared"

# Apply Prisma migrations to production database
echo "🔄 Applying Prisma migrations..."
pnpm prisma migrate deploy --schema=./packages/shared/prisma/schema.prisma
echo "✅ Migrations applied"

# Build the application
echo "🔨 Building Next.js application..."
pnpm --filter ./apps/web build

# Verify build succeeded
if [ -d "apps/web/.next" ]; then
  echo "✅ Build directory created"
  echo "Build size:"
  du -sh apps/web/.next
else
  echo "❌ ERROR: Build failed - .next directory not found!"
  exit 1
fi

echo "✅ Build complete!"
