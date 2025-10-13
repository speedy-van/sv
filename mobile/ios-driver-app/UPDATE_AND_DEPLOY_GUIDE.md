# iOS Driver App - Update and Deploy Guide

## 🎯 Quick Start

This guide will help you update the iOS driver app with the fixed API configuration and deploy it to TestFlight.

---

## 📋 Prerequisites

- ✅ Mac with Xcode installed
- ✅ Apple Developer account
- ✅ App already exists in App Store Connect
- ✅ Backend fixes deployed to production (commit: `e520775`)

---

## 🔧 Step 1: Update API Configuration

### File to Edit
`Config/AppConfig.swift`

### Current Code (Line 9-13)
```swift
#if DEBUG
static let apiBaseURL = "http://localhost:3000"
#else
static let apiBaseURL = "https://api.speedy-van.co.uk"  // ❌ This doesn't exist
#endif
```

### Updated Code
```swift
#if DEBUG
static let apiBaseURL = "http://localhost:3000"
#else
static let apiBaseURL = "https://speedy-van.co.uk"  // ✅ Fixed URL
#endif
```

**Why this change?**
- The subdomain `api.speedy-van.co.uk` is not configured
- The main domain `speedy-van.co.uk` hosts the API endpoints
- Backend fixes have been deployed to this domain

---

## 🧪 Step 2: Test Locally (Optional but Recommended)

### Run in Simulator
1. Open `SpeedyVanDriver.xcodeproj` in Xcode
2. Select iPhone simulator (e.g., iPhone 15 Pro)
3. Press `Cmd + R` to run
4. Test login with:
   - **Email:** zadfad41@gmail.com
   - **Password:** 112233

### Expected Result
✅ Login should succeed
✅ Dashboard should load
✅ No console errors related to API

---

## 📦 Step 3: Prepare for Release

### Update Version Numbers

**File:** `Info.plist`

1. **CFBundleShortVersionString** (Version)
   - Current: `1.0.0` (or whatever it is)
   - New: Increment based on change type:
     - Bug fix: `1.0.1`
     - New feature: `1.1.0`
     - Major change: `2.0.0`

2. **CFBundleVersion** (Build Number)
   - **MUST increment** for each upload
   - Example: If current is `1`, change to `2`

### Verify Configuration

**Check these settings in Xcode:**

1. **General Tab**
   - Bundle Identifier: `uk.co.speedy-van.driver`
   - Version: Updated
   - Build: Incremented
   - Deployment Target: iOS 16.0

2. **Signing & Capabilities**
   - Team: Select your Apple Developer team
   - Signing Certificate: Automatic or Manual
   - Provisioning Profile: Valid and not expired

3. **Build Settings**
   - Code Signing Identity: iOS Developer (Debug) / iOS Distribution (Release)
   - Development Team: Your team ID

---

## 🏗️ Step 4: Create Archive

### Clean Build
```
Cmd + Shift + K
```

### Select Build Destination
1. Click on device selector in toolbar
2. Select **"Any iOS Device (arm64)"**
   - ⚠️ Do NOT select simulator
   - ⚠️ Do NOT select specific device

### Create Archive
```
Product > Archive
```
or
```
Cmd + Shift + B
```

**Wait Time:** 2-5 minutes

### Verify Archive
1. Organizer window opens automatically
2. Your archive appears in the list
3. Check:
   - ✅ Correct version number
   - ✅ Correct build number
   - ✅ Today's date

---

## ✅ Step 5: Validate Archive

**Before uploading, validate to catch issues early**

1. In Organizer, select your archive
2. Click **"Validate App"**
3. Select distribution: **"App Store Connect"**
4. Select signing: **"Automatically manage signing"** (recommended)
5. Click **"Validate"**

### Common Validation Issues

❌ **Missing Compliance**
- Solution: Answer export compliance questions

❌ **Invalid Signature**
- Solution: Check signing settings, regenerate certificates

❌ **Missing Entitlements**
- Solution: Verify capabilities in Xcode

❌ **Icon Issues**
- Solution: Ensure 1024x1024 app icon exists

---

## 🚀 Step 6: Upload to App Store Connect

### Upload Process

1. In Organizer, select validated archive
2. Click **"Distribute App"**
3. Select **"App Store Connect"**
4. Select **"Upload"**
5. Select signing: **"Automatically manage signing"**
6. Review summary
7. Click **"Upload"**

**Upload Time:** 5-15 minutes depending on internet speed

### Verify Upload

1. You'll see progress bar
2. Success message appears
3. Build appears in App Store Connect (may take 10-30 minutes)

---

## 📱 Step 7: Configure TestFlight

### Access App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in
3. Click **"My Apps"**
4. Select **"Speedy Van Driver"**
5. Click **"TestFlight"** tab

### Wait for Processing

**Status Progression:**
1. "Processing" (10-30 minutes)
2. "Ready to Submit"
3. Email notification when ready

### Export Compliance

