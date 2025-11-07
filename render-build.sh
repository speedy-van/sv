#!/bin/bash

set -euo pipefail

npm install -g pnpm@10.17.0 --force
pnpm install --frozen-lockfile

# Apply Prisma migrations to production database
echo "🔄 Applying Prisma migrations..."
pnpm prisma migrate deploy --schema=./packages/shared/prisma/schema.prisma
echo "✅ Migrations applied"

# Build the application
pnpm --filter ./apps/web build

# Ensure standalone bundle contains static assets and public files
echo "📦 Copying static assets to standalone bundle..."

# Copy static files
mkdir -p apps/web/.next/standalone/apps/web/.next/static
cp -R apps/web/.next/static/. apps/web/.next/standalone/apps/web/.next/static/
echo "✅ Static files copied"

# Copy public directory
mkdir -p apps/web/.next/standalone/apps/web/public
cp -R apps/web/public/. apps/web/.next/standalone/apps/web/public/
echo "✅ Public files copied"

# Verify structure
echo "📂 Verifying standalone structure..."
ls -la apps/web/.next/standalone/apps/web/ || echo "⚠️ Warning: Could not list standalone directory"
echo "✅ Build complete!"

