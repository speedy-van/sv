# 🔒 Environment Separation Guide - Speedy Van

## Overview

This guide explains how to properly separate development and production environments to ensure the safety and stability of your production database.

---

## 🎯 Goal

**Prevent any development or testing operations from affecting the production database and live customer data.**

---

## 📋 Step-by-Step Setup

### Step 1: Create Development Database on Neon

1. **Login to Neon Console**: https://console.neon.tech/
2. **Create a new database** named `speedyvan-dev`
3. **Copy the connection string** (it will look like this):
   ```
   postgresql://[username]:[password]@[host].neon.tech/speedyvan-dev?sslmode=require&channel_binding=require
   ```

### Step 2: Update Your `.env.local` File

**IMPORTANT**: You cannot see `.env.local` in the project for security reasons, but it exists.

Update **only the `DATABASE_URL` line** in your existing `.env.local`:

```bash
# Replace the DATABASE_URL with your NEW development database:
DATABASE_URL=postgresql://[DEV_USERNAME]:[DEV_PASSWORD]@[DEV_HOST].neon.tech/speedyvan-dev?sslmode=require&channel_binding=require

# Add these protection flags:
ENVIRONMENT_MODE=development
ALLOW_MIGRATIONS=true
ALLOW_DATA_SEEDING=true
NODE_ENV=development
```

**Keep all other variables** (Stripe keys, API keys, etc.) as they are.

### Step 3: Update `.env.production` (Already Done)

The production environment file is already configured with:
- Production database URL
- Production Stripe live keys
- Production service endpoints
- `NODE_ENV=production`
- `ENVIRONMENT_MODE=production`

**DO NOT modify this file unless deploying production changes.**

### Step 4: Copy Schema to Development Database

Run these commands to set up your development database:

```bash
# Generate Prisma client
pnpm run prisma:generate

# Push schema to development database
cd packages/shared
npx prisma db push

# (Optional) Seed test data
npx prisma db seed
```

---

## 🛡️ Built-in Protection Features

### 1. **Database Protection System**

Location: `packages/shared/src/database/db-protection.ts`

This module automatically:
- ✅ Detects if you're using a production database in development
- ✅ Blocks the application from starting if there's a mismatch
- ✅ Logs all destructive operations in production
- ✅ Prevents accidental data seeding in production

### 2. **Protected Prisma Client**

Location: `packages/shared/src/database/index-protected.ts`

Use this instead of the regular Prisma client:

```typescript
// ❌ OLD (unsafe)
import { prisma } from '@/lib/prisma';

// ✅ NEW (protected)
import { prisma } from '@/packages/shared/src/database/index-protected';
```

This client automatically validates your environment on import.

### 3. **Environment Validation on Startup**

The app will **crash on startup** with a clear error message if:
- Development environment tries to connect to production database
- Production database URL is detected in `.env.local`
- Environment variables are misconfigured

Example error message:
```
╔════════════════════════════════════════════════════════════════╗
║                   🚨 DATABASE PROTECTION 🚨                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  CRITICAL ERROR: Production database detected in              ║
║  non-production environment!                                  ║
║                                                                ║
║  Current Environment: development                             ║
║  Database: PRODUCTION                                         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 📁 Environment Files Structure

```
speedy-van/
├── .env.local              # Your local development (git-ignored, NOT visible)
├── .env.development        # Template for development (committed)
├── .env.production         # Production configuration (committed)
└── env.example             # Example template (committed)
```

### File Purposes:

| File | Purpose | Git Status |
|------|---------|------------|
| `.env.local` | Your personal local environment | ❌ Ignored (never commit) |
| `.env.development` | Development template with placeholders | ✅ Committed |
| `.env.production` | Production configuration | ✅ Committed |
| `env.example` | Template for new developers | ✅ Committed |

---

## 🚀 Running Different Environments

### Development (Local)

```bash
# Uses .env.local automatically
pnpm run dev
```

### Production (Deployed)

```bash
# Uses .env.production
NODE_ENV=production pnpm run build
NODE_ENV=production pnpm start
```

---

## ⚙️ Database Operations

### Development Database

✅ **Allowed Operations:**
- Migrations: `npx prisma migrate dev`
- Schema push: `npx prisma db push`
- Data seeding: `npx prisma db seed`
- Direct SQL queries
- Testing destructive operations
- Full data resets

### Production Database

⚠️ **Restricted Operations:**
- Migrations: Only via approved deployment process
- Schema changes: Requires manual approval
- Data seeding: **BLOCKED**
- Direct SQL: Only with explicit authorization
- Destructive operations: Logged and monitored

---

## 🔍 Verification Commands

Check your current environment:

```bash
# Show current database connection
echo $DATABASE_URL

# Test database connection
cd packages/shared
npx prisma db execute --stdin <<< "SELECT current_database();"

# Verify environment mode
echo $ENVIRONMENT_MODE
```

---

## 🛠️ Prisma Commands by Environment

### Development

```bash
# Generate Prisma client
pnpm run prisma:generate

