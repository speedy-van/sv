# iOS Driver App - Deployment Guide

Complete guide for deploying the Speedy Van iOS driver app to TestFlight and the App Store.

## Overview

This guide covers:
1. Preparing the app for release
2. Creating app assets
3. TestFlight deployment
4. App Store submission
5. Post-deployment

## 1. Pre-Deployment Checklist

### Code Review

- [ ] All features working correctly
- [ ] No crashes or critical bugs
- [ ] Tested on multiple devices
- [ ] Tested on iOS 16.0, 17.0, and latest
- [ ] API endpoints point to production
- [ ] Debug logging disabled in release
- [ ] All TODOs and FIXMEs resolved
- [ ] Code cleaned up (no commented code)

### Configuration

- [ ] Update version number in `Info.plist`
- [ ] Update build number (increment for each build)
- [ ] Set API URL to production in `AppConfig.swift`
- [ ] Verify bundle identifier: `uk.co.speedy-van.driver`
- [ ] Set deployment target to iOS 16.0

### Assets

- [ ] App icon (1024x1024 PNG, no alpha)
- [ ] Launch screen configured
- [ ] All images optimized
- [ ] Color assets configured

## 2. Create App Assets

### App Icon

**Requirements:**
- Size: 1024x1024 pixels
- Format: PNG
- No transparency (alpha channel)
- No rounded corners (iOS adds them)

**Design Guidelines:**
- Simple, recognizable design
- Works well at small sizes
- Speedy Van branding
- Van/delivery theme
- Blue primary color

**Add to Xcode:**
1. Open `Assets.xcassets`
2. Click "AppIcon"
3. Drag 1024x1024 image to the "App Store iOS" slot
4. Xcode will generate all sizes

### Launch Screen

The launch screen is configured in `Info.plist`. It shows:
- Speedy Van logo
- Brand primary color background
- Simple, fast loading

**No changes needed** - already configured!

### Screenshots (For App Store)

**Required Sizes:**
- iPhone 6.7" (1290 x 2796) - iPhone 15 Pro Max
- iPhone 6.5" (1242 x 2688) - iPhone 11 Pro Max
- iPhone 5.5" (1242 x 2208) - iPhone 8 Plus
- iPad Pro 12.9" (2048 x 2732)

**Recommended Screenshots:**
1. Dashboard with online status
2. Available jobs list
3. Job details screen
4. Job progress/tracking
5. Profile screen

**How to Capture:**
1. Run app on simulator (e.g., iPhone 15 Pro Max)
2. Navigate to desired screen
3. `Cmd + S` to save screenshot
4. Screenshots saved to Desktop

## 3. Archive the App

### Clean Build

```bash
# Clean build folder
Cmd + Shift + K

# Clean derived data (if needed)
# Xcode > Preferences > Locations > Derived Data > Arrow icon
```

### Create Archive

1. Select "Any iOS Device (arm64)" as build destination
2. Product > Archive (or `Cmd + Shift + B`)
3. Wait for archive to complete (2-5 minutes)
4. Organizer window will open automatically

### Validate Archive

1. In Organizer, select your archive
2. Click "Validate App"
3. Select distribution method: "App Store Connect"
4. Select signing: "Automatically manage signing"
5. Click "Validate"
6. Fix any errors/warnings
7. Re-archive if needed

## 4. Upload to App Store Connect

### Prepare App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with Apple Developer account
3. Click "My Apps"
4. Click "+" to create new app

**App Information:**
- Platform: iOS
- Name: Speedy Van Driver
- Primary Language: English (UK)
- Bundle ID: uk.co.speedy-van.driver
- SKU: speedyvan-driver-001

### Upload Build

1. In Xcode Organizer, select archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Select "Upload"
5. Select signing: "Automatically manage signing"
6. Review summary
7. Click "Upload"
8. Wait for upload (5-15 minutes)

### Process Build

After upload:
1. Build appears in App Store Connect (may take 10-30 minutes)
2. Status changes from "Processing" to "Ready to Submit"
3. You'll receive email when processing completes

## 5. TestFlight Setup

### Create TestFlight Group

1. In App Store Connect, go to your app
2. Click "TestFlight" tab
3. Click "+" under "Internal Testing"
4. Name: "Internal Testers"
5. Add internal testers (up to 100)

**Add Testers:**
1. Click group name
2. Click "+" to add testers
3. Enter email addresses
4. Click "Add"

### Configure Build

1. Select build under "Builds"
2. Click "Provide Export Compliance Information"
3. Answer questions:
   - Does your app use encryption? **No** (unless you added encryption)
4. Add "What to Test" notes
5. Click "Submit for Review" (internal testing)

### Test on TestFlight

1. Testers receive email invitation
2. Install TestFlight app from App Store
3. Open invitation email
4. Tap "View in TestFlight"
5. Install and test the app

**Testing Checklist:**
- [ ] Login works
- [ ] Dashboard loads correctly
- [ ] Jobs list loads
- [ ] Can accept/decline jobs
- [ ] Job progress updates work
- [ ] Location tracking works
- [ ] Push notifications work (if enabled)
- [ ] No crashes
- [ ] Good performance

## 6. App Store Submission

### App Information

**Category:**
- Primary: Business
- Secondary: Productivity

