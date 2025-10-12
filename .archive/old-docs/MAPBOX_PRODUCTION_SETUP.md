# Mapbox Production Setup Guide

## Issue Description

In development, both "address suggestions (autocomplete)" and "use current location" work correctly with Mapbox API. However, in production, only "use my current location" works while autocomplete fails.

## Root Cause Analysis

The problem is caused by **inconsistent environment variable naming**:

- **Code expects**: `NEXT_PUBLIC_MAPBOX_TOKEN`
- **Environment files have**: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

This mismatch prevents the frontend from accessing the Mapbox token in production.

## Solution Steps

### 1. Fix Environment Variable Names

**Update all environment files to use the correct variable name:**

```bash
# Change from:
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here

# To:
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

**Files updated:**

- ✅ `env.example`
- ✅ `env.production`
- ✅ `env.example.backup`

### 2. Mapbox Dashboard Configuration

**Create a Public Token with proper scopes:**

1. Go to [Mapbox Dashboard](https://account.mapbox.com/)
2. Navigate to "Access Tokens"
3. Create a new token with these scopes:
   - `geocoding:read`
   - `styles:read`
   - `tiles:read`
   - `fonts:read`

**Set allowed URLs:**

- `http://localhost:3000` (development)
- `https://speedy-van.onrender.com` (production)
- `https://speedy-van.co.uk` (production domain)

### 3. Production Environment Variables

**In Render dashboard, set:**

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk_xxxxxxxxxxxxx
```

**Important:** The token must start with `pk_` (public key), not `sk_` (secret key).

### 4. Content Security Policy (CSP)

**CSP headers have been added to middleware to allow Mapbox:**

```typescript
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
  "img-src 'self' data: blob: https://*.mapbox.com",
  "connect-src 'self' https://api.mapbox.com https://events.mapbox.com",
  "font-src 'self' https://api.mapbox.com",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];
```

### 5. Code Verification

**Ensure these components use the correct environment variable:**

- ✅ `AddressAutocomplete.tsx` - Uses `/api/places/suggest` endpoint
- ✅ `ServiceMapSection.tsx` - Uses `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`
- ✅ `LiveMap.tsx` - Uses `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`
- ✅ `addressService.ts` - Uses `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`

**API endpoints properly configured:**

- ✅ `/api/places/suggest` - Falls back to `NEXT_PUBLIC_MAPBOX_TOKEN`
- ✅ `/api/places/reverse` - Falls back to `NEXT_PUBLIC_MAPBOX_TOKEN`

### 6. Deployment Steps

1. **Update Render environment variables** with the correct token
2. **Clear build cache** in Render dashboard
3. **Redeploy** the application
4. **Test autocomplete** functionality in production

### 7. Testing

**Verify the fix:**

1. Navigate to booking form in production
2. Start typing an address
3. Check browser console for any errors
4. Verify autocomplete suggestions appear
5. Test address selection

### 8. Monitoring

**Check for these in production logs:**

- ✅ No "Missing MAPBOX_TOKEN" warnings
- ✅ Successful API calls to `api.mapbox.com`
- ✅ Proper CSP headers in response

## Troubleshooting

### If autocomplete still fails:

1. **Check browser console** for CSP violations
2. **Verify environment variable** is set correctly in Render
3. **Check Mapbox token permissions** and allowed domains
4. **Clear browser cache** and test again
5. **Check network tab** for failed requests to Mapbox

### Common issues:

- **Token format**: Must be `pk_` not `sk_`
- **Domain restrictions**: Ensure production domain is allowed
- **CSP blocking**: Check if CSP headers are being applied
- **Build cache**: Clear Render build cache before redeploy

## Security Notes

- **Public tokens** are safe to expose in frontend code
- **Secret tokens** should never be exposed to the browser
- **Domain restrictions** limit token usage to authorized sites
- **CSP headers** provide additional security layer

## Files Modified

- `env.example` - Fixed variable name
- `env.production` - Fixed variable name
- `env.example.backup` - Fixed variable name
- `src/middleware.ts` - Added CSP headers for Mapbox

## Next Steps

1. ✅ Environment variable names fixed
2. ✅ CSP headers added to middleware
3. 🔄 Update Render environment variables
4. 🔄 Redeploy application
5. 🔄 Test autocomplete functionality
6. 🔄 Monitor production logs
