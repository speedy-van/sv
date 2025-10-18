# ⚡ Quick Setup: Database Separation

## 🎯 What You Need to Do Manually

### Step 1: Create Development Database on Neon

1. Go to: https://console.neon.tech/
2. Click "New Project" or use existing project
3. Create a new database named: `speedyvan-dev`
4. Copy the connection string

Example connection string:
```
postgresql://[username]:[password]@[host].neon.tech/speedyvan-dev?sslmode=require&channel_binding=require
```

### Step 2: Update Your `.env.local`

Your `.env.local` file exists but is hidden for security. Update it with:

```bash
# Replace ONLY this line with your NEW development database:
DATABASE_URL=postgresql://[DEV_USER]:[DEV_PASS]@[DEV_HOST].neon.tech/speedyvan-dev?sslmode=require&channel_binding=require

# Add these lines if they don't exist:
ENVIRONMENT_MODE=development
ALLOW_MIGRATIONS=true
ALLOW_DATA_SEEDING=true
NODE_ENV=development

# Use Stripe TEST keys (get from Stripe Dashboard → Developers → API Keys → Test mode)
STRIPE_SECRET_KEY=sk_test_[YOUR_STRIPE_TEST_SECRET_KEY]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[YOUR_STRIPE_TEST_PUBLISHABLE_KEY]

# Keep all other variables as they are
```

### Step 3: Copy Schema to Development Database

```bash
# Generate Prisma client
pnpm run prisma:generate

# Push schema to your new development database
cd packages/shared
npx prisma db push

# Verify connection
npx prisma studio
```

### Step 4: Verify Protection is Working

```bash
# Start your app
pnpm run dev

# You should see this message:
# 🔒 Database Environment Check:
#    Environment: DEVELOPMENT
#    Database: DEVELOPMENT
#    Status: ✅ VALID
```

---

## ✅ What Was Done Automatically

1. ✅ Created `.env.development` template
2. ✅ Updated `.env.production` format (no changes to values)
3. ✅ Created database protection system (`db-protection.ts`)
4. ✅ Created protected Prisma client (`index-protected.ts`)
5. ✅ Created comprehensive documentation

---

## 🚨 Important Notes

### Production Database Protection

The system will **automatically block** the app if:
- You try to use production database in development
- Environment variables are misconfigured
- There's a mismatch between environment and database

### What's Protected

| Environment | Migrations | Seeding | Direct SQL | Destructive Ops |
|-------------|-----------|---------|------------|-----------------|
| Development | ✅ Allowed | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Production  | ⚠️ Restricted | ❌ Blocked | ⚠️ Logged | ⚠️ Logged |

---

## 🧪 Test the Protection

To verify protection is working:

1. Temporarily set production DATABASE_URL in `.env.local`
2. Try to start the app: `pnpm run dev`
3. **Expected**: App should crash with a protection error
4. **Restore**: Change back to development DATABASE_URL

---

## 📞 Common Issues

### Issue: "PRODUCTION_DATABASE_ACCESS_BLOCKED"

**Solution**: Check your `.env.local` - you're using production DATABASE_URL

```bash
# Make sure your .env.local has:
DATABASE_URL=postgresql://...speedyvan-dev...  # NOT neondb
ENVIRONMENT_MODE=development                   # NOT production
```

### Issue: "Prisma connection failed"

**Solution**: Verify your development database connection string

```bash
cd packages/shared
npx prisma db execute --stdin <<< "SELECT 1;"
```

### Issue: Migration failed

**Solution**: Make sure you're in the correct directory

```bash
cd packages/shared  # Important!
npx prisma migrate dev
```

---

## 📋 Quick Command Reference

```bash
# Check environment
echo $NODE_ENV $ENVIRONMENT_MODE

# Generate Prisma client
pnpm run prisma:generate

# Apply schema (development only)
cd packages/shared
npx prisma db push

# Open database viewer
npx prisma studio

# Check current database
npx prisma db execute --stdin <<< "SELECT current_database();"
```

---

## 🎓 Summary

**What you need to do:**
1. Create development database on Neon
2. Update `.env.local` with development DATABASE_URL
3. Run `pnpm run prisma:generate && cd packages/shared && npx prisma db push`

**What the system does automatically:**
- Validates environment on startup
- Blocks production database access in development
- Logs all operations for audit trail
- Prevents accidental data loss

---

## ✅ Verification Checklist

- [ ] Created `speedyvan-dev` database on Neon
- [ ] Updated `.env.local` with development DATABASE_URL
- [ ] Added `ENVIRONMENT_MODE=development` to `.env.local`
- [ ] Ran `pnpm run prisma:generate`
- [ ] Ran `npx prisma db push` successfully
- [ ] Opened Prisma Studio to verify data
- [ ] Started app and saw "✅ VALID" environment message
- [ ] Tested protection by temporarily using production URL (optional)

---

**Need detailed information?** See `ENVIRONMENT_SEPARATION_GUIDE.md`

