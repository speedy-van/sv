# 🧪 Quick Test Guide - Permission Monitor & Real-time Tracking

## 🚀 Quick Start

### 1. Start Driver App (Expo)
```powershell
cd C:\sv\mobile\expo-driver-app
npx expo start
# Press 'i' for iOS simulator
```

### 2. Start Web App
```powershell
cd C:\sv
pnpm dev
# Web app runs on http://localhost:3000
```

---

## 📱 Test 1: Permission Monitor (Driver App)

### Scenario A: Auto-Offline on Permission Loss

**Steps:**
1. Open Driver App in iOS Simulator
2. Go to Dashboard
3. Toggle **Online** switch to ON
4. ✅ Driver goes online

5. **Disable GPS:**
   - iOS Simulator: `Features` → `Location` → `None`
   
6. **Expected Result:**
   - ⚠️ Console logs: "Permission status changed"
   - 🔴 Driver automatically goes OFFLINE
   - 📱 Online toggle switches to OFF
   - ✅ Backend status updated

7. **Re-enable GPS:**
   - iOS Simulator: `Features` → `Location` → `Apple` (or custom location)
   
8. **Expected Result:**
   - ✅ Console logs: "Permissions restored"
   - 🟢 Driver can go online again

---

### Scenario B: Warning Modal with Assigned Job

**Steps:**
1. Driver is **Online** with an **assigned job**
2. In `DashboardScreen`, simulate assigned job:
   ```typescript
   permissionMonitor.addAssignedJob('JOB123', 'REF-2025-001');
   ```

3. **Disable GPS** (as above)

4. **Expected Result:**
   - ⚠️ **Warning modal appears** immediately
   - ⏰ **Countdown shows "5:00"** (5 minutes)
   - 📋 **Missing permissions listed** (Location Services)
   - ⚙️ **"Open Settings" button** visible
   - ℹ️ **"I Understand" button** visible

5. **Click "Open Settings"**
   - ✅ iOS Settings app opens
   - ✅ Modal closes

6. **Re-enable GPS** and return to app
   - ✅ Warning modal closes automatically
   - ✅ Countdown stops
   - 🟢 Driver can continue with job

---

### Scenario C: Block Online Toggle Without Permissions

**Steps:**
1. Driver is **Offline**
2. **Disable GPS** in iOS Simulator
3. Try to toggle **Online** switch to ON

4. **Expected Result:**
   - 🚫 **Alert appears:**
     > "Permissions Required"
     > 
     > You need to enable the following permissions to go online:
     > 
     > • Location Services
     > 
     > Please enable them in Settings.
   - ⚙️ **"Open Settings" button** in alert
   - ❌ **Online toggle stays OFF**

5. **Click "Open Settings"**
   - ✅ iOS Settings opens

6. **Enable GPS** and retry
   - ✅ Driver can go online successfully

---

## 🌐 Test 2: Real-time Tracking (Web App)

### Scenario: Live Driver Location Updates

**Steps:**

1. **Create a test booking** with tracking reference (e.g., `REF-2025-001`)

2. **Assign driver** to booking via Admin Panel

3. **Open Customer Tracking Page:**
   ```
   http://localhost:3000/tracking/REF-2025-001
   ```

4. **Expected Result:**
   - 🗺️ Map loads with pickup/dropoff markers
   - 🚚 Driver marker appears (if location available)
   - 🔴 **"LIVE" badge** appears (red, with pulse animation)
   - ⚡ **"Real-time Updates Active"** badge below map
   - 🕒 Last update timestamp shown

5. **In Driver App:**
   - Open `JobDetailScreen` for assigned job
   - Click **"Start Job"**
   - Driver location updates automatically sent to `/api/driver/tracking`

6. **Expected Result (Customer Page):**
   - 🚚 **Driver marker moves** in real-time (NO page refresh)
   - 📍 New coordinates logged in console:
     ```
     📍 Real-time location update received: {
       lat: 55.xxxx,
       lng: -4.xxxx,
       timestamp: "2025-10-11T..."
     }
     ```
   - 🗺️ Route line updates
   - 🕒 Last update timestamp refreshes
   - ⚡ LIVE badge continues pulsing

