# Deployment Verification Checklist - Route Matched Popup System

## Pre-Deployment Checklist

### ✅ Code Changes
- [x] Accept API updated to send Pusher events
- [x] All backend endpoints verified
- [x] iOS app code reviewed
- [x] No critical bugs identified

### ⚠️ Configuration Required
- [ ] Add `CRON_SECRET` to Render environment variables
- [ ] Set up external cron job (EasyCron/cron-job.org)
- [ ] Verify Pusher credentials in production
- [ ] Test cron endpoint manually with curl

---

## Deployment Steps

### 1. Update Environment Variables on Render

```bash
# Add this to Render dashboard → Environment
CRON_SECRET=your-secure-random-32-char-secret

# Verify existing variables
PUSHER_APP_ID=2034743
PUSHER_KEY=407cb06c423e6c032e9c
PUSHER_SECRET=bf769b4fd7a3cf95a803
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=407cb06c423e6c032e9c
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

### 2. Deploy to Render

```bash
# Push changes to GitHub
git add .
git commit -m "fix: Add Pusher events to Accept API and document cron setup"
git push origin main

# Render will auto-deploy
# Monitor deployment at: https://dashboard.render.com/
```

### 3. Set Up Cron Job

**Choose ONE of these options:**

#### Option A: EasyCron (Recommended)
1. Go to https://www.easycron.com/
2. Create account (free tier)
3. Add new cron job:
   - **URL**: `https://speedy-van.co.uk/api/cron/expire-assignments`
   - **Schedule**: `* * * * *` (every minute)
   - **Method**: GET
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`
   - **Timeout**: 60 seconds

#### Option B: cron-job.org
1. Go to https://cron-job.org/
2. Create account (free)
3. Add new cron job:
   - **URL**: `https://speedy-van.co.uk/api/cron/expire-assignments`
   - **Schedule**: Every minute
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`

---

## Post-Deployment Verification

### Test 1: Manual Cron Endpoint Test

```bash
# Test cron endpoint manually
curl -X GET https://speedy-van.co.uk/api/cron/expire-assignments \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -v

