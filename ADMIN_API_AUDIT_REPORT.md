# Admin API Endpoints Audit Report

**Generated:** 2025-10-17T09:12:13.284Z

**Total Endpoints:** 124

## Summary

- **Total Issues:** 106
- **Critical:** 59 🔴
- **Warnings:** 47 ⚠️
- **Info:** 0 ℹ️

## Issues by Category

### Security (13)

#### 🔴 Critical

- **analytics/performance/route.ts:1** - Missing authentication check
- **cleanup-emails/route.ts:1** - Missing authentication check
- **email-security/route.ts:1** - Missing authentication check
- **fix-driver-audio/route.ts:1** - Missing authentication check
- **metrics/availability/route.ts:1** - Missing authentication check
- **orders/[code]/fix-coordinates/route.ts:1** - Missing authentication check
- **orders/pending/route.ts:1** - Missing authentication check
- **routes/[id]/edit/route.ts:1** - Missing authentication check
- **routes/active/route.ts:1** - Missing authentication check
- **routes/create/route.ts:1** - Missing authentication check
- **routes/suggested/route.ts:1** - Missing authentication check
- **routing/cron/route.ts:1** - Missing authentication check
- **tracking-diagnostics/route.ts:1** - Missing authentication check

### Response (44)

#### ⚠️ Warnings

