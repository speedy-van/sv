# 🧹 Cache Clear Instructions - Safari 17+ Fix (iPhone 15-17)

## 🎯 Problem
Safari 17+ on iPhone 15-17 is serving **stale cached versions** of `WhereAndWhatStep.tsx` component, causing:
- Layout breaks on mobile
- CSS not loading correctly
- Component re-rendering from cache instead of new build

## ✅ Solution Steps

### 1. Clear Local Build Cache

```bash
# Navigate to project root
cd apps/web

# Remove Next.js build cache
rm -rf .next

# Remove Node.js cache
rm -rf node_modules/.cache

# Clean install (optional but recommended)
rm -rf node_modules
pnpm install

# Rebuild with clean cache
pnpm run build
```

### 2. Clear CDN Cache (Vercel)

If you're using **Vercel**:

1. Go to Vercel Dashboard → Your Project
2. Navigate to **Deployments** tab
3. Find the latest deployment
4. Click **⋯** (three dots) → **Redeploy**
5. **IMPORTANT**: Check **"Clear build cache"** checkbox
6. Click **Redeploy**

### 3. Clear CDN Cache (Cloudflare/Nginx)

If using **Cloudflare**:
```bash
# Purge cache for these paths:
/_next/static/css/*
/_next/static/chunks/*
/_next/static/js/*
```

If using **Nginx**:
```bash
# Clear cache directory
rm -rf /var/cache/nginx/*
# Or restart nginx
sudo systemctl restart nginx
```

### 4. Clear Browser Cache on iPhone

**Method 1: Safari Settings**
1. Settings → Safari
2. Clear History and Website Data
3. Confirm

**Method 2: Console Command (Developer Mode)**
Open Safari DevTools on iPhone (via Mac Safari → Develop → iPhone):
```javascript
// Unregister Service Workers
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(r => r.unregister())
);

// Clear all caches
caches.keys().then(names => 
  Promise.all(names.map(name => caches.delete(name)))
);

// Hard reload
location.reload(true);
```

**Method 3: Private Browsing**
1. Open Safari in Private Browsing mode
2. Test the booking-luxury page
3. This bypasses all cache

### 5. Verify Cache is Cleared

After clearing cache, check:
1. Open Safari DevTools → Network tab
2. Reload the page
3. Look for `WhereAndWhatStep` in network requests
4. Check **Response Headers**:
   - Should NOT have `Cache-Control: max-age=31536000`
   - Should have fresh `ETag` or no `ETag` (if `generateEtags: false`)
5. Check **Response**:
   - Should show latest version (check console logs for "Dataset Validation Fix v3.1")

### 6. Configuration Changes Applied

The following config changes have been applied to prevent cache issues:

**`next.config.mjs`:**
- ✅ `generateEtags: false` - Disables ETags
- ✅ `onDemandEntries.maxInactiveAge: 0` - Disables page caching
- ✅ `onDemandEntries.pagesBufferLength: 0` - No page buffering
- ✅ `experimental.optimisticClientCache: false` - Forces fresh components
- ✅ `compiler.removeConsole: false` - Keeps console logs for debugging

**`layout.tsx`:**
- ✅ Service Worker auto-unregister script
- ✅ Cache API auto-clear script

## 🔍 Troubleshooting

### If cache still persists:

1. **Check Service Worker Status:**
   ```javascript
   navigator.serviceWorker.getRegistrations().then(console.log);
   ```

2. **Check Cache Storage:**
   ```javascript
   caches.keys().then(console.log);
   ```

3. **Force Hard Reload:**
   - Hold Shift + Click Reload button
   - Or: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

4. **Check Build Hash:**
   - Open `.next/BUILD_ID` file
   - Compare with previous build
   - If same, rebuild with `rm -rf .next && pnpm run build`

## 📝 Notes

- These cache-clearing configurations are **temporary** for debugging
- After confirming the fix works, you may want to re-enable caching for performance
- Monitor console logs for cache-related messages
- The Service Worker unregister script runs automatically on page load

## 🚀 After Cache Clear

Once cache is cleared:
1. Test on iPhone 15/16/17 Safari
2. Verify layout displays correctly
3. Check console for "WhereAndWhatStep loaded" message (should appear once, not multiple times)
4. Verify CSS chunks load correctly (no "Refused to execute script" errors)

---

**Last Updated:** 2025-11-05
**Related Issues:** Safari 17+ cache issues, iPhone 15-17 layout breaks







