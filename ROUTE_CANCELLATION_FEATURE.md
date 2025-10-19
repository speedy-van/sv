# Route Cancellation Feature Documentation

## Overview

This document describes the enhanced route cancellation feature that ensures proper handling of drops and real-time driver notification when an admin cancels a route.

## Features Implemented

### 1. Drop Re-assignment After Route Cancellation

When an admin cancels a route, all associated drops are automatically:
- **Removed from the route** (`routeId` set to `null`)
- **Reset to pending status** (`status` set to `'pending'`)
- **Made available for re-assignment** (appear with blue circle indicator)

#### Backend Changes

**File**: `apps/web/src/app/api/admin/routes/[id]/cancel/route.ts`

```typescript
// Update all drops to remove route assignment and reset to pending
await prisma.drop.updateMany({
  where: {
    routeId: routeId,
  },
  data: {
    routeId: null,        // Remove route assignment
    status: 'pending',    // Reset to pending (blue circle)
  },
});
```

**What This Means:**
- Drops are not cancelled or lost
- They return to the pending drops pool
- Admin can immediately add them to new routes
- Blue circle indicator shows they're available

### 2. Real-time Driver Notification

When a route is cancelled (especially if in progress), the driver is immediately notified via Pusher and the route is removed from their iOS app.

#### Backend Notification

**File**: `apps/web/src/app/api/admin/routes/[id]/cancel/route.ts`

```typescript
await pusher.trigger(`driver-${route.driverId}`, 'route-cancelled', {
  routeId: routeId,
  routeNumber: routeId,
  message: `Route ${routeId} has been cancelled by admin`,
  reason: 'Admin cancelled the route',
  bookingsCount: route.Booking?.length || 0,
  dropsCount: route.drops?.length || 0,
  cancelledAt: new Date().toISOString(),
  // Signal to iOS app to remove route immediately
  action: 'remove_route',
  shouldRemoveFromApp: true,
});
```

#### iOS App Handling

**File**: `mobile/ios-driver-app/Services/NotificationHandler.swift`

Added new notification type:
```swift
enum NotificationType: String, Codable {
    case routeCancelled = "route_cancelled"
    case dropRemoved = "drop_removed"
    // ... other types
}
```

Handler for route cancellation:
```swift
case .routeCancelled:
    // Remove route from app immediately
    NotificationCenter.default.post(
        name: NSNotification.Name("RemoveRoute"),
        object: nil,
        userInfo: ["routeId": payload.entityId]
    )
```

**File**: `mobile/ios-driver-app/Services/RouteService.swift`

Added notification observers:
```swift
@objc private func handleRouteCancellation(_ notification: Notification) {
    guard let routeId = notification.userInfo?["routeId"] as? String else { return }
    
    print("🗑️ Removing cancelled route from app: \(routeId)")
    
    // Remove route from active routes
    DispatchQueue.main.async {
        self.activeRoutes.removeAll { $0.id == routeId }
    }
    
    // Post notification to update UI
    NotificationCenter.default.post(
        name: NSNotification.Name("RoutesUpdated"),
        object: nil
    )
}
```

## User Flow

### Admin Cancels Route

1. **Admin clicks "Cancel Route"** in the admin dashboard
2. **Backend processes cancellation:**
   - Route status → `'closed'`
   - All drops → `routeId: null`, `status: 'pending'`
   - All bookings → `routeId: null`, `status: 'CONFIRMED'`
3. **Pusher notification sent** to driver (if assigned)
4. **Driver's iOS app receives notification:**
   - Route removed from active routes list
   - UI updates immediately
   - Driver sees cancellation message

### Admin Re-assigns Drops

1. **Admin opens route creation** (manual or smart generator)
2. **Pending drops list shows:**
   - All unassigned drops with **blue circle indicator**
   - Previously cancelled drops now available
3. **Admin selects drops** and creates new route
4. **Drops assigned to new route:**
   - `routeId` → new route ID
   - `status` → `'booked'` or `'assigned'`
   - Blue circle → assigned indicator

## Visual Indicators

### Drop Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| `pending` | 🔵 Blue Circle | Available for assignment |
| `booked` | 🟡 Yellow | Assigned to route |
| `in_transit` | 🟠 Orange | Driver en route |
| `delivered` | 🟢 Green | Completed |
| `failed` | 🔴 Red | Delivery failed |
| `cancelled` | ⚫ Gray | Cancelled (not re-assignable) |

**Key Difference:**
- **`pending`** = Available for re-assignment (blue circle)
- **`cancelled`** = Permanently cancelled (gray, not shown in pending list)

## API Endpoints

### Cancel Route

**Endpoint**: `POST /api/admin/routes/[id]/cancel`

**Request**: No body required

**Response**:
```json
{
  "route": {
    "id": "route_123",
    "status": "closed",
    "endTime": "2025-10-19T12:00:00Z"
  },
  "message": "Route cancelled successfully. Bookings have been reset to pending."
}
```

