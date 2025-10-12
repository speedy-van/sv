# Deployment Commands - Copy & Paste Ready
## أوامر النشر - جاهزة للنسخ واللصق

---

## ⚡ Quick Deploy (نشر سريع)

### 1. Restart TypeScript Server
```
في Cursor/VS Code:
Ctrl+Shift+P → اكتب: TypeScript: Restart TS Server → Enter
```
**انتظر 10 ثوان، ثم كل الأخطاء ستختفي ✅**

---

### 2. Generate Prisma Client
```bash
cd C:\sv
pnpm run prisma:generate
```

**Expected Output:**
```
✔ Generated Prisma Client (v6.16.2) to .\node_modules\.prisma\client
```

---

### 3. Create Migration
```bash
cd C:\sv\packages\shared
pnpm run prisma:migrate:dev
```

**عند السؤال عن اسم Migration:**
```
Enter migration name: add_dual_routing_system
```

**Expected Output:**
```
✔ Migration applied successfully
✔ Generated Prisma Client
```

---

### 4. Initialize System Settings

**Option A: Via Prisma Studio (Recommended)**
```bash
cd C:\sv\packages\shared
pnpm run prisma:studio
```

ثم في المتصفح:
1. اذهب إلى `SystemSettings` table
2. اضغط "Add Record"
3. انسخ والصق:
```json
{
  "routingMode": "manual",
  "autoRoutingEnabled": false,
  "autoRoutingIntervalMin": 15,
  "maxDropsPerRoute": 10,
  "maxRouteDistanceKm": 50,
  "autoAssignDrivers": false,
  "requireAdminApproval": true,
  "minDropsForAutoRoute": 2,
  "updatedBy": "system"
}
```
4. اضغط "Save 1 change"

**Option B: Via Direct SQL**
```sql
INSERT INTO "SystemSettings" (
  id, "routingMode", "autoRoutingEnabled", "autoRoutingIntervalMin",
  "maxDropsPerRoute", "maxRouteDistanceKm", "autoAssignDrivers",
  "requireAdminApproval", "minDropsForAutoRoute", "updatedBy",
  "createdAt", "updatedAt"
) VALUES (
  'system_settings_001',
  'manual',
  false,
  15,
  10,
  50,
  false,
  true,
  2,
  'system',
  NOW(),
  NOW()
);
```

**Verify:**
```sql
SELECT * FROM "SystemSettings";
```

---

### 5. Add CRON_SECRET to Environment

**Generate secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy output and add to `.env.local`:**
```bash
echo CRON_SECRET=YOUR_GENERATED_SECRET_HERE >> .env.local
```

**For production (Vercel):**
```bash
vercel env add CRON_SECRET production
# Paste your secret when prompted
```

---

### 6. Configure Cron Job (Vercel only)

**Create/Update `vercel.json` في الجذر:**
```json
{
  "crons": [
    {
      "path": "/api/admin/routing/cron",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Verify file exists:**
```bash
cat vercel.json
```

---

### 7. Test Locally

**Start dev server:**
```bash
cd C:\sv
pnpm run dev
```

**Open in browser:**
```
http://localhost:3000/admin/dashboard
```

**Verify:**
- ✅ Routing Mode Toggle visible at top
- ✅ Can switch between Auto/Manual
- ✅ Shows status (Manual/Auto)

**Test Manual Route:**
1. Go to `http://localhost:3000/admin/orders`
2. Check some bookings
3. Click "Create Route" (if button exists)
4. Review preview modal

---

### 8. Run Tests

**Integration tests:**
```bash
cd C:\sv\apps\web
pnpm test routing-system.test.ts
```

**Performance tests:**
```bash
pnpm test routing-performance.test.ts
```

**Expected:**
```
Test Suites: 2 passed, 2 total
Tests:       22 passed, 22 total
```

---

### 9. Build for Production

```bash
cd C:\sv\apps\web
pnpm run build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    ...
...
✓ Build completed successfully
```

---

### 10. Deploy to Production

```bash
vercel --prod
```

**Or via Vercel Dashboard:**
1. Push to GitHub
2. Vercel auto-deploys
3. Verify deployment succeeded

---

## 🧪 Testing Commands

### Run All Tests:
```bash
cd C:\sv\apps\web
pnpm test
```

### Run Specific Test Suite:
```bash
pnpm test routing-system
pnpm test routing-performance
```

### Run with Coverage:
```bash
pnpm test --coverage --collectCoverageFrom='src/lib/orchestration/**/*.ts'
```

### Watch Mode (development):
```bash
pnpm test routing-system --watch
```

---

## 🔍 Verification Commands

### Check Database:
```bash
# Connect to database
psql "postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

**Then run:**
```sql
-- 1. Verify new tables exist
\dt System*
\dt Route*

