# Real-Time Tracking System Verification & Implementation

## 📋 Executive Summary

This document provides a comprehensive verification and implementation guide for the **Speedy Van** real-time tracking system, covering GPS enforcement, customer tracking integration, and iOS background execution.

---

## 🔍 System Architecture Overview

```
┌─────────────────┐
│  Driver App     │
│  (iOS/Android)  │
└────────┬────────┘
         │
         │ 1. GPS Location Updates (every 10s)
         │ 2. Status Changes (accepted, en_route, arrived, etc.)
         │ 3. Permission Monitoring (GPS + Notifications)
         │
         ▼
┌─────────────────────────────────┐
│  Backend API                     │
│  /api/driver/tracking           │
│  /api/driver/status             │
│  /api/driver/jobs/[id]/progress │
└─────────┬───────────────────────┘
          │
          │ Pusher WebSocket Broadcast
          │ Channel: `tracking-${bookingReference}`
          │ Events: location-update, status-change
          │
          ▼
┌──────────────────────────────────┐
│  Customer Tracking Page          │
│  /tracking/[reference]           │
│  - Live map with driver location │
│  - Progress timeline             │
│  - ETA updates                   │
└──────────────────────────────────┘
```

---

## 1️⃣ iOS Background Modes Configuration

### ❌ CRITICAL ISSUE FOUND
The `app.json` was **missing iOS background modes** required for continuous location tracking and push notifications.

### ✅ FIXED

**File**: `mobile/expo-driver-app/app.json`

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "location",              // ✅ Background GPS tracking
          "fetch",                 // ✅ Background data fetch
          "remote-notification",   // ✅ Push notifications in background
          "processing"             // ✅ Background task processing
        ]
      }
    }
  }
}
```

### Required iOS Permissions:
- ✅ `NSLocationWhenInUseUsageDescription` - Foreground location
- ✅ `NSLocationAlwaysAndWhenInUseUsageDescription` - Background location
- ✅ `NSLocationAlwaysUsageDescription` - Always location access

### Testing:
1. **Lock iPhone screen** → App should continue tracking
2. **Switch to another app** → Location updates should continue
3. **Check Console** → Should see "📍 Background location update" logs

---

## 2️⃣ Permission Monitoring System

### ✅ NEW: PermissionMonitorService

**File**: `mobile/expo-driver-app/src/services/permission-monitor.service.ts`

#### Features:
1. **Continuous Monitoring**
   - Checks GPS + Notification permissions every 10 seconds
   - Monitors app state changes (foreground/background)
   - Detects permission changes in real-time

2. **Auto-Offline Trigger**
   - If GPS **or** Notifications are disabled → Driver goes **Offline (Auto)**
   - Backend API updated immediately: `POST /api/driver/status { isOnline: false }`

3. **5-Minute Warning System**
   - If driver has assigned jobs and disables permissions:
     - ⚠️ Shows warning modal immediately
     - ⏰ Starts 5-minute countdown
     - 📤 Auto-unassigns job if not fixed within 5 minutes

4. **Permission Restoration**
   - If driver re-enables permissions → Countdown cancelled
   - Driver status updated: `{ isOnline: true }`

#### Usage Example:
```typescript
import permissionMonitor from './services/permission-monitor.service';

// Start monitoring
await permissionMonitor.startMonitoring();

// Register callbacks
permissionMonitor.onPermissionChange((status) => {
  console.log('Permission changed:', status);
  if (!status.location || !status.notifications) {
    setIsOnline(false);
  }
});

permissionMonitor.onWarning((job, remainingMinutes) => {
  console.log(`⚠️ Warning: ${job.reference} will be unassigned in ${remainingMinutes} minutes`);
  setShowWarningModal(true);
});

// Track assigned jobs
permissionMonitor.addAssignedJob('booking_123', 'SVMGFTR1A48USQ');

// Remove when completed
permissionMonitor.removeAssignedJob('booking_123');
```

---

## 3️⃣ Permission Warning Modal

### ✅ NEW: PermissionWarningModal Component

**File**: `mobile/expo-driver-app/src/components/PermissionWarningModal.tsx`

#### Features:
- 🎨 **Visual Design**:
  - Pulsing warning icon (red glow)
  - Live countdown timer (MM:SS format)
  - Color changes based on urgency:
    - 🟡 Yellow: > 3 minutes
    - 🟠 Orange: 1-3 minutes
    - 🔴 Red: < 1 minute

- 📋 **Information Display**:
  - Shows assigned order reference
  - Lists missing permissions (GPS/Notifications)
  - Clear instructions for each platform (iOS/Android)

- 🔘 **Actions**:
  - **"Open Settings"** button → Directly opens app settings
  - **"I Understand"** button → Dismisses warning

#### Usage:
```tsx
<PermissionWarningModal
  visible={showWarning}
  jobReference="SVMGFTR1A48USQ"
  remainingMinutes={3.5}
  missingPermissions={{
    location: false,
    notifications: true,
  }}
  onDismiss={() => setShowWarning(false)}
  onOpenSettings={() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }}
