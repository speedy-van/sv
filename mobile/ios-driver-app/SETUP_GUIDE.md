# iOS Driver App - Setup Guide

Complete step-by-step guide to set up and run the Speedy Van iOS driver application.

## Prerequisites

Before you begin, ensure you have:

- **Mac** with macOS 13.0 (Ventura) or later
- **Xcode 15.0+** (download from Mac App Store)
- **iOS 16.0+** device or simulator
- **Active Apple Developer Account** (for device testing)

## Step 1: Install Xcode

1. Open Mac App Store
2. Search for "Xcode"
3. Click "Install" (this may take 30-60 minutes)
4. Once installed, open Xcode and accept the license agreement
5. Install additional components when prompted

## Step 2: Open the Project

```bash
# Navigate to the project directory
cd mobile/ios-driver-app

# Open the Xcode project
open SpeedyVanDriver.xcodeproj
```

Alternatively, double-click `SpeedyVanDriver.xcodeproj` in Finder.

## Step 3: Configure API Endpoint

1. In Xcode, navigate to: `Config/AppConfig.swift`
2. Update the API base URL:

```swift
// For production (recommended)
static let apiBaseURL = "https://api.speedy-van.co.uk"

// For local development
// static let apiBaseURL = "http://localhost:3000"
```

## Step 4: Configure Signing & Capabilities

### Automatic Signing (Recommended)

1. Select the project in the navigator (top-left)
2. Select the "SpeedyVanDriver" target
3. Go to "Signing & Capabilities" tab
4. Check "Automatically manage signing"
5. Select your Team (Apple Developer Account)
6. Xcode will automatically generate a provisioning profile

### Manual Signing (Advanced)

1. Uncheck "Automatically manage signing"
2. Select your provisioning profile from dropdown
3. Ensure the Bundle Identifier matches: `uk.co.speedy-van.driver`

## Step 5: Add Required Capabilities

The following capabilities are required:

### Background Modes
1. Click "+ Capability" button
2. Search for "Background Modes"
3. Enable:
   - ✅ Location updates
   - ✅ Background fetch
   - ✅ Remote notifications

### Push Notifications
1. Click "+ Capability" button
2. Search for "Push Notifications"
3. Add it

## Step 6: Configure Location Permissions

The app requires location permissions. These are already configured in `Info.plist`:

- **NSLocationWhenInUseUsageDescription**: Used during active jobs
- **NSLocationAlwaysAndWhenInUseUsageDescription**: Background tracking
- **NSLocationAlwaysUsageDescription**: Continuous tracking

**No changes needed** - these are pre-configured!

## Step 7: Build and Run

### On Simulator (Quick Testing)

1. Select a simulator from the device dropdown (e.g., "iPhone 15 Pro")
2. Press `Cmd + R` or click the Play button
3. Wait for the build to complete (first build may take 2-3 minutes)
4. App will launch automatically

### On Physical Device (Real Testing)

1. Connect your iPhone/iPad via USB
2. Trust the computer on your device if prompted
3. Select your device from the device dropdown
4. Press `Cmd + R` or click the Play button
5. On first run, you may need to:
   - Go to Settings > General > VPN & Device Management
   - Trust the developer certificate
6. Return to the app and launch it

## Step 8: Test the App

### Login Credentials

```
Email: driver@test.com
Password: password123
```

### Test Flow

1. **Login**
   - Enter credentials
   - Tap "Sign In"
   - Should see dashboard

2. **Enable Online Status**
   - Toggle "Online" switch
   - Grant location permissions when prompted
   - Should see "You're Online"

3. **View Jobs**
   - Tap "Jobs" tab
   - Should see available jobs
   - Tap a job to view details

4. **Accept Job**
   - View job details
   - Tap "Accept Job"
   - Confirm acceptance
   - Job should move to "Assigned" section

5. **Start Job**
   - Tap accepted job
   - Tap "Start Job"
   - See job progress screen
   - Update progress through steps

6. **Complete Job**
   - Progress through all steps:
     - En Route → Arrived → Loading → In Transit → Unloading → Complete
   - Tap "Complete Job"
   - Job marked as completed

## Troubleshooting

