# 🚀 Complete Decline & Removal System - Full Documentation

## Overview
Enterprise-grade system for handling driver declines and admin removals with instant UI updates, automatic reassignment, acceptance rate tracking, and earnings recalculation.

---

## ✨ Complete Feature Set

### 1. **Instant Removal from Driver UI** ⚡
- ✅ Job/Route **disappears instantly** from Driver Portal
- ✅ Job/Route **disappears instantly** from iOS Driver App
- ✅ No manual refresh needed
- ✅ Powered by Pusher real-time events

### 2. **Automatic Reassignment** 🔄
- ✅ Finds next available driver **automatically**
- ✅ Prioritizes drivers by **acceptance rate** (highest first)
- ✅ Checks driver **capacity** before assignment
- ✅ Creates new **Assignment** record
- ✅ Notifies new driver **instantly**

### 3. **Acceptance Rate Tracking** 📊
- ✅ Each decline = **-5% acceptance rate**
- ✅ Rate **never goes below 0%**
- ✅ Updated in `DriverPerformance` table
- ✅ Real-time sync across all platforms

### 4. **Earnings Recalculation** 💰
- ✅ Calculates earnings for **completed drops only**
- ✅ Uncompleted drops = **£0**
- ✅ Updates `DriverEarnings` table
- ✅ Admin notes for audit trail

### 5. **Real-Time Admin Updates** 💼
- ✅ `admin/orders` panel updates instantly
- ✅ `admin/routes` panel updates instantly
- ✅ Admin schedule syncs in real-time
- ✅ Driver schedule syncs in real-time

---

## 🔄 Complete Workflow

### Scenario: Driver Declines Job

```
Driver Clicks "Decline" Button
        ↓
Backend Updates Database
        ↓
Pusher Sends Real-Time Events
        ↓
┌───────────────────┴───────────────────┐
↓                                       ↓
INSTANT REMOVAL                    AUTO-REASSIGNMENT
↓                                       ↓
Driver Portal: Job disappears     Find next driver (by acceptance rate)
iOS App: Job disappears           Create new assignment
                                  Send job offer to new driver
        ↓                                ↓
ACCEPTANCE RATE UPDATE            ADMIN NOTIFICATIONS
        ↓                                ↓
Performance: -5%                  admin/orders: updates instantly
Driver sees: "Rate: 80%"          admin/schedule: updates instantly
        ↓
ALL PLATFORMS SYNCED ✅
```

---

## 📡 Pusher Events - Complete List

### For Driver (Instant Removal):

#### 1. Job Removed Event
```javascript
{
  event: 'job-removed',
  channel: 'driver-{driverId}',
  data: {
    jobId: 'job_123',
    reason: 'declined',
    message: 'Job declined and removed from your schedule',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Remove job from list instantly
jobs.filter(j => j.id !== data.jobId)
```

#### 2. Route Removed Event
```javascript
{
  event: 'route-removed',
  channel: 'driver-{driverId}',
  data: {
    routeId: 'route_abc',
    reason: 'declined',
    message: 'Route declined and removed from your schedule',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Remove route from list instantly
routes.filter(r => r.id !== data.routeId)
```

#### 3. Acceptance Rate Updated
```javascript
{
  event: 'acceptance-rate-updated',
  channel: 'driver-{driverId}',
  data: {
    acceptanceRate: 80,
    change: -5,
    reason: 'job_declined',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Update progress bar
setAcceptanceRate(data.acceptanceRate)
```

#### 4. Schedule Updated
```javascript
{
  event: 'schedule-updated',
  channel: 'driver-{driverId}',
  data: {
    type: 'job_removed',  // or 'route_removed'
    jobId: 'job_123',
    acceptanceRate: 80,
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Reload schedule
loadSchedule()
```

---

### For Next Driver (Auto-Reassignment):

#### 5. Job Offer Event
```javascript
{
  event: 'job-offer',
  channel: 'driver-{nextDriverId}',
  data: {
    jobId: 'job_123',
    message: 'New job offer (auto-reassigned)',
    expiresIn: 600,  // seconds
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Show new job notification
showJobOffer(data)
```

