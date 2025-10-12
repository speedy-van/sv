# 📊 Driver Acceptance Rate System - Complete Documentation

## Overview
Automatic acceptance rate tracking system that decreases by 5% each time a driver declines an order or route, with real-time updates across all platforms.

---

## ✨ Key Features

### 1. **Automatic Acceptance Rate Decrease**
- ✅ Every decline = **-5% acceptance rate**
- ✅ Rate never drops below **0%**
- ✅ Stored in `DriverPerformance` table
- ✅ Real-time calculation and update

### 2. **Real-Time Updates**
- ✅ **Driver Schedule** - instant update via Pusher
- ✅ **Admin Schedule** - instant update via Pusher
- ✅ **Driver Portal** - live progress bar update
- ✅ **iOS App** - push notification with new rate

### 3. **Multi-Platform Sync**
- ✅ All changes synchronized instantly
- ✅ No manual refresh needed
- ✅ Consistent data across platforms

---

## 🔄 How It Works

### When Driver Declines Order:

1. **Driver Action** → Decline order/route
2. **Backend Processing:**
   ```
   Current Rate: 85%
   Decline: -5%
   New Rate: 80% (max(0, 85 - 5))
   ```
3. **Database Update:**
   ```sql
   UPDATE DriverPerformance
   SET acceptanceRate = 80,
       lastCalculated = NOW()
   WHERE driverId = 'driver123'
   ```
4. **Real-Time Notifications:**
   ```javascript
   // Driver channel
   pusher.trigger('driver-{id}', 'acceptance-rate-updated', {
     acceptanceRate: 80,
     change: -5,
     reason: 'job_declined'
   })

   // Admin channel
   pusher.trigger('admin-schedule', 'driver-performance-updated', {
     driverId: 'driver123',
     acceptanceRate: 80,
     type: 'acceptance_rate_decreased'
   })
   ```

---

## 📱 Pusher Events Reference

### Driver Channel Events

#### Acceptance Rate Updated
```javascript
{
  event: 'acceptance-rate-updated',
  channel: 'driver-{driverId}',
  data: {
    acceptanceRate: 80,        // New rate (0-100)
    change: -5,                // Change amount (always -5)
    reason: 'job_declined',    // or 'route_declined'
    jobId: 'abc123',          // or routeId
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}
```

#### Schedule Updated
```javascript
{
  event: 'schedule-updated',
  channel: 'driver-{driverId}',
  data: {
    type: 'acceptance_rate_changed',
    acceptanceRate: 80,
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}
```

### Admin Channel Events

#### Driver Acceptance Rate Updated
```javascript
{
  event: 'driver-acceptance-rate-updated',
  channel: 'admin-drivers',
  data: {
    driverId: 'driver123',
    driverName: 'John Doe',
    acceptanceRate: 80,
    change: -5,
    reason: 'job_declined',    // or 'route_declined'
    jobId: 'abc123',          // or routeId
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}
```

#### Driver Performance Updated
```javascript
{
  event: 'driver-performance-updated',
  channel: 'admin-schedule',
  data: {
    driverId: 'driver123',
    acceptanceRate: 80,
    type: 'acceptance_rate_decreased',
    timestamp: '2024-01-15T10:30:00.000Z'
  }
}
```

---

## 🛠️ API Endpoints

### 1. Decline Job
```
POST /api/driver/jobs/[id]/decline

Response:
{
  "success": true,
  "message": "Job declined successfully",
  "acceptanceRate": 80,
  "change": -5
}
```

### 2. Decline Job (Alternative)
```
POST /api/dispatch/decline

Body:
{
  "bookingId": "job_123"
}

Response:
{
  "ok": true,
  "acceptanceRate": 80,
  "change": -5
}
```

### 3. Decline Route
```
POST /api/driver/routes/[id]/decline

Body:
{
  "reason": "Vehicle breakdown"
}

Response:
{
  "success": true,
  "message": "Route declined successfully",
  "warning": "Your acceptance rate decreased by 5% to 80%. Declining jobs affects your performance rating.",
  "data": {
    "routeId": "route_abc",
    "reassignedToOtherDrivers": true,
    "acceptanceRate": 80,
    "change": -5
  }
}
```

---

## 💻 Frontend Integration

### Driver Portal (React/Next.js)

```typescript
import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

// In driver schedule/dashboard
export function DriverSchedule({ driverId }: { driverId: string }) {
  const [acceptanceRate, setAcceptanceRate] = useState(100);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
    });

    const channel = pusher.subscribe(`driver-${driverId}`);

    // Listen for acceptance rate updates
    channel.bind('acceptance-rate-updated', (data: any) => {
      setAcceptanceRate(data.acceptanceRate);
      
      toast({
        title: 'Acceptance Rate Updated',
        description: `Your acceptance rate decreased to ${data.acceptanceRate}%`,
        status: 'warning',
        duration: 5000
      });
    });

    // Listen for schedule updates
    channel.bind('schedule-updated', (data: any) => {
      if (data.type === 'acceptance_rate_changed') {
        setAcceptanceRate(data.acceptanceRate);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`driver-${driverId}`);
    };
  }, [driverId]);

  return (
    <Box>
      <Text>Acceptance Rate</Text>
      <Progress 
        value={acceptanceRate} 
        colorScheme={acceptanceRate >= 80 ? 'green' : acceptanceRate >= 60 ? 'yellow' : 'red'}
      />
      <Text>{acceptanceRate}%</Text>
    </Box>
  );
}
```

