#!/bin/bash
set -e

echo "🚀 Running Prisma migrations on production..."

# Navigate to shared package
cd packages/shared

# Run Prisma migrations
echo "📦 Deploying migrations..."
npx prisma migrate deploy

# Generate Prisma Client
echo "🔄 Regenerating Prisma Client..."
npx prisma generate

echo "✅ Migrations completed successfully!"

