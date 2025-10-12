# Cron Job Setup for Assignment Expiry

## Overview

The system requires a cron job to run **every minute** to check for expired driver assignments and automatically reassign them.

---

## Option 1: Vercel Cron (Recommended for Vercel Deployments)

### Setup Steps:

1. **Deploy `vercel.json`** (already created)
   ```json
   {
     "crons": [
       {
         "path": "/api/cron/expire-assignments",
         "schedule": "* * * * *"
       }
     ]
   }
   ```

2. **Set Environment Variable in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `CRON_SECRET` = `your-strong-random-secret-here`
   - **Important:** Generate a strong random secret:
     ```bash
     openssl rand -hex 32
     ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Verify:**
   - Check Vercel Dashboard → Functions → Cron Jobs
   - Should show: `* * * * *` running every minute

---

## Option 2: External Cron Service (For Non-Vercel Deployments)

### Recommended Services:
- **cron-job.org** (Free, reliable)
- **EasyCron** (Free tier available)
- **UptimeRobot** (Also monitors uptime)

### Setup with cron-job.org:

1. **Register at cron-job.org**

2. **Create New Cron Job:**
   - URL: `https://your-domain.com/api/cron/expire-assignments`
   - Schedule: `* * * * *` (every minute)
   - HTTP Method: `GET`
   - Custom Headers:
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```

3. **Test:**
   ```bash
   curl -X GET \
     -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://your-domain.com/api/cron/expire-assignments
   ```

4. **Expected Response:**
   ```json
   {
     "success": true,
     "message": "Expired 0 assignments",
     "expiredCount": 0,
     "timestamp": "2025-01-15T10:30:00.000Z"
   }
   ```

---

## Option 3: GitHub Actions (Free for Public/Private Repos)

### Setup:

1. **Create `.github/workflows/expire-assignments.yml`:**
   ```yaml
   name: Expire Assignments Cron

   on:
     schedule:
       - cron: '* * * * *' # Every minute
     workflow_dispatch: # Allow manual trigger

   jobs:
     expire-assignments:
       runs-on: ubuntu-latest
       steps:
         - name: Call Expiry Endpoint
           run: |
             curl -X GET \
               -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
               -f \
               https://your-domain.com/api/cron/expire-assignments
   ```

2. **Add Secret to GitHub:**
   - Go to GitHub Repo → Settings → Secrets → Actions
   - Add: `CRON_SECRET` = `your-strong-secret`

3. **Commit and Push:**
   ```bash
   git add .github/workflows/expire-assignments.yml
   git commit -m "Add cron job for assignment expiry"
   git push
   ```

4. **Verify:**
   - Go to GitHub → Actions tab
   - Should see workflow running every minute

---

## Option 4: AWS CloudWatch Events

### Setup:

1. **Create Lambda Function:**
   ```javascript
   exports.handler = async (event) => {
     const https = require('https');
     
     const options = {
       hostname: 'your-domain.com',
       path: '/api/cron/expire-assignments',
       method: 'GET',
       headers: {
         'Authorization': `Bearer ${process.env.CRON_SECRET}`
       }
     };
     
     return new Promise((resolve, reject) => {
       const req = https.request(options, (res) => {
         let data = '';
         res.on('data', (chunk) => { data += chunk; });
         res.on('end', () => {
           resolve({
             statusCode: res.statusCode,
             body: data
           });
         });
       });
       
       req.on('error', reject);
       req.end();
     });
   };
   ```

2. **Create CloudWatch Rule:**
   - Schedule: `rate(1 minute)`
   - Target: Lambda function created above

3. **Set Environment Variable:**
   - Lambda → Configuration → Environment Variables
   - Add: `CRON_SECRET` = `your-secret`

---

## Option 5: Google Cloud Scheduler

### Setup:

1. **Create Cloud Scheduler Job:**
   ```bash
   gcloud scheduler jobs create http expire-assignments \
     --schedule="* * * * *" \
     --uri="https://your-domain.com/api/cron/expire-assignments" \
     --http-method=GET \
     --headers="Authorization=Bearer YOUR_CRON_SECRET"
   ```

2. **Verify:**
   ```bash
   gcloud scheduler jobs list
   ```

---

## Testing

### Manual Test:
```bash
# Replace YOUR_CRON_SECRET with your actual secret
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -v \
  https://your-domain.com/api/cron/expire-assignments
