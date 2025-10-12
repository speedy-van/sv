# Test Visitor Tracking System

## ✅ Setup Complete

1. ✅ Database migrated (3 new tables created)
2. ✅ Prisma Client generated
3. ✅ VisitorTracker component added to layout
4. ✅ Development server restarted

## 🧪 How to Test

### 1. Open Your Browser
Visit: `http://localhost:3000`

### 2. Navigate Between Pages
- Go to different pages (Home, About, Services, etc.)
- Click on buttons and links
- Scroll down pages
- Fill and submit forms

### 3. Check Browser Console
- Press F12 to open DevTools
- Go to Console tab
- You should see NO errors from `useVisitorTracking.ts`
- The 500 error should be gone

### 4. Verify Data in Database

#### Option A: Prisma Studio (Recommended)
```bash
cd packages/shared
pnpm prisma studio
```
Then check these tables:
- `VisitorSession` - Should have your session with location data
- `PageView` - Should have all pages you visited
- `VisitorAction` - Should have your interactions

#### Option B: Direct SQL Query
```sql
-- Check visitor sessions
SELECT 
  sessionId,
  country,
  city,
  browserName,
  osName,
  deviceType,
  entryPage,
  createdAt
FROM "VisitorSession"
ORDER BY createdAt DESC
LIMIT 5;

-- Check page views
SELECT 
  page,
  referrer,
  timestamp
FROM "PageView"
ORDER BY timestamp DESC
LIMIT 10;

-- Check visitor actions
SELECT 
  action,
  actionData,
  timestamp
FROM "VisitorAction"
ORDER BY timestamp DESC
LIMIT 10;
```

### 5. Check Admin Dashboard
Visit: `http://localhost:3000/admin/visitors`

You should see:
- Your visitor session
- Location data (Country, City)
- Browser and device info
- Pages visited
- Time spent

## 🔍 Troubleshooting

### If you still see 500 error:
1. Check terminal output for detailed error
2. Ensure DATABASE_URL is set in `.env.local`
3. Verify Prisma Client was generated: `pnpm prisma:generate`
4. Restart dev server: Stop (Ctrl+C) and run `pnpm dev` again

### If no data in database:
1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage
3. Check if `visitor_id` exists
4. Go to Session Storage
5. Check if `visitor_session_id` exists

### If location is null:
- This is normal for localhost (127.0.0.1)
- Location tracking works best in production with real IPs
- You can test with a VPN to simulate different locations

## 📊 Expected Results

After visiting 3-4 pages, you should see:

### VisitorSession Table:
```
sessionId: "abc123-def456-..."
visitorId: "xyz789-uvw012-..."
ipAddress: "127.0.0.1" (or your real IP)
country: null (localhost) or "GB", "US", etc.
city: null (localhost) or "London", "New York", etc.
browserName: "Chrome", "Firefox", "Safari", etc.
osName: "Windows", "macOS", "Linux", etc.
deviceType: "Desktop", "Mobile", "Tablet"
entryPage: "/"
createdAt: 2025-10-06...
lastSeenAt: 2025-10-06... (updates on each page view)
```

### PageView Table (multiple rows):
```
page: "/"
referrer: ""
timestamp: 2025-10-06...

page: "/about"
referrer: "http://localhost:3000/"
timestamp: 2025-10-06...

page: "/services"
referrer: "http://localhost:3000/about"
timestamp: 2025-10-06...
```

### VisitorAction Table:
```
action: "scroll_depth"
actionData: { depth: 50, page: "/about" }
timestamp: 2025-10-06...

action: "link_click"
actionData: { href: "/contact", text: "Contact Us" }
timestamp: 2025-10-06...
```

## ✅ Success Criteria

- [ ] No 500 errors in browser console
- [ ] Session created in VisitorSession table
- [ ] Page views recorded in PageView table
- [ ] Actions recorded in VisitorAction table
- [ ] Browser/OS/Device info detected correctly
- [ ] Session persists across page navigation
- [ ] lastSeenAt updates on each page view

## 🎉 If All Tests Pass

**Congratulations! Your visitor tracking system is working perfectly!** 🚀

You can now:
1. Monitor real user behavior
2. Analyze traffic by location
3. Track conversion funnels
4. Identify popular pages
5. Detect issues with user flows

---

**Last Updated**: October 6, 2025  
**Status**: Ready for Testing ✅
