# Driver App Deployment Guide

## Critical Issues Fixed

This guide documents the critical fixes applied to resolve driver app login failures and environment configuration issues.

---

## 🚨 Issues Identified and Fixed

### 1. **localhost Usage in Production Builds**
**Problem**: iOS and Expo apps were using `http://localhost:3000` in production builds, causing complete failure on physical devices.

**Fix Applied**:
- ✅ Updated `mobile/ios-driver-app/Config/AppConfig.swift` to use production URL
- ✅ Updated `mobile/expo-driver-app/src/config/api.ts` to fallback to production URL
- ✅ Added clear warnings about localhost not working on iOS devices

### 2. **Insecure Authentication Tokens**
**Problem**: Driver login was generating simple Base64 tokens instead of secure JWTs.

**Fix Applied**:
- ✅ Updated `/api/driver/auth/login` to use NextAuth JWT encoding
- ✅ Tokens now use `JWT_SECRET` for proper signing and verification
- ✅ Tokens expire after 30 days (appropriate for mobile apps)

### 3. **Missing Environment Variables**
**Problem**: EAS builds didn't have all required environment variables configured.

**Fix Applied**:
- ✅ Updated `mobile/expo-driver-app/eas.json` with all env vars:
  - `EXPO_PUBLIC_API_URL`
  - `EXPO_PUBLIC_PUSHER_KEY`
  - `EXPO_PUBLIC_PUSHER_CLUSTER`
- ✅ Created `.env.example` for reference (blocked by .gitignore)

### 4. **HTTP vs HTTPS Issues**
**Problem**: iOS requires HTTPS in production; HTTP connections are blocked by default.

**Fix Applied**:
- ✅ All apps now use `https://speedy-van.co.uk` for production
- ✅ Backend is properly configured with HTTPS on Render

---

## 📋 Environment Variables Setup

### Backend (Render / Production Server)

Ensure these variables are set in your **Render Dashboard** or **production environment**:

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Authentication
NEXTAUTH_SECRET=ZV6xh/oJhYk9wwrjX5RA5JgjC9uCSuWZHpIprjYs2LA=
NEXTAUTH_URL=https://speedy-van.co.uk
JWT_SECRET=b8a0e10574e514dfa383b30da00de05d

# Public URLs
NEXT_PUBLIC_API_URL=https://speedy-van.co.uk
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg

# Pusher (Real-time)
PUSHER_APP_ID=2034743
PUSHER_KEY=407cb06c423e6c032e9c
PUSHER_SECRET=bf769b4fd7a3cf95a803
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=407cb06c423e6c032e9c
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Email Service (ZeptoMail)
ZEPTO_API_URL=https://api.zeptomail.eu/v1.1/email
ZEPTO_API_KEY=Zoho-enczapikey yA6KbHsOvgmllm5SQ0A+05GD9Ys1//xoii+0syvhdcwhK4Llj6E8gxE/JdWyLmfd34OCsqhUOtoQc9q9vopefJQ3M9EEfJTGTuv4P2uV48xh8ciEYNYhgp6oA7UVFaRIcxggAiUwT/MkWA==
MAIL_FROM=noreply@speedy-van.co.uk

# SMS Service
THESMSWORKS_KEY=3a68c7e9-7159-4326-b886-bb853df9ba8a
THESMSWORKS_SECRET=a0a85d1a5d275ccc0e7d30a3d8b359803fccde8a9c03442464395b43c97e3720
THESMSWORKS_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkiOiIzYTY4YzdlOS03MTU5LTQzMjYtYjg4Ni1iYjg1M2RmOWJhOGEiLCJzZWNyZXQiOiJhMGE4NWQxYTVkMjc1Y2NjMGU3ZDMwYTNkOGIzNTk4MDNmY2NkZThhOWMwMzQ0MjQ2NDM5NWI0M2M5N2UzNzIwIiwiaWF0IjoxNzU2MzY4MTA0LCJleHAiOjI1NDQ3NjgxMDR9.tm3DX2_BZbgra_eEHpudL8GJI_RizeluKg7ujj-sik8

# Stripe (Live Keys)
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51Rp06mBpmFIwZiSMBP8AYxDhTznhg6vBscxblxthVbk52ilyB4zlnKrC2IcnvVyXF2dv0mvOd2whaTXCZIsEonFo00izEP3DhS
STRIPE_WEBHOOK_SECRET=whsec_1fe8d3923c5aad30a4df3fe785c2db5b13c1ccbb4d3c333b311b5b3f5e366b72