```

### Expected Output:
```json
{
  "success": true,
  "message": "Expired 2 assignments, reassigned 2",
  "expiredCount": 2,
  "reassignedCount": 2,
  "results": [
    {
      "assignmentId": "assignment_123",
      "expired": true,
      "reassigned": true,
      "reassignedTo": "John Driver"
    },
    {
      "assignmentId": "assignment_456",
      "expired": true,
      "reassigned": true,
      "reassignedTo": "Jane Driver"
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Error Response (Unauthorized):
```json
{
  "error": "Unauthorized"
}
```
**Fix:** Check that `Authorization: Bearer YOUR_CRON_SECRET` header is correct.

---

## Monitoring

### Check Logs:

**Vercel:**
- Vercel Dashboard → Your Project → Functions → `/api/cron/expire-assignments`
- View execution logs

**Other Platforms:**
- Check your platform's function/cron logs
- Look for:
  - `⏰ Running assignment expiry check...`
  - `✅ Expired X assignments`
  - `✅ Reassigned Y assignments`

### Set Up Alerts:

**Option 1: Sentry/LogRocket**
```javascript
if (error) {
  Sentry.captureException(error, {
    tags: { cron: 'expire-assignments' }
  });
}
```

**Option 2: Email Notifications**
Add to cron endpoint:
```javascript
if (expiredCount > 10) {
  await sendAlert({
    to: 'admin@your-domain.com',
    subject: 'High number of expired assignments',
    body: `${expiredCount} assignments expired in last minute`
  });
}
```

---

## Troubleshooting

### Issue: Cron not running

**Check:**
1. Is `vercel.json` deployed?
   ```bash
   vercel ls
   ```

2. Is `CRON_SECRET` set correctly?
   ```bash
   vercel env ls
   ```

3. Test endpoint manually:
   ```bash
   curl -H "Authorization: Bearer SECRET" https://your-domain.com/api/cron/expire-assignments
   ```

### Issue: 401 Unauthorized

**Fix:**
- Verify `CRON_SECRET` environment variable matches the header
- Check that header is: `Authorization: Bearer YOUR_SECRET` (not just `YOUR_SECRET`)

### Issue: 500 Internal Server Error

**Check:**
1. Backend logs for errors
2. Database connection
3. Pusher credentials
4. Prisma client initialized

---

## Production Checklist

- [ ] `vercel.json` deployed
- [ ] `CRON_SECRET` environment variable set (strong random value)
- [ ] Cron job scheduled (every minute)
- [ ] Manual test successful
- [ ] Logs show cron running every minute
- [ ] Test with expired assignment (wait 30 min or manually set `expiresAt` in past)
- [ ] Verify auto-reassignment works
- [ ] Verify Pusher events sent
- [ ] Verify acceptance rate updated
- [ ] Monitoring/alerts set up

---

## Performance

### Expected Execution Time:
- **0 expired assignments**: < 100ms
- **1-10 expired assignments**: < 1 second
- **11-50 expired assignments**: < 3 seconds
- **51-100 expired assignments**: < 5 seconds

### Database Impact:
- 1 query per minute (find expired)
- 3 queries per expired assignment (update + penalty + reassign)
- Minimal load even with 100s of concurrent assignments

---

## Security

### Best Practices:
1. ✅ Use strong random `CRON_SECRET` (32+ characters)
2. ✅ Never commit secrets to Git
3. ✅ Rotate `CRON_SECRET` periodically (quarterly)
4. ✅ Monitor for unauthorized access attempts
5. ✅ Use HTTPS only

### Example Strong Secret:
```bash
openssl rand -hex 32
# Output: a3f8d9c2b1e4f5a6d7c8b9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0
```

---

## Questions?

If cron job is not working:
1. Check endpoint manually works: `curl -H "Authorization: Bearer SECRET" https://domain.com/api/cron/expire-assignments`
2. Check `CRON_SECRET` is set correctly
3. Check cron schedule is `* * * * *` (every minute)
4. Check backend logs for errors
5. Verify Vercel cron is enabled (Pro plan required)

---

**Last Updated:** 2025-01-15  
**Status:** ✅ READY FOR PRODUCTION

