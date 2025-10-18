# 📱 Real-time Notifications for iOS Driver App

## Overview
This document explains how real-time notifications work between the Admin dashboard and the iOS driver app using Pusher.

## 🔔 Notification Channels

### 1. **Driver-Specific Channel**
**Channel:** `driver-{driverId}`

#### Events:
- `job-removed` - When admin removes driver from order
- `order-removed` - When admin unassigns order
- `job-cancelled` - When admin cancels order
- `job-removed-from-list` - When admin cancels order with driver
- `schedule-updated` - When driver's schedule changes
- `route-cancelled` - When admin cancels a route
- `drop-removed` - When admin removes a drop from route

### 2. **Admin Channel**
**Channel:** `admin-channel`

#### Events:
- `order-unassigned` - Notification to admin when order is unassigned
- `order-assigned` - Notification when order is assigned

### 3. **Drivers Broadcast Channel**
**Channel:** `drivers-channel`

#### Events:
- `job-available-again` - When a job becomes available after driver removal
- `job-cancelled` - When a job is cancelled for all drivers

## 🚀 Admin Actions & Notifications

### Action 1: **Assign Driver**
**Endpoint:** `POST /api/admin/orders/[code]/assign-driver`

**Pusher Notifications Sent:**
```typescript
// To new driver
pusher.trigger(`driver-{newDriverId}`, 'job-assigned', {
  bookingId,
  bookingReference,
  customerName,
  pickupAddress,
  dropoffAddress,
  scheduledAt,
  totalGBP,
  message: 'New job assigned to you'
});

// To admin dashboard
pusher.trigger('admin-channel', 'job-assigned', {
  bookingId,
  bookingReference,
  driverId,
  driverName
});
```

**iOS App Should:**
- ✅ Refresh jobs list
- ✅ Show notification banner
- ✅ Update badge count
- ✅ Play notification sound

---

### Action 2: **Reassign Driver**
**Endpoint:** `POST /api/admin/orders/[code]/assign-driver` (with existing driver)

**Pusher Notifications Sent:**
```typescript
// To old driver
pusher.trigger(`driver-{oldDriverId}`, 'job-removed', {
  bookingId,
  bookingReference,
  reason: 'Reassigned to another driver',
  message: 'This job has been reassigned'
});

// To new driver
pusher.trigger(`driver-{newDriverId}`, 'job-assigned', {
  bookingId,
  bookingReference,
  // ... job details
});
```

**iOS App Should:**
- ✅ Remove job from old driver's list
- ✅ Add job to new driver's list
- ✅ Show reassignment notification

---

### Action 3: **Unassign Driver**
**Endpoint:** `POST /api/admin/orders/[code]/unassign`

**Pusher Notifications Sent:**
```typescript
// To driver
pusher.trigger(`driver-{driverId}`, 'order-removed', {
  orderRef,
  message: 'Order has been removed from your schedule by admin',
  reason
});

pusher.trigger(`driver-{driverId}`, 'schedule-updated', {
  type: 'order_removed',
  orderRef,
  timestamp
});

// To all drivers
pusher.trigger('drivers-channel', 'job-available-again', {
  bookingId,
  bookingReference,
  message: 'This job is now available'
});
```

**iOS App Should:**
- ✅ Remove order from active jobs list
- ✅ Update schedule view
- ✅ Show notification: "Order removed by admin"
- ✅ Refresh available jobs list

---

### Action 4: **Cancel Order**
**Endpoint:** `POST /api/admin/orders/[code]/cancel-enhanced`

**Pusher Notifications Sent:**
```typescript
// To assigned driver (if any)
pusher.trigger(`driver-{driverId}`, 'job-cancelled', {
  bookingId,
  bookingReference,
  reason,
  message: 'Your assigned job has been cancelled'
});

pusher.trigger(`driver-{driverId}`, 'job-removed-from-list', {
  bookingId,
  bookingReference,
  message: 'This job has been removed from your active jobs'
});

// To all drivers
pusher.trigger('drivers-channel', 'job-cancelled', {
  bookingId,
  bookingReference,
  reason,
  message: 'This job has been cancelled and is no longer available'
});

// Stop tracking
pusher.trigger(`tracking-{reference}`, 'tracking-stopped', {
  reason: 'booking_cancelled',
  message: 'Tracking stopped due to booking cancellation'
});
```

**iOS App Should:**
- ✅ Remove job from all lists
- ✅ Stop location tracking
- ✅ Clear any cached job data
- ✅ Show cancellation notification
- ✅ Update earnings/stats if needed

---

### Action 5: **Remove Driver (from order)**
**Endpoint:** `POST /api/admin/orders/[code]/remove-driver`

**Pusher Notifications Sent:**
```typescript
// To removed driver
pusher.trigger(`driver-{driverId}`, 'job-removed', {
  bookingId,
  bookingReference,
  reason,
  removedAt,
  message: 'You have been removed from this job'
});

// To all drivers
pusher.trigger('drivers-channel', 'job-available-again', {
  bookingId,
  bookingReference,
  customerName,
  pickupAddress,
  dropoffAddress,
  availableAt,
  message: 'This job is now available again'
});

// To customer
pusher.trigger(`booking-{reference}`, 'driver-removed', {
  reason,
  removedAt,
  message: 'Your driver has been changed'
});
```

**iOS App Should:**
- ✅ Remove job from active list
- ✅ Show notification: "Removed from job"
- ✅ Update availability status
- ✅ Refresh available jobs

---

### Action 6: **Cancel Route**
**Endpoint:** `POST /api/admin/routes/[id]/cancel`