7. **Test Refresh:**
   - Click **"Refresh" button** on map
   - ✅ Data fetches from API
   - ✅ LIVE connection remains active

8. **Test Disconnect:**
   - Stop web server briefly
   - 🔴 LIVE badge may disappear
   - Restart server
   - 🟢 Auto-reconnects
   - ✅ LIVE badge reappears

---

## 🧪 Console Logs to Watch

### Driver App (Expo):
```
🔐 Initializing Permission Monitor...
✅ Permission monitoring started
📱 Permission status changed: { location: ✅, notifications: ✅ }
⚠️ Permission status changed: { location: ❌, notifications: ✅ }
⚠️ WARNING: Permission lost for assigned job REF-2025-001
⏰ REF-2025-001: 4.8 minutes remaining
✅ Permissions restored for REF-2025-001 - cancelling countdown
🧹 Dashboard unmounted - services stopped
```

### Web App (Browser Console):
```
🔌 Initializing Pusher for real-time tracking: REF-2025-001
📡 Subscribing to channel: tracking-REF-2025-001
✅ Successfully subscribed to tracking channel
📍 Real-time location update received: { driverId: "xxx", lat: 55.xxxx, lng: -4.xxxx }
📊 Status update received: { status: "IN_PROGRESS" }
⏱️ ETA update received: { eta: { estimatedArrival: "14:30", minutesRemaining: 15 } }
🧹 Cleaning up Pusher connection
```

### Backend (Terminal):
```
✅ Real-time location updates sent for tracking synchronization
📡 Pusher broadcast → tracking-REF-2025-001
📡 Pusher broadcast → admin-tracking
```

---

## ✅ Success Indicators

### Driver App:
- ✅ Permission changes detected within 10 seconds
- ✅ Auto-offline when GPS/Notifications disabled
- ✅ Warning modal shows with countdown
- ✅ Settings link opens correctly
- ✅ No crashes or errors

### Web App:
- ✅ LIVE badge appears when Pusher connects
- ✅ Driver marker moves without page refresh
- ✅ Console shows real-time location updates
- ✅ Connection reconnects automatically
- ✅ No TypeScript errors

### End-to-End:
- ✅ Driver location → API → Pusher → Customer page
- ✅ Updates appear within 1-2 seconds
- ✅ No polling needed (100% event-driven)
- ✅ Stable connection for extended period

---

## 🐛 Troubleshooting

### Issue: LIVE badge doesn't appear
**Solution:**
- Check Pusher credentials in `.env.local`:
  ```bash
  NEXT_PUBLIC_PUSHER_KEY=407cb06c423e6c032e9c
  NEXT_PUBLIC_PUSHER_CLUSTER=eu
  ```
- Check browser console for errors
- Verify channel name matches booking reference

### Issue: Permission Modal doesn't appear
**Solution:**
- Check if job is assigned: `permissionMonitor.addAssignedJob(...)`
- Verify GPS is actually disabled in iOS Settings
- Check console for permission check logs

### Issue: Driver location not updating
**Solution:**
- Verify driver has started the job
- Check `/api/driver/tracking` is receiving POST requests
- Verify Pusher trigger is successful in backend logs
- Check TrackingPing records in database

---

## 📊 Quick Validation Commands

### Check Pusher Connection:
```javascript
// In browser console on tracking page:
pusher.connection.state
// Expected: "connected"
```

### Check Permission Status:
```javascript
// In Expo console (driver app):
permissionMonitor.getStatus()
// Expected: { location: true, notifications: true, lastChecked: Date }
```

### Check Tracking Channel:
```javascript
// In browser console:
pusher.allChannels()
// Expected: includes "tracking-REF-2025-001"
```

---

**Ready to test!** 🚀









