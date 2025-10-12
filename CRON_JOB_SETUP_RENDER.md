# Cron Job Setup for Render Deployment

## Overview

The Speedy Van system requires a cron job to automatically expire driver assignments that are not accepted within 30 minutes. This document explains how to set up an external cron job to call the expiry endpoint on Render.

---

## Why External Cron Job?

Render's free and starter tiers **do not support** built-in cron jobs. We need to use an external service to call our API endpoint every minute.

---

## Step 1: Add CRON_SECRET to Render

1. Go to your Render dashboard
2. Select your web service
3. Go to **Environment** tab
4. Add new environment variable:
   ```
   Key: CRON_SECRET
   Value: [Generate a secure random string - minimum 32 characters]
   ```

**To generate a secure random string**:

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
$randomBytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($randomBytes)
[Convert]::ToBase64String($randomBytes)

# Online
# Visit: https://www.random.org/strings/
# Generate: 1 string, 32 characters, alphanumeric + special chars
```

**Example CRON_SECRET**:
```
J8k2Lp9mQr3Xt5Zv7Bn4Cf6Hg8Jk0Mn2Pq4Rs6Tv8Xw0Yy2Az
```

4. Click **Save Changes**
5. Render will automatically redeploy your service

---

## Step 2: Choose a Cron Service

### Option A: EasyCron (Recommended) ⭐

**Pros**:
- Free tier: 20 cron jobs
- 1-minute intervals
- Email notifications on failures
- Easy to use
- HTTPS support
- Custom headers support

**Steps**:

1. **Sign up**: Go to https://www.easycron.com/user/register
   - Use your work email
   - Choose **Free Plan** (no credit card required)

2. **Create Cron Job**:
   - Click **+ Add Cron Job**
   - Fill in the form:

   ```
   Cron Job Name: Expire Driver Assignments
   
   URL: https://speedy-van.co.uk/api/cron/expire-assignments
   
   Cron Expression: * * * * *
   (This means: every 1 minute)
   
   HTTP Method: GET
   
   HTTP Headers:
   Authorization: Bearer YOUR_CRON_SECRET_HERE
   
   Timeout: 60 seconds
   
   Status: Enabled
   
   Email Notification: Enabled (on failure only)
   ```

3. **Test the Cron Job**:
   - Click **Run Now** to test
   - Check the logs - you should see:
   ```json
   {
     "success": true,
     "message": "No expired assignments found",
     "expiredCount": 0,
     "timestamp": "2025-01-11T12:00:00.000Z"
   }
   ```

4. **Monitor**:
   - EasyCron will email you if the job fails
   - Check execution history daily

---

### Option B: cron-job.org

**Pros**:
- Free forever
- Unlimited cron jobs
- 1-minute intervals
- Email notifications
- Execution history

**Steps**:

1. **Sign up**: Go to https://cron-job.org/en/signup/
   - Use your work email
   - No credit card required

2. **Create Cron Job**:
   - Click **Create cronjob**
   - Fill in the form:

   ```
   Title: Expire Driver Assignments
   
   Address (URL): https://speedy-van.co.uk/api/cron/expire-assignments
   
   Schedule:
   - Execution: Every minute
   - Time: */1 * * * *
   
   Request method: GET
   
   Request settings:
   - Authentication: None (we use custom header)
   - Custom headers:
     Authorization: Bearer YOUR_CRON_SECRET_HERE
   
   Notifications:
   - Enable email notifications: Yes
   - Notify on failure: Yes
   
   Status: Enabled
   ```

3. **Test**:
   - Click **Test run**
   - Check response - should be HTTP 200 with success JSON

4. **Activate**:
   - Click **Create cronjob**
   - Monitor execution history

---

### Option C: UptimeRobot (5-minute minimum)

**Pros**:
- Free tier: 50 monitors
- Simple setup
- Email/SMS alerts
- Public status page

**Cons**:
- **Minimum interval: 5 minutes** (not ideal, but acceptable)

**Steps**:

1. **Sign up**: Go to https://uptimerobot.com/signUp
   - Use your work email
   - Free plan (no credit card)

2. **Create Monitor**:
   - Click **+ Add New Monitor**
   - Fill in the form:

   ```
   Monitor Type: HTTP(s)
   
   Friendly Name: Expire Driver Assignments
   
   URL (or IP): https://speedy-van.co.uk/api/cron/expire-assignments
   
   Monitoring Interval: 5 minutes
   (This is the minimum for free tier)
   
   Monitor Timeout: 30 seconds
   
   Advanced Settings:
   - Custom HTTP Headers:
     Authorization: Bearer YOUR_CRON_SECRET_HERE
   
   - Keyword Type: Keyword Exists
   - Keyword Value: success
   (This ensures the endpoint returns success)
   
   Alert Contacts: Your email
   ```

3. **Test**:
   - Wait for first check (up to 5 minutes)
   - Check status - should show "Up"

4. **Monitor**:
   - UptimeRobot will alert you if endpoint is down

**Note**: 5-minute intervals mean assignments can take up to 5 minutes to expire instead of 1 minute. This is acceptable for production but not ideal.

---

## Step 3: Verify Cron Job is Working

### Check Render Logs

1. Go to Render dashboard
2. Select your web service
3. Go to **Logs** tab
4. Filter for "cron" or "expire"

**You should see logs like this every minute**:

```
⏰ [2025-01-11T12:00:00.000Z] Running assignment expiry check...
✅ No expired assignments found
```

**When assignments expire, you'll see**:

```
🔴 Found 2 expired assignment(s)
⏰ Expiring assignment assign_123 for driver driver_456
📉 Decreased acceptance rate for driver driver_456 from 100% to 95%
✅ Job auto-reassigned to driver: John Smith
✅ Expired 2/2 assignments
✅ Reassigned 2/2 assignments
```

### Check Pusher Dashboard

1. Go to https://dashboard.pusher.com/
2. Select your app
3. Go to **Debug Console**
4. Filter for channels:
   - `driver-*` → Should see `job-removed`, `acceptance-rate-updated`
   - `admin-orders` → Should see `order-status-changed`

### Check Database

```sql
-- Check expired assignments
SELECT 
  a.id,
  a.status,
  a.expiresAt,
  a.updatedAt,
  u.name as driverName,
  dp.acceptanceRate
