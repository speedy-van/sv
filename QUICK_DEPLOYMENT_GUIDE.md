# 🚀 QUICK DEPLOYMENT GUIDE - Economy Service Fix

## ⚡ CRITICAL: Follow in Order

### Step 1: Database Migration (5 minutes)
```bash
# Connect to database
psql $DATABASE_URL

# Run migration
\i add-service-type-columns.sql

# Verify columns added
\d "Booking"

# Check updated count
SELECT COUNT(*) FROM "Booking" WHERE "isEconomyService" = true;

# Exit
\q
```

**Expected Output:**
- 3 new columns added to Booking table
- Existing Economy bookings updated
- Indexes created

---

### Step 2: Deploy Code (10 minutes)
```bash
# Pull latest changes
git pull origin main

# Install dependencies (if needed)
cd apps/web
pnpm install

# Build
pnpm build

# Restart server
pm2 restart speedy-van
# OR
docker-compose down && docker-compose up -d
```

---

### Step 3: Verify Deployment (5 minutes)

#### Check API Endpoints:
```bash
# Check Orders API (should exclude Economy)
curl "https://your-domain.com/api/admin/orders?status=active" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Check Routes API (should include economyDrops)
curl "https://your-domain.com/api/admin/routes" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

#### Check Database:
```sql
-- Verify new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Booking' 
  AND column_name IN ('serviceType', 'isEconomyService', 'shouldBeMultiDrop');

-- Check data populated
SELECT "serviceType", COUNT(*) 
FROM "Booking" 
GROUP BY "serviceType";
```

---

### Step 4: Create Test Booking (10 minutes)

1. Open browser: `https://your-domain.com/booking-luxury`
2. Fill form:
   - Pickup: London SW1A 1AA
   - Dropoff: Manchester M1 1AA
   - Date: Tomorrow
   - **Urgency: Scheduled** (this triggers Economy)
3. Add items (keep under 500kg for Economy eligibility)
4. Enter customer details
5. Click "Continue to Payment"
6. Use Stripe test card: `4242 4242 4242 4242`
7. Complete payment

**Wait 10 seconds, then check:**

```sql
-- Find your test booking
SELECT id, reference, "serviceType", "isEconomyService", "orderType" 
FROM "Booking" 
WHERE "customerEmail" = 'your-test-email@example.com' 
ORDER BY "createdAt" DESC 
LIMIT 1;

-- Check if Drop was created
SELECT id, status, "serviceTier" 
FROM "Drop" 
WHERE "customerId" = (
  SELECT "customerId" FROM "Booking" 
  WHERE "customerEmail" = 'your-test-email@example.com' 
  ORDER BY "createdAt" DESC 
  LIMIT 1
);
```

**Expected:**
- ✅ `serviceType` = 'ECONOMY'
- ✅ `isEconomyService` = true
- ✅ `orderType` = 'multi-drop' (after payment)
- ✅ Drop exists with `serviceTier` = 'economy'

---

### Step 5: Check Admin Panel (5 minutes)

1. Login to admin: `https://your-domain.com/admin`
2. Go to Operations → Single Orders tab
   - ✅ Should NOT see Economy test booking
3. Go to Operations → Multi-Drop Routes tab
   - ✅ Should SEE Economy test booking OR drop
4. Click on booking/drop
   - ✅ Should see "🟢 Economy" badge

---

## 🆘 TROUBLESHOOTING

### Problem: Migration Fails
```bash
# Check if columns already exist
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'Booking' AND column_name = 'serviceType';"

# If exists, skip migration
# If not exists, check syntax errors in SQL file
```

### Problem: Booking Doesn't Convert to Drop
```bash
# Check webhook logs
tail -f /var/log/speedy-van/webhook.log

# Check for errors
grep "Economy booking" /var/log/speedy-van/webhook.log | grep "Error"

# Manually convert booking
psql $DATABASE_URL
UPDATE "Booking" SET "orderType" = 'multi-drop', "isMultiDrop" = true WHERE id = 'YOUR_BOOKING_ID';
```

### Problem: Booking Still Appears in Single Orders
```bash
# Check if booking is actually Economy
psql $DATABASE_URL -c "SELECT id, reference, \"serviceType\", \"isEconomyService\" FROM \"Booking\" WHERE reference = 'YOUR_REFERENCE';"

# If isEconomyService is false, update it
psql $DATABASE_URL -c "UPDATE \"Booking\" SET \"isEconomyService\" = true, \"serviceType\" = 'ECONOMY' WHERE reference = 'YOUR_REFERENCE';"

# Refresh admin panel (Ctrl+Shift+R)
```

### Problem: No Service Type Badge Showing
```bash
# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# Check API response
curl "https://your-domain.com/api/admin/orders" -H "Cookie: YOUR_SESSION" | jq '.items[0].serviceType'
```

---

## ✅ SUCCESS CRITERIA

After deployment, verify ALL these are true:

- [ ] Migration completed without errors
- [ ] 3 new columns exist in Booking table
- [ ] Existing bookings updated with service types
- [ ] New Economy booking creates successfully
- [ ] Payment completes and webhook runs
- [ ] Drop is created automatically
- [ ] Booking has `orderType='multi-drop'`
- [ ] Economy booking NOT in Single Orders
- [ ] Economy booking/drop IN Multi-Drop Routes
- [ ] Service type badge shows "🟢 Economy"
- [ ] No errors in logs

---

## 📞 ROLLBACK PLAN

If something goes wrong:

```bash
# 1. Revert code changes
git revert HEAD

# 2. Rebuild
cd apps/web && pnpm build

# 3. Restart
pm2 restart speedy-van

# Note: DO NOT rollback database - new columns are harmless
# They just won't be populated until you redeploy the fix
```

---

## 📊 POST-DEPLOYMENT MONITORING (24 hours)

```sql
-- Check Economy booking rate
SELECT 
  DATE("createdAt") as date,
  COUNT(*) as total_bookings,
  SUM(CASE WHEN "isEconomyService" = true THEN 1 ELSE 0 END) as economy_bookings,
  ROUND(100.0 * SUM(CASE WHEN "isEconomyService" = true THEN 1 ELSE 0 END) / COUNT(*), 2) as economy_percentage
FROM "Booking"
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE("createdAt")
ORDER BY date DESC;

-- Check Drop conversion rate
SELECT 
  COUNT(DISTINCT b.id) as economy_bookings,
  COUNT(DISTINCT d.id) as drops_created,
  ROUND(100.0 * COUNT(DISTINCT d.id) / COUNT(DISTINCT b.id), 2) as conversion_rate
FROM "Booking" b
LEFT JOIN "Drop" d ON d."customerId" = b."customerId" AND d."serviceTier" = 'economy'
WHERE b."isEconomyService" = true
  AND b."createdAt" >= NOW() - INTERVAL '24 hours';

-- Check for failed conversions
SELECT id, reference, "createdAt", status, "orderType"
FROM "Booking"
WHERE "isEconomyService" = true
  AND "orderType" != 'multi-drop'
  AND status = 'CONFIRMED'
  AND "createdAt" >= NOW() - INTERVAL '24 hours';
```

---

## 🎉 DONE!

**Deployment Complete!**

Total Time: ~35 minutes  
Risk Level: Low  
Business Impact: HIGH (fixes critical workflow)

Economy bookings now automatically route to Multi-Drop section as designed.

---

**Quick Reference:**
- Error Report: `ADMIN_OPERATIONS_FULL_ERROR_REPORT.md`
- Fixes Summary: `ADMIN_OPERATIONS_FIXES_SUMMARY.md`
- Migration SQL: `add-service-type-columns.sql`
