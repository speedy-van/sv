# Speedy Van - Deployment Guide (Render.com)

## 🚀 Production Deployment on Render.com

### Prerequisites
- Render.com account
- GitHub repository connected
- PostgreSQL 14+ (Render PostgreSQL)
- Redis (Render Redis)
- Stripe account
- Pusher account
- Mapbox account

---

## 1. Create Render Services

### A. PostgreSQL Database

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Name: `speedy-van-db`
3. Region: **Frankfurt (EU Central)**
4. Plan: **Standard** (or higher for production)
5. Click **Create Database**
6. Copy the **Internal Database URL** (starts with `postgresql://`)

### B. Redis Instance

1. Go to Render Dashboard → **New** → **Redis**
2. Name: `speedy-van-redis`
3. Region: **Frankfurt (EU Central)**
4. Plan: **Standard**
5. Click **Create Redis**
6. Copy the **Internal Redis URL**

### C. Web Service (Next.js App)

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository: `speedy-van/sv`
3. Configure:
   - **Name**: `speedy-van-web`
   - **Region**: **Frankfurt (EU Central)**
   - **Branch**: `main`
   - **Root Directory**: `apps/web`
   - **Runtime**: **Node**
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start`
   - **Plan**: **Standard** (or higher)

---

## 2. Environment Variables (Render Dashboard)

Add these in **Web Service** → **Environment** tab:

```bash
# Database
DATABASE_URL=<Internal Database URL from step 1A>
DIRECT_URL=<Internal Database URL from step 1A>

# NextAuth
NEXTAUTH_URL=https://speedy-van.onrender.com
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pusher
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk....

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Email (SendGrid)
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@speedy-van.co.uk

# Redis
REDIS_URL=<Internal Redis URL from step 1B>

# Node Environment
NODE_ENV=production
```

---

## 3. Database Migration

### Option A: Render Shell (Recommended)

1. Go to **Web Service** → **Shell** tab
2. Run:
```bash
cd apps/web
npx prisma migrate deploy
npx prisma db seed
```

### Option B: Local with Production DB

```bash
# Set DATABASE_URL to production
export DATABASE_URL="<production-db-url>"

# Run migrations
npx prisma migrate deploy

# Seed data
npx prisma db seed
```

---

## 4. Custom Domain Setup

1. Go to **Web Service** → **Settings** → **Custom Domains**
2. Click **Add Custom Domain**
3. Enter: `speedy-van.co.uk`
4. Add DNS records to your domain provider:
   ```
   Type: CNAME
   Name: @
   Value: speedy-van.onrender.com
   
   Type: CNAME
   Name: www
   Value: speedy-van.onrender.com
   ```
5. Wait for SSL certificate (automatic, ~5 minutes)

---

## 5. Deploy

### Automatic Deployment (Recommended)

- Push to `main` branch → Render auto-deploys
- Monitor deployment in **Logs** tab

### Manual Deployment

1. Go to **Web Service** → **Manual Deploy**
2. Click **Deploy latest commit**

---

## 6. Cron Jobs (Background Tasks)

Create **Cron Jobs** in Render:

### A. Expire Assignments (Every 5 minutes)

1. **New** → **Cron Job**
2. Name: `expire-assignments`
3. Command: `curl -X POST https://speedy-van.onrender.com/api/cron/expire-assignments -H "Authorization: Bearer $CRON_SECRET"`
4. Schedule: `*/5 * * * *`

### B. Daily Reports (Every day at 2 AM)

1. **New** → **Cron Job**
2. Name: `daily-reports`
3. Command: `curl -X POST https://speedy-van.onrender.com/api/cron/daily-reports -H "Authorization: Bearer $CRON_SECRET"`
4. Schedule: `0 2 * * *`

**Note**: Add `CRON_SECRET` to environment variables (generate with `openssl rand -hex 32`)

---

## 7. Post-Deployment Checklist

- [ ] Test booking flow: https://speedy-van.onrender.com
- [ ] Test driver earnings calculation
- [ ] Test Stripe payments (live mode)
- [ ] Test real-time notifications (Pusher)
- [ ] Test mobile apps (iOS/Android) with production API
- [ ] Monitor error logs in Render Dashboard
- [ ] Set up monitoring (Sentry)
- [ ] Configure database backups (Render auto-backups enabled)
- [ ] Test custom domain SSL
- [ ] Verify cron jobs running

---

## 8. Monitoring & Logs