# Expected response:
{
  "success": true,
  "message": "No expired assignments found",
  "expiredCount": 0,
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

**✅ PASS**: Status 200, success: true  
**❌ FAIL**: Status 401 (check CRON_SECRET) or 500 (check logs)

---

### Test 2: Admin Assigns Driver → Popup Shows Instantly

**Steps**:
1. Open iOS driver app and login
2. Go to Dashboard
3. Set status to **Online**
4. **Simultaneously**:
   - **Admin**: Assign a driver to an order
   - **iOS App**: Watch for popup

**Expected Result**:
- ✅ Popup appears within 1 second
- ✅ Correct order number displayed
- ✅ 30:00 countdown starts
- ✅ Sound plays
- ✅ Vibration triggered

**Check Logs**:
```
# Render logs (Backend)
📡 Sending route-matched event to driver channel: driver-{id}
✅ Route-matched event sent result: {...}

# iOS app logs
🎯 ROUTE MATCHED EVENT RECEIVED IN DASHBOARD: {...}
📌 Saved pending offer: {...}
💫💫💫 SHOWING MATCH MODAL...
```

**✅ PASS**: Popup shows instantly with correct info  
**❌ FAIL**: Popup doesn't show or takes >3 seconds

---

### Test 3: Driver Taps "View Now" → "Accept"

**Steps**:
1. Driver taps "View Now" in popup
2. Navigate to job details
3. Tap "Accept" button

**Expected Result**:
- ✅ Job status updates to "Accepted"
- ✅ Admin dashboard updates instantly (no refresh)
- ✅ Driver schedule updates
- ✅ Customer tracking page updates

**Check Pusher Events**:
1. Go to https://dashboard.pusher.com/
2. Select your app
3. Check Debug Console for these events:

```
Channel: admin-orders
Event: order-accepted
Data: {
  jobId: "...",
  driverId: "...",
  driverName: "...",
  acceptedAt: "..."
}

Channel: admin-drivers
Event: driver-accepted-job
Data: {
  driverId: "...",
  jobId: "..."
}

Channel: booking-{reference}
Event: driver-accepted
Data: {
  driverName: "...",
  acceptedAt: "..."
}
```

**✅ PASS**: All events triggered, admin sees update instantly  
**❌ FAIL**: Admin doesn't see update or has to refresh

---

### Test 4: Driver Taps "Decline" → Penalty Applied

**Steps**:
1. Driver receives popup
2. Tap "Decline (-5%)" button
3. Confirm decline

**Expected Result**:
- ✅ Popup closes
- ✅ Acceptance rate decreases by 5%
- ✅ Acceptance rate indicator updates instantly
- ✅ Job removed from driver's list
- ✅ Admin dashboard shows job as "Available"
- ✅ Next available driver receives popup

**Check Database**:
```sql
-- Check acceptance rate updated
SELECT 
  u.name,
  dp.acceptanceRate,
  dp.lastCalculated
FROM "DriverPerformance" dp
JOIN "Driver" d ON dp.driverId = d.id
JOIN "User" u ON d.userId = u.id
WHERE d.id = 'YOUR_DRIVER_ID';

-- Check assignment declined
SELECT 
  id, status, declinedAt
FROM "Assignment"
WHERE bookingId = 'YOUR_BOOKING_ID'
ORDER BY createdAt DESC
LIMIT 2;
```

**✅ PASS**: Acceptance rate decreased, new assignment created  
**❌ FAIL**: Acceptance rate unchanged or no reassignment

---

### Test 5: 30-Minute Expiry (Wait for Timeout)

**Steps**:
1. Assign driver to order
2. Driver receives popup but **does not** tap View Now or Decline
3. Wait 30 minutes (or change `expiresAt` in DB to 1 minute for testing)

**Testing Shortcut (for faster testing)**:
```sql
-- Set assignment to expire in 1 minute
UPDATE "Assignment"
SET "expiresAt" = NOW() + INTERVAL '1 minute'
WHERE id = 'YOUR_ASSIGNMENT_ID';
```

**Wait 2 minutes, then check:**

**Expected Result**:
- ✅ Popup auto-closes
- ✅ Driver sees alert: "Assignment expired"
- ✅ Acceptance rate decreased by 5%
- ✅ Job auto-reassigned to next driver
- ✅ Admin dashboard shows job as "Available" then "Assigned"

**Check Render Logs**:
```
⏰ Expiring assignment assign_123 for driver driver_456
📉 Decreased acceptance rate for driver driver_456 from 100% to 95%
✅ Job auto-reassigned to driver: John Smith
```

**Check Pusher Events**:
```
Channel: driver-{expired_driver_id}
Events:
- job-removed (reason: expired)
- acceptance-rate-updated (change: -5)

Channel: driver-{next_driver_id}
Event: route-matched (message: auto-reassigned)

Channel: admin-orders
Event: order-status-changed (reason: expired)
```

**✅ PASS**: Expiry processed, reassigned automatically  
**❌ FAIL**: Assignment not expired or no reassignment

---

### Test 6: App Restart with Pending Offer

**Steps**:
1. Driver receives popup
2. **Close app completely** (swipe up to kill)
3. Wait 5 seconds
4. **Reopen app**

**Expected Result**:
- ✅ Popup reappears automatically
- ✅ Countdown shows **remaining time** (not full 30 min)
- ✅ Same order number displayed
- ✅ Sound plays again
- ✅ Can still accept/decline

**Example**:
- Assignment received at 12:00 PM (expires 12:30 PM)
- App closed at 12:05 PM
- App reopened at 12:10 PM
- Countdown shows **20:00** (not 30:00)

**Check iOS Logs**:
```
🔍 Checking for pending offers in storage...
📌 Restored pending offer: assign_123
⏰ Offer expires at: 2025-01-11T12:30:00.000Z
🎵 PLAYING NOTIFICATION SOUND...
💫 SHOWING MATCH MODAL...
```

**✅ PASS**: Popup restored with correct remaining time  
**❌ FAIL**: Popup doesn't show or countdown resets to 30 min

---

### Test 7: Driver Offline → Online Reconnect

**Steps**:
1. Driver app is open
2. Turn on **Airplane Mode**
3. Admin assigns driver to order
4. Wait 10 seconds
5. Turn off **Airplane Mode**

**Expected Result**:
- ✅ Pusher reconnects within 5 seconds
- ✅ Popup appears automatically
- ✅ Correct countdown (time passed while offline)
- ✅ Can accept/decline

**Check iOS Logs**:
```
🔌 Pusher disconnected
📡 Pusher state changed: connected -> disconnected
🔄 Pusher reconnecting...
✅ Pusher connected successfully
🎯 ROUTE MATCHED EVENT RECEIVED: {...}
```

**✅ PASS**: Popup shows after reconnect  
**❌ FAIL**: Popup doesn't show or app doesn't reconnect

---

### Test 8: Admin Cancels Order While Pending

**Steps**:
1. Driver receives popup
2. **Admin**: Cancel the order (before driver accepts)
3. Check driver app

**Expected Result**:
- ✅ Popup closes automatically
- ✅ Alert: "Order cancelled by admin"
- ✅ No acceptance rate penalty

**Check Pusher Events**:
```
Channel: driver-{id}
Event: job-removed
Data: {
  reason: "cancelled",
  message: "Order cancelled by admin"
}
```

**✅ PASS**: Popup closes, no penalty  
**❌ FAIL**: Popup still showing or penalty applied

---

### Test 9: Multiple Simultaneous Offers

**Steps**:
1. Driver has 1 pending offer (popup showing)
2. Admin assigns **another** order to same driver
3. Check driver app

**Expected Result**:
- ✅ **Only one popup active** at a time
- ✅ New offer saved to storage
- ✅ After accepting/declining first, second popup shows
- **OR**
- ✅ Alert: "You already have a pending offer"
- ✅ Second offer queued for later

**Check iOS Logs**:
```
⚠️ Pending offer already exists
💾 Queuing second offer: {...}
```

**✅ PASS**: No duplicate popups, offers queued  
**❌ FAIL**: Multiple popups stacked or app crashes

---

### Test 10: Cron Job Running Every Minute

**Steps**:
1. Check cron service (EasyCron/cron-job.org)
2. Review execution history
3. Check Render logs

**Expected Result**:
- ✅ Cron runs every 1 minute (1440 times per day)
- ✅ Render logs show: "⏰ Running assignment expiry check..." every minute
- ✅ No 401 errors (CRON_SECRET valid)
- ✅ No 500 errors (no crashes)

**Check EasyCron Execution History**:
```
Last 10 executions:
12:00 PM - Success (200) - 1.2s
12:01 PM - Success (200) - 1.1s
12:02 PM - Success (200) - 1.3s
...
```

**Check Render Logs** (filter: "cron" or "expire"):
```
2025-01-11 12:00:00 ⏰ Running assignment expiry check...
2025-01-11 12:00:01 ✅ No expired assignments found
2025-01-11 12:01:00 ⏰ Running assignment expiry check...
2025-01-11 12:01:01 ✅ No expired assignments found
```

**✅ PASS**: Cron runs consistently every minute  
**❌ FAIL**: Gaps in execution or errors

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Acceptable | Critical |
|--------|--------|------------|----------|
| **Admin assign → Popup shows** | <1s | <3s | >5s |
| **Countdown accuracy** | ±1s | ±5s | >10s |
| **Accept API response** | <500ms | <2s | >5s |
| **Decline API response** | <500ms | <2s | >5s |
| **Pusher event latency** | <200ms | <1s | >3s |
| **Cron execution time** | <2s | <10s | >30s |
| **Auto-reassignment time** | <3s | <10s | >30s |

### How to Measure

**1. Admin → Popup Latency**:
```javascript
// In iOS app, add timestamp logs
const assignedAt = new Date(data.assignedAt);
const receivedAt = new Date();
const latencyMs = receivedAt - assignedAt;
console.log(`🎯 Popup latency: ${latencyMs}ms`);
```

**2. API Response Times**:
```bash
# Test Accept API
time curl -X POST https://speedy-van.co.uk/api/driver/jobs/{id}/accept \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected: <500ms
```

**3. Pusher Event Latency**:
- Check Pusher Debug Console → Event Inspector
- Look at "Time" column
- Should be <200ms from trigger to receive

**4. Cron Execution Time**:
- Check EasyCron execution history
- Look at "Duration" column
- Should be <2 seconds

---

## Common Issues & Fixes

### Issue 1: Popup doesn't show

**Possible causes**:
1. Pusher not connected
2. Driver not subscribed to channel
3. Event name mismatch
4. Pusher credentials wrong

**Debug**:
```javascript
// In iOS app
console.log('Pusher state:', pusher.connection.state);
console.log('Subscribed channels:', pusher.allChannels());
```

**Fix**:
- Check Pusher credentials in `.env.local`
- Verify channel name: `driver-{driverId}`
- Check Pusher Debug Console for events

---

### Issue 2: Countdown incorrect after restart

**Possible causes**:
1. `expiresAt` not saved correctly
2. Timezone issues
3. Countdown calculation wrong

**Debug**:
```javascript
// In RouteMatchModal
console.log('expiresAt:', expiresAt);
console.log('Current time:', new Date().toISOString());
console.log('Remaining seconds:', remainingSeconds);
```

**Fix**:
- Ensure `expiresAt` is saved as ISO string
- Use `new Date(expiresAt).getTime()` for calculation
- Always use UTC timestamps

---

### Issue 3: Acceptance rate not updating

**Possible causes**:
1. DriverPerformance record doesn't exist
2. Pusher event not sent
3. iOS app not listening to event

**Debug**:
```sql
-- Check if DriverPerformance exists
SELECT * FROM "DriverPerformance" WHERE driverId = 'YOUR_DRIVER_ID';

-- If not, create it
INSERT INTO "DriverPerformance" (driverId, acceptanceRate, lastCalculated)
VALUES ('YOUR_DRIVER_ID', 100, NOW());
```

**Fix**:
- Run migration to create DriverPerformance for all drivers
- Ensure Pusher event `acceptance-rate-updated` is sent
- Check iOS app listens to this event

---

### Issue 4: Cron job failing

**Possible causes**:
1. CRON_SECRET mismatch
2. Database connection timeout
3. Neon database sleeping

**Debug**:
```bash
# Test cron endpoint
curl -X GET https://speedy-van.co.uk/api/cron/expire-assignments \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -v

# Check response status and body
```

**Fix**:
- Verify CRON_SECRET in Render matches cron service
- Increase timeout in cron service to 60s
- Keep Neon database active with ping endpoint

---

## Success Criteria

All tests must pass for production deployment:

- [ ] Test 1: Manual cron endpoint test ✅
- [ ] Test 2: Admin assigns → popup shows ✅
- [ ] Test 3: Driver accepts → admin updated ✅
- [ ] Test 4: Driver declines → penalty applied ✅
- [ ] Test 5: 30-minute expiry works ✅
- [ ] Test 6: App restart restores popup ✅
- [ ] Test 7: Offline → online reconnect ✅
- [ ] Test 8: Admin cancels → popup closes ✅
- [ ] Test 9: Multiple offers handled ✅
- [ ] Test 10: Cron runs every minute ✅

**When all tests pass**:
✅ **System is ready for production use**

---

## Monitoring After Deployment

### Daily Checks (First Week)

**Morning**:
- [ ] Check cron execution history (should be 1440/day)
- [ ] Review Render logs for errors
- [ ] Check Pusher dashboard for event counts
- [ ] Verify no failed API requests

**Evening**:
- [ ] Review acceptance rate changes in database
- [ ] Check if auto-reassignment worked
- [ ] Review driver feedback on popup
- [ ] Check admin dashboard for issues

### Weekly Checks (After First Week)

- [ ] Analyze cron job performance trends
- [ ] Review Pusher usage (stay under limits)
- [ ] Check database performance
- [ ] Review driver acceptance rates
- [ ] Collect user feedback

---

## Rollback Plan

**If critical issues found after deployment:**

### Immediate Actions
1. **Disable cron job** in EasyCron/cron-job.org
2. **Revert code** to previous version:
   ```bash
   git revert HEAD
   git push origin main
   ```
3. **Notify team** and drivers
4. **Manual assignment** until fixed

### Investigation
1. Check Render logs for errors
2. Review Pusher events
3. Test locally with production data
4. Fix issues and redeploy

---

**End of Verification Checklist**









