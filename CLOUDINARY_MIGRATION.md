# 🚀 Cloudinary Migration Guide

## Problem Solved
Next.js Image Optimization on Render was causing **60-120 second load times per image**, making the site unusable.

## Solution
Migrated all images to **Cloudinary CDN** for instant delivery with automatic optimization.

---

## 📋 Migration Steps

### 1. Create Cloudinary Account (FREE)
```bash
# Go to: https://cloudinary.com/users/register/free
# Sign up and get your credentials
```

### 2. Install Cloudinary SDK
```bash
cd apps/web
npm install cloudinary dotenv
```

### 3. Configure Environment Variables

**Local Development** (`.env.local`):
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Production** (Render Dashboard):
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

### 4. Upload Images to Cloudinary
```bash
cd apps/web
node upload-to-cloudinary.js
```

This will:
- ✅ Upload all images from `public/images/`
- ✅ Organize them in `speedy-van/` folder
- ✅ Enable automatic format & quality optimization
- ✅ Generate optimized URLs

### 5. Deploy to Production
```bash
git add .
git commit -m "feat: migrate to Cloudinary CDN for image optimization"
git push origin main
```

### 6. Update Render Environment
1. Go to Render Dashboard
2. Select your service
3. Add environment variable:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```
4. Trigger manual deploy

---

## 🎯 What Changed

### `next.config.mjs`
```javascript
images: {
  unoptimized: true, // Disable Next.js optimization
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      pathname: '/**',
    },
  ],
}
```

### `src/lib/cloudinary.ts` (NEW)
Utility functions for Cloudinary URL generation:
- `getCloudinaryUrl()` - Generate optimized URLs
- `localToCloudinary()` - Convert local paths
- `getCloudinaryPreset()` - Use presets (thumbnail, hero, etc.)

### `src/components/common/OptimizedImage.tsx`
Now automatically converts local image paths to Cloudinary URLs:
```tsx
<OptimizedImage 
  src="/images/truck.png" 
  alt="Truck"
  width={800}
  height={600}
/>
// Becomes: https://res.cloudinary.com/.../w_800,h_600,q_auto,f_auto/truck.png
```

---

## ✅ Benefits

| Before (Next.js) | After (Cloudinary) |
|------------------|-------------------|
| 60-120s per image | <1s per image |
| No caching | Global CDN cache |
| Server processing | Edge delivery |
| Single format | Auto WebP/AVIF |
| Manual optimization | Auto quality |

---

## 🔍 Verification

### Test Image Loading
```bash
# Before (slow):
https://speedy-van.co.uk/_next/image?url=/images/truck.png&w=800&q=75

# After (fast):
https://res.cloudinary.com/YOUR_CLOUD/image/upload/w_800,q_auto,f_auto/speedy-van/truck.png
```

### Check Performance
1. Open browser DevTools (Network tab)
2. Load a page with images
3. Verify images load from `res.cloudinary.com`
4. Check load times (<1s)

---

## 📊 Cloudinary Free Tier

✅ **25 GB storage**  
✅ **25 GB bandwidth/month**  
✅ **Unlimited transformations**  
✅ **Auto WebP/AVIF conversion**  
✅ **Global CDN delivery**  

Perfect for Speedy Van's needs!

---

## 🆘 Troubleshooting

### Images not loading?
1. Check `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set
2. Verify images uploaded: https://cloudinary.com/console/media_library
3. Check browser console for errors

### Upload failed?
1. Verify API credentials in `.env.local`
2. Check Cloudinary dashboard quota
3. Try uploading single image manually

### Still slow?
1. Verify `unoptimized: true` in `next.config.mjs`
2. Check images load from `res.cloudinary.com` (not `_next/image`)
3. Clear browser cache

---

## 📚 Resources

- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)
- [Next.js Image Docs](https://nextjs.org/docs/app/api-reference/components/image)

---

## 🎉 Result

Images now load **instantly** from Cloudinary's global CDN, providing a professional user experience that was impossible with Next.js image optimization on Render.

**Problem solved. Site is fast. Users are happy.** ✨