/>
```

---

## 4️⃣ Real-Time Location Tracking Flow

### Current Implementation Status

#### ✅ Driver App → Backend
**Service**: `location.service.ts`

```typescript
// Sends location every 10 seconds or 50 meters
await apiService.post('/api/driver/tracking', {
  bookingId: currentJobId,
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  accuracy: location.coords.accuracy,
});
```

**Configuration** (`config/api.ts`):
```typescript
LOCATION_UPDATE_INTERVAL: 10000,      // 10 seconds
LOCATION_DISTANCE_FILTER: 50,         // 50 meters
```

#### ⚠️ NEEDS VERIFICATION: Backend → Pusher → Customer

**API Endpoint**: `/api/driver/tracking`

**Required Checks**:
1. Does the API receive location updates?
2. Does it broadcast via Pusher to `tracking-${bookingReference}` channel?
3. Does customer tracking page subscribe to this channel?
4. Are location updates instant (<1s latency)?

**Expected Pusher Event**:
```javascript
channel.bind('location-update', (data) => {
  {
    driverLocation: {
      lat: 51.5074,
      lng: -0.1278,
      timestamp: "2025-10-11T14:30:00Z"
    },
    bookingReference: "SVMGFTR1A48USQ",
    status: "en_route"
  }
});
```

---

## 5️⃣ Customer Tracking Integration

### Current Implementation

**Page**: `/tracking/[reference]`  
**Component**: `LiveTrackingMap.tsx`

#### Features:
- ✅ Fetches initial booking data from `/api/track/${reference}`
- ✅ Displays live map with Mapbox GL
- ✅ Shows pickup/dropoff markers
- ✅ Displays job timeline with status updates
- ✅ Auto-refresh every 10 seconds (polling fallback)

#### ⚠️ MISSING: Pusher WebSocket Integration

**Current**: Uses polling (`fetchTrackingData()` every 10s)  
**Required**: Use Pusher WebSocket for instant updates

**Example Implementation Needed**:
```typescript
import Pusher from 'pusher-js';

useEffect(() => {
  const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });

  const channel = pusher.subscribe(`tracking-${bookingReference}`);

  channel.bind('location-update', (data: any) => {
    console.log('📍 Real-time location update:', data);
    setTrackingData(prevData => ({
      ...prevData,
      currentLocation: data.driverLocation,
      lastUpdated: new Date().toISOString(),
    }));
    
    // Update map marker position
    updateDriverMarker(data.driverLocation);
  });

  channel.bind('status-change', (data: any) => {
    console.log('🔄 Status update:', data);
    setTrackingData(prevData => ({
      ...prevData,
      status: data.status,
      routeProgress: data.progress,
    }));
  });

  return () => {
    channel.unbind_all();
    channel.unsubscribe();
    pusher.disconnect();
  };
}, [bookingReference]);
```

---

## 6️⃣ Progress Line Updates

### Expected Behavior

Every driver action should update the **progress line** instantly:

| Driver Action | Backend Event | Customer UI Update |
|--------------|---------------|-------------------|
| Accept Job | `POST /api/driver/jobs/[id]/claim` | Progress: 0% → 10% |
| Start Journey | `PUT /api/driver/jobs/[id]/progress { step: 'en_route' }` | Progress: 10% → 30% |
| Arrive Pickup | `PUT /api/driver/jobs/[id]/progress { step: 'arrived' }` | Progress: 30% → 50% |
| Loading Items | `PUT /api/driver/jobs/[id]/progress { step: 'loading' }` | Progress: 50% → 60% |
| In Transit | `PUT /api/driver/jobs/[id]/progress { step: 'in_transit' }` | Progress: 60% → 80% |
| Arrive Dropoff | `PUT /api/driver/jobs/[id]/progress { step: 'unloading' }` | Progress: 80% → 90% |
| Complete Job | `PUT /api/driver/jobs/[id]/progress { step: 'completed' }` | Progress: 90% → 100% |

### Implementation Check

**Backend API** (`/api/driver/jobs/[id]/progress/route.ts`):
```typescript
// After updating progress in database
await pusher.trigger(`tracking-${booking.reference}`, 'status-change', {
  bookingReference: booking.reference,
  status: step,
  progress: calculateProgress(step),
  timestamp: new Date().toISOString(),
});
```

**Customer Page** (`LiveTrackingMap.tsx`):
```typescript
channel.bind('status-change', (data) => {
  // Update progress bar
  setRouteProgress(data.progress);
  
  // Add to timeline
  addTimelineEvent({
    step: data.status,
    timestamp: data.timestamp,
  });
});
```

---

## 7️⃣ Testing Checklist

### ✅ iOS Background Execution
- [ ] App continues tracking when screen is locked
- [ ] App continues tracking when in background
- [ ] Push notifications work in background
- [ ] Location updates every 10 seconds
- [ ] No "background mode not enabled" warnings

### ✅ Permission Monitoring
- [ ] Disable GPS → App goes offline immediately
- [ ] Disable Notifications → App goes offline immediately
- [ ] With assigned job + disable GPS → Warning modal appears
- [ ] Warning modal shows 5-minute countdown
- [ ] Re-enable GPS within 5 minutes → Countdown cancels
- [ ] Wait 5 minutes → Job auto-unassigned

### ✅ Real-Time Tracking
- [ ] Driver location updates on customer map (<1s delay)
- [ ] Driver status changes update progress line instantly
- [ ] ETA recalculates with each location update
- [ ] Customer sees driver icon moving smoothly
- [ ] No delays or polling lag

### ✅ Multi-Platform Sync
- [ ] Admin dashboard sees same data as customer page
- [ ] Driver app status matches admin view
- [ ] All three platforms (driver/customer/admin) sync in real-time

---

## 8️⃣ API Endpoints to Verify

### Driver App → Backend

| Endpoint | Method | Purpose | Pusher Event |
|----------|--------|---------|--------------|
| `/api/driver/tracking` | POST | Send location update | `location-update` |
| `/api/driver/status` | POST | Update online/offline | `driver-status-change` |
| `/api/driver/jobs/[id]/claim` | POST | Accept job | `job-accepted` |
| `/api/driver/jobs/[id]/progress` | PUT | Update job status | `status-change` |
| `/api/driver/jobs/[id]/unassign` | POST | Remove assignment | `job-unassigned` |

### Customer → Backend

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/track/[reference]` | GET | Get tracking data |
| Pusher Subscribe | WebSocket | `tracking-${reference}` |

