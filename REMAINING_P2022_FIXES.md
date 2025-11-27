# P2022 Metadata Column Issue - Remaining Files

## Issue
Production database doesn't have `User.metadata` column. All `prisma.user.find*` queries WITHOUT explicit `select` clause will fail with P2022 error.

## Fixed Files (Commit c7fda6ea)
✅ apps/web/src/app/api/admin/users/route.ts
✅ apps/web/src/app/api/admin/users/[id]/route.ts  
✅ apps/web/src/app/api/auth/register/route.ts
✅ apps/web/src/app/api/auth/forgot/route.ts

## Remaining Files (22 files with 24 queries)

### Auth Endpoints (Priority: CRITICAL)
- [ ] apps/web/src/app/api/auth/reset/route.ts (line 27)
- [ ] apps/web/src/app/api/auth/verify-email/route.ts (line 17)
- [ ] apps/web/src/app/api/auth/resend-verification/route.ts (line 15)
- [ ] apps/web/src/app/api/auth/test/route.ts (line 27)

### Driver Auth Endpoints (Priority: HIGH)
- [ ] apps/web/src/app/api/driver/auth/login/route.ts (lines 34, 41, 49)
- [ ] apps/web/src/app/api/driver/auth/forgot/route.ts (line 30)
- [ ] apps/web/src/app/api/driver/auth/reset/route.ts (line 39)

### Customer Auth Endpoints (Priority: HIGH)
- [ ] apps/web/src/app/api/customer/auth/login/route.ts (line 19)

### Driver Endpoints (Priority: MEDIUM)
- [ ] apps/web/src/app/api/driver/applications/route.ts (line 231)
- [ ] apps/web/src/app/api/driver/email/verify/route.ts (line 76)
- [ ] apps/web/src/app/api/driver/settings/route.ts (line 284)
- [ ] apps/web/src/app/api/driver/email/change-request/route.ts (line 88)

### Admin Endpoints (Priority: MEDIUM)
- [ ] apps/web/src/app/api/admin/staff/route.ts (line 141)
- [ ] apps/web/src/app/api/admin/search/route.ts (line 69)
- [ ] apps/web/src/app/api/admin/routes/create/route.ts (line 18)
- [ ] apps/web/src/app/api/admin/customers/route.ts (line 102)
- [ ] apps/web/src/app/api/admin/customers/[id]/route.ts (line 181)
- [ ] apps/web/src/app/api/admin/customers/[id]/actions/route.ts (line 23)

### Misc Endpoints (Priority: LOW)
- [ ] apps/web/src/app/api/verify-email-change/route.ts (line 75)
- [ ] apps/web/src/app/api/pusher/auth/route.ts (line 46)
- [ ] apps/web/src/app/api/portal/profile/route.ts (line 32)
- [ ] apps/web/src/app/api/debug/create-driver-record/route.ts (line 19)

## Fix Pattern

For each file, add explicit `select` clause:

```typescript
// Before (❌ will fail in production)
const user = await prisma.user.findUnique({
  where: { id: userId },
});

// After (✅ works in production)
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    // Add only fields actually used
  },
});
```

## Notes
- If query uses `include: { driver: true }`, convert to `select` with nested select:
  ```typescript
  select: {
    id: true,
    email: true,
    driver: {
      select: {
        id: true,
      },
    },
  }
  ```
- Only include fields that are actually accessed in the code
- Test each endpoint after fixing