#### 6. Route Offer Event
```javascript
{
  event: 'route-offer',
  channel: 'driver-{nextDriverId}',
  data: {
    routeId: 'route_abc',
    dropCount: 10,
    estimatedEarnings: 150,  // £150
    estimatedDuration: 180,  // minutes
    message: 'New route assigned with 10 stops (auto-reassigned)',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Show route notification
showRouteOffer(data)
```

---

### For Admin:

#### 7. Order Status Changed
```javascript
{
  event: 'order-status-changed',
  channel: 'admin-orders',
  data: {
    jobId: 'job_123',
    status: 'available',
    previousDriver: 'driver_456',
    driverName: 'John Doe',
    reason: 'declined',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Update order in list
updateOrderStatus(data.jobId, 'available')
```

#### 8. Order Reassigned
```javascript
{
  event: 'order-reassigned',
  channel: 'admin-orders',
  data: {
    jobId: 'job_123',
    previousDriver: 'driver_456',
    previousDriverName: 'John Doe',
    newDriver: 'driver_789',
    newDriverName: 'Jane Smith',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Update order assignment
updateOrderDriver(data.jobId, data.newDriver)
```

#### 9. Route Status Changed
```javascript
{
  event: 'route-status-changed',
  channel: 'admin-routes',
  data: {
    routeId: 'route_abc',
    status: 'available',
    previousDriver: 'driver_456',
    driverName: 'John Doe',
    reason: 'declined',
    dropCount: 10,
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Update route in list
updateRouteStatus(data.routeId, 'available')
```

#### 10. Route Reassigned
```javascript
{
  event: 'route-reassigned',
  channel: 'admin-routes',
  data: {
    routeId: 'route_abc',
    previousDriver: 'driver_456',
    previousDriverName: 'John Doe',
    newDriver: 'driver_789',
    newDriverName: 'Jane Smith',
    dropCount: 10,
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Update route assignment
updateRouteDriver(data.routeId, data.newDriver)
```

#### 11. Driver Performance Updated
```javascript
{
  event: 'driver-performance-updated',
  channel: 'admin-schedule',
  data: {
    driverId: 'driver_456',
    acceptanceRate: 80,
    type: 'acceptance_rate_decreased',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Update driver stats
updateDriverPerformance(data.driverId, data.acceptanceRate)
```

#### 12. Driver Acceptance Rate Updated
```javascript
{
  event: 'driver-acceptance-rate-updated',
  channel: 'admin-drivers',
  data: {
    driverId: 'driver_456',
    driverName: 'John Doe',
    acceptanceRate: 80,
    change: -5,
    reason: 'job_declined',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}

// Frontend Action: Update driver in list
updateDriver(data.driverId, { acceptanceRate: data.acceptanceRate })
```

---

## 💻 Frontend Integration

### Driver Portal - Instant Removal

```typescript
'use client';
import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

export function DriverJobsList({ driverId }: { driverId: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [acceptanceRate, setAcceptanceRate] = useState(100);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
    });

    const channel = pusher.subscribe(`driver-${driverId}`);

    // INSTANT REMOVAL: Remove job from UI
    channel.bind('job-removed', (data: any) => {
      setJobs(prev => prev.filter(job => job.id !== data.jobId));
      
      toast({
        title: 'Job Removed',
        description: data.message,
        status: 'info',
        duration: 3000
      });
    });

    // INSTANT REMOVAL: Remove route from UI
    channel.bind('route-removed', (data: any) => {
      setRoutes(prev => prev.filter(route => route.id !== data.routeId));
      
      toast({
        title: 'Route Removed',
        description: data.message,
        status: 'info',
        duration: 3000
      });
    });

    // Update acceptance rate
    channel.bind('acceptance-rate-updated', (data: any) => {
      setAcceptanceRate(data.acceptanceRate);
      
      toast({
        title: 'Performance Update',
        description: `Acceptance rate: ${data.acceptanceRate}% (${data.change}%)`,
        status: 'warning',
        duration: 5000
      });
    });

    // New job offer (after reassignment)
    channel.bind('job-offer', (data: any) => {
      toast({
        title: 'New Job Offer',
        description: data.message,
        status: 'success',
        duration: 8000
      });
      
      loadJobs(); // Refresh job list
    });

    // New route offer (after reassignment)
    channel.bind('route-offer', (data: any) => {
      toast({
        title: 'New Route Offer',
        description: data.message,
        status: 'success',
        duration: 8000
      });
      
      loadRoutes(); // Refresh route list
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`driver-${driverId}`);
    };
  }, [driverId]);

  return (
    <Box>
      {/* Acceptance Rate Progress */}
      <Box mb={4}>
        <Text>Acceptance Rate</Text>
        <Progress 
          value={acceptanceRate} 
          colorScheme={acceptanceRate >= 80 ? 'green' : acceptanceRate >= 60 ? 'yellow' : 'red'}
        />
        <Text>{acceptanceRate}%</Text>
      </Box>

      {/* Jobs List */}
      {jobs.map(job => (
        <JobCard key={job.id} job={job} onDecline={handleDecline} />
      ))}
    </Box>
  );
}
```