When build is ready:
1. Click on build number
2. Click **"Provide Export Compliance Information"**
3. Answer: **"No"** (app doesn't use encryption beyond standard HTTPS)
4. Click **"Start Internal Testing"**

### Add What to Test

**Example:**
```
Version 1.0.1 - Login Fix

Changes:
• Fixed API endpoint configuration
• Resolved login issues on production
• Improved error handling

Test Focus:
• Login with test credentials (zadfad41@gmail.com / 112233)
• Verify dashboard loads correctly
• Check job listing functionality
• Test location tracking
```

---

## 👥 Step 8: Add Testers

### Internal Testing (Immediate)

1. Click **"Internal Testing"** group
2. Click **"+"** to add testers
3. Enter email addresses
4. Click **"Add"**

**Testers receive:**
- Email invitation
- Instructions to install TestFlight
- Direct link to app

### External Testing (Optional)

For wider testing:
1. Create external group
2. Add up to 10,000 testers
3. Requires App Review (1-2 days)

---

## 🧪 Step 9: Test on Real Device

### Install TestFlight

1. Download **TestFlight** from App Store
2. Open invitation email
3. Tap **"View in TestFlight"**
4. Tap **"Install"**

### Test Checklist

**Critical Tests:**
- [ ] App launches successfully
- [ ] Login works with test credentials
- [ ] Dashboard loads and displays correctly
- [ ] Jobs list appears (if any jobs available)
- [ ] Profile screen accessible
- [ ] No crashes or freezes

**Login Test:**
- Email: `zadfad41@gmail.com`
- Password: `112233`
- Expected: Success, dashboard loads

**API Test:**
- Verify API calls succeed
- Check network logs (if needed)
- Ensure no 500 errors

---

## 📊 Step 10: Monitor and Iterate

### Check Crash Reports

**Xcode Organizer:**
```
Window > Organizer > Crashes
```

**App Store Connect:**
```
My Apps > Speedy Van Driver > TestFlight > Crashes
```

### Collect Feedback

**From Testers:**
- TestFlight feedback
- Email reports
- Direct communication

**Common Issues to Watch:**
- Login failures
- API timeouts
- Location permission issues
- UI glitches

### Fix and Resubmit

If issues found:
1. Fix code
2. Test locally
3. Increment build number
4. Create new archive
5. Upload to TestFlight
6. Repeat testing

---

## 🎉 Step 11: Production Release (When Ready)

### Submit for App Review

1. Go to **"App Store"** tab (not TestFlight)
2. Click **"+"** to add version
3. Enter version number
4. Fill all required information:
   - Description
   - Keywords
   - Screenshots
   - Privacy details
5. Select build from TestFlight
6. Click **"Submit for Review"**

### Review Timeline

- **Typical:** 1-2 days
- **Expedited:** Request if critical (rare approval)
- **Rejection:** Address issues and resubmit

---

## 🔍 Troubleshooting

### Build Fails

**Error:** "No signing identity found"
- **Solution:** Configure signing in Xcode settings

**Error:** "Missing provisioning profile"
- **Solution:** Regenerate profile in Apple Developer portal

**Error:** "Duplicate symbols"
- **Solution:** Clean build folder, rebuild

### Upload Fails

**Error:** "Invalid bundle"
- **Solution:** Check bundle identifier matches App Store Connect

**Error:** "Missing compliance"
- **Solution:** Answer export compliance questions

### TestFlight Issues

**Build not appearing**
- **Wait:** Can take up to 30 minutes
- **Check email:** Processing notifications

**Testers can't install**
- **Verify:** Email addresses correct
- **Check:** TestFlight app installed
- **Confirm:** Invitation sent

---

## 📞 Support

### Backend API Issues
- **Status:** Check if Render deployed commit `e520775`
- **Test:** `curl https://speedy-van.co.uk/api/driver/auth/login`
- **Contact:** Backend team

### iOS Build Issues
- **Xcode:** Clean build folder, restart Xcode
- **Certificates:** Regenerate in Apple Developer portal
- **Help:** support@speedy-van.co.uk

### TestFlight Issues
- **Apple Support:** https://developer.apple.com/support/
- **Documentation:** https://developer.apple.com/testflight/

---

## ✅ Final Checklist

**Before Upload:**
- [ ] API URL updated in AppConfig.swift
- [ ] Version number incremented
- [ ] Build number incremented
- [ ] Tested in simulator (optional)
- [ ] Archive created successfully
- [ ] Archive validated without errors

**After Upload:**
- [ ] Build appears in App Store Connect
- [ ] Export compliance answered
- [ ] What to Test notes added
- [ ] Testers invited
- [ ] Tested on real device
- [ ] Login works with test credentials
- [ ] No crashes or critical bugs

**Production Ready:**
- [ ] All TestFlight feedback addressed
- [ ] Comprehensive testing completed
- [ ] Screenshots prepared
- [ ] App Store information complete
- [ ] Ready to submit for review

---

## 🚀 Quick Commands Reference

```bash
# Clean build
Cmd + Shift + K

# Run in simulator
Cmd + R

# Create archive
Cmd + Shift + B

# Open Organizer
Window > Organizer

# Build settings
Cmd + B (Build)
Cmd + . (Stop)
```

---

## 📝 Version History

| Version | Build | Date | Changes |
|---------|-------|------|---------|
| 1.0.0 | 1 | Initial | First release |
| 1.0.1 | 2 | Oct 13 | Fixed API endpoint |

---

## 🎯 Success Criteria

**This update is successful when:**
1. ✅ App builds without errors
2. ✅ Archive uploads to TestFlight
3. ✅ Login works on TestFlight build
4. ✅ No crashes during testing
5. ✅ All core features functional

---

**Good luck! 🚀**

For questions: support@speedy-van.co.uk

