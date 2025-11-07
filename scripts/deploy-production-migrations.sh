#!/bin/bash

# Script to deploy Prisma migrations to production database
# Run this ONLY when connected to production database

set -euo pipefail

echo "🚨 WARNING: This will apply migrations to PRODUCTION database!"
echo "📊 Current migrations to be applied:"
echo ""

# Show pending migrations
npx prisma migrate status --schema=./packages/shared/prisma/schema.prisma

echo ""
read -p "⚠️  Are you sure you want to continue? (type 'yes' to proceed): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Migration cancelled"
  exit 1
fi

echo "🚀 Applying migrations to production..."
npx prisma migrate deploy --schema=./packages/shared/prisma/schema.prisma

echo "✅ Migrations applied successfully!"
echo "🔄 Generating Prisma Client..."
npx prisma generate --schema=./packages/shared/prisma/schema.prisma

echo "✅ Production database is up to date!"