---

### Admin Orders Panel - Real-Time Updates

```typescript
'use client';
import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

export function AdminOrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
    });

    const channel = pusher.subscribe('admin-orders');

    // Order status changed (after decline)
    channel.bind('order-status-changed', (data: any) => {
      setOrders(prev => 
        prev.map(order => 
          order.id === data.jobId
            ? { ...order, status: data.status, driver: null }
            : order
        )
      );

      toast({
        title: 'Order Updated',
        description: `Order declined by ${data.driverName}`,
        status: 'info',
        duration: 4000
      });
    });

    // Order reassigned (auto-reassignment)
    channel.bind('order-reassigned', (data: any) => {
      setOrders(prev => 
        prev.map(order => 
          order.id === data.jobId
            ? { ...order, driverId: data.newDriver, driverName: data.newDriverName }
            : order
        )
      );

      toast({
        title: 'Order Auto-Reassigned',
        description: `From ${data.previousDriverName} to ${data.newDriverName}`,
        status: 'success',
        duration: 5000
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('admin-orders');
    };
  }, []);

  return <OrdersTable orders={orders} />;
}
```

---

### Admin Routes Panel - Real-Time Updates

```typescript
'use client';
import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

export function AdminRoutesPanel() {
  const [routes, setRoutes] = useState<Route[]>([]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
    });

    const channel = pusher.subscribe('admin-routes');

    // Route status changed (after decline)
    channel.bind('route-status-changed', (data: any) => {
      setRoutes(prev => 
        prev.map(route => 
          route.id === data.routeId
            ? { ...route, status: data.status, driverId: null }
            : route
        )
      );

      toast({
        title: 'Route Updated',
        description: `Route declined by ${data.driverName} (${data.dropCount} stops)`,
        status: 'info',
        duration: 4000
      });
    });

    // Route reassigned (auto-reassignment)
    channel.bind('route-reassigned', (data: any) => {
      setRoutes(prev => 
        prev.map(route => 
          route.id === data.routeId
            ? { 
                ...route, 
                driverId: data.newDriver, 
                driverName: data.newDriverName,
                status: 'assigned'
              }
            : route
        )
      );

      toast({
        title: 'Route Auto-Reassigned',
        description: `${data.dropCount} stops reassigned from ${data.previousDriverName} to ${data.newDriverName}`,
        status: 'success',
        duration: 5000
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('admin-routes');
    };
  }, []);

  return <RoutesTable routes={routes} />;
}
```

---

### iOS Driver App - Instant Removal

