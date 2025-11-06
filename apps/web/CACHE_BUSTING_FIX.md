# Cache Busting Fix for Production Deployments

## Problem
Users (especially on iPhones) were seeing old versions of the website after deployments because:
1. CDN (Render) was serving stale JS/CSS files from `/_next/static/`
2. Service Worker was caching old chunks
3. Browser cache was reusing outdated assets
4. Build system was reusing same hash names for chunks

## Solution Implemented

### 1. Service Worker Updates (`public/sw.js`)
- **Never cache Next.js static chunks** (`/_next/static/`)
- Always fetch from network for `/_next/static/` files
- Force fresh fetch for CSS files
- Clear all caches on service worker activation

### 2. Next.js Configuration (`next.config.mjs`)
- **Unique Build ID**: Each build generates a unique ID using timestamp + random string
- **Standalone Output**: Ensures each deployment generates completely new chunks
- **Cache Headers**: Added `X-Content-Hash` header for cache busting
- **ETag Disabled**: Prevents stale cache validation

### 3. Middleware Updates (`src/middleware.ts`)
- **Cache Busting Headers**: Added `X-Content-Hash` and `ETag` headers for `/_next/static/` files
- Forces revalidation for Next.js chunks

### 4. Layout Updates (`src/app/layout.tsx`)
- **Service Worker Unregister**: Automatically unregisters all service workers on page load
- **Cache Clear**: Clears all caches on page load
- Prevents stale cache from being served

## How to Force CDN Cache Purge

### Option 1: Render.com Dashboard
1. Go to Render.com dashboard
2. Select your service
3. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
4. This will force a fresh build and clear CDN cache

### Option 2: Render.com CLI
```bash
# Install Render CLI
npm install -g render-cli

# Login to Render
render login

# Force deploy with cache clear
render deploy --clear-cache
```

### Option 3: Environment Variable
Add to Render.com environment variables:
```
NEXT_BUILD_ID=$(date +%s)-$(openssl rand -hex 8)
```

This ensures each build has a unique ID.

### Option 4: Manual Cache Clear (Emergency)
If users still see old versions:
1. Add a query parameter to force refresh: `?v=$(date +%s)`
2. Or use hard refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
3. Clear browser cache manually

## Testing

### Before Deploy
1. Check current build ID in `.next/BUILD_ID`
2. Note the chunk hashes in `.next/static/`

### After Deploy
1. Verify new build ID is different
2. Check chunk hashes are different
3. Test in incognito/private mode
4. Test on iPhone Safari (most problematic)

### Verify Cache Busting
1. Open DevTools → Network tab
2. Check `/_next/static/` files
3. Verify `X-Content-Hash` header is present
4. Verify files have new hashes

## Monitoring

### Check Service Worker Status
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(console.log);
```

### Check Cache Status
```javascript
// In browser console
caches.keys().then(console.log);
```

### Force Unregister Service Worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
```

## Notes

- **Service Worker**: Currently disabled/unregistered on every page load to prevent stale cache
- **Build ID**: Generated automatically on each build
- **CDN Cache**: Should be cleared after each deploy (use Render.com dashboard)
- **Browser Cache**: Cleared automatically via service worker unregister script

## Future Improvements

1. **Selective Service Worker**: Re-enable service worker but exclude `/_next/static/` from cache
2. **Versioned Service Worker**: Use build ID in service worker filename
3. **CDN Integration**: Automatically purge CDN cache on deploy via webhook
4. **Cache Headers**: Use `Cache-Control: no-cache` for HTML, `immutable` for static assets

