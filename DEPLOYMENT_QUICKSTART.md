# Speedy Van - Deployment Quick Start Guide

This guide provides step-by-step instructions for deploying the Speedy Van system to Render.com.

---

## Prerequisites

Before starting, ensure you have:

1. **GitHub Account** with access to the speedy-van repository
2. **Render.com Account** (free tier available)
3. **Database** - Either Neon (recommended) or Render Postgres
4. **API Keys** for third-party services:
   - Pusher (real-time notifications)
   - Stripe (payments)
   - Zepto Mail (email service)
   - TheSMSWorks (SMS service)
   - Mapbox (maps and geocoding)
   - Weather API (optional)
   - OpenAI API (optional)

---

## Step 1: Prepare Database

### Option A: Neon (Recommended)

Neon provides a serverless Postgres database with excellent performance and a generous free tier.

1. Go to [neon.tech](https://neon.tech)
2. Sign up or log in
3. Create a new project
4. Name it "speedy-van-production"
5. Select region: **Europe (Frankfurt)** for best performance with Render
6. Copy the connection string (starts with `postgresql://`)
7. Keep this connection string safe - you'll need it in Step 3

### Option B: Render Postgres

Alternatively, use Render's managed Postgres database.

1. In Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Configure:
   - Name: `speedyvan-db`
   - Database: `speedyvan`
   - Plan: Starter (or Free for testing)
   - Region: Frankfurt
4. Click "Create Database"
5. Wait for provisioning
6. Copy the "Internal Database URL"

---

## Step 2: Create Render Web Service

### Method A: Using Blueprint (Recommended)

This method uses the `render.yaml` file for automatic configuration.

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository: `speedy-van/speedy-van`
4. Select the repository
5. Render will detect `render.yaml` automatically
6. Click "Apply"
7. Proceed to Step 3 for environment variables

### Method B: Manual Setup

If you prefer manual configuration:

1. Click "New +" → "Web Service"
2. Connect GitHub repository
3. Configure:
   - **Name:** `speedy-van-web`
   - **Runtime:** Node
   - **Region:** Frankfurt
   - **Branch:** main
   - **Root Directory:** `apps/web`
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`
4. Click "Create Web Service"
5. Proceed to Step 3

---

## Step 3: Configure Environment Variables

In the Render dashboard for your web service, go to "Environment" and add these variables:

### Required Variables

```bash
# Node Environment
NODE_ENV=production

# Database (from Step 1)
DATABASE_URL=postgresql://user:password@host/database

# NextAuth (Render will auto-generate if you use generateValue)
NEXTAUTH_SECRET=<click "Generate" button>
NEXTAUTH_URL=https://speedy-van-web.onrender.com

# Pusher (Real-time notifications)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Zepto Mail)
ZEPTO_API_URL=https://api.zeptomail.eu/v1.1/email
ZEPTO_API_KEY=your_zepto_api_key
MAIL_FROM=noreply@speedy-van.co.uk

# SMS (TheSMSWorks)
THESMSWORKS_KEY=your_sms_key
THESMSWORKS_SECRET=your_sms_secret
THESMSWORKS_JWT=your_sms_jwt

# Maps (Mapbox)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# Security
JWT_SECRET=<click "Generate" button>
CRON_SECRET=<click "Generate" button>

# Company Info
NEXT_PUBLIC_COMPANY_NAME=Speedy Van
NEXT_PUBLIC_COMPANY_PHONE=+44 7901846297
NEXT_PUBLIC_COMPANY_EMAIL=support@speedy-van.co.uk
```

### Optional Variables

```bash
# Weather API (if using weather features)
NEXT_PUBLIC_WEATHER_API_KEY=your_weather_api_key

# OpenAI (if using AI features)
OPENAI_API_KEY=sk-...

# Custom domain (if configured)
NEXT_PUBLIC_SITE_URL=https://speedy-van.co.uk
```

**Important Notes:**
- Click the "Generate" button for secrets instead of manually creating them
- Never commit these values to Git
- Keep a secure backup of all credentials
- Use production API keys, not test keys

---

## Step 4: Deploy

### First Deployment

1. After adding environment variables, Render will automatically start building
2. Monitor the build logs in the "Logs" tab
3. Build process takes approximately 5-10 minutes
4. Wait for "Build succeeded" message
5. Service will automatically start

### Verify Deployment

1. Open the service URL: `https://speedy-van-web.onrender.com`
2. Check health endpoint: `https://speedy-van-web.onrender.com/api/health`
3. Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2025-10-12T10:30:00.000Z",
     "uptime": 3600,
     "cronJobsInitialized": true,
     "environment": "production"
   }
   ```

---

## Step 5: Run Database Migrations

After the first successful deployment, you need to run database migrations.

### Using Render Shell

1. In Render dashboard, go to your web service
2. Click "Shell" tab
3. Run the following commands:
   ```bash
   cd apps/web
   npx prisma migrate deploy
   npx prisma db seed  # Optional: seed initial data
   ```

### Using Local Terminal

Alternatively, run migrations from your local machine:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://user:password@host/database"

# Run migrations
cd apps/web
npx prisma migrate deploy
```