# General
NODE_ENV=production
PORT=3000
```

⚠️ **IMPORTANT**: 
- Never use quotes around environment variable values in Render
- Never change case of variable names
- Any new or modified variable requires **redeploying the server**

### Expo Driver App (EAS Build)

The environment variables are now configured in `mobile/expo-driver-app/eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://speedy-van.co.uk",
        "EXPO_PUBLIC_PUSHER_KEY": "407cb06c423e6c032e9c",
        "EXPO_PUBLIC_PUSHER_CLUSTER": "eu",
        "EXPO_PUBLIC_BUILD_ENV": "production"
      }
    }
  }
}
```

---

## 🚀 Deployment Steps

### Step 1: Backend Deployment (Render)

1. **Update Environment Variables**:
   ```bash
   # Go to Render Dashboard → Your Service → Environment
   # Add/update all variables listed above
   ```

2. **Run Database Migrations**:
   ```bash
   # If you modified Prisma schema
   pnpm run prisma:generate
   npx prisma migrate deploy
   ```

3. **Deploy Backend**:
   ```bash
   # Render auto-deploys on git push, or use manual deploy button
   git push origin main
   ```

4. **Verify Backend is Live**:
   ```bash
   curl https://speedy-van.co.uk/api/health
   ```

### Step 2: iOS Driver App Deployment (EAS)

1. **Navigate to Expo App**:
   ```bash
   cd mobile/expo-driver-app
   ```

2. **Install Dependencies** (if needed):
   ```bash
   pnpm install
   ```

3. **Build for iOS Production**:
   ```bash
   # Build for App Store submission
   npx eas build --platform ios --profile production
   
   # Or build for internal testing
   npx eas build --platform ios --profile preview
   ```

4. **Submit to App Store** (when ready):
   ```bash
   npx eas submit --platform ios --profile production
   ```

### Step 3: Verification

1. **Test Login Endpoint**:
   ```bash
   curl -X POST https://speedy-van.co.uk/api/driver/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"driver@test.com","password":"testpassword"}'
   ```

2. **Expected Response**:
   ```json
   {
     "success": true,
     "token": "eyJhbGci...long-jwt-token",
     "user": { ... },
     "driver": { ... }
   }
   ```

3. **Verify Token is JWT**:
   - Should be a long string (not short Base64)
   - Should have three parts separated by dots (header.payload.signature)
   - Can be decoded at https://jwt.io

---

## 🔧 Development Workflow

### Local Development with Physical iOS Device

⚠️ **NEVER use `localhost` for iOS device testing!**

**Option 1: Use Production API**
```bash
# In mobile/expo-driver-app/.env.local
EXPO_PUBLIC_API_URL=https://speedy-van.co.uk
```

**Option 2: Use Your Computer's IP**
```bash
# Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
EXPO_PUBLIC_DEV_API_URL=http://192.168.1.100:3000
```

**Option 3: Use ngrok Tunnel**
```bash
# Install ngrok: https://ngrok.com
ngrok http 3000

# Use the HTTPS URL provided
EXPO_PUBLIC_DEV_API_URL=https://your-tunnel.ngrok.io
```

---

## ✅ Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All environment variables are set in Render
- [ ] `DATABASE_URL` points to production database
- [ ] `NEXTAUTH_URL` is `https://speedy-van.co.uk` (not localhost)
- [ ] `JWT_SECRET` is set and secure
- [ ] All API URLs use HTTPS (not HTTP)
- [ ] Prisma migrations are up to date
- [ ] Backend is deployed and accessible via HTTPS
- [ ] EAS build configuration includes all env vars
- [ ] No `localhost` references in production code
- [ ] Driver login returns proper JWT token
- [ ] Mobile app can connect to backend via HTTPS

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to server"
**Cause**: App is trying to use localhost  
**Fix**: Verify `EXPO_PUBLIC_API_URL` is set to production URL

### Issue: "Invalid token" or "Token expired"
**Cause**: JWT_SECRET mismatch or old token format  
**Fix**: Redeploy backend with correct `JWT_SECRET`, re-login on app

### Issue: "SSL/Certificate error"
**Cause**: Backend not using HTTPS properly  
**Fix**: Ensure Render has SSL enabled and `NEXTAUTH_URL` uses https://

### Issue: "Environment variable not found"
**Cause**: Variable not set in deployment environment  
**Fix**: Add variable in Render dashboard, redeploy service

### Issue: iOS build fails
**Cause**: Missing dependencies or incorrect eas.json  
**Fix**: Run `pnpm install` and verify `eas.json` configuration

---

## 📞 Support

For issues:
- **Email**: support@speedy-van.co.uk
- **Phone**: 07901846297

---

## 🔒 Security Notes

1. **Never commit `.env.local`** - already in `.gitignore`
2. **Rotate secrets regularly** - especially `JWT_SECRET` and API keys
3. **Use HTTPS only** - HTTP is blocked by iOS in production
4. **Validate tokens server-side** - never trust client-provided tokens
5. **Monitor failed login attempts** - check audit logs regularly

---

## 📝 Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `mobile/ios-driver-app/Config/AppConfig.swift` | Changed `localhost` to production URL | iOS devices can't access localhost |
| `mobile/expo-driver-app/src/config/api.ts` | Added fallback to production URL | Safer default for builds |
| `mobile/expo-driver-app/eas.json` | Added all env vars to build profiles | EAS needs explicit env configuration |
| `apps/web/src/app/api/driver/auth/login/route.ts` | Replaced Base64 token with JWT | Security and proper authentication |

---

## ✨ What's Fixed

- ✅ Driver app can now log in from physical iOS devices
- ✅ Authentication uses secure JWT tokens with proper expiration
- ✅ All apps use production HTTPS URLs
- ✅ Environment variables properly configured for deployment
- ✅ No more localhost references in production code
- ✅ EAS builds include all required environment variables

**The driver app login should now work correctly in production!** 🎉

