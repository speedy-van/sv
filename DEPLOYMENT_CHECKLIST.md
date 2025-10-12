# Dual Routing System - Deployment Checklist
## قائمة التحقق الكاملة للنشر في الإنتاج

---

## ✅ Pre-Deployment Checklist

### 1️⃣ Database Setup

- [ ] **Run Prisma Migration**
```bash
cd packages/shared
pnpm run prisma:migrate
```

- [ ] **Verify New Tables**
```sql
-- Check SystemSettings
SELECT * FROM "SystemSettings" LIMIT 1;

-- Check RouteApproval
SELECT COUNT(*) FROM "RouteApproval";

-- Check SystemAuditLog
SELECT COUNT(*) FROM "SystemAuditLog";
```

- [ ] **Initialize System Settings**
```typescript
// Run once in production console or via API
await prisma.systemSettings.create({
  data: {
    routingMode: 'manual', // Start with manual
    autoRoutingEnabled: false,
    autoRoutingIntervalMin: 15,
    maxDropsPerRoute: 10,
    maxRouteDistanceKm: 50,
    autoAssignDrivers: false,
    requireAdminApproval: true,
    minDropsForAutoRoute: 2,
    updatedBy: 'system',
  }
});
```

---

### 2️⃣ Environment Variables

- [ ] **Add CRON_SECRET**
```env
CRON_SECRET=your_secure_random_secret_minimum_32_characters_here
```
**Generate secure secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] **Verify Existing Variables**
```env
# Database
DATABASE_URL=postgresql://...

# SMS (TheSMSWorks)
THESMSWORKS_JWT=...

# Pusher
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=eu

# Email (ZeptoMail)
ZEPTO_API_KEY=...
ZEPTO_API_URL=https://api.zeptomail.eu/v1.1/email
MAIL_FROM=noreply@speedy-van.co.uk

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://speedy-van.co.uk
```

---

### 3️⃣ Vercel/Deployment Configuration

- [ ] **Add Cron Job to `vercel.json`**
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

- [ ] **Configure Environment Variables in Vercel**
```bash
vercel env add CRON_SECRET production
# Paste your generated secret
```

- [ ] **Build and Deploy**
```bash
cd apps/web
pnpm run build
vercel --prod
```

---

### 4️⃣ Verification Tests (Production)

#### Test 1: Configuration Loading
```bash
curl https://speedy-van.co.uk/api/admin/routing/settings \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "routingMode": "manual",
    "autoRoutingEnabled": false,
    "maxDropsPerRoute": 10
  }
}
```

---

#### Test 2: Toggle Routing Mode
```bash
curl -X PATCH https://speedy-van.co.uk/api/admin/routing/settings/mode \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_TOKEN" \
  -d '{"mode": "auto"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Routing mode switched to AUTO successfully",
  "data": {
    "newMode": "auto",
    "timestamp": "2025-10-11T..."
  }
}
```

---

#### Test 3: Manual Route Creation
```bash
curl -X POST https://speedy-van.co.uk/api/admin/routing/manual \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_ADMIN_TOKEN" \
  -d '{
    "bookingIds": ["REAL_BOOKING_ID_1", "REAL_BOOKING_ID_2"],
    "startTime": "2025-10-12T09:00:00Z",
    "skipApproval": false
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Route created successfully with 2 stops",
  "data": {
    "routeId": "route_xxx",
    "approvalId": "approval_xxx",
    "requiresApproval": true
  }
}
```

---

#### Test 4: Cron Job (Manual Trigger)
```bash
curl -X POST https://speedy-van.co.uk/api/admin/routing/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "routesCreated": 2,
    "bookingsProcessed": 8,
    "duration": 3456,
    "timestamp": "2025-10-11T..."
  }
}
```

---

#### Test 5: Driver Notifications
Create a route with driver assignment and verify:

- [ ] **Pusher:** Check Driver App receives real-time notification
- [ ] **SMS:** Driver receives SMS on phone
- [ ] **Push:** Mobile device shows push notification
- [ ] **Email:** Driver receives email backup

**Verification Query:**
```sql
SELECT * FROM "SystemAuditLog" 
WHERE "eventType" = 'driver_notified' 
ORDER BY "timestamp" DESC 
LIMIT 5;
```

---

### 5️⃣ Admin Dashboard Verification

- [ ] **Open Admin Dashboard**
  - Navigate to: `https://speedy-van.co.uk/admin/dashboard`
  
- [ ] **Verify Routing Mode Toggle**
  - Should see toggle switch at top
  - Should show current mode (Auto/Manual)
  - Should display last run time (if Auto)
  - "Trigger Now" button should work

- [ ] **Test Mode Switching**
  - Switch to Auto → verify badge changes
  - Switch to Manual → verify badge changes
  - Check audit log for mode change entries

- [ ] **Test Manual Route Creation**
  - Go to Orders page
  - Select 2-3 confirmed bookings
  - Click "Create Route" button (if implemented)
  - Should open Route Preview Modal
  - Review stops, metrics, map
  - Click "Approve & Create"
  - Verify route appears in Routes page

- [ ] **Check Pending Approvals**
  - Navigate to Routes page
  - Should see routes with "Pending Approval" status
  - Click "Review"
  - Should open Route Preview Modal
  - Test Approve and Reject flows

---

### 6️⃣ Database Integrity Check

Run these queries to ensure data consistency:

