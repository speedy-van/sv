# Driver ID Mapping Fix - Critical Structural Issue

## Problem Identified

The mobile app was failing to initialize Pusher because `user.driver.id` was **undefined** in the user object returned from authentication APIs.

**Error:**
```
❌ Driver ID not found in user object. User must have a driver relation.
```

## Root Cause

The backend APIs were not including the `driver` relation in the user object response structure, causing the mobile app to fail when trying to subscribe to driver-specific Pusher channels.

---

## Fixes Applied

### 1. Login API (`/api/driver/auth/login`)

**Before:**
```typescript
{
  success: true,
  token: "...",
  user: {
    id: "user_123",
    email: "driver@example.com",
    name: "Driver Name",
    role: "driver"
  },
  driver: {
    id: "driver_456",
    onboardingStatus: "approved",
    basePostcode: "G1 1AA",
    vehicleType: "Van"
  }
}
```

**After:**
```typescript
{
  success: true,
  token: "...",
  user: {
    id: "user_123",
    email: "driver@example.com",
    name: "Driver Name",
    role: "driver",
    driver: {                    // ✅ NESTED inside user object
      id: "driver_456",
      userId: "user_123",
      onboardingStatus: "approved",
      basePostcode: "G1 1AA",
      vehicleType: "Van",
      status: "active",
      rating: 4.8
    }
  }
}
```

---

### 2. Profile API (`/api/driver/profile`)

**Before:**
```typescript
{
  success: true,
  data: {
    id: "user_123",
    email: "driver@example.com",
    driverId: "driver_456",    // Only flat driverId field
    basePostcode: "G1 1AA",
    vehicleType: "Van"
  }
}
```

**After:**
```typescript
{
  success: true,
  data: {
    id: "user_123",
    email: "driver@example.com",
    driver: {                   // ✅ Full driver relation
      id: "driver_456",
      userId: "user_123",
      status: "active",
      onboardingStatus: "approved",
      basePostcode: "G1 1AA",
      vehicleType: "Van",
      rating: 4.8,
      strikes: 0
    },
    driverId: "driver_456",     // Kept for backward compatibility
    basePostcode: "G1 1AA",
    vehicleType: "Van"
  }
}
```

---

### 3. Mobile App (`DashboardScreen.tsx` & `ChatScreen.tsx`)

**Before (WRONG):**
```typescript
const driverId = user.driver?.id || user.id;  // ❌ Falls back to user.id
```

**After (CORRECT):**
```typescript
const driverId = user.driver?.id;  // ✅ Only use driver.id

if (!driverId) {
  console.error('❌ Driver ID not found in user object');
  return;  // Fail fast if missing
}
```

---

## Data Flow Verification

```
Driver Login
    ↓
Backend returns user object with nested driver relation
    ↓
Mobile app saves user object to AsyncStorage
    ↓
Mobile app reads user.driver.id
    ↓
Pusher initializes with channel: driver-${driver.id}
    ↓
Backend sends events to: driver-${driver.id}
    ↓
Mobile app receives events instantly ✅
```

---

## Database Structure

```typescript
User (model)
├─ id: "user_123"          ← User.id
├─ email: "driver@example.com"
├─ role: "driver"
└─ Driver (relation)       ← One-to-one relation
    ├─ id: "driver_456"     ← Driver.id (CRITICAL for Pusher)
    ├─ userId: "user_123"   ← Foreign key to User
    ├─ status: "active"
    └─ onboardingStatus: "approved"
```

---

## Pusher Channel Mapping

| Backend Event | Channel | Mobile Subscription |
|--------------|---------|---------------------|
| `route-matched` | `driver-${Driver.id}` | `driver-${user.driver.id}` |
| `job-assigned` | `driver-${Driver.id}` | `driver-${user.driver.id}` |
| `route-removed` | `driver-${Driver.id}` | `driver-${user.driver.id}` |

**Critical:** Both backend and mobile MUST use `Driver.id` (NOT `User.id`)

---

## Testing Checklist

- [x] Login API returns `user.driver.id`
- [x] Profile API returns `user.driver.id`
- [x] Mobile app uses ONLY `user.driver.id` (no fallback to `user.id`)
- [x] Mobile app fails fast if `user.driver.id` is missing
- [x] Pusher initializes with correct driver ID
- [x] Backend sends events to correct channel
- [x] Mobile app receives popup instantly
- [ ] Test on real iOS device with driver account
- [ ] Verify logs show matching driver IDs on both sides

---

## Files Modified

1. `apps/web/src/app/api/driver/auth/login/route.ts`
2. `apps/web/src/app/api/driver/profile/route.ts`
3. `mobile/expo-driver-app/src/screens/DashboardScreen.tsx`
4. `mobile/expo-driver-app/src/screens/ChatScreen.tsx`

---

## Validation Commands

```bash
# 1. Test driver login
curl -X POST http://localhost:3000/api/driver/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@test.com","password":"password"}' \
  | jq '.user.driver.id'

# 2. Test driver profile
curl -X GET http://localhost:3000/api/driver/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.data.driver.id'

# Expected output for both: "driver_456" (not null or undefined)
```

---

## Critical Notes

1. **Never use `User.id` for Pusher channels** - always use `Driver.id`
2. **Fail fast** if `driver` relation is missing - don't fallback or guess
3. **Test with real driver accounts** - ensure database has proper User↔Driver relations
4. **Check Prisma queries** - always include `Driver: true` when fetching users with role `driver`
5. **Monitor logs** - backend and mobile must show matching driver IDs

---

**Status:** ✅ Fixed and Ready for Testing
**Priority:** 🔴 Critical - Required for live dispatch system
**Impact:** All driver real-time notifications depend on this