### Admin Schedule (React/Next.js)

```typescript
import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

export function AdminDriverSchedule() {
  const [drivers, setDrivers] = useState<any[]>([]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
    });

    // Subscribe to admin channels
    const driversChannel = pusher.subscribe('admin-drivers');
    const scheduleChannel = pusher.subscribe('admin-schedule');

    // Listen for driver acceptance rate updates
    driversChannel.bind('driver-acceptance-rate-updated', (data: any) => {
      setDrivers(prev => 
        prev.map(driver => 
          driver.id === data.driverId
            ? { ...driver, acceptanceRate: data.acceptanceRate }
            : driver
        )
      );

      toast({
        title: 'Driver Performance Update',
        description: `${data.driverName}'s acceptance rate: ${data.acceptanceRate}%`,
        status: 'info',
        duration: 4000
      });
    });

    // Listen for schedule updates
    scheduleChannel.bind('driver-performance-updated', (data: any) => {
      if (data.type === 'acceptance_rate_decreased') {
        // Update driver in list
        setDrivers(prev => 
          prev.map(driver => 
            driver.id === data.driverId
              ? { ...driver, acceptanceRate: data.acceptanceRate }
              : driver
          )
        );
      }
    });

    return () => {
      driversChannel.unbind_all();
      scheduleChannel.unbind_all();
      pusher.unsubscribe('admin-drivers');
      pusher.unsubscribe('admin-schedule');
    };
  }, []);

  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Driver</Th>
          <Th>Acceptance Rate</Th>
          <Th>Status</Th>
        </Tr>
      </Thead>
      <Tbody>
        {drivers.map(driver => (
          <Tr key={driver.id}>
            <Td>{driver.name}</Td>
            <Td>
              <Progress value={driver.acceptanceRate} />
              <Text>{driver.acceptanceRate}%</Text>
            </Td>
            <Td>
              <Badge colorScheme={driver.acceptanceRate >= 80 ? 'green' : 'red'}>
                {driver.acceptanceRate >= 80 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
```

### iOS Driver App (Swift)

```swift
import PusherSwift

class DriverScheduleViewController: UIViewController {
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
        
        // Listen for acceptance rate updates
        channel.bind(eventName: "acceptance-rate-updated") { (event: PusherEvent) -> Void in
            if let data = event.data as? [String: Any],
               let newRate = data["acceptanceRate"] as? Double {
                
                DispatchQueue.main.async {
                    self.acceptanceRate = newRate
                    self.updateAcceptanceRateUI()
                    
                    // Show notification
                    self.showNotification(
                        title: "Acceptance Rate Updated",
                        body: "Your acceptance rate is now \(Int(newRate))%. Declining jobs affects your performance."
                    )
                }
            }
        }
        
        // Listen for schedule updates
        channel.bind(eventName: "schedule-updated") { (event: PusherEvent) -> Void in
            if let data = event.data as? [String: Any],
               let type = data["type"] as? String,
               type == "acceptance_rate_changed",
               let newRate = data["acceptanceRate"] as? Double {
                
                DispatchQueue.main.async {
                    self.acceptanceRate = newRate
                    self.updateAcceptanceRateUI()
                }
            }
        }
        
        pusher.connect()
    }
    
    func updateAcceptanceRateUI() {
        progressBar.progress = Float(acceptanceRate / 100.0)
        rateLabel.text = "\(Int(acceptanceRate))%"
        
        // Update color based on rate
        if acceptanceRate >= 80 {
            progressBar.tintColor = .systemGreen
        } else if acceptanceRate >= 60 {
            progressBar.tintColor = .systemYellow
        } else {
            progressBar.tintColor = .systemRed
        }
    }
}
```

---

## 🗄️ Database Schema

### DriverPerformance Table:
```sql
model DriverPerformance {
  id                    String   @id
  driverId              String   @unique
  averageRating         Float    @default(0)
  totalRatings          Int      @default(0)
  completionRate        Float    @default(0)
  acceptanceRate        Float    @default(0)    -- Updated on decline
  onTimeRate            Float    @default(0)
  cancellationRate      Float    @default(0)
  totalJobs             Int      @default(0)
  completedJobs         Int      @default(0)
  cancelledJobs         Int      @default(0)
  lateJobs              Int      @default(0)
  lastCalculated        DateTime @default(now()) -- Updated on decline
  ...
}
```

### Update Query (on decline):
```sql
UPDATE DriverPerformance
SET 
  acceptanceRate = GREATEST(0, acceptanceRate - 5),
  lastCalculated = NOW()
WHERE driverId = 'driver123'
```

---

## 📊 Business Logic

### Acceptance Rate Calculation:
```
New Rate = MAX(0, Current Rate - 5)

Examples:
- 100% → decline → 95%
- 50% → decline → 45%
- 5% → decline → 0%
- 0% → decline → 0% (stays at 0)
```

### Performance Categories:
```
Excellent: 90-100%  ✅
Good:      80-89%   ✅
Fair:      60-79%   ⚠️
Poor:      40-59%   ❌
Critical:  0-39%    🚨
```

### Impact on Driver:
- **90%+**: Priority job offers, bonuses eligible
- **80-89%**: Normal job offers
- **60-79%**: Reduced job priority, warning notifications
- **Below 60%**: Account review, limited job offers
- **Below 40%**: Account suspension risk

---

## 🎯 Usage Scenarios

### Scenario 1: Driver Declines Single Job
```
Initial Rate: 85%
Action: Decline job
Result: 85% - 5% = 80%

Notifications:
✅ Driver app shows: "Acceptance rate decreased to 80%"
✅ Admin dashboard updates instantly
✅ Progress bar updates in real-time
```

### Scenario 2: Driver Declines Route
```
Initial Rate: 75%
Action: Decline route with 10 drops
Result: 75% - 5% = 70%

Notifications:
✅ Driver sees warning: "Rate decreased to 70%"
✅ Admin gets notification with driver name
✅ All platforms sync instantly
```

### Scenario 3: Rate Reaches 0%
```
Initial Rate: 3%
Action: Decline job
Result: MAX(0, 3 - 5) = 0%

Notifications:
✅ Driver: "Critical: Acceptance rate at 0%"
✅ Admin: "Driver needs review - 0% acceptance"
✅ Automatic account flag for review
```

---

## 🚀 Testing Guide

### Test Case 1: Single Decline
```bash
# Prerequisites:
# - Driver with 85% acceptance rate
# - Active job offer

curl -X POST https://api.speedy-van.co.uk/api/driver/jobs/job123/decline \
  -H "Authorization: Bearer {token}"

# Expected:
# - Response: { acceptanceRate: 80, change: -5 }
# - Database: acceptanceRate = 80
# - Pusher: events sent to driver & admin
# - UI: Progress bar updates to 80%
```

### Test Case 2: Multiple Declines
```bash
# Start: 100%
# Decline 1: 95%
# Decline 2: 90%
# Decline 3: 85%

# Verify rate decreases by 5% each time
# Verify all platforms update in real-time
```

### Test Case 3: Edge Case - Below Zero
```bash
# Start: 2%
# Decline: Should become 0% (not negative)

# Verify: Math.max(0, 2 - 5) = 0
```

---

## ⚡ Real-Time Update Flow

```
Driver Declines → API Updates DB → Pusher Sends Events
                                          ↓
                        ┌─────────────────┴─────────────────┐
                        ↓                                   ↓
                Driver Channel                        Admin Channel
                        ↓                                   ↓
              ┌─────────┴─────────┐              ┌─────────┴─────────┐
              ↓                   ↓              ↓                   ↓
        Driver Portal        iOS App       Admin Dashboard    Admin Schedule
              ↓                   ↓              ↓                   ↓
         Progress Bar        Progress Bar   Driver List        Schedule View
         Updates              Updates        Updates            Updates
```

---

## 🛡️ Safety & Validation

### Data Integrity:
- ✅ Rate never goes below 0%
- ✅ Transaction-based updates (rollback on error)
- ✅ Timestamp tracking (`lastCalculated`)
- ✅ Audit trail in logs

### Error Handling:
- ✅ Pusher failure doesn't block decline
- ✅ DB error rolls back transaction
- ✅ Missing performance record creates default
- ✅ Invalid driver ID returns 404

### Business Rules:
- ✅ Each decline = exactly -5%
- ✅ No fractional percentages
- ✅ Immediate effect (no delay)
- ✅ Synced across all platforms

---

## 📈 Monitoring & Logs

### Success Logs:
```
📉 Acceptance rate decreased: 85% → 80%
📡 Acceptance rate update notifications sent successfully
✅ Job declined successfully: { acceptanceRate: 80 }
```

### Error Logs:
```
❌ Error declining job: [details]
⚠️ Failed to send Pusher notifications: [error] (decline continues)
⚠️ Driver performance record not found (creating default)
```

---

## ✅ Implementation Checklist

- [x] API endpoints updated (3 endpoints)
- [x] Database updates on decline
- [x] -5% decrease logic implemented
- [x] Rate never below 0% enforced
- [x] Pusher events configured (4 events)
- [x] Driver channel notifications
- [x] Admin channel notifications
- [x] Schedule update events
- [x] Frontend listeners ready
- [x] iOS app integration ready
- [x] Audit trail logging
- [x] Error handling complete
- [x] Documentation complete

---

## 🎉 Summary

The Acceptance Rate System:

✅ **Automatic** - 5% decrease on every decline  
✅ **Real-Time** - Instant updates via Pusher  
✅ **Multi-Platform** - Driver Portal + Admin Dashboard + iOS App  
✅ **Safe** - Never below 0%, transaction-based  
✅ **Transparent** - Clear feedback to drivers and admins  
✅ **Accountable** - Full audit trail and logging  

**Ready for Production! 🚀**