# Create a new migration
cd packages/shared
npx prisma migrate dev --name your_migration_name

# Push schema without migration (quick development)
npx prisma db push

# Seed development data
npx prisma db seed

# Open Prisma Studio (visual database editor)
npx prisma studio
```

### Production

```bash
# Deploy migrations (only in production environment)
cd packages/shared
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

---

## 📊 Environment Variables Checklist

### Development (`.env.local`)

- [ ] `DATABASE_URL` points to **development database**
- [ ] `NODE_ENV=development`
- [ ] `ENVIRONMENT_MODE=development`
- [ ] `ALLOW_MIGRATIONS=true`
- [ ] `ALLOW_DATA_SEEDING=true`
- [ ] Stripe **test** keys (`sk_test_...`, `pk_test_...`)
- [ ] `NEXT_PUBLIC_API_URL=http://localhost:3000`

### Production (`.env.production`)

- [ ] `DATABASE_URL` points to **production database**
- [ ] `NODE_ENV=production`
- [ ] `ENVIRONMENT_MODE=production`
- [ ] `ALLOW_MIGRATIONS=false` (or not set)
- [ ] `ALLOW_DATA_SEEDING=false` (or not set)
- [ ] Stripe **live** keys (`sk_live_...`, `pk_live_...`)
- [ ] `NEXT_PUBLIC_API_URL=https://api.speedy-van.co.uk`

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't:

1. Copy production `DATABASE_URL` to `.env.local`
2. Run `prisma db push` in production without testing
3. Seed production database with test data
4. Delete production `.env` files from git
5. Share `.env.local` files (they're personal)
6. Use production API keys in development

### ✅ Do:

1. Always use development database for local work
2. Test migrations in development first
3. Keep `.env.local` secret and personal
4. Commit `.env.production` and `.env.development` templates
5. Use test Stripe keys in development
6. Review database changes before production deployment

---

## 🔐 Security Best Practices

### 1. Database Access

```bash
# Development: Full access
# Production: Read-only for most operations
# Write operations: Only through approved APIs
```

### 2. API Keys

```bash
# Keep separate keys for each environment:
Development:  sk_test_***, pk_test_***
Production:   sk_live_***, pk_live_***
```

### 3. Backups

```bash
# Production database: Automatic daily backups via Neon
# Development database: Manual backups as needed
```

---

## 🧪 Testing the Protection System

Run this test to verify protection is working:

```bash
# 1. Temporarily set production DATABASE_URL in .env.local
DATABASE_URL=postgresql://neondb_owner:...@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?...

# 2. Try to start the app
pnpm run dev

# Expected result: App should crash with protection error ✅
# If app starts: Protection is NOT working ❌
```

---

## 📞 Need Help?

If you encounter issues:

1. **Check environment variables**: `printenv | grep DATABASE`
2. **Verify Prisma connection**: `cd packages/shared && npx prisma db execute --stdin <<< "SELECT 1"`
3. **Check protection status**: Import and log `getEnvironmentInfo()` from `db-protection.ts`
4. **Review logs**: Look for "🔒 Database Environment Check" messages

---

## 📝 Migration Workflow

### Development → Production

1. **Development**:
   ```bash
   # Create and test migration locally
   npx prisma migrate dev --name add_new_feature
   # Test thoroughly in development database
   ```

2. **Staging** (Optional):
   ```bash
   # Deploy to staging environment first
   npx prisma migrate deploy
   # Test in staging environment
   ```

3. **Production**:
   ```bash
   # Only after thorough testing
   # Set NODE_ENV=production
   # Run migration
   npx prisma migrate deploy
   ```

---

## 🎓 Summary

✅ **Development Database**: `speedyvan-dev` - Safe for testing and experiments
✅ **Production Database**: `neondb` - Protected from accidental changes
✅ **Protection System**: Automatically validates environment and blocks unsafe operations
✅ **Prisma Migrations**: Only allowed in appropriate environments
✅ **Data Seeding**: Blocked in production

**The protection system ensures that even if you make a mistake, the production database remains safe.**

---

## 📅 Maintenance Tasks

### Weekly

- [ ] Review production database performance
- [ ] Check for pending migrations
- [ ] Monitor database size and usage

### Monthly

- [ ] Verify backup integrity
- [ ] Review access logs
- [ ] Update development database schema if needed
- [ ] Clean up old test data in development

---

## 🔄 Quick Reference

```bash
# Check current environment
echo $NODE_ENV $ENVIRONMENT_MODE

# Switch to development
export NODE_ENV=development
export ENVIRONMENT_MODE=development

# Switch to production (careful!)
export NODE_ENV=production
export ENVIRONMENT_MODE=production

# Verify database connection
cd packages/shared
npx prisma db execute --stdin <<< "SELECT current_database(), current_user;"
```

---

**Last Updated**: October 18, 2025
**Version**: 1.0.0
**Author**: Speedy Van Development Team