```sql
-- 1. Check for orphaned bookings (routeId points to non-existent route)
SELECT COUNT(*) as orphaned_bookings
FROM "Booking" b
LEFT JOIN "Route" r ON b."routeId" = r.id
WHERE b."routeId" IS NOT NULL AND r.id IS NULL;
-- Expected: 0

-- 2. Check for duplicate active routes for same bookings
SELECT "bookingId", COUNT(*) as route_count
FROM "Booking"
WHERE "routeId" IS NOT NULL
GROUP BY "bookingId"
HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- 3. Verify SystemSettings exists
SELECT COUNT(*) FROM "SystemSettings";
-- Expected: 1

-- 4. Check audit log integrity
SELECT "eventType", COUNT(*) as count
FROM "SystemAuditLog"
WHERE "timestamp" > NOW() - INTERVAL '24 hours'
GROUP BY "eventType"
ORDER BY count DESC;
-- Should show routing events

-- 5. Check pending approvals
SELECT COUNT(*) as pending_approvals
FROM "RouteApproval"
WHERE "status" = 'pending';
-- Should match UI display
```

---

### 7️⃣ Performance Monitoring

- [ ] **Set Up Monitoring Alerts**
  - Cron job failures
  - Route creation taking > 5s
  - Driver notification failures
  - Database query timeouts

- [ ] **Check Initial Performance**
```bash
# Run performance tests in staging
cd apps/web
pnpm test routing-performance.test.ts
```

- [ ] **Monitor Key Metrics**
  - Auto-routing success rate
  - Average route creation time
  - Notification delivery rate
  - API response times

---

### 8️⃣ Security Verification

- [ ] **Verify Authentication**
  - All routing endpoints require admin role
  - Cron endpoint protected by secret
  - No public access to sensitive data

- [ ] **Test Authorization**
```bash
# Try accessing without auth - should fail
curl https://speedy-van.co.uk/api/admin/routing/settings

# Try with customer token - should fail
curl https://speedy-van.co.uk/api/admin/routing/settings \
  -H "Cookie: next-auth.session-token=CUSTOMER_TOKEN"
```

- [ ] **Check Audit Logging**
  - All admin actions logged with user ID
  - IP addresses captured
  - Timestamps accurate

---

### 9️⃣ Rollback Plan

**If critical issues occur:**

1. **Disable Auto-Routing Immediately**
```sql
UPDATE "SystemSettings" 
SET "autoRoutingEnabled" = false, "routingMode" = 'manual'
WHERE id IN (SELECT id FROM "SystemSettings" LIMIT 1);
```

2. **Cancel Pending Cron Jobs**
   - Go to Vercel Dashboard → Cron Jobs → Disable

3. **Release Locked Bookings**
```sql
-- Find bookings in problematic routes
SELECT b.id, b.reference, b."routeId"
FROM "Booking" b
JOIN "Route" r ON b."routeId" = r.id
WHERE r."status" = 'planned' AND r."createdAt" > NOW() - INTERVAL '1 hour';

-- If needed, release them
UPDATE "Booking"
SET "routeId" = NULL
WHERE "routeId" IN (
  SELECT id FROM "Route" 
  WHERE "status" = 'planned' 
  AND "createdAt" > NOW() - INTERVAL '1 hour'
);
```

4. **Notify Stakeholders**
   - Admin team
   - Driver support
   - Customer service

---

### 🔟 Post-Deployment Monitoring (First 48 Hours)

#### Hour 1-4: Intensive Monitoring
- [ ] Check every 30 minutes
- [ ] Monitor cron executions
- [ ] Watch for errors in logs
- [ ] Verify notifications sent

#### Hour 4-24: Regular Monitoring
- [ ] Check every 2 hours
- [ ] Review audit logs
- [ ] Check pending approvals queue
- [ ] Monitor driver feedback

#### Day 2: Steady State
- [ ] Daily check-ins
- [ ] Review metrics
- [ ] Gather user feedback
- [ ] Document any issues

---

## 📊 Success Criteria

After 48 hours, system is considered stable if:

✅ **No Critical Errors**
- No cron job failures
- No database errors
- No authentication issues

✅ **Performance Within Thresholds**
- Auto-routing completes < 10s
- Manual routes created < 3s
- All endpoints respond < 1s

✅ **Notifications Delivered**
- > 95% SMS delivery rate
- > 98% Pusher delivery
- > 90% Push notification delivery
- 100% audit log coverage

✅ **User Acceptance**
- Admin can toggle modes smoothly
- Routes created successfully
- Drivers receive notifications
- No customer complaints

---

## 🚨 Known Issues & Limitations

1. **First Run Performance**
   - First auto-routing run may be slower (cold start)
   - Subsequent runs will be faster due to caching

2. **Concurrent Operations**
   - System prevents concurrent auto-routing
   - Manual operations can still run during auto-routing

3. **Large Batches**
   - Routes with > 20 bookings may take longer
   - Consider splitting into multiple routes

4. **Notification Delays**
   - SMS may have 1-2 second delay
   - Push notifications depend on device connectivity

---

## 📞 Emergency Contacts

**Critical Issues:**
- System Admin: [admin@speedy-van.co.uk]
- Database Team: [db@speedy-van.co.uk]
- DevOps: [devops@speedy-van.co.uk]

**Support:**
- Phone: 07901846297
- Email: support@speedy-van.co.uk

---

## ✅ Final Sign-Off

**Deployment completed by:** _________________

**Date:** _________________

**Verified by:** _________________

**Notes:**
```
[Space for deployment notes, issues encountered, special configurations, etc.]
```

---

## 🎉 الحمد لله، النظام جاهز للإنتاج! 

**All systems GO! 🚀**
