# ⚡ Quick Production Deployment Guide

## 🚀 Fast Deployment (Using Script)

### Option 1: Using PowerShell Script (Recommended)

```powershell
# Run the deployment script
.\deploy-production.ps1
```

The script will:
1. ✅ Check environment variables
2. ✅ Verify Prisma schema
3. ✅ Check migration status
4. ✅ Apply migrations (with confirmation)
5. ✅ Verify database connection
6. ✅ Generate Prisma client
7. ✅ Build application

---

## 🚀 Manual Deployment (Step by Step)

### Step 1: Backup Production Database

**⚠️ IMPORTANT: Do this first!**

1. Go to https://console.neon.tech/
2. Select your Production project
3. Click **"Create Branch"** or **"Export"** to create a backup

---

### Step 2: Update .env.local

Update `.env.local` with production DATABASE_URL:

```env
DATABASE_URL=postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

### Step 3: Apply Migrations

```powershell
# Navigate to packages/shared
cd packages\shared

# Set DATABASE_URL environment variable
$env:DATABASE_URL="postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Check migration status
npx prisma migrate status

# Apply migrations (if pending)
npx prisma migrate deploy
```

---

### Step 4: Build and Deploy

```powershell
# Go back to root
cd ..\..

# Generate Prisma client
pnpm --filter @speedy-van/app run prisma:generate

# Build application
pnpm --filter @speedy-van/app build

# Start application (test locally first)
pnpm --filter @speedy-van/app start
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Build completed successfully
- [ ] Application starts without errors
- [ ] Logs show: `🔗 Using database: PRODUCTION`
- [ ] `/api/admin/me` endpoint works
- [ ] No database connection errors
- [ ] All migrations applied successfully

---

## 🆘 Troubleshooting

### Issue: "Can't reach database server"

**Solution**: 
- Verify DATABASE_URL is correct
- Check if Neon database is accessible
- Verify network connectivity

### Issue: "Migration failed"

**Solution**:
1. Stop immediately
2. Review migration SQL files
3. Check for conflicts
4. Restore from backup if needed

### Issue: "Build failed"

**Solution**:
1. Check TypeScript errors: `pnpm type-check`
2. Check linting errors: `pnpm lint`
3. Fix errors before rebuilding

---

## 📞 Quick Commands Reference

```powershell
# Set production DATABASE_URL
$env:DATABASE_URL="postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Check migration status
cd packages\shared
npx prisma migrate status

# Apply migrations
npx prisma migrate deploy

# Build application
cd ..\..
pnpm --filter @speedy-van/app build

# Start application
pnpm --filter @speedy-van/app start
```

---

**⚠️ Important**: Always backup production database before applying migrations!