### View Logs
1. Go to **Web Service** → **Logs** tab
2. Real-time logs appear automatically

### Health Checks
- API: `https://speedy-van.onrender.com/api/health`
- Database: `https://speedy-van.onrender.com/api/health/db`

### Metrics
- Go to **Web Service** → **Metrics** tab
- Monitor CPU, Memory, Response Time

---

## 9. Scaling

### Vertical Scaling (More Power)
1. Go to **Web Service** → **Settings**
2. Change **Instance Type** to higher plan

### Horizontal Scaling (More Instances)
1. Go to **Web Service** → **Settings** → **Scaling**
2. Increase **Number of Instances**

**Recommended for production:**
- **Instance Type**: Standard Plus ($25/month)
- **Instances**: 2-3 (for high availability)

---

## 10. Rollback Procedure

### Option A: Render Dashboard
1. Go to **Web Service** → **Events** tab
2. Find previous successful deployment
3. Click **Rollback to this version**

### Option B: Git Revert
```bash
# Revert last commit
git revert HEAD
git push origin main

# Render will auto-deploy the reverted version
```

---

## 11. Performance Optimization

### Already Configured:
- ✅ Image optimization (WebP/AVIF)
- ✅ Code splitting
- ✅ Redis caching
- ✅ Database connection pooling

### Additional Optimizations:
1. **Enable CDN**: Use Cloudflare in front of Render
2. **Database Indexes**: Already optimized in schema
3. **Redis Caching**: Implement for frequently accessed data
4. **Background Jobs**: Use Render Cron Jobs (configured above)

---

## 12. Security

### Already Configured:
- ✅ HTTPS (automatic with Render)
- ✅ Environment variables encrypted
- ✅ Database internal networking
- ✅ CORS configured
- ✅ Rate limiting (in middleware)

### Additional Security:
1. **DDoS Protection**: Enable Cloudflare
2. **Firewall**: Configure in Render settings
3. **Secrets Rotation**: Rotate API keys quarterly
4. **Database Backups**: Automatic daily backups (Render)

---

## 13. Backup & Disaster Recovery

### Database Backups (Automatic)
- Render PostgreSQL: Daily automatic backups (7-day retention)
- Manual backup: **Database** → **Backups** → **Create Backup**

### Restore from Backup
1. Go to **Database** → **Backups**
2. Select backup
3. Click **Restore**

### Full System Restore
1. Create new Render services
2. Restore database from backup
3. Deploy from Git (automatic)
4. Update DNS if needed

---

## 14. Cost Estimation (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Web Service | Standard Plus | $25 |
| PostgreSQL | Standard | $20 |
| Redis | Standard | $10 |
| **Total** | | **$55/month** |

**Note**: Prices as of 2025. Check Render.com for current pricing.

---

## 15. Troubleshooting

### Build Fails
- Check **Logs** tab for errors
- Verify `pnpm install` succeeds
- Ensure all dependencies in `package.json`

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check database is running
- Test connection: `npx prisma db pull`

### Cron Jobs Not Running
- Verify `CRON_SECRET` is set
- Check cron job logs in Render
- Test manually: `curl -X POST https://speedy-van.onrender.com/api/cron/expire-assignments -H "Authorization: Bearer YOUR_CRON_SECRET"`

---

## Support

For deployment issues:
- Render Support: https://render.com/docs
- Speedy Van: support@speedy-van.co.uk

---

## Quick Deploy Checklist

- [ ] Create PostgreSQL database on Render
- [ ] Create Redis instance on Render
- [ ] Create Web Service connected to GitHub
- [ ] Add all environment variables
- [ ] Run database migrations
- [ ] Configure custom domain
- [ ] Set up cron jobs
- [ ] Test all features
- [ ] Monitor logs for 24 hours
- [ ] Set up alerts

**Deployment Time**: ~30 minutes
**Status**: ✅ **Production Ready**

---

## 👥 Development Team

* **Lead Developer:** *Mr. Ahmad Alwakai*
* **Team:** *Speedy Van Technical Team* (internal full-stack engineers, backend specialists, and mobile developers)
* **Core Stack:** Next.js, Node.js, TypeScript, Prisma, PostgreSQL, Expo (React Native), Chakra UI
* **Infrastructure:** Neon (PostgreSQL), Render (hosting), Stripe (payments), Pusher (real-time), ZeptoMail (email)

**Support:** support@speedy-van.co.uk | +44 7901 846297