FROM "Assignment" a
JOIN "Driver" d ON a.driverId = d.id
JOIN "User" u ON d.userId = u.id
LEFT JOIN "DriverPerformance" dp ON d.id = dp.driverId
WHERE a.status = 'declined'
  AND a.expiresAt < NOW()
  AND a.updatedAt > NOW() - INTERVAL '5 minutes'
ORDER BY a.updatedAt DESC;
```

---

## Step 4: Troubleshooting

### Issue: Cron job returns 401 Unauthorized

**Cause**: CRON_SECRET doesn't match

**Fix**:
1. Check CRON_SECRET in Render environment variables
2. Check Authorization header in cron service
3. Make sure format is: `Authorization: Bearer YOUR_SECRET_HERE`

**Test manually**:

```bash
curl -X GET https://speedy-van.co.uk/api/cron/expire-assignments \
  -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" \
  -v
```

---

### Issue: Cron job times out

**Cause**: Database query is slow or Prisma connection issues

**Fix**:
1. Check Render logs for errors
2. Increase timeout in cron service (60 seconds minimum)
3. Check database connection pooling
4. Check Neon database is not sleeping (Neon free tier sleeps after 5 min inactivity)

**Test database connection**:

```bash
psql 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -c "SELECT COUNT(*) FROM \"Assignment\" WHERE status = 'invited';"
```

---

### Issue: Assignments not expiring

**Cause**: Cron job not calling endpoint or logic error

**Debug steps**:

1. **Check cron service logs**:
   - EasyCron → Execution History
   - cron-job.org → Cronjob history
   - UptimeRobot → Logs

2. **Check Render logs**:
   - Should see log entries every minute
   - If no logs, cron is not calling endpoint

3. **Test manually**:

```bash
# Create a test assignment that expires in 1 minute
curl -X POST https://speedy-van.co.uk/api/test/create-expiring-assignment \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "YOUR_DRIVER_ID",
    "bookingId": "YOUR_BOOKING_ID",
    "expiresInMinutes": 1
  }'