**Age Rating:**
- 4+ (no mature content)

**App Description:**

```
Speedy Van Driver is the official driver application for Speedy Van delivery service.

Features:
• Accept and manage delivery jobs
• Real-time GPS tracking
• Route optimization
• Earnings tracking
• Customer communication
• Job progress updates
• Professional dashboard

For Speedy Van drivers only. Requires approved driver account.

Support: support@speedy-van.co.uk
Phone: 07901846297
```

**Keywords:**
```
delivery, driver, van, logistics, courier, transport, speedy, jobs, tracking
```

**Support URL:**
```
https://speedy-van.co.uk/driver-support
```

**Privacy Policy URL:**
```
https://speedy-van.co.uk/privacy
```

### Screenshots

Upload 5-8 screenshots for each device size:
1. Dashboard (first impression)
2. Jobs list (core feature)
3. Job details (functionality)
4. Tracking (unique feature)
5. Profile (optional)

### App Privacy

**Data Collection:**
1. Location: Used for job tracking
2. Contact Info: Email for account
3. Identifiers: Device ID for notifications

**Data Usage:**
- Linked to user identity
- Used for functionality
- Not used for tracking
- Not shared with third parties

### Submit for Review

1. Complete all required information
2. Upload screenshots
3. Add promotional text (optional)
4. Select pricing: **Free**
5. Select availability: **UK only**
6. Click "Submit for Review"

### Review Process

**Timeline:**
- Initial review: 24-48 hours
- Typical approval: 1-2 days
- Rejection possible (address issues and resubmit)

**Common Rejection Reasons:**
- Missing app functionality
- Incomplete information
- Privacy issues
- Design guideline violations
- Bugs/crashes

**If Rejected:**
1. Read rejection reason carefully
2. Fix issues
3. Respond to reviewer in Resolution Center
4. Create new build if code changes needed
5. Resubmit

## 7. Post-Deployment

### Monitor Performance

**App Analytics:**
- App Store Connect > Analytics
- Monitor downloads
- Track crashes
- Review ratings

**TestFlight Feedback:**
- Review feedback from beta testers
- Fix bugs before production

### Update Strategy

**Version Updates:**
1. Fix critical bugs: Patch (1.0.1)
2. New features: Minor (1.1.0)
3. Major changes: Major (2.0.0)

**Update Process:**
1. Make changes
2. Test thoroughly
3. Increment version/build number
4. Archive and upload
5. Submit for review

### User Support

**Support Channels:**
- Email: support@speedy-van.co.uk
- Phone: 07901846297
- In-app: Profile > Support

**Common Issues:**
1. Login problems → Check credentials
2. Location not working → Check permissions
3. Jobs not loading → Check internet
4. App crashes → Collect crash logs

## 8. Production Monitoring

### Crash Reporting

**Xcode Organizer:**
1. Window > Organizer
2. Click "Crashes" tab
3. View crash reports
4. Symbolicate and fix

**Third-party Tools:**
- Firebase Crashlytics (recommended)
- Sentry
- Bugsnag

### Performance Monitoring

**Metrics to Track:**
- App launch time
- API response times
- Battery usage
- Memory usage
- Location accuracy

### User Feedback

**Encourage Reviews:**
- In-app prompts (after positive experience)
- Email campaigns
- Driver incentives

**Respond to Reviews:**
- Thank positive reviews
- Address negative reviews promptly
- Fix reported issues

## Version Management

### Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

**Examples:**
- 1.0.0 - Initial release
- 1.0.1 - Bug fixes
- 1.1.0 - New features
- 2.0.0 - Major redesign

### Build Numbers

- Increment for each upload
- Unique per version
- Format: Integer (1, 2, 3...)

## Release Notes Template

```
Version 1.0.0

What's New:
• Initial release
• Complete driver workflow
• Job management
• Real-time tracking
• Earnings dashboard

Bug Fixes:
• N/A (initial release)

Improvements:
• Optimized performance
• Enhanced UI/UX
• Better location accuracy
```

## Rollback Plan

If critical bug in production:

1. **Immediate:**
   - Post notice in driver communications
   - Prepare hotfix

2. **Fix:**
   - Create bug fix
   - Test thoroughly
   - Create new build

3. **Deploy:**
   - Upload to App Store Connect
   - Request expedited review (if critical)
   - Monitor closely

## Checklist Summary

**Before Submission:**
- [ ] Code complete and tested
- [ ] Assets created (icon, screenshots)
- [ ] App Store Connect configured
- [ ] Archive validated
- [ ] Build uploaded

**TestFlight:**
- [ ] Internal testing complete
- [ ] External testing complete (optional)
- [ ] All feedback addressed

**App Store:**
- [ ] All information complete
- [ ] Screenshots uploaded
- [ ] Privacy details filled
- [ ] Submitted for review

**Post-Launch:**
- [ ] Monitor analytics
- [ ] Respond to reviews
- [ ] Fix bugs promptly
- [ ] Plan next version

## Support

For deployment help:
- Email: support@speedy-van.co.uk
- Phone: 07901846297
- Address: Office 2.18, 1 Barrack Street, Hamilton, ML3 0DG, Scotland
- Apple Developer Support: https://developer.apple.com/support/

Good luck with your deployment! 🚀

