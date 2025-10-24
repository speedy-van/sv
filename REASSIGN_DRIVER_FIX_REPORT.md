# Reassign Driver Fix Report

**Date:** October 18, 2025**Branch:** fix-routes-and-deepseek**Status:** ✅ **FIXED AND TESTED**

---

## Problem Summary

**Issue:** Reassign Driver function was failing with 500 Internal Server Error

**Error Message:**

```
Foreign key constraint violated on the constraint: `Booking_driverId_fkey`
```

**Root Cause:** The admin routes API was returning `driver.userId` instead of `driver.id` in the drivers list, causing a foreign key constraint violation when trying to reassign routes.

---

## Technical Details

### The Bug

**File:** `/apps/web/src/app/api/admin/routes/route.ts`**Line:** 244

**Before (Broken):**

```typescript
const drivers = driversData.map((driver: any) => ({
  id: driver.userId,  // ❌ Wrong! This is User ID, not Driver ID
  name: driver.User?.name || 'Unknown',
  status: driver.DriverAvailability?.status || 'offline',
  currentRoutes: 0,
}));
```

**After (Fixed):**

```typescript
const drivers = driversData.map((driver: any) => ({
  id: driver.id,  // ✅ Correct! This is the actual Driver ID
  name: driver.User?.name || 'Unknown',
  status: driver.DriverAvailability?.status || 'offline',
  currentRoutes: 0,
}));
```

### Why This Caused the Error

1. **Frontend** receives drivers list with `userId` as `id`

1. **User** selects a driver from dropdown (e.g., `cmg0p8t8s007ikz29kkmwd62l` - which is a User ID)

1. **Frontend** sends this ID to reassign API as `driverId`

1. **Backend** tries to update `booking.driverId` with this value

1. **Database** rejects it because:
  - `Booking.driverId` has foreign key to `Driver.id`
  - The value sent is a `User.id`, not a `Driver.id`
  - Foreign key constraint violation occurs

### Database Schema

```
model Booking {
  driverId String?
  driver   Driver? @relation(fields: [driverId], references: [id])
  // ...
}

model Driver {
  id     String @id @default(cuid())
  userId String @unique
  User   User   @relation(fields: [userId], references: [id])
  // ...
}
```

**The relationship:**

- `Booking.driverId` → `Driver.id` (NOT `Driver.userId`)

- `Driver.userId` → `User.id`

---

## The Fix

**Changed one line in ****`/apps/web/src/app/api/admin/routes/route.ts`****:**

```
const drivers = driversData.map((driver: any) => ({
-  id: driver.userId,
+  id: driver.id, // ✅ Fixed: Use driver.id instead of driver.userId
  name: driver.User?.name || 'Unknown',
  status: driver.DriverAvailability?.status || 'offline',
  currentRoutes: 0,
}));
```

---

## Testing Results

### Before Fix

```
POST /api/admin/routes/booking-cmgrlviom0005w21oprll6hw8/reassign 500 (Internal Server Error)

Error: Foreign key constraint violated on the constraint: `Booking_driverId_fkey`
```

### After Fix

```
POST /api/admin/routes/booking-cmgrlviom0005w21oprll6hw8/reassign 200 in 2496ms

✅ Driver Reassigned Successfully
✅ Route updated from "Ahmed Mohammeds" to "Mohamad Albashir"
✅ Page refreshed automatically with updated driver
```

### Test Case

**Route:** `booking-cmgrlviom0005w21oprll6hw8`**From Driver:** Ahmed Mohammeds**To Driver:** Mohamad Albashir (ID: `cmg0pd1x5007mkz29sv031923`)**Reason:** "Testing fixed reassign driver function after fixing driver ID mapping"**Result:** ✅ **SUCCESS**

---

## Commits

1. **d2b2a11** - fix: Fix session.user.id type casting in reassign route endpoint

1. **15621d0** - fix: Fix driver ID mapping in admin routes API - use driver.id instead of driver.userId

---

## Impact

### Fixed

- ✅ Reassign Driver function now works correctly

- ✅ No more foreign key constraint violations

- ✅ Proper driver IDs are sent to backend

- ✅ Database updates succeed

### Verified

- ✅ Driver dropdown shows correct drivers

- ✅ Reassignment updates route successfully

- ✅ Page refreshes with updated data

- ✅ Server logs show 200 OK status

---

## Related Files

**Modified:**

- `/apps/web/src/app/api/admin/routes/route.ts` (Line 244)

**Related (No changes needed):**

- `/apps/web/src/app/api/admin/routes/[id]/reassign/route.ts` (Backend logic is correct)

- `/apps/web/src/components/admin/EnhancedAdminRoutesDashboard.tsx` (Frontend logic is correct)

---

## Lessons Learned

1. **Always use the correct foreign key reference**
  - `Booking.driverId` references `Driver.id`, not `Driver.userId`

1. **API responses should match database schema**
  - When returning driver data, use `driver.id` for the ID field
  - Don't confuse `Driver.id` with `Driver.userId`

1. **Test with actual database constraints**
  - Foreign key violations only appear in real database operations
  - Mock data might not catch these issues

1. **Check the full data flow**
  - API → Frontend → API → Database
  - Ensure IDs are consistent throughout the flow

---

## Recommendations

### Immediate

- ✅ Fix has been deployed to `fix-routes-and-deepseek` branch

- ✅ Tested successfully in development environment

- ⏸️ Ready for staging deployment

### Future Improvements

1. **Add TypeScript types** for driver objects to prevent ID confusion

1. **Add validation** in reassign API to check if driver ID exists before attempting update

1. **Improve error messages** to show which foreign key constraint failed

1. **Add unit tests** for driver ID mapping in API responses

---

## Deployment Checklist

- [x] Code fixed

- [x] Tested locally

- [x] Committed to git

- [x] Pushed to GitHub

- [ ] Deploy to staging

- [ ] Test on staging

- [ ] Deploy to production

- [ ] Monitor for errors

---

**Report Generated:** October 18, 2025, 02:12 AM GMT+1**Fixed By:** Ahmad Alwakai**Verified:** ✅ Working in development environment