**Pusher Notifications Sent:**
```typescript
// To assigned driver
pusher.trigger(`driver-{driverId}`, 'route-cancelled', {
  routeId,
  routeNumber,
  message: 'Route has been cancelled by admin',
  reason,
  bookingsCount,
  cancelledAt
});
```

**iOS App Should:**
- ✅ Remove entire route from routes list
- ✅ Remove all bookings in route
- ✅ Update schedule and earnings
- ✅ Show route cancellation notification

---

### Action 7: **Unassign Route**
**Endpoint:** `POST /api/admin/routes/[id]/unassign`

**Pusher Notifications Sent:**
```typescript
// To driver
pusher.trigger(`driver-{driverId}`, 'route-unassigned', {
  routeId,
  routeNumber,
  message: 'Route unassigned by admin',
  bookingsCount,
  dropsCount,
  earningsAdjustment
});
```

**iOS App Should:**
- ✅ Remove route from active routes
- ✅ Update earnings if partial completion
- ✅ Show unassignment notification

---

## 📲 iOS App Implementation Guide

### 1. **Pusher Setup**
```swift
// Initialize Pusher
let pusher = Pusher(
    key: "YOUR_PUSHER_KEY",
    options: PusherClientOptions(
        host: .cluster("eu")
    )
)

// Subscribe to driver channel
let driverChannel = pusher.subscribe("driver-\(driverId)")
```

### 2. **Event Handlers**
```swift
// Job Removed
driverChannel.bind(eventName: "job-removed") { (data: Any?) in
    if let data = data as? [String: Any],
       let bookingId = data["bookingId"] as? String {
        // Remove from local list
        self.removeJobFromList(bookingId)
        
        // Show notification
        self.showNotification(title: "Job Removed", 
                            message: "This job has been removed by admin")
        
        // Refresh jobs
        self.refreshJobsList()
    }
}

// Order Removed
driverChannel.bind(eventName: "order-removed") { (data: Any?) in
    if let data = data as? [String: Any],
       let orderRef = data["orderRef"] as? String {
        self.removeOrderFromSchedule(orderRef)
        self.showNotification(title: "Order Removed", 
                            message: data["message"] as? String ?? "")
    }
}

// Job Cancelled
driverChannel.bind(eventName: "job-cancelled") { (data: Any?) in
    if let data = data as? [String: Any],
       let bookingId = data["bookingId"] as? String {
        self.removeJobCompletely(bookingId)
        self.stopLocationTracking()
        self.showNotification(title: "Job Cancelled", 
                            message: "This job has been cancelled")
    }
}

// Schedule Updated
driverChannel.bind(eventName: "schedule-updated") { (data: Any?) in
    self.refreshSchedule()
    self.updateCalendarView()
}

// Route Cancelled
driverChannel.bind(eventName: "route-cancelled") { (data: Any?) in
    if let data = data as? [String: Any],
       let routeId = data["routeId"] as? String {
        self.removeRouteFromList(routeId)
        self.updateEarnings()
        self.showNotification(title: "Route Cancelled", 
                            message: data["message"] as? String ?? "")
    }
}
```

### 3. **Testing Real-time Notifications**

#### Manual Test:
1. Login to iOS app as driver
2. Open Admin dashboard
3. Perform action (assign/unassign/cancel)
4. Check iOS app for:
   - Notification banner
   - List updates
   - Badge updates
   - Sound/vibration

#### Automated Test:
```bash
# Test Pusher notification
curl -X POST https://api.speedy-van.co.uk/api/admin/orders/TEST123/unassign \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN" \
  -d '{"reason": "Test notification"}'
```

---

## ✅ Checklist for iOS Developer

- [ ] Pusher SDK integrated
- [ ] Driver channel subscription working
- [ ] `job-removed` event handled
- [ ] `order-removed` event handled
- [ ] `job-cancelled` event handled
- [ ] `schedule-updated` event handled
- [ ] `route-cancelled` event handled
- [ ] `drop-removed` event handled
- [ ] Notification banners displayed
- [ ] Jobs list refreshes automatically
- [ ] Location tracking stops on cancel
- [ ] Badge count updates
- [ ] Sounds/vibrations work
- [ ] Error handling for network issues
- [ ] Reconnection logic implemented

---

## 🐛 Troubleshooting

### Issue: Notifications not received
**Check:**
1. Pusher key correct?
2. Channel name format: `driver-{driverId}`
3. Driver logged in?
4. Network connection stable?
5. App in foreground/background?

### Issue: Delayed notifications
**Check:**
1. Network latency
2. Pusher connection state
3. Server-side trigger delays
4. iOS background app refresh settings

### Issue: Duplicate notifications
**Check:**
1. Multiple channel subscriptions
2. App state management
3. Event unbinding on logout

---

## 📊 Monitoring

### Pusher Dashboard
- Monitor channel subscriptions
- Check event delivery rates
- View connection statistics
- Debug failed deliveries

### App Analytics
- Track notification received rate
- Monitor user engagement with notifications
- Measure time to update UI
- Log any Pusher errors

---

## 🔐 Security Notes

1. **Channel Authentication:**
   - Use private channels for sensitive data
   - Implement proper auth endpoints
   - Validate driver IDs

2. **Data Validation:**
   - Always validate event data
   - Handle malformed payloads
   - Sanitize user inputs

3. **Connection Security:**
   - Use TLS (enabled by default)
   - Store Pusher key securely
   - Don't expose secret in client

---

## 📝 Notes

- All endpoints include Pusher notifications
- Notifications are non-blocking (won't fail requests)
- Multiple channels ensure redundancy
- Events logged for audit trail
- Customer/admin also notified where appropriate

---

**Last Updated:** $(date)
**Environment:** Production
**Pusher Cluster:** EU