# Wait 2 minutes, then check if expired
curl -X GET https://speedy-van.co.uk/api/cron/expire-assignments \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

### Issue: Pusher events not received

**Cause**: Pusher credentials wrong or channel not subscribed

**Fix**:

1. **Check Pusher credentials in Render**:
```
PUSHER_APP_ID=2034743
PUSHER_KEY=407cb06c423e6c032e9c
PUSHER_SECRET=bf769b4fd7a3cf95a803
PUSHER_CLUSTER=eu
```

2. **Check Pusher Debug Console**:
   - Should see events being triggered
   - Check channel names match: `driver-{driverId}`

3. **Check iOS app Pusher connection**:
   - App logs should show: "✅ Pusher connected successfully"
   - Should see: "📡 Subscribed to channel: driver-{id}"

---

## Step 5: Monitoring & Alerts

### Set up Email Alerts

**In EasyCron**:
1. Go to **Account → Notification Settings**
2. Enable "Email on Job Failure"
3. Add your email

**In cron-job.org**:
1. Go to **Settings → Notifications**
2. Enable "Email on execution failure"
3. Add your email

**In UptimeRobot**:
1. Go to **My Settings → Alert Contacts**
2. Add email and SMS (optional)

### Monitor Daily

**Daily checklist**:
- [ ] Check cron service execution history (should be 1440 executions per day)
- [ ] Check Render logs for errors
- [ ] Check Pusher dashboard for event counts
- [ ] Check database for acceptance rate updates

---

## Step 6: Scaling & Performance

### Current Performance

- **Executions per day**: 1440 (every minute)
- **API calls per day**: 1440
- **Database queries per execution**: ~3-5
- **Average execution time**: <2 seconds
- **Pusher events per expiry**: 3-4

### Free Tier Limits

**EasyCron Free**:
- 20 cron jobs
- Unlimited executions
- ✅ Sufficient for our needs

**cron-job.org Free**:
- Unlimited cron jobs
- Unlimited executions
- ✅ Sufficient for our needs

**Render Free**:
- 750 hours/month (sufficient)
- Database queries: depends on plan
- ✅ Should be sufficient

### If You Outgrow Free Tier

**Upgrade to Render Starter ($7/month)**:
- Includes built-in cron jobs
- No external service needed
- Better performance

**How to migrate to Render Starter**:

1. Add `render.yaml` with cron job:
```yaml
services:
  - type: web
    name: speedy-van-web
    env: node
    buildCommand: pnpm install && pnpm run build
    startCommand: pnpm start
    
  - type: cron
    name: expire-assignments
    env: node
    schedule: "* * * * *"
    buildCommand: pnpm install
    startCommand: curl -X GET https://speedy-van.co.uk/api/cron/expire-assignments -H "Authorization: Bearer $CRON_SECRET"
```

2. Upgrade to Starter plan
3. Disable external cron service

---

## Conclusion

Your cron job is now set up and will automatically expire assignments every minute. Monitor the logs and email alerts to ensure it's working correctly.

**Key Points**:
- ✅ Cron job calls endpoint every 1 minute (or 5 min for UptimeRobot)
- ✅ Expired assignments are marked as declined
- ✅ Acceptance rate decreased by 5%
- ✅ Auto-reassignment to next available driver
- ✅ Real-time notifications sent via Pusher
- ✅ Admin dashboard updated instantly
- ✅ Driver app updated instantly

**Support**:
- EasyCron: https://www.easycron.com/support
- cron-job.org: https://cron-job.org/en/support/
- UptimeRobot: https://uptimerobot.com/support
- Render: https://render.com/docs

---

**End of Setup Guide**