---

## Step 6: Configure Custom Domain (Optional)

If you have a custom domain (e.g., speedy-van.co.uk):

### In Render Dashboard

1. Go to your web service
2. Click "Settings" → "Custom Domains"
3. Click "Add Custom Domain"
4. Enter your domain: `speedy-van.co.uk`
5. Render will provide DNS records

### In Your DNS Provider

Add the following DNS records (provided by Render):

```
Type: CNAME
Name: www
Value: speedy-van-web.onrender.com

Type: A
Name: @
Value: [IP address from Render]
```

### Update Environment Variables

After DNS propagation (24-48 hours):

1. Update `NEXTAUTH_URL` to `https://speedy-van.co.uk`
2. Update `NEXT_PUBLIC_SITE_URL` to `https://speedy-van.co.uk`
3. Redeploy the service

---

## Step 7: Configure Third-Party Services

### Stripe Webhooks

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to Developers → Webhooks
3. Click "Add endpoint"
4. Enter URL: `https://your-domain.com/api/webhooks/stripe`
5. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
6. Copy the webhook secret
7. Add to Render environment variables as `STRIPE_WEBHOOK_SECRET`

### Pusher Configuration

1. Go to [Pusher Dashboard](https://dashboard.pusher.com)
2. Create a new app or use existing
3. Configure:
   - Cluster: EU (eu)
   - Enable client events: Yes
4. Copy credentials to Render environment variables

### Email Configuration (Zepto Mail)

1. Go to [Zepto Mail Dashboard](https://www.zoho.com/zeptomail/)
2. Verify your sending domain
3. Create API key
4. Add to Render environment variables

---

## Step 8: Test Production Deployment

### Web Application Tests

1. **Homepage:** Visit `https://your-domain.com`
   - Should load without errors
   - Check browser console for errors

2. **Booking Flow:** Test creating a booking
   - Enter pickup and dropoff addresses
   - Select vehicle type
   - Get instant quote
   - Complete booking (test mode)

3. **Admin Dashboard:** Login as admin
   - Navigate to `/admin`
   - Check all sections load
   - Verify data displays correctly

4. **API Endpoints:** Test key endpoints
   - `/api/health` - Should return healthy status
   - `/api/pricing/comprehensive` - Should return pricing
   - `/api/driver/jobs/available` - Should return jobs

### Mobile App Tests

1. **Update API URL** in mobile apps:
   ```swift
   // iOS: NetworkService.swift
   static let baseURL = "https://your-domain.com/api"
   ```
   
   ```typescript
   // Android: api.config.ts
   export const API_BASE_URL = "https://your-domain.com/api"
   ```

2. **Test iOS App:**
   - Build and run on device/simulator
   - Login as driver
   - Check available jobs load
   - Test job details view
   - Verify earnings display

3. **Test Android App:**
   - Build and run on device/emulator
   - Login as driver
   - Check available jobs load
   - Test job details screen
   - Verify earnings display

### Cron Jobs Verification

1. Check logs for cron initialization:
   ```
   🚀 Initializing cron jobs...
   ✅ All cron jobs initialized
   ```

2. Verify assignment expiry runs every minute
3. Check database for expired assignments being updated

---

## Step 9: Monitor and Maintain

### Regular Monitoring

1. **Check Health Endpoint Daily:**
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Monitor Render Logs:**
   - Check for errors
   - Monitor response times
   - Track cron job execution

3. **Database Performance:**
   - Monitor query performance
   - Check connection pool usage
   - Review slow queries

### Backups

1. **Database Backups:**
   - Neon: Automatic backups included
   - Render Postgres: Configure backup schedule

2. **Code Backups:**
   - Maintained in GitHub repository
   - Create tags for releases

3. **Environment Variables:**
   - Keep secure backup of all credentials
   - Document all configuration

### Updates

1. **Deploy Updates:**
   ```bash
   git push origin main
   # Render auto-deploys on push
   ```

2. **Manual Deploy:**
   - In Render dashboard, click "Manual Deploy"
   - Select branch and deploy

3. **Rollback:**
   - In Render dashboard, click "Rollback"
   - Select previous deployment

---

## Troubleshooting

### Build Fails

**Error: "pnpm not found"**
- Solution: Ensure `packageManager` is set in `package.json`
- Render auto-installs pnpm based on this field

**Error: "Module not found"**
- Solution: Clear build cache in Render dashboard
- Redeploy with "Clear build cache & deploy"

### Database Connection Issues

**Error: "Connection timeout"**
- Check DATABASE_URL is correct
- Verify database is running
- Check firewall rules (Neon/Render)

**Error: "SSL required"**
- Add `?sslmode=require` to DATABASE_URL
- Example: `postgresql://user:pass@host/db?sslmode=require`

### Environment Variables

**Changes not taking effect:**
- After updating env vars, manually redeploy
- Render doesn't auto-redeploy on env var changes

### Cron Jobs Not Running

**Check logs for initialization:**
- Should see "Cron jobs initialized" in logs
- If not, check health endpoint is being called
- Render pings health endpoint automatically

### Mobile Apps Can't Connect

**Check API URL:**
- Ensure using production URL, not localhost
- Verify HTTPS is used
- Check CORS configuration

---

## Performance Optimization

### After Initial Deployment

1. **Enable CDN:**
   - Render includes CDN by default
   - Verify static assets are cached

2. **Database Optimization:**
   - Review slow query logs
   - Add indexes where needed
   - Optimize N+1 queries

3. **Monitoring:**
   - Set up error tracking (Sentry)
   - Configure performance monitoring
   - Set up uptime monitoring

---

## Security Checklist

- [ ] All secrets use environment variables
- [ ] No secrets committed to Git
- [ ] HTTPS enabled (automatic with Render)
- [ ] Database uses SSL
- [ ] API routes are protected
- [ ] Admin routes require authentication
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Webhook signatures verified
- [ ] Input validation on all forms

---

## Support

For deployment issues:

1. **Check Render Documentation:** [render.com/docs](https://render.com/docs)
2. **Review Application Logs:** In Render dashboard
3. **Check Health Endpoint:** `/api/health`
4. **Verify Environment Variables:** All required vars set
5. **Database Connection:** Test with Prisma Studio

---

## Next Steps

After successful deployment:

1. **Configure Google Analytics** for tracking
2. **Set up Google Search Console** for SEO
3. **Configure Google Ads** campaigns
4. **Set up monitoring and alerts**
5. **Create backup and disaster recovery plan**
6. **Document operational procedures**
7. **Train team on production system**

---

**Deployment Complete!** 🎉

Your Speedy Van system is now live and ready to serve customers.

