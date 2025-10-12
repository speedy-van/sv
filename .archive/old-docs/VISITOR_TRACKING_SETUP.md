# Quick Setup Guide - Auto Visitor Location Tracking

## 🚀 5-Minute Setup

### Step 1: Database Migration
```bash
cd packages/shared
pnpm prisma migrate dev --name add_visitor_tracking
pnpm prisma generate
```

### Step 2: Add Tracker to Your App
Open your root layout file and add the VisitorTracker:

**File**: `apps/web/src/app/layout.tsx`
```tsx
import { VisitorTracker } from '@/components/VisitorTracker';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Add this line */}
        <VisitorTracker />
        
        {children}
      </body>
    </html>
  );
}
```

### Step 3: Restart Dev Server
```bash
pnpm dev
```

### Step 4: Test It
1. Visit your website
2. Navigate to `/admin/visitors`
3. See real-time visitor data with exact locations!

## ✅ What You Get

### Automatic Tracking:
- ✅ IP Address
- ✅ Country, City, Region
- ✅ Exact Coordinates (lat/lng)
- ✅ Browser (Chrome, Firefox, etc.)
- ✅ OS (Windows, Mac, Linux, etc.)
- ✅ Device Type (Desktop, Mobile, Tablet)
- ✅ Screen Resolution
- ✅ Language & Timezone
- ✅ Every page visited
- ✅ All user actions (clicks, scrolls, forms)

### No Configuration Needed!
Everything works automatically out of the box.

---

## 📊 View Your Data

### Admin Dashboard
- **Full Analytics**: `/admin/visitors`
- **Area Rankings**: `/admin/analytics` → Visitors tab

### Example Query (Prisma Studio)
```bash
pnpm prisma studio
```
Then browse the `VisitorSession` table!

---

## 🎯 Advanced: Track Custom Events

```tsx
import { useVisitorTracking } from '@/hooks/useVisitorTracking';

function BookingButton() {
  const { trackAction } = useVisitorTracking();

  const handleClick = () => {
    trackAction('booking_button_clicked', {
      packageType: 'premium',
      value: 99.99,
    });
  };

  return <button onClick={handleClick}>Book Now</button>;
}
```

---

## 📝 That's It!

Your visitor tracking is now live with automatic location detection! 🎉