**Side Effects:**
- Route status → `'closed'`
- Drops → `routeId: null`, `status: 'pending'`
- Bookings → `routeId: null`, `status: 'CONFIRMED'`
- Driver notified via Pusher
- iOS app removes route

### Get Pending Drops

**Endpoint**: `GET /api/admin/routes/pending-drops`

**Query Parameters:**
- `includePendingPayment` (optional): Include drops with pending payment

**Response**:
```json
{
  "success": true,
  "drops": [
    {
      "id": "drop_123",
      "bookingId": "booking_456",
      "reference": "SV-123456",
      "pickupAddress": "123 Main St, London",
      "deliveryAddress": "456 Oak Ave, London",
      "status": "pending",
      "quotedPrice": 5000,
      "scheduledAt": "2025-10-19T14:00:00Z"
    }
  ],
  "totalCount": 15
}
```

## Testing

### Test Scenario 1: Cancel Planned Route

1. Create a route with 3 drops
2. Assign to driver
3. Cancel route before driver starts
4. **Expected:**
   - Route status = `'closed'`
   - 3 drops appear in pending drops with blue circles
   - Driver receives cancellation notification
   - Route removed from driver's app

### Test Scenario 2: Cancel In-Progress Route

1. Create a route with 5 drops
2. Driver accepts and starts route
3. Driver completes 2 drops
4. Admin cancels route
5. **Expected:**
   - Route status = `'closed'`
   - Remaining 3 drops → pending (blue circles)
   - Completed 2 drops → remain `'delivered'`
   - Driver receives immediate notification
   - Route disappears from driver's app

### Test Scenario 3: Re-assign Cancelled Drops

1. Cancel a route with 4 drops
2. Open smart route generator
3. **Expected:**
   - 4 drops visible in pending list with blue circles
   - Can select and add to new route
   - After assignment, blue circles → yellow (assigned)

## Database Schema

### Drop Status Flow

```
pending → booked → in_transit → delivered
   ↑                                ↓
   └──────── (route cancelled) ─────┘
```

### Route Status Flow

```
pending_assignment → planned → in_progress → completed
                       ↓
                    closed (cancelled)
```

## Troubleshooting

### Drops Not Showing After Cancellation

**Issue**: Cancelled drops don't appear in pending list

**Check:**
1. Verify drops have `routeId: null`
   ```sql
   SELECT id, routeId, status FROM "Drop" WHERE id = 'drop_id';
   ```
2. Verify drops have `status: 'pending'`
3. Check pending drops API response

**Fix**: Run manual update if needed
```sql
UPDATE "Drop" 
SET "routeId" = NULL, "status" = 'pending' 
WHERE "routeId" = 'cancelled_route_id';
```

### Driver Not Receiving Notification

**Issue**: Route not removed from driver's iOS app

**Check:**
1. Pusher credentials configured correctly
2. Driver subscribed to correct channel: `driver-{driverId}`
3. iOS app has notification permissions
4. Check server logs for Pusher errors

**Debug**:
```bash
# Check server logs
grep "Route cancellation notification" logs/*.log

# Test Pusher manually
curl -X POST https://api.pusher.com/apps/{app_id}/events \
  -H "Authorization: Bearer {key}" \
  -d '{"name":"route-cancelled","channel":"driver-123","data":{}}'
```

### Blue Circle Not Showing

**Issue**: Drops show wrong color indicator

**Check:**
1. Drop status is exactly `'pending'` (case-sensitive)
2. Frontend status mapping correct
3. CSS/styling applied correctly

**Frontend Check**:
```typescript
// Verify status mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'blue';
    case 'booked': return 'yellow';
    // ... other statuses
  }
};
```

## Performance Considerations

### Bulk Cancellations

When cancelling multiple routes:
- Use transaction to ensure atomicity
- Update drops in batches
- Send notifications asynchronously

```typescript
await prisma.$transaction(async (tx) => {
  // Update route
  await tx.route.update({ ... });
  
  // Update drops
  await tx.drop.updateMany({ ... });
  
  // Update bookings
  await tx.booking.updateMany({ ... });
});

// Send notification after transaction commits
await sendPusherNotification(...);
```

### Database Indexes

Ensure indexes exist for performance:
```sql
CREATE INDEX IF NOT EXISTS "idx_drop_routeid_status" 
ON "Drop"("routeId", "status");

CREATE INDEX IF NOT EXISTS "idx_booking_routeid_status" 
ON "Booking"("routeId", "status");
```

## Security

### Authorization

Only admins can cancel routes:
```typescript
const session = await getServerSession(authOptions);
if (!session?.user || (session.user as any).role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Audit Trail

All cancellations logged:
```typescript
adminNotes: `Route cancelled by admin on ${new Date().toISOString()}`
```

## Future Enhancements

1. **Cancellation Reasons**: Add dropdown for cancellation reason
2. **Partial Cancellation**: Allow cancelling specific drops only
3. **Driver Compensation**: Calculate compensation for cancelled routes
4. **Customer Notification**: Auto-notify customers of cancellation
5. **Undo Cancellation**: Allow reverting cancellation within time window

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Status**: Implemented and Tested

