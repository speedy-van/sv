# Multi-Drop Routes Management APIs

## Overview
Complete API endpoints for managing multi-drop routes with smart notifications, driver management, and route operations.

## Smart Notifications System

### Auto Admin Alerts
The system automatically notifies admins when routes have:
- **Long Distance**: Routes > 50 miles
- **Long Duration**: Routes > 5 hours (300 minutes)
- **High Drop Count**: Routes with > 10 stops

**Severity Levels:**
- `high`: Distance > 100 miles OR Duration > 8 hours
- `medium`: Other threshold violations

**Pusher Channel:** `admin-notifications`
**Event:** `route-alert`

```json
{
  "type": "route_created_alert",
  "routeId": "route_123",
  "routeReference": "SV-000019",
  "severity": "high",
  "metrics": {
    "totalDistance": "127.5 miles",
    "totalDuration": "8 hours",
    "dropsCount": 15,
    "estimatedValue": "£7213.89"
  },
  "alerts": [
    "Long distance route: 127.5 miles",
    "Long duration: 8 hours",
    "High drop count: 15 stops"
  ],
  "timestamp": "2025-11-27T05:40:00.331Z"
}
```

## API Endpoints

### 1. Create Route
**POST** `/api/admin/routes/create`

Creates a new multi-drop route with automatic notifications.

**Request Body:**
```json
{
  "bookingIds": ["booking1", "booking2", "..."],
  "driverId": "driver_id_optional",
  "startTime": "2025-11-27T10:00:00Z",
  "isAutomatic": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "route": {
      "id": "route_123",
      "reference": "SV-000019",
      "status": "assigned",
      "totalDrops": 15,
      "totalOutcome": 721389
    },
    "analysis": {
      "totalDistance": 127.5,
      "totalDuration": 525,
      "totalValue": 721389
    }
  }
}
```

**Features:**
- ✅ Validates driver exists
- ✅ Uses `Driver.userId` for foreign key
- ✅ Batch creates bookings and drops
- ✅ Smart admin notifications
- ✅ Driver notifications

---

### 2. Cancel Route
**POST** `/api/admin/routes/[id]/cancel`

Cancels a route and resets all bookings to pending status.

**Request Body:**
```json
{
  "reason": "Customer requested cancellation"
}
```

**Response:**
```json
{
  "success": true,
  "route": { "..." },
  "message": "Route SV-000019 cancelled successfully. 15 bookings reset to pending.",
  "data": {
    "routeReference": "SV-000019",
    "bookingsReset": 15,
    "dropsDeleted": 15
  }
}
```

**Features:**
- ✅ Resets all bookings to `CONFIRMED` status
- ✅ Removes `routeId` from bookings
- ✅ Deletes all drops
- ✅ Notifies driver via Pusher
- ✅ Notifies admin
- ✅ Sends cancellation emails to all customers
- ✅ Transaction-safe

---

### 3. Remove Driver from Route
**POST** `/api/admin/routes/[id]/remove-driver`

Removes driver from route without cancelling the route.

**Request Body:**
```json
{
  "reason": "Driver unavailable"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver Hannah Lewis removed from route SV-000019",
  "data": {
    "route": { "..." },
    "driverName": "Hannah Lewis",
    "bookingsUpdated": 15
  }
}
```

**Features:**
- ✅ Sets route status to `pending_assignment`
- ✅ Removes driver from all bookings
- ✅ Resets bookings to `CONFIRMED`
- ✅ Updates admin notes with timestamp
- ✅ Notifies driver via Pusher
- ✅ Notifies admin
- ✅ Transaction-safe

---

### 4. Edit Route
**PUT** `/api/admin/routes/[id]/edit`

Add, remove, or reorder bookings in a route.

**Request Body:**
```json
{
  "bookingIds": ["booking1", "booking2", "..."],
  "action": "add" // "add", "remove", or "reorder"
}
```

**Actions:**
- `add`: Adds new bookings to existing route
- `remove`: Removes specified bookings from route
- `reorder`: Changes the sequence of stops

**Response:**
```json
{
  "success": true,
  "data": {
    "route": { "..." },
    "bookings": [ "..." ]
  }
}
```

**Features:**
- ✅ Re-analyzes route metrics
- ✅ Updates drops and sequences
- ✅ Batch updates for performance
- ✅ Deletes route if no bookings remain
- ✅ Transaction-safe

---

### 5. Reassign Route
**POST** `/api/admin/routes/[id]/reassign`