---

## 9️⃣ Configuration Requirements

### Environment Variables

**Backend** (`.env`):
```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=eu
```

**Mobile App** (`config/api.ts`):
```typescript
LOCATION_UPDATE_INTERVAL: 10000,  // 10 seconds
LOCATION_DISTANCE_FILTER: 50,     // 50 meters
```

**Customer Page** (`.env.local`):
```env
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

---

## 🔟 Implementation Priorities

### Priority 1: Critical (Must Complete)
1. ✅ Add iOS background modes to app.json
2. ✅ Implement PermissionMonitorService
3. ✅ Create PermissionWarningModal component
4. ⚠️ Verify Pusher integration in tracking API
5. ⚠️ Add Pusher WebSocket to customer tracking page

### Priority 2: Important (Should Complete)
6. ⚠️ Implement auto-unassignment API endpoint
7. ⚠️ Add driver status update API
8. ⚠️ Test end-to-end flow with real devices
9. ⚠️ Verify multi-drop route tracking

### Priority 3: Enhancement (Nice to Have)
10. Add offline queue for location updates
11. Implement location interpolation for smooth movement
12. Add predictive ETA based on traffic data
13. Implement geofencing for automatic arrival detection

---

## 📝 Next Steps

1. **Test iOS Background Modes**
   ```bash
   # Rebuild app with new background modes
   cd mobile/expo-driver-app
   eas build --profile development --platform ios
   ```

2. **Integrate PermissionMonitor into DashboardScreen**
   ```typescript
   // Add to DashboardScreen useEffect
   permissionMonitor.startMonitoring();
   permissionMonitor.onPermissionChange(handlePermissionChange);
   ```

3. **Verify Backend Pusher Broadcasting**
   ```bash
   # Check Pusher dashboard for events
   # Test with curl:
   curl -X POST http://localhost:3000/api/driver/tracking \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"bookingId":"123","latitude":51.5074,"longitude":-0.1278}'
   ```

4. **Add Pusher to Customer Tracking**
   ```bash
   # Install Pusher client
   cd apps/web
   npm install pusher-js
   ```

5. **End-to-End Testing**
   - Assign order to driver
   - Driver accepts and starts journey
   - Customer opens tracking page
   - Verify real-time updates (<1s latency)

---

## ✅ Success Criteria

The system is working correctly when:

1. ✅ Driver app tracks location in background (iOS/Android)
2. ✅ Disabling GPS/notifications → Auto offline + warning (if assigned)
3. ✅ Customer sees driver location update every 10 seconds
4. ✅ Progress line updates instantly with driver actions
5. ✅ ETA recalculates with each location update
6. ✅ No polling delays - all updates via WebSocket
7. ✅ Multi-platform sync (driver/customer/admin)
8. ✅ 5-minute warning works correctly
9. ✅ Auto-unassignment triggers after timeout
10. ✅ No crashes or permission errors

---

**Status**: 🟡 Partially Complete
- ✅ iOS background modes added
- ✅ Permission monitoring implemented
- ✅ Warning system created
- ⚠️ Real-time Pusher integration needs verification
- ⚠️ Customer tracking WebSocket needs implementation
- ⚠️ End-to-end testing required