```swift
import PusherSwift
import UIKit

class DriverJobsViewController: UIViewController {
    var jobs: [Job] = []
    var routes: [Route] = []
    var acceptanceRate: Double = 100.0
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupPusher()
    }
    
    func setupPusher() {
        let pusher = Pusher(
            key: "YOUR_PUSHER_KEY",
            options: PusherClientOptions(cluster: "eu")
        )
        
        let channel = pusher.subscribe("driver-\(driverId)")
        
        // INSTANT REMOVAL: Job removed
        channel.bind(eventName: "job-removed") { (event: PusherEvent) -> Void in
            if let data = event.data as? [String: Any],
               let jobId = data["jobId"] as? String {
                
                DispatchQueue.main.async {
                    // Remove job from array instantly
                    self.jobs.removeAll(where: { $0.id == jobId })
                    self.tableView.reloadData()
                    
                    // Show notification
                    self.showBanner(
                        title: "Job Removed",
                        message: data["message"] as? String ?? "Job declined",
                        style: .info
                    )
                }
            }
        }
        
        // INSTANT REMOVAL: Route removed
        channel.bind(eventName: "route-removed") { (event: PusherEvent) -> Void in
            if let data = event.data as? [String: Any],
               let routeId = data["routeId"] as? String {
                
                DispatchQueue.main.async {
                    // Remove route from array instantly
                    self.routes.removeAll(where: { $0.id == routeId })
                    self.tableView.reloadData()
                    
                    // Show notification
                    self.showBanner(
                        title: "Route Removed",
                        message: data["message"] as? String ?? "Route declined",
                        style: .info
                    )
                }
            }
        }
        
        // Acceptance rate update
        channel.bind(eventName: "acceptance-rate-updated") { (event: PusherEvent) -> Void in
            if let data = event.data as? [String: Any],
               let newRate = data["acceptanceRate"] as? Double {
                
                DispatchQueue.main.async {
                    self.acceptanceRate = newRate
                    self.updateAcceptanceRateUI()
                    
                    // Show warning notification
                    self.showNotification(
                        title: "Performance Update",
                        body: "Your acceptance rate is now \(Int(newRate))%"
                    )
                }
            }
        }
        
        // New job offer (after auto-reassignment)
        channel.bind(eventName: "job-offer") { (event: PusherEvent) -> Void in
            if let data = event.data as? [String: Any] {
                DispatchQueue.main.async {
                    // Show job offer notification
                    self.showJobOfferAlert(data)
                    
                    // Refresh jobs list
                    self.loadJobs()
                }
            }
        }
        
        // New route offer (after auto-reassignment)
        channel.bind(eventName: "route-offer") { (event: PusherEvent) -> Void in
            if let data = event.data as? [String: Any] {
                DispatchQueue.main.async {
                    // Show route offer notification
                    self.showRouteOfferAlert(data)
                    
                    // Refresh routes list
                    self.loadRoutes()
                }
            }
        }
        
        pusher.connect()
    }
}
```

---

## 🎯 Auto-Reassignment Logic

### Priority Order:
```
1. Driver Status: active ✅
2. Onboarding: approved ✅
3. Availability: online ✅
4. Capacity: Has space (currentCapacityUsed < maxConcurrentDrops) ✅
5. Sorted by: Acceptance Rate (highest first) ✅
```

### Example:
```
Available Drivers:
1. Driver A - 95% acceptance rate, 3/5 capacity ✅ SELECTED
2. Driver B - 90% acceptance rate, 5/5 capacity ❌ FULL
3. Driver C - 85% acceptance rate, 2/5 capacity ✅ BACKUP

Result: Job/Route assigned to Driver A
```

---

## 🗄️ Database Updates

### When Job Declined:

```sql
-- 1. Update Assignment
UPDATE Assignment
SET status = 'declined'
WHERE bookingId = 'job_123' AND driverId = 'driver_456'

-- 2. Reset Booking
UPDATE Booking
SET driverId = NULL, status = 'CONFIRMED'
WHERE id = 'job_123'

-- 3. Update Acceptance Rate
UPDATE DriverPerformance
SET acceptanceRate = GREATEST(0, acceptanceRate - 5),
    lastCalculated = NOW()
WHERE driverId = 'driver_456'

-- 4. Create New Assignment (Auto-reassign)
INSERT INTO Assignment (id, bookingId, driverId, status, expiresAt)
VALUES ('assign_job_123_driver_789_...', 'job_123', 'driver_789', 'invited', NOW() + INTERVAL '10 minutes')
```