Reassigns route to a different driver.

**Request Body:**
```json
{
  "driverId": "new_driver_id",
  "reason": "Original driver unavailable"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Route reassigned successfully",
  "data": {
    "route": { "..." },
    "oldDriver": "John Doe",
    "newDriver": "Jane Smith"
  }
}
```

**Features:**
- ✅ Validates new driver
- ✅ Updates all bookings
- ✅ Notifies both drivers
- ✅ Audit logging
- ✅ Transaction-safe

---

## Pusher Events

### Driver Notifications

**Channel:** `driver-{userId}`

**Events:**
1. `route-assigned`
```json
{
  "routeId": "route_123",
  "routeReference": "SV-000019",
  "stops": 15,
  "totalDistance": "127.5 miles",
  "estimatedDuration": "8 hours",
  "totalValue": 721389,
  "timestamp": "2025-11-27T05:40:00.331Z"
}
```

2. `route-removed`
```json
{
  "routeId": "route_123",
  "routeReference": "SV-000019",
  "reason": "Route reassignment by admin",
  "timestamp": "2025-11-27T05:40:00.331Z"
}
```

3. `route-cancelled`
```json
{
  "routeId": "route_123",
  "routeReference": "SV-000019",
  "message": "Route SV-000019 has been cancelled by admin",
  "reason": "Admin cancelled the route",
  "bookingsCount": 15,
  "dropsCount": 15,
  "cancelledAt": "2025-11-27T05:40:00.331Z",
  "action": "remove_route",
  "shouldRemoveFromApp": true
}
```

### Admin Notifications

**Channel:** `admin-notifications`

**Events:**
1. `route-alert` (Auto-triggered for long routes)
2. `route-driver-removed`
3. `route-cancelled`

---

## Database Schema Updates

### Route Model
```prisma
model Route {
  driverId: String? // References User.id (not Driver.id)
  User: User? @relation(fields: [driverId], references: [id])
}
```

**Important:** 
- Foreign key `Route.driverId` → `User.id`
- Use `Driver.userId` when assigning routes
- NOT `Driver.id`

---

## Performance Optimizations

### Batch Operations
1. **Booking Updates**: `Promise.all()` instead of loops
2. **Drop Creation**: `createMany()` instead of individual creates
3. **Transaction Timeout**: Fixed with parallel operations

### Before (Slow)
```typescript
for (let i = 0; i < bookings.length; i++) {
  await prisma.booking.update({ ... }); // 15 sequential queries
  await prisma.drop.create({ ... });     // 15 sequential queries
}
// Total: 30 sequential queries = ~10 seconds
```

### After (Fast)
```typescript
await Promise.all(bookings.map((b, i) => 
  tx.booking.update({ ... })
)); // All in parallel

await tx.drop.createMany({ data: dropsData }); // Single batch query
// Total: 2 parallel operations = ~1 second
```

---

## Error Handling

All endpoints include:
- ✅ Proper error messages
- ✅ Transaction rollback on failure
- ✅ Detailed logging with emojis
- ✅ Graceful notification failures (non-blocking)

---

## Testing

### Manual Testing Checklist
- [ ] Create route with > 50 miles → Admin notification
- [ ] Create route with > 10 drops → Admin notification
- [ ] Cancel route → All bookings reset + emails sent
- [ ] Remove driver → Route back to pending
- [ ] Edit route (add/remove) → Metrics updated
- [ ] Reassign driver → Both drivers notified

### API Testing
```bash
# Create route
curl -X POST http://localhost:3000/api/admin/routes/create \
  -H "Content-Type: application/json" \
  -d '{"bookingIds": ["id1","id2"], "driverId": "driver_id"}'

# Cancel route
curl -X POST http://localhost:3000/api/admin/routes/{id}/cancel \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test cancellation"}'

# Remove driver
curl -X POST http://localhost:3000/api/admin/routes/{id}/remove-driver \
  -H "Content-Type: application/json" \
  -d '{"reason": "Driver unavailable"}'
```

---

## Migration Notes

### Breaking Changes
None - All endpoints are backward compatible

### Database Changes
None - Uses existing schema correctly

### Code Changes
1. Fixed `Route.driverId` to use `Driver.userId`
2. Optimized batch operations
3. Added smart notifications

---

## Future Enhancements
- [ ] SMS notifications for high-priority alerts
- [ ] Auto-reassignment when driver removed
- [ ] Route optimization suggestions
- [ ] Driver workload balancing
- [ ] Estimated arrival time tracking
