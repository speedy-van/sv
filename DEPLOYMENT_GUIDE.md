# Speedy Van - Deployment Guide

## 🚀 Production Deployment Steps

### Prerequisites
- Node.js 22.x
- PostgreSQL 14+ (or Neon)
- Redis (for caching)
- Stripe account
- Pusher account
- Mapbox account

---

## 1. Environment Variables

Create `.env.production` with:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/speedy_van"
DIRECT_URL="postgresql://user:password@host:5432/speedy_van"

# NextAuth
NEXTAUTH_URL="https://speedy-van.co.uk"
NEXTAUTH_SECRET="your-secret-here"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Pusher
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="eu"

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN="pk...."

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

# Email (SendGrid)
SENDGRID_API_KEY="SG...."
```

---

## 2. Database Migration

```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed
```

---

## 3. Build & Deploy

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option B: Docker

```bash
# Build
docker build -t speedy-van .

# Run
docker run -p 3000:3000 speedy-van
```

### Option C: PM2

```bash
# Build
pnpm build

# Start with PM2
pm2 start ecosystem.config.js --env production
```

---

## 4. Post-Deployment Checklist

- [ ] Test booking flow
- [ ] Test driver earnings calculation
- [ ] Test Stripe payments
- [ ] Test real-time notifications
- [ ] Test mobile apps (iOS/Android)
- [ ] Monitor error logs
- [ ] Set up monitoring (Sentry/DataDog)
- [ ] Configure backups

---

## 5. Monitoring

### Logs
```bash
# Vercel
vercel logs

# PM2
pm2 logs speedy-van

# Docker
docker logs speedy-van
```

### Health Checks
- API: `https://speedy-van.co.uk/api/health`
- Database: `https://speedy-van.co.uk/api/health/db`

---

## 6. Rollback Procedure

```bash
# Vercel
vercel rollback

# PM2
pm2 reload speedy-van --update-env

# Docker
docker stop speedy-van
docker run -p 3000:3000 speedy-van:previous
```

---

## 7. Performance Optimization

- Enable CDN (Cloudflare/Vercel Edge)
- Configure Redis caching
- Optimize images (already using WebP/AVIF)
- Enable gzip compression
- Set up database connection pooling

---

## 8. Security

- [ ] Enable HTTPS
- [ ] Configure CORS
- [ ] Set up rate limiting
- [ ] Enable CSP headers
- [ ] Configure firewall rules
- [ ] Set up DDoS protection

---

## Support

For deployment issues, contact: support@speedy-van.co.uk

