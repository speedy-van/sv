# 🚀 How to Run the iOS Driver App

## Requirements
- **macOS** (Monterey 12.0 or later)
- **Xcode 15.0+**
- **iOS 16.0+ device or simulator**

---

## Step 1: Open Project in Xcode

```bash
cd mobile/ios-driver-app
open SpeedyVanDriver.xcodeproj
```

Or double-click `SpeedyVanDriver.xcodeproj` in Finder.

---

## Step 2: Configure API Endpoint (Optional)

Open `Config/AppConfig.swift` and set the API URL:

```swift
// For production
static let apiBaseURL = "https://api.speedy-van.co.uk"

// For local development
// static let apiBaseURL = "http://localhost:3000"
```

---

## Step 3: Select Target Device

In Xcode toolbar:
- Click on the device selector (next to the Play button)
- Choose an iOS Simulator (e.g., "iPhone 15 Pro") or a connected physical device

---

## Step 4: Build and Run

**Option A: Use Keyboard Shortcut**
```
Cmd + R
```

**Option B: Use Xcode Menu**
- Product → Run

**Option C: Click Play Button**
- Click the ▶️ button in Xcode toolbar

---

## Step 5: First Run Setup

### If Using Simulator:
✅ No additional setup needed  
✅ Location services work automatically  
✅ Perfect for testing UI and navigation  

### If Using Physical Device:
1. **Sign the app** (Signing & Capabilities tab)
   - Select your Apple Developer account
   - Choose automatic signing

2. **Trust the developer** on device:
   - Settings → General → VPN & Device Management
   - Trust your developer certificate

3. **Grant permissions** when prompted:
   - Location access (for tracking)
   - Notifications (for job alerts)

---

## ⚠️ Common Issues & Fixes

### Issue 1: "Failed to prepare device for development"
**Fix:** 
- Disconnect and reconnect your iPhone
- Restart Xcode
- Update iOS to latest version

### Issue 2: "No Developer Account"
**Fix:**
- You need a free Apple Developer account
- Go to Xcode → Preferences → Accounts
- Sign in with your Apple ID

### Issue 3: "Provisioning Profile Error"
**Fix:**
- In Xcode: Signing & Capabilities
- Enable "Automatically manage signing"
- Select your team

### Issue 4: Build Errors
**Fix:**
```bash
# Clean build folder
Cmd + Shift + K

# Or in Xcode menu:
Product → Clean Build Folder
```

---

## 🧪 Testing Checklist

Once the app launches:

### Authentication
- [ ] Login screen appears
- [ ] Can enter email and password
- [ ] Login button works

### Dashboard (5 Tabs)
- [ ] Home tab shows stats
- [ ] Routes tab loads
- [ ] Schedule tab displays
- [ ] Earnings tab works
- [ ] Settings tab opens

### Routes System
- [ ] Can view routes list
- [ ] Route cards display correctly
- [ ] Can tap on a route
- [ ] Route details show all drops
- [ ] Navigation buttons work

### Schedule
- [ ] Today's jobs count shows
- [ ] Acceptance rate displays
- [ ] Tabs switch correctly (Upcoming/Past/Declined)
- [ ] Job cards render properly

### Earnings
- [ ] Period selector works
- [ ] Summary cards display
- [ ] Earnings list shows
- [ ] Can switch between periods

### Settings
- [ ] Profile tab loads
- [ ] Notifications tab works
- [ ] Security tab displays
- [ ] Can edit fields
- [ ] Save buttons function

---

## 🔧 Development Mode

### Enable Debug Logging

The app automatically enables logging in DEBUG mode.

Check console in Xcode for logs:
- `🚗 Driver Jobs API - Starting request`
- `✅ Login successful`
- `📡 Fetching routes...`

### API Testing

To test against local backend:

1. Update `AppConfig.swift`:
```swift
static let apiBaseURL = "http://localhost:3000"
```

2. Run your backend server:
```bash
cd ../../
pnpm run dev
```

3. Ensure backend is accessible from simulator/device

---

## 📱 Simulator Shortcuts

**Useful keyboard shortcuts:**
- `Cmd + R` - Build and run
- `Cmd + .` - Stop running
- `Cmd + Shift + H` - Home button
- `Cmd + Shift + K` - Clean build

**Simulate location:**
- Debug → Simulate Location → Custom Location
- Or use Location menu in simulator

---

## 🎯 Quick Test Login

If backend has test credentials:

```
Email: driver@test.com
Password: password123
```

Or create a driver account through the admin panel.

---

## 📊 Performance Testing

### Check Memory Usage:
- Xcode → Debug Navigator → Memory
- Should stay under 200MB for normal use

### Check CPU Usage:
- Xcode → Debug Navigator → CPU
- Should be minimal when idle

### Check Network:
- Xcode → Debug Navigator → Network
- Monitor API calls

---

## 🚀 Production Build

To create a release build:

1. **Change scheme:**
   - Product → Scheme → Edit Scheme
   - Change Build Configuration to "Release"

2. **Archive the app:**
   - Product → Archive
   - Wait for build to complete

3. **Distribute:**
   - Choose distribution method:
     - TestFlight (Beta testing)
     - App Store (Production)
     - Ad Hoc (Internal testing)

---

## 📝 Notes

- **First build** may take 5-10 minutes
- **Subsequent builds** are much faster (~30 seconds)
- **Simulator** is faster than physical device for development
- **Location services** work better on physical device

---

## 🆘 Need Help?

**Xcode Documentation:**
https://developer.apple.com/xcode/

**Swift Documentation:**
https://docs.swift.org/

**Support:**
- Email: support@speedy-van.co.uk
- Phone: 07901846297

---

**Ready to run! Press Cmd + R in Xcode! 🚀**