- **analytics/reports/[id]/export/route.ts:13** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **analytics/reports/[id]/export/route.ts:41** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response(content, {
  ```
- **analytics/reports/[id]/export/route.ts:49** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Internal Server Error', { status: 500 });
  ```
- **analytics/reports/[id]/route.ts:14** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **analytics/reports/[id]/route.ts:37** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json({ report: mockReport });
  ```
- **analytics/reports/[id]/route.ts:40** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Internal Server Error', { status: 500 });
  ```
- **analytics/reports/[id]/route.ts:51** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **analytics/reports/[id]/route.ts:89** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json({ report: updatedReport });
  ```
- **analytics/reports/[id]/route.ts:92** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Internal Server Error', { status: 500 });
  ```
- **analytics/reports/[id]/route.ts:103** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **analytics/reports/[id]/route.ts:110** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json({ success: true });
  ```
- **analytics/reports/[id]/route.ts:113** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Internal Server Error', { status: 500 });
  ```
- **analytics/reports/[id]/run/route.ts:13** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **analytics/reports/[id]/run/route.ts:30** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json({
  ```
- **analytics/reports/[id]/run/route.ts:37** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Internal Server Error', { status: 500 });
  ```
- **analytics/reports/preview/route.ts:13** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **analytics/reports/preview/route.ts:22** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Missing required metrics', { status: 400 });
  ```
- **analytics/reports/preview/route.ts:54** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json(previewData);
  ```
- **analytics/reports/preview/route.ts:57** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Internal Server Error', { status: 500 });
  ```
- **analytics/reports/route.ts:13** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **analytics/reports/route.ts:68** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json({ reports: mockReports });
  ```
- **analytics/reports/route.ts:71** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Internal Server Error', { status: 500 });
  ```
- **analytics/reports/route.ts:79** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **analytics/reports/route.ts:96** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Missing required fields', { status: 400 });
  ```
- **analytics/reports/route.ts:121** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json({ report: newReport });
  ```
- **analytics/reports/route.ts:124** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Internal Server Error', { status: 500 });
  ```
- **analytics/route.ts:14** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **analytics/route.ts:341** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json(payload);
  ```
- **analytics/route.ts:344** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response(
  ```
- **audit/route.ts:8** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **audit/route.ts:21** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json({ items, nextCursor });
  ```
- **orders/[code]/assign/route.ts:14** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **orders/[code]/assign/route.ts:46** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Booking not found', { status: 404 });
  ```
- **orders/[code]/assign/route.ts:50** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Booking is not in confirmed status', {
  ```
- **orders/[code]/assign/route.ts:84** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('No suitable drivers available', { status: 404 });
  ```
- **orders/[code]/assign/route.ts:168** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json({
  ```
- **orders/[code]/assign/route.ts:175** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Internal Server Error', { status: 500 });
  ```
- **orders/[code]/assign/route.ts:185** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **orders/[code]/assign/route.ts:198** - Should use NextResponse.json() instead of Response()
  ```typescript
  if (!booking) return new Response('Not Found', { status: 404 });
  ```
- **orders/[code]/assign/route.ts:256** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json({
  ```
- **orders/bulk/route.ts:13** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **orders/route.ts:23** - Should use NextResponse.json() instead of Response()
  ```typescript
  return new Response('Unauthorized', { status: 401 });
  ```
- **orders/route.ts:217** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json({ items: orders, nextCursor });
  ```
- **orders/route.ts:226** - Should use NextResponse.json() instead of Response()
  ```typescript
  return Response.json(
  ```

### Async/Await (46)

#### 🔴 Critical

- **analytics/route.ts:63** - Missing await on prisma.booking.findMany()
  ```typescript
  prisma.booking.findMany({
  ```
- **analytics/route.ts:74** - Missing await on prisma.driver.findMany()
  ```typescript
  prisma.driver.findMany({
  ```
- **analytics/route.ts:123** - Missing await on prisma.booking.findMany()
  ```typescript
  prisma.booking.findMany({
  ```
- **booking-luxury/route.ts:45** - Missing await on prisma.booking.findMany()
  ```typescript
  prisma.booking.findMany({
  ```
- **booking-luxury/route.ts:78** - Missing await on prisma.booking.count()
  ```typescript
  prisma.booking.count({ where }),
  ```
- **customers/route.ts:37** - Missing await on prisma.user.findMany()
  ```typescript
  prisma.user.findMany({
  ```
- **customers/route.ts:53** - Missing await on prisma.user.count()
  ```typescript
  prisma.user.count({ where }),
  ```
- **dashboard/route.ts:325** - Missing await on prisma.booking.count()
  ```typescript
  prisma.booking.count({
  ```
- **dashboard/route.ts:333** - Missing await on prisma.booking.count()
  ```typescript
  prisma.booking.count({
  ```
- **dashboard/route.ts:341** - Missing await on prisma.driverApplication.count()
  ```typescript
  prisma.driverApplication.count({
  ```
- **dashboard/route.ts:348** - Missing await on prisma.booking.count()
  ```typescript
  prisma.booking.count({
  ```
- **dashboard/route.ts:363** - Missing await on prisma.booking.findMany()
  ```typescript
  prisma.booking.findMany({
  ```
- **dashboard/route.ts:403** - Missing await on prisma.driverIncident.count()
  ```typescript
  prisma.driverIncident.count({
  ```
- **dashboard-enhanced/route.ts:117** - Missing await on prisma.booking.count()
  ```typescript
  prisma.booking.count({
  ```
- **dashboard-enhanced/route.ts:124** - Missing await on prisma.booking.count()
  ```typescript
  prisma.booking.count({
  ```
- **dashboard-enhanced/route.ts:131** - Missing await on prisma.booking.count()
  ```typescript
  prisma.booking.count({
  ```
- **dashboard-enhanced/route.ts:139** - Missing await on prisma.booking.count()
  ```typescript
  prisma.booking.count({
  ```
- **dispatch/realtime/route.ts:17** - Missing await on prisma.booking.findMany()
  ```typescript
  prisma.booking.findMany({
  ```
- **dispatch/realtime/route.ts:49** - Missing await on prisma.driver.findMany()
  ```typescript
  prisma.driver.findMany({
  ```
- **dispatch/realtime/route.ts:81** - Missing await on prisma.driverIncident.findMany()
  ```typescript
  prisma.driverIncident.findMany({
  ```
- **dispatch/realtime/route.ts:113** - Missing await on prisma.trackingPing.findMany()
  ```typescript
  prisma.trackingPing.findMany({
  ```
- **driver-applications/route.ts:48** - Missing await on prisma.driverApplication.findMany()
  ```typescript
  prisma.driverApplication.findMany({
  ```
- **driver-applications/route.ts:54** - Missing await on prisma.driverApplication.count()
  ```typescript
  prisma.driverApplication.count({ where: whereClause }),
  ```
- **drivers/fix-availability/route.ts:136** - Missing await on prisma.driver.count()
  ```typescript
  prisma.driver.count({
  ```
- **drivers/fix-availability/route.ts:142** - Missing await on prisma.driver.count()
  ```typescript
  prisma.driver.count({
  ```
- **drivers/fix-availability/route.ts:151** - Missing await on prisma.driver.findMany()
  ```typescript
  prisma.driver.findMany({
  ```
- **drivers/fix-availability/route.ts:167** - Missing await on prisma.driver.count()
  ```typescript
  prisma.driver.count({
  ```
- **finance/ledger/route.ts:64** - Missing await on prisma.driverEarnings.findMany()
  ```typescript
  prisma.driverEarnings.findMany({
  ```
- **finance/ledger/route.ts:88** - Missing await on prisma.driverEarnings.count()
  ```typescript
  prisma.driverEarnings.count({ where }),
  ```
- **finance/payouts/route.ts:56** - Missing await on prisma.driverPayout.findMany()
  ```typescript
  prisma.driverPayout.findMany({
  ```
- **finance/payouts/route.ts:81** - Missing await on prisma.driverPayout.count()
  ```typescript
  prisma.driverPayout.count({ where }),
  ```
- **finance/refunds/route.ts:35** - Missing await on prisma.refund.findMany()
  ```typescript
  prisma.refund.findMany({
  ```
- **finance/refunds/route.ts:48** - Missing await on prisma.refund.count()
  ```typescript
  prisma.refund.count({ where }),
  ```
- **people/stats/route.ts:43** - Missing await on prisma.driver.count()
  ```typescript
  prisma.driver.count(),
  ```
- **people/stats/route.ts:46** - Missing await on prisma.driver.count()
  ```typescript
  prisma.driver.count({
  ```
- **people/stats/route.ts:54** - Missing await on prisma.driverApplication.count()
  ```typescript
  prisma.driverApplication.count({
  ```
- **people/stats/route.ts:61** - Missing await on prisma.user.count()
  ```typescript
  prisma.user.count({
  ```
- **people/stats/route.ts:68** - Missing await on prisma.user.count()
  ```typescript
  prisma.user.count({
  ```
- **people/stats/route.ts:82** - Missing await on prisma.user.count()
  ```typescript
  prisma.user.count({
  ```
- **refunds/route.ts:38** - Missing await on prisma.refund.findMany()
  ```typescript
  prisma.refund.findMany({
  ```
- **refunds/route.ts:53** - Missing await on prisma.refund.count()
  ```typescript
  prisma.refund.count({ where }),
  ```
- **search/route.ts:24** - Missing await on prisma.booking.findMany()
  ```typescript
  prisma.booking.findMany({
  ```
- **search/route.ts:45** - Missing await on prisma.driver.findMany()
  ```typescript
  prisma.driver.findMany({
  ```
- **search/route.ts:69** - Missing await on prisma.user.findMany()
  ```typescript
  prisma.user.findMany({
  ```
- **users/route.ts:43** - Missing await on prisma.user.findMany()
  ```typescript
  prisma.user.findMany({
  ```
- **users/route.ts:59** - Missing await on prisma.user.count()
  ```typescript
  prisma.user.count({ where }),
  ```

### Error Handling (1)

#### ⚠️ Warnings

- **audit/route.ts:1** - Missing try-catch block

### Prisma Query (2)

#### ⚠️ Warnings

- **routes/active/route.ts:121** - Accessing driver.name/email - ensure driver relation is included
  ```typescript
  name: (route as any).driver.name,
  ```
- **routes/active/route.ts:122** - Accessing driver.name/email - ensure driver relation is included
  ```typescript
  email: (route as any).driver.email,
  ```

## ✅ Clean Endpoints (87)

- audit-trail/route.ts (GET)
- auto-assignment/route.ts (POST)
- bonuses/[id]/approve/route.ts (POST)
- bonuses/pending/route.ts (GET)
- bonuses/request/route.ts (POST)
- chat/conversations/[id]/messages/route.ts (GET, POST)
- chat/conversations/route.ts (GET)
- chat/status/route.ts (POST, GET)
- chat/typing/route.ts (POST)
- content/areas/route.ts (GET, POST)
- content/promos/route.ts (GET, POST)
- content/route.ts (GET, POST)
- customers/[id]/actions/route.ts (POST)
- customers/[id]/route.ts (GET, PUT, DELETE)
- customers/export/route.ts (GET)
- diagnostic/booking/[code]/route.ts (GET)
- dispatch/assign/route.ts (POST)
- dispatch/auto-assign/route.ts (POST, GET)
- dispatch/incidents/[id]/route.ts (GET, PUT, DELETE)
- dispatch/incidents/route.ts (POST, GET)
- dispatch/mode/route.ts (GET, POST)
- dispatch/smart-assign/route.ts (POST)
- driver-applications/[id]/approve/route.ts (PATCH)
- driver-applications/[id]/reject/route.ts (PATCH)
- driver-applications/[id]/request-info/route.ts (PATCH)
- drivers/[id]/activate/route.ts (POST)
- drivers/[id]/force-logout/route.ts (POST)
- drivers/[id]/remove-all/route.ts (POST)
- drivers/[id]/reset-device/route.ts (POST)
- drivers/[id]/review/route.ts (POST, GET)
- drivers/[id]/route.ts (GET, PUT)
- drivers/[id]/suspend/route.ts (POST)
- drivers/applications/[id]/approve/route.ts (POST)
- drivers/applications/[id]/reject/route.ts (POST)
- drivers/applications/[id]/request_info/route.ts (POST)
- drivers/applications/[id]/route.ts (GET, PUT)
- drivers/applications/route.ts (GET)
- drivers/available/route.ts (GET)
- drivers/earnings/route.ts (PATCH, GET)
- drivers/route.ts (GET)
- drivers/schedule/route.ts (GET)
- finance/payouts/[id]/process/route.ts (POST)
- finance/route.ts (GET)
- health/route.ts (GET)
- jobs/pending-approval/route.ts (GET)
- monitoring/start/route.ts (POST, DELETE, GET)
- notifications/[id]/read/route.ts (PUT)
- notifications/retry/route.ts (POST, GET)
- notifications/route.ts (GET)
- notifications/send-to-driver/route.ts (POST, GET)
- notifications/test/route.ts (POST, GET)
- notify-drivers/route.ts (POST)
- orders/[code]/assign-driver/route.ts (POST)
- orders/[code]/cancel/route.ts (POST)
- orders/[code]/cancel-enhanced/route.ts (POST)
- orders/[code]/confirm-payment/route.ts (POST)
- orders/[code]/remove-driver/route.ts (POST)
- orders/[code]/route.ts (GET, PUT)
- orders/[code]/send-confirmation/route.ts (POST)
- orders/[code]/send-floor-warning/route.ts (POST)
- orders/[code]/tracking/route.ts (GET)
- orders/[code]/unassign/route.ts (POST)
- orders/auto-notify-drivers/route.ts (POST)
- performance/route.ts (GET, PUT)
- routes/[id]/assign/route.ts (POST)
- routes/[id]/cancel/route.ts (POST)
- routes/[id]/drops/[dropId]/route.ts (DELETE)
- routes/[id]/drops/route.ts (GET, POST)
- routes/[id]/reassign/route.ts (POST)
- routes/[id]/route.ts (GET, PATCH, DELETE)
- routes/[id]/unassign/route.ts (POST)
- routes/auto-create/route.ts (POST)
- routes/multi-drop/route.ts (GET, POST, PUT, DELETE)
- routes/pending-drops/route.ts (GET)
- routes/preview/route.ts (POST)
- routes/route.ts (GET, POST)
- routes/scheduler/route.ts (GET, POST)
- routing/approve/route.ts (GET, POST, DELETE)
- routing/manual/route.ts (POST, PUT)
- routing/settings/route.ts (GET, POST, PATCH)
- routing/trigger/route.ts (POST)
- settings/pricing/config/route.ts (GET, POST)
- settings/pricing/route.ts (GET, POST)
- sms/recipients/route.ts (GET)
- sms/send/route.ts (POST)
- tracking/route.ts (GET)
- users/[id]/route.ts ()

## ❌ Endpoints with Issues (37)

### analytics/reports/[id]/route.ts

- **Methods:** GET, PATCH, DELETE
- **Issues:** 9
- **Auth:** ✅
- **Error Handling:** ✅

⚠️ **Line 14:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 37:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json({ report: mockReport });
```
⚠️ **Line 40:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Internal Server Error', { status: 500 });
```
⚠️ **Line 51:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 89:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json({ report: updatedReport });
```
⚠️ **Line 92:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Internal Server Error', { status: 500 });
```
⚠️ **Line 103:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 110:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json({ success: true });
```
⚠️ **Line 113:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Internal Server Error', { status: 500 });
```

### orders/[code]/assign/route.ts

- **Methods:** POST, GET
- **Issues:** 9
- **Auth:** ✅
- **Error Handling:** ✅

⚠️ **Line 14:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 46:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Booking not found', { status: 404 });
```
⚠️ **Line 50:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Booking is not in confirmed status', {
```
⚠️ **Line 84:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('No suitable drivers available', { status: 404 });
```
⚠️ **Line 168:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json({
```
⚠️ **Line 175:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Internal Server Error', { status: 500 });
```
⚠️ **Line 185:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 198:** Should use NextResponse.json() instead of Response()
```typescript
if (!booking) return new Response('Not Found', { status: 404 });
```
⚠️ **Line 256:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json({
```

### analytics/reports/route.ts

- **Methods:** GET, POST
- **Issues:** 7
- **Auth:** ✅
- **Error Handling:** ✅

⚠️ **Line 13:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 68:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json({ reports: mockReports });
```
⚠️ **Line 71:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Internal Server Error', { status: 500 });
```
⚠️ **Line 79:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 96:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Missing required fields', { status: 400 });
```
⚠️ **Line 121:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json({ report: newReport });
```
⚠️ **Line 124:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Internal Server Error', { status: 500 });
```

### analytics/route.ts

- **Methods:** GET
- **Issues:** 6
- **Auth:** ✅
- **Error Handling:** ✅

⚠️ **Line 14:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
🔴 **Line 63:** Missing await on prisma.booking.findMany()
```typescript
prisma.booking.findMany({
```
🔴 **Line 74:** Missing await on prisma.driver.findMany()
```typescript
prisma.driver.findMany({
```
🔴 **Line 123:** Missing await on prisma.booking.findMany()
```typescript
prisma.booking.findMany({
```
⚠️ **Line 341:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json(payload);
```
⚠️ **Line 344:** Should use NextResponse.json() instead of Response()
```typescript
return new Response(
```

### dashboard/route.ts

- **Methods:** 
- **Issues:** 6
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 325:** Missing await on prisma.booking.count()
```typescript
prisma.booking.count({
```
🔴 **Line 333:** Missing await on prisma.booking.count()
```typescript
prisma.booking.count({
```
🔴 **Line 341:** Missing await on prisma.driverApplication.count()
```typescript
prisma.driverApplication.count({
```
🔴 **Line 348:** Missing await on prisma.booking.count()
```typescript
prisma.booking.count({
```
🔴 **Line 363:** Missing await on prisma.booking.findMany()
```typescript
prisma.booking.findMany({
```
🔴 **Line 403:** Missing await on prisma.driverIncident.count()
```typescript
prisma.driverIncident.count({
```

### people/stats/route.ts

- **Methods:** GET
- **Issues:** 6
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 43:** Missing await on prisma.driver.count()
```typescript
prisma.driver.count(),
```
🔴 **Line 46:** Missing await on prisma.driver.count()
```typescript
prisma.driver.count({
```
🔴 **Line 54:** Missing await on prisma.driverApplication.count()
```typescript
prisma.driverApplication.count({
```
🔴 **Line 61:** Missing await on prisma.user.count()
```typescript
prisma.user.count({
```
🔴 **Line 68:** Missing await on prisma.user.count()
```typescript
prisma.user.count({
```
🔴 **Line 82:** Missing await on prisma.user.count()
```typescript
prisma.user.count({
```

### analytics/reports/preview/route.ts

- **Methods:** POST
- **Issues:** 4
- **Auth:** ✅
- **Error Handling:** ✅

⚠️ **Line 13:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 22:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Missing required metrics', { status: 400 });
```
⚠️ **Line 54:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json(previewData);
```
⚠️ **Line 57:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Internal Server Error', { status: 500 });
```

### dashboard-enhanced/route.ts

- **Methods:** GET
- **Issues:** 4
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 117:** Missing await on prisma.booking.count()
```typescript
prisma.booking.count({
```
🔴 **Line 124:** Missing await on prisma.booking.count()
```typescript
prisma.booking.count({
```
🔴 **Line 131:** Missing await on prisma.booking.count()
```typescript
prisma.booking.count({
```
🔴 **Line 139:** Missing await on prisma.booking.count()
```typescript
prisma.booking.count({
```

### dispatch/realtime/route.ts

- **Methods:** GET, POST
- **Issues:** 4
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 17:** Missing await on prisma.booking.findMany()
```typescript
prisma.booking.findMany({
```
🔴 **Line 49:** Missing await on prisma.driver.findMany()
```typescript
prisma.driver.findMany({
```
🔴 **Line 81:** Missing await on prisma.driverIncident.findMany()
```typescript
prisma.driverIncident.findMany({
```
🔴 **Line 113:** Missing await on prisma.trackingPing.findMany()
```typescript
prisma.trackingPing.findMany({
```

### drivers/fix-availability/route.ts

- **Methods:** POST, GET
- **Issues:** 4
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 136:** Missing await on prisma.driver.count()
```typescript
prisma.driver.count({
```
🔴 **Line 142:** Missing await on prisma.driver.count()
```typescript
prisma.driver.count({
```
🔴 **Line 151:** Missing await on prisma.driver.findMany()
```typescript
prisma.driver.findMany({
```
🔴 **Line 167:** Missing await on prisma.driver.count()
```typescript
prisma.driver.count({
```

### analytics/reports/[id]/export/route.ts

- **Methods:** GET
- **Issues:** 3
- **Auth:** ✅
- **Error Handling:** ✅

⚠️ **Line 13:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 41:** Should use NextResponse.json() instead of Response()
```typescript
return new Response(content, {
```
⚠️ **Line 49:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Internal Server Error', { status: 500 });
```

### analytics/reports/[id]/run/route.ts

- **Methods:** POST
- **Issues:** 3
- **Auth:** ✅
- **Error Handling:** ✅

⚠️ **Line 13:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 30:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json({
```
⚠️ **Line 37:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Internal Server Error', { status: 500 });
```

### audit/route.ts

- **Methods:** GET
- **Issues:** 3
- **Auth:** ✅
- **Error Handling:** ❌

⚠️ **Line 1:** Missing try-catch block
⚠️ **Line 8:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 21:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json({ items, nextCursor });
```

### orders/route.ts

- **Methods:** GET
- **Issues:** 3
- **Auth:** ✅
- **Error Handling:** ✅

⚠️ **Line 23:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```
⚠️ **Line 217:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json({ items: orders, nextCursor });
```
⚠️ **Line 226:** Should use NextResponse.json() instead of Response()
```typescript
return Response.json(
```

### routes/active/route.ts

- **Methods:** GET
- **Issues:** 3
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check
⚠️ **Line 121:** Accessing driver.name/email - ensure driver relation is included
```typescript
name: (route as any).driver.name,
```
⚠️ **Line 122:** Accessing driver.name/email - ensure driver relation is included
```typescript
email: (route as any).driver.email,
```

### search/route.ts

- **Methods:** GET
- **Issues:** 3
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 24:** Missing await on prisma.booking.findMany()
```typescript
prisma.booking.findMany({
```
🔴 **Line 45:** Missing await on prisma.driver.findMany()
```typescript
prisma.driver.findMany({
```
🔴 **Line 69:** Missing await on prisma.user.findMany()
```typescript
prisma.user.findMany({
```

### booking-luxury/route.ts

- **Methods:** GET, POST
- **Issues:** 2
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 45:** Missing await on prisma.booking.findMany()
```typescript
prisma.booking.findMany({
```
🔴 **Line 78:** Missing await on prisma.booking.count()
```typescript
prisma.booking.count({ where }),
```

### customers/route.ts

- **Methods:** 
- **Issues:** 2
- **Auth:** ✅
- **Error Handling:** ❌

🔴 **Line 37:** Missing await on prisma.user.findMany()
```typescript
prisma.user.findMany({
```
🔴 **Line 53:** Missing await on prisma.user.count()
```typescript
prisma.user.count({ where }),
```

### driver-applications/route.ts

- **Methods:** GET
- **Issues:** 2
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 48:** Missing await on prisma.driverApplication.findMany()
```typescript
prisma.driverApplication.findMany({
```
🔴 **Line 54:** Missing await on prisma.driverApplication.count()
```typescript
prisma.driverApplication.count({ where: whereClause }),
```

### finance/ledger/route.ts

- **Methods:** GET
- **Issues:** 2
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 64:** Missing await on prisma.driverEarnings.findMany()
```typescript
prisma.driverEarnings.findMany({
```
🔴 **Line 88:** Missing await on prisma.driverEarnings.count()
```typescript
prisma.driverEarnings.count({ where }),
```

### finance/payouts/route.ts

- **Methods:** GET, POST
- **Issues:** 2
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 56:** Missing await on prisma.driverPayout.findMany()
```typescript
prisma.driverPayout.findMany({
```
🔴 **Line 81:** Missing await on prisma.driverPayout.count()
```typescript
prisma.driverPayout.count({ where }),
```

### finance/refunds/route.ts

- **Methods:** GET, POST
- **Issues:** 2
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 35:** Missing await on prisma.refund.findMany()
```typescript
prisma.refund.findMany({
```
🔴 **Line 48:** Missing await on prisma.refund.count()
```typescript
prisma.refund.count({ where }),
```

### refunds/route.ts

- **Methods:** GET, POST
- **Issues:** 2
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 38:** Missing await on prisma.refund.findMany()
```typescript
prisma.refund.findMany({
```
🔴 **Line 53:** Missing await on prisma.refund.count()
```typescript
prisma.refund.count({ where }),
```

### users/route.ts

- **Methods:** 
- **Issues:** 2
- **Auth:** ✅
- **Error Handling:** ✅

🔴 **Line 43:** Missing await on prisma.user.findMany()
```typescript
prisma.user.findMany({
```
🔴 **Line 59:** Missing await on prisma.user.count()
```typescript
prisma.user.count({ where }),
```

### analytics/performance/route.ts

- **Methods:** GET
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

### cleanup-emails/route.ts

- **Methods:** POST
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

### email-security/route.ts

- **Methods:** GET, POST
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

### fix-driver-audio/route.ts

- **Methods:** POST
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

### metrics/availability/route.ts

- **Methods:** GET, DELETE
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

### orders/[code]/fix-coordinates/route.ts

- **Methods:** POST
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

### orders/bulk/route.ts

- **Methods:** POST
- **Issues:** 1
- **Auth:** ✅
- **Error Handling:** ✅

⚠️ **Line 13:** Should use NextResponse.json() instead of Response()
```typescript
return new Response('Unauthorized', { status: 401 });
```

### orders/pending/route.ts

- **Methods:** GET
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

### routes/[id]/edit/route.ts

- **Methods:** PUT
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

### routes/create/route.ts

- **Methods:** POST
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

### routes/suggested/route.ts

- **Methods:** GET
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

### routing/cron/route.ts

- **Methods:** POST, GET
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

### tracking-diagnostics/route.ts

- **Methods:** GET, POST
- **Issues:** 1
- **Auth:** ❌
- **Error Handling:** ✅

🔴 **Line 1:** Missing authentication check