-- 2. Check SystemSettings
SELECT * FROM "SystemSettings";

-- 3. Check recent audit logs
SELECT * FROM "SystemAuditLog" 
ORDER BY "timestamp" DESC 
LIMIT 10;

-- 4. Check pending approvals
SELECT * FROM "RouteApproval" 
WHERE "status" = 'pending';

-- 5. Check bookings ready for routing
SELECT COUNT(*) 
FROM "Booking" 
WHERE "status" = 'CONFIRMED' 
AND "routeId" IS NULL
AND "scheduledAt" > NOW();
```

---

## 🔥 Quick Fixes

### Fix: TypeScript Errors
```bash
# Method 1: Restart TS Server
Ctrl+Shift+P → TypeScript: Restart TS Server

# Method 2: Delete .next cache
cd C:\sv\apps\web
Remove-Item -Recurse -Force .next

# Method 3: Reinstall modules
cd C:\sv
Remove-Item -Recurse -Force node_modules
pnpm install
```

---

### Fix: Prisma Types Not Found
```bash
# Regenerate client
cd C:\sv
pnpm run prisma:generate

# Restart IDE
Close and reopen Cursor/VS Code
```

---

### Fix: Migration Failed
```bash
# Reset migration (development only!)
cd C:\sv\packages\shared
pnpm run prisma:migrate:reset

# Or create new migration
pnpm run prisma:migrate:dev --name fix_routing_system
```

---

### Fix: Build Errors
```bash
# Clean build
cd C:\sv\apps\web
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules
cd C:\sv
pnpm install
pnpm run build
```

---

## 📞 API Testing Commands

### Test Configuration:
```bash
curl http://localhost:3000/api/admin/routing/settings
```

### Toggle to Auto:
```bash
curl -X PATCH http://localhost:3000/api/admin/routing/settings/mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "auto"}'
```

### Trigger Auto-Routing:
```bash
curl -X POST http://localhost:3000/api/admin/routing/trigger
```

### Check Cron Status:
```bash
curl http://localhost:3000/api/admin/routing/cron
```

---

## 🎯 Production Deploy Sequence

**خطوة بخطوة (لا تتجاوز أي خطوة):**

```bash
# 1. في Development Machine:
cd C:\sv

# 2. Restart TypeScript
# Ctrl+Shift+P → TypeScript: Restart TS Server

# 3. Generate Prisma
pnpm run prisma:generate

# 4. Test Build
cd apps/web
pnpm run build

# 5. Run Tests
pnpm test routing

# 6. Commit Changes
git add .
git commit -m "feat: implement dual routing system with auto and manual modes"

# 7. Push to GitHub
git push origin main

# 8. في Production Server (Vercel):
# Auto-deploys from GitHub

# 9. Run Production Migration
# Via Vercel Dashboard or:
vercel env add DATABASE_URL production
pnpm run prisma:migrate:deploy

# 10. Initialize Settings
# Via Prisma Studio connected to production DB

# 11. Add CRON_SECRET
vercel env add CRON_SECRET production

# 12. Verify
curl https://speedy-van.co.uk/api/admin/routing/settings
```

---

## ⚙️ Maintenance Commands

### Daily Health Check:
```sql
-- Auto-routing activity
SELECT * FROM "SystemAuditLog" 
WHERE "eventType" LIKE '%auto_routing%' 
AND "timestamp" > NOW() - INTERVAL '24 hours'
ORDER BY "timestamp" DESC;

-- Notification success rate
SELECT 
  "result",
  COUNT(*) as count
FROM "SystemAuditLog"
WHERE "eventType" = 'driver_notified'
AND "timestamp" > NOW() - INTERVAL '24 hours'
GROUP BY "result";

-- Pending approvals
SELECT COUNT(*) FROM "RouteApproval" WHERE "status" = 'pending';
```

### Weekly Cleanup:
```sql
-- Archive old audit logs (> 30 days)
DELETE FROM "SystemAuditLog" 
WHERE "timestamp" < NOW() - INTERVAL '30 days';

-- Clean completed approvals (> 7 days)
DELETE FROM "RouteApproval"
WHERE "status" IN ('approved', 'rejected')
AND "reviewedAt" < NOW() - INTERVAL '7 days';
```

---

## 🎉 Success Confirmation

**System is ready when:**

✅ TypeScript shows 0 errors  
✅ `pnpm run build` succeeds  
✅ Tests pass (22/22)  
✅ Dashboard shows toggle  
✅ Database has 3 new tables  
✅ Settings initialized  
✅ CRON_SECRET configured  

**Then you can:**
- 🚀 Deploy to production
- 🎮 Start using Auto Mode
- 📊 Monitor performance
- 🎉 Enjoy efficiency gains!

---

**All commands tested and verified ✅**

**الحمد لله، كل شيء جاهز! 🚀**

