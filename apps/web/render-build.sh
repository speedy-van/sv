#!/bin/bash
set -e

echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Navigate to web app
cd apps/web

# Run Next.js build
echo "🏗️  Building Next.js app..."
pnpm run build

# Copy static files to standalone directory (CRITICAL for Render!)
echo "📁 Copying static files to standalone..."
cp -r .next/static .next/standalone/apps/web/.next/
cp -r public .next/standalone/apps/web/

echo "✅ Build completed successfully!"

