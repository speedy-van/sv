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
pnpm --filter ./apps/web build

# Debug: Check if standalone was created
echo "🔍 Checking standalone output..."
if [ -d "apps/web/.next/standalone" ]; then
  echo "✅ Standalone directory exists"
  ls -la apps/web/.next/standalone/ | head -20
else
  echo "❌ ERROR: Standalone directory NOT created!"
  echo "Listing apps/web/.next/ contents:"
  ls -la apps/web/.next/ || echo "⚠️ .next directory doesn't exist"
  exit 1
fi

# Debug: Check if static files exist
echo "🔍 Checking static files..."
if [ -d "apps/web/.next/static" ]; then
  echo "✅ Static directory exists"
  echo "Static files count:"
  find apps/web/.next/static -type f | wc -l
else
  echo "❌ ERROR: Static directory NOT found!"
  exit 1
fi

# Ensure standalone bundle contains static assets and public files
echo "📦 Copying static assets to standalone bundle..."

# Copy static files
echo "Creating target directory: apps/web/.next/standalone/apps/web/.next/static"
mkdir -p apps/web/.next/standalone/apps/web/.next/static

echo "Copying from: apps/web/.next/static/"
echo "Copying to: apps/web/.next/standalone/apps/web/.next/static/"
cp -Rv apps/web/.next/static/* apps/web/.next/standalone/apps/web/.next/static/ || {
  echo "❌ ERROR: Failed to copy static files!"
  exit 1
}
echo "✅ Static files copied"

# Verify static files were copied
echo "🔍 Verifying static files in standalone..."
STATIC_COUNT=$(find apps/web/.next/standalone/apps/web/.next/static -type f 2>/dev/null | wc -l)
echo "Static files in standalone: $STATIC_COUNT"

if [ "$STATIC_COUNT" -eq 0 ]; then
  echo "❌ ERROR: No static files found in standalone!"
  exit 1
fi

# Copy public directory
echo "📦 Copying public directory..."
if [ -d "apps/web/public" ]; then
  mkdir -p apps/web/.next/standalone/apps/web/public
  cp -Rv apps/web/public/* apps/web/.next/standalone/apps/web/public/ || {
    echo "❌ ERROR: Failed to copy public files!"
    exit 1
  }
  echo "✅ Public files copied"
else
  echo "⚠️ Warning: public directory not found"
fi

# Verify structure
echo "📂 Verifying standalone structure..."
echo "Contents of apps/web/.next/standalone/apps/web/:"
ls -la apps/web/.next/standalone/apps/web/ || echo "⚠️ Warning: Could not list standalone directory"

echo "Contents of apps/web/.next/standalone/apps/web/.next/:"
ls -la apps/web/.next/standalone/apps/web/.next/ || echo "⚠️ Warning: Could not list .next directory"

echo "✅ Build complete!"