### When Route Declined:

```sql
-- 1. Update Route
UPDATE Route
SET driverId = NULL, status = 'planned'
WHERE id = 'route_abc'

-- 2. Reset Bookings
UPDATE Booking
SET driverId = NULL
WHERE id IN (SELECT bookingId FROM Drop WHERE routeId = 'route_abc')

-- 3. Reset Drops
UPDATE Drop
SET status = 'pending'
WHERE routeId = 'route_abc'

-- 4. Update Acceptance Rate
UPDATE DriverPerformance
SET acceptanceRate = GREATEST(0, acceptanceRate - 5),
    lastCalculated = NOW()
WHERE driverId = 'driver_456'

-- 5. Reassign Route (Auto-reassign)
UPDATE Route
SET driverId = 'driver_789', status = 'assigned'
WHERE id = 'route_abc'
```

---

## ✅ Complete Checklist

### Backend:
- [x] Job decline API updated with -5% logic
- [x] Route decline API updated with -5% logic
- [x] Dispatch decline API updated with -5% logic
- [x] Instant removal Pusher events added
- [x] Auto-reassignment logic implemented
- [x] Acceptance rate tracking (never below 0%)
- [x] Admin panels real-time updates
- [x] Driver schedule real-time updates
- [x] Earnings recalculation for partial completion
- [x] Audit trail logging

### Frontend Events:
- [x] `job-removed` - Instant UI removal
- [x] `route-removed` - Instant UI removal
- [x] `acceptance-rate-updated` - Live progress bar
- [x] `job-offer` - New assignment notification
- [x] `route-offer` - New assignment notification
- [x] `order-status-changed` - Admin panel update
- [x] `order-reassigned` - Admin panel update
- [x] `route-status-changed` - Admin panel update
- [x] `route-reassigned` - Admin panel update
- [x] `driver-performance-updated` - Admin schedule
- [x] `driver-acceptance-rate-updated` - Admin drivers list

### Documentation:
- [x] Complete Pusher events reference
- [x] Frontend integration examples
- [x] iOS app integration code
- [x] Database schema updates
- [x] Auto-reassignment logic
- [x] Error handling guide

---

## 🚀 Complete Flow Example

### Driver Declines Job:

```
1. Driver Portal/iOS:
   - Driver clicks "Decline" button
   
2. API Processing:
   - Updates Assignment → 'declined'
   - Resets Booking → driverId = null
   - Updates DriverPerformance → acceptanceRate - 5%
   
3. Pusher Events Sent:
   ✉️ driver-{id}: 'job-removed' → Job disappears instantly
   ✉️ driver-{id}: 'acceptance-rate-updated' → Progress bar updates
   ✉️ admin-orders: 'order-status-changed' → Admin sees change
   
4. Auto-Reassignment:
   - Find best driver (highest acceptance rate + capacity)
   - Create new Assignment
   - Send Pusher event: driver-{newId}: 'job-offer'
   - Send Pusher event: admin-orders: 'order-reassigned'
   
5. Result:
   ✅ Original driver: Job removed from UI
   ✅ New driver: Job offer appears instantly
   ✅ Admin panel: Shows reassignment in real-time
   ✅ All platforms: Synchronized perfectly
```

---

## 🎉 Summary

### What Happens on Decline:

1. **Instant Removal** ⚡
   - Job/Route **vanishes** from Driver Portal
   - Job/Route **vanishes** from iOS App
   - No page refresh needed

2. **Automatic Reassignment** 🔄
   - System finds best available driver
   - Assigns job/route automatically
   - Notifies new driver instantly

3. **Acceptance Rate Update** 📉
   - Decreases by 5% per decline
   - Never below 0%
   - Updates in real-time everywhere

4. **Admin Notifications** 💼
   - `admin/orders` updates instantly
   - `admin/routes` updates instantly
   - Shows old driver → new driver

5. **Schedule Sync** 📅
   - Driver schedule updates
   - Admin schedule updates
   - All platforms synchronized

**The workflow NEVER stops - declined jobs are instantly reassigned! 🚀**

