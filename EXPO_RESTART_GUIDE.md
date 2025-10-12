# How to Start Expo with New Background Modes

## ✅ Background Modes Added

The `app.json` has been updated with iOS background modes:
```json
"UIBackgroundModes": [
  "location",              // GPS tracking in background
  "fetch",                 // Background data fetch
  "remote-notification",   // Push notifications
  "processing"             // Background tasks
]
```

---

## 🚀 Quick Start Commands

### Option 1: Using Existing Terminal (node)
The "node" terminal is already running Expo from the correct directory.

**Just reload the app in your iOS simulator:**
1. In iOS Simulator, press `Cmd + D`
2. Tap "Reload"
3. The new background modes will be applied

---

### Option 2: Restart Expo (if needed)

**Step 1: Open PowerShell in correct directory**
```powershell
cd C:\sv\mobile\expo-driver-app
```

**Step 2: Start Expo**
```powershell
npx expo start
```

**Step 3: Open in iOS Simulator**
- Press `i` in the terminal
- Or scan QR code with Expo Go app

---

## 📱 Verify Background Modes

### Test 1: Check app.json
```powershell
cd C:\sv\mobile\expo-driver-app
cat app.json
```

Look for `UIBackgroundModes` in the iOS section - should see all 4 modes.

### Test 2: Test GPS in Background
1. Open driver app
2. Start a job
3. Lock iPhone screen
4. Wait 30 seconds
5. Check backend logs for location updates

### Test 3: Test Permissions
1. Open driver app
2. Go to iPhone Settings → Speedy Van Driver
3. Disable "Location"
4. Return to app
5. Should trigger offline + warning (if job assigned)

---

## 🔧 Troubleshooting

### Issue: "Unable to find expo"
**Solution**: Make sure you're in the correct directory
```powershell
# Check current directory
pwd

# Should show: C:\sv\mobile\expo-driver-app
# If not, navigate there:
cd C:\sv\mobile\expo-driver-app
```

### Issue: Node version warnings
**Solution**: Ignore them - Node 20.17 works fine (warnings are for 20.19+)

### Issue: Background tracking not working
**Solution**: 
1. Rebuild the app (if using physical device)
2. Reinstall from TestFlight
3. Or use Expo Go (background modes work there too)

---

## ✅ What's Ready Now

1. ✅ **iOS Background Modes** - Added to app.json
2. ✅ **Permission Monitor Service** - Created at `src/services/permission-monitor.service.ts`
3. ✅ **Warning Modal Component** - Created at `src/components/PermissionWarningModal.tsx`
4. ✅ **Tracking API** - Already broadcasting via Pusher

---

## ⚠️ What Needs Integration

1. **Integrate PermissionMonitor into DashboardScreen**
   - Import the service
   - Start monitoring on mount
   - Show warning modal when triggered

2. **Add Pusher to Customer Tracking Page**
   - Subscribe to `tracking-${reference}` channel
   - Listen for `location-update` events

3. **Test End-to-End**
   - Assign job to driver
   - Driver accepts
   - Customer opens tracking page
   - Verify real-time updates

---

## 📝 Files Modified

- ✅ `app.json` - Added iOS background modes
- ✅ `src/services/permission-monitor.service.ts` - NEW
- ✅ `src/components/PermissionWarningModal.tsx` - NEW

---

## 🎯 Next Steps

**For Testing Background Modes:**
1. Reload app in simulator (Cmd + D → Reload)
2. Accept a job
3. Lock screen
4. Check logs for location updates

**For Production:**
1. Rebuild app with EAS Build
2. Submit to TestFlight
3. Install on physical device
4. Test background tracking

---

**Current Status**: ✅ Infrastructure Ready - App will apply background modes on next reload
