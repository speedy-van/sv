# ⚡ Quick Fix Checklist - TurboModule Crash

## 🚨 الأولوية القصوى - نفّذ الآن

### ✅ Phase 1: Cleanup (5 min)
```bash
cd mobile/driver-app
rm -rf node_modules .expo ios/Pods ios/Podfile.lock
pnpm install
cd ios && pod install && cd ..
```

### ✅ Phase 2: Verify Configuration (3 min)
```bash
# Check app.json
grep "EXPO_PUBLIC_API_BASE_URL" app.json
# Must show: https://speedy-van.co.uk

# Check eas.json production profile
cat eas.json | grep -A 10 "production"
# Must show: "buildConfiguration": "Release"
```

### ✅ Phase 3: Update Version (2 min)
```json
// app.json
{
  "version": "2.0.4",
  "ios": {
    "buildNumber": "4"
  }
}
```

### ✅ Phase 4: Build Production (30 min)
```bash
eas build --platform ios --profile production --clear-cache
```

### ✅ Phase 5: Test on Device (10 min)
```
[ ] Download .ipa from EAS
[ ] Install on physical iPhone
[ ] Open app - should go directly to Login
[ ] NO "Downloading 100%" screen
[ ] NO red error screens
[ ] Can type in login fields
```

---

## 🎯 Success Criteria

### ✅ App Must:
- [ ] Launch immediately to login screen
- [ ] Show Splash screen (not Metro)
- [ ] No TurboModule errors
- [ ] No Metro/dev server required
- [ ] Work on cellular data (not just WiFi)

### ❌ App Must NOT:
- [ ] Show "Downloading 100%" screen
- [ ] Show Metro bundler UI
- [ ] Crash with PlatformConstants error
- [ ] Require dev server running
- [ ] Show red error screens

---

## 🔧 If Still Failing

### Option A: Enable expo-dev-client
```bash
pnpm add expo-dev-client
# Add to plugins in app.json
eas build --platform ios --profile production --clear-cache
```

### Option B: Force Hermes
```json
// app.json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

### Option C: Check Logs
```bash
# Get build logs
eas build:view [BUILD_ID]

# Get device crash logs
# iOS: Settings → Privacy → Analytics → Analytics Data
```

---

## 📋 Before Sending to Client

```
Pre-Send Checklist:
[ ] Built with --profile production
[ ] Tested on YOUR iPhone first
[ ] App opens to login screen
[ ] No crashes for 5 minutes
[ ] Can type in form fields
[ ] Console shows "Connected to API"
[ ] No red screens
[ ] Version number updated
[ ] Build number incremented
```

---

## 💬 Message to Send

```
Subject: Fixed - Production Build Ready

Root Cause: Was sending development build with Metro dependency
Solution: Built proper production binary with EAS

New Build:
- Version: 2.0.4
- Build: 4
- Download: [link]
- Tested on: iPhone [model]

Confirmed Working:
✅ Launches directly to login
✅ No Metro dependency
✅ No TurboModule errors
✅ Production API configured

Please test and confirm.
```

---

## 🚀 Quick Commands

```bash
# Full rebuild from scratch
cd mobile/driver-app && \
rm -rf node_modules .expo ios/Pods && \
pnpm install && \
cd ios && pod install && cd .. && \
eas build --platform ios --profile production --clear-cache

# Check last build status
eas build:list --platform ios --limit 1

# View build logs
eas build:view [BUILD_ID]

# Download build
eas build:download [BUILD_ID]
```

---

**Time Estimate: 50 minutes total**
**Critical: Test on physical device BEFORE sending**
