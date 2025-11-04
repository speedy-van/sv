# 🚀 Production Deployment Guide - Step by Step

## 📋 Pre-Deployment Checklist

Before starting, ensure you have:

1. ✅ Access to Neon Console (https://console.neon.tech/)
2. ✅ Production database credentials
3. ✅ All environment variables ready
4. ✅ Backup of production database

---

## Step 1: Backup Production Database

### Option A: Using Neon Console (Recommended)

1. Go to https://console.neon.tech/
2. Select your **Production** project (ep-dry-glitter-aftvvy9d)
3. Click **"Branches"** or **"Create Branch"**
4. Create a backup branch with a descriptive name (e.g., `backup-before-migration-2025-11-04`)
5. Or use **"Export"** to download a SQL dump

### Option B: Using pg_dump (if available)

```bash
# Set DATABASE_URL to production
export DATABASE_URL="postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Create backup
pg_dump "$DATABASE_URL" > backup_production_$(date +%Y%m%d_%H%M%S).sql
```

**✅ Verify backup was created successfully before proceeding**

---

## Step 2: Update .env.local with Production DATABASE_URL

### Update `.env.local` file:

```env
# Production Database
DATABASE_URL=postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Other required variables
NODE_ENV=production
NEXTAUTH_SECRET=your-production-nextauth-secret
NEXTAUTH_URL=https://speedy-van.co.uk
JWT_SECRET=your-production-jwt-secret

# API Keys (Namespaced)
GROQ_API_KEY_ADMIN=gsk_your_groq_api_key_admin_here
GROQ_API_KEY_CUSTOMER=gsk_your_groq_api_key_customer_here
GROQ_API_KEY_DRIVER=gsk_your_groq_api_key_driver_here
GROQ_API_KEY=gsk_your_groq_api_key_fallback_here

# ... (all other production variables)
```

**⚠️ Important**: After updating `.env.local`, the application will connect to Production database!

---

## Step 3: Verify Prisma Schema

```bash
cd packages/shared
npx prisma validate
```

**Expected output**: `The schema is valid ✅`

---

## Step 4: Check Migration Status

```bash
cd packages/shared

# Set DATABASE_URL environment variable
$env:DATABASE_URL="postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Check migration status
npx prisma migrate status
```

**What to look for**:
- ✅ If all migrations are applied: `Database is up to date!`
- ⚠️ If migrations are pending: List of pending migrations

---

## Step 5: Apply Migrations to Production

```bash
cd packages/shared

# Ensure DATABASE_URL is set to production
$env:DATABASE_URL="postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Apply migrations
npx prisma migrate deploy
```

**Expected output**:
```
Applying migration `20251028_add_career_applications`
Applying migration `20250111_add_message_read_delivered`
...
All migrations have been successfully applied.
```

**⚠️ If you see errors**: Stop immediately and review the error messages.

---

## Step 6: Verify Database Connection

```bash
cd packages/shared

# Set DATABASE_URL
$env:DATABASE_URL="postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Test connection
npx prisma db execute --stdin <<< "SELECT current_database(), current_user;"
```

**Expected output**: Should show database name and user.

---

## Step 7: Build Application

```bash
cd C:\sv

# Generate Prisma client
pnpm --filter @speedy-van/app run prisma:generate

# Build application
pnpm --filter @speedy-van/app build
```

**Expected output**: `Build completed successfully`

**⚠️ If build fails**: Fix errors before proceeding.

---

## Step 8: Start Application (Test Locally First)

```bash
cd C:\sv

# Start application
pnpm --filter @speedy-van/app start
```

**What to check**:
1. ✅ Application starts without errors
2. ✅ Logs show: `🔗 Using database: PRODUCTION`
3. ✅ No connection errors
4. ✅ Test `/api/admin/me` endpoint

---

## Step 9: Verify Production Deployment

### Test API Endpoints

1. **Test Admin Route**:
   ```bash
   curl http://localhost:3000/api/admin/me
   # Or use browser: http://localhost:3000/api/admin/me
   ```

2. **Check Logs**:
   - Look for: `🔗 Using database: PRODUCTION`
   - Look for: `✅ Admin session found`
   - No errors related to database connection

3. **Verify Database Connection**:
   - Check logs for database connection messages
   - Verify no connection errors

---

## Step 10: Deploy to Production Server

After local testing is successful:

1. **Deploy to your hosting platform** (Vercel, Render, etc.)
2. **Set environment variables** in hosting platform
3. **Monitor deployment logs**
4. **Verify production endpoints** after deployment

---

## 🆘 Troubleshooting

### Issue: `Can't reach database server`

**Solution**: 
- Verify DATABASE_URL is correct
- Check network connectivity
- Verify Neon database is accessible

### Issue: Migration fails

**Solution**:
1. Stop immediately
2. Review migration SQL files
3. Check for conflicts
4. Restore from backup if needed

### Issue: Build fails

**Solution**:
1. Check TypeScript errors: `pnpm type-check`
2. Check linting errors: `pnpm lint`
3. Fix errors before rebuilding

---

## ✅ Post-Deployment Checklist

- [ ] Production database backup created
- [ ] `.env.local` updated with production DATABASE_URL
- [ ] Migrations applied successfully
- [ ] Build completed successfully
- [ ] Application starts without errors
- [ ] `/api/admin/me` endpoint works
- [ ] Database connection logs show "PRODUCTION"
- [ ] No errors in logs
- [ ] Production deployment successful

---

## 📞 Support

If you encounter issues:
1. Check logs for detailed error messages
2. Review migration files
3. Verify environment variables
4. Check database connectivity

---

**Last Updated**: November 4, 2025