### Build Errors

**Error: "Command CodeSign failed"**
- Solution: Check Signing & Capabilities, ensure valid provisioning profile

**Error: "No such module 'SwiftUI'"**
- Solution: Ensure deployment target is iOS 16.0+ in project settings

**Error: "Failed to register bundle identifier"**
- Solution: Change bundle identifier to something unique in project settings

### Runtime Errors

**App crashes on launch**
- Check Xcode console for error messages
- Ensure API endpoint is correct and reachable
- Check device logs: Window > Devices and Simulators > View Device Logs

**Location not updating**
- Ensure location permissions granted (Always)
- Check Background Modes are enabled
- Verify API endpoint is correct

**Can't login**
- Check internet connection
- Verify API endpoint is correct
- Check backend is running
- Test with curl: `curl https://api.speedy-van.co.uk/api/driver/session`

**Jobs not loading**
- Check internet connection
- Verify authentication token
- Check backend API is accessible
- Look for errors in Xcode console

### Simulator Limitations

The iOS Simulator has limitations:

- **No Push Notifications**: Can't test real push notifications
- **Simulated Location**: Use Xcode's location simulation
- **Performance**: Slower than real device

To test these features, use a **physical device**.

## Location Simulation (Simulator Only)

1. Run app in simulator
2. In Xcode menu: Debug > Simulate Location
3. Choose a location (e.g., "London, England")
4. Location will update in app

## Debugging

### Enable Verbose Logging

In `Config/AppConfig.swift`, debug mode is automatically enabled:

```swift
#if DEBUG
static let isDebug = true
static let enableLogging = true
#else
static let isDebug = false
static let enableLogging = false
#endif
```

### View Console Logs

1. Run app in Xcode
2. Open Debug Area: `Cmd + Shift + Y`
3. Filter logs by typing in search bar
4. Look for emoji indicators:
   - 📤 = API Request
   - 📥 = API Response
   - ✅ = Success
   - ❌ = Error
   - 📍 = Location Update
   - 🚗 = Driver Action

### Common Log Patterns

```
✅ Login successful
📍 Location updated: 55.8642, -4.2518
📤 REQUEST: POST /api/driver/jobs/123/accept
📥 RESPONSE: 200 OK
🚗 Driver Jobs API - Found jobs: assigned=2, available=5
```

## Performance Optimization

### Battery Life

The app is optimized for battery life:
- Location updates every 30 seconds (configurable)
- Background updates only when tracking jobs
- Significant location changes only

### Data Usage

- API calls are minimal
- No unnecessary polling
- Efficient JSON payloads

## Advanced Configuration

### Custom API Timeout

Edit `Config/AppConfig.swift`:

```swift
static let requestTimeout: TimeInterval = 30.0 // seconds
```

### Location Update Frequency

Edit `Config/AppConfig.swift`:

```swift
static let locationUpdateInterval: TimeInterval = 30.0 // seconds
static let minimumDistanceFilter: Double = 50.0 // meters
```

## Production Checklist

Before deploying to App Store:

- [ ] Update app version in `Info.plist`
- [ ] Set API URL to production
- [ ] Disable debug logging
- [ ] Test on multiple devices (iPhone, iPad)
- [ ] Test on different iOS versions (16.0+)
- [ ] Test all user flows
- [ ] Test offline behavior
- [ ] Test background location
- [ ] Test push notifications (physical device)
- [ ] Add app icon (1024x1024)
- [ ] Add screenshots for App Store
- [ ] Create app description
- [ ] Submit for App Store review

## Support

If you encounter issues:

1. Check this guide thoroughly
2. Review Xcode console logs
3. Test on physical device (not just simulator)
4. Contact support: **support@speedy-van.co.uk**
5. Call: **07901846297**
6. Address: **Office 2.18, 1 Barrack Street, Hamilton, ML3 0DG, Scotland**

## Next Steps

1. ✅ Get app running locally
2. ✅ Test all features
3. ✅ Fix any issues
4. Create app icon and launch screen
5. Prepare App Store submission
6. Submit to App Store Connect
7. TestFlight beta testing
8. Production release

Good luck! 🚀

