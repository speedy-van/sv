# Changelog - Speedy Van Driver App

All notable changes to the Speedy Van Driver mobile app will be documented in this file.

---

## [2.0.0] - 2025-10-28

### 🎉 Major Release - Full iOS/Android Feature Parity

This is a **complete rewrite** bringing Android to full feature parity with iOS, with significant enhancements across the entire app.

### ✨ Added

#### Global Features
- **Email Notifications:** Drivers receive instant emails when jobs are assigned
  - Professional HTML templates with company branding
  - Direct app store links to open the app
  - Correct driver earnings display
  - Pickup/dropoff details included

- **Global Job Assignment System:** Pop-ups now work on ALL screens
  - Persistent across app restarts
  - Saved to AsyncStorage
  - Automatic restoration when app returns to foreground
  - 30-minute expiry window
  - Works on Dashboard, Jobs, Schedule, Earnings, Profile screens

- **Schedule Tab:** New dedicated tab for viewing all assignments
  - Color-coded by date (Today=Green, Tomorrow=Amber, Future=Cyan, Past=Red)
  - Shows scheduled date and time
  - Displays earnings and addresses
  - Tap to navigate to job progress
  - Real-time sync with backend
  - Purple neon design theme

#### Notifications
- **Sound Alerts:** 10-second repeat notification sound for urgency
- **Vibration Patterns:** Triple heavy impact haptic feedback
- **System Notifications:** Work even when app is in background
- **Multi-Channel:** Sound + Vibration + Pop-up + Email simultaneously

#### UI/UX Enhancements

**Login Screen:**
- Blue curved top decoration
- Floating white logo container with shadow
- Premium form card with rounded corners
- Icon-enhanced input fields (email, password)
- Glowing blue login button
- Professional error messages with icons
- Contact support footer

**Dashboard:**
- Animated "Today's Overview" title (rainbow color cycling every 3 seconds)
- White wave shimmer effect on greeting ("Hello, {name}!")
- Dynamic neon glows on status card (Green=Online, Red=Offline)
- Green neon glow on "Searching for Jobs" card
- White wave shimmer on "Searching for Jobs" card
- Amber neon glow on "No Jobs Available" empty state
- Enhanced stats cards with color-coded neon glows
- Clean white header with shadows

**Jobs Screen:**
- Light blue neon glow on header
- Blue neon glow on active filter tabs
- Amber neon glow on empty states
- Modern filter tabs with active states
- Enhanced job cards with shadows and borders

**Earnings Screen:**
- Green glowing total earnings card with large font
- Premium info cards with shadows
- Clean header with borders
- Enhanced typography throughout

**Profile Screen:**
- Light blue neon glow on all menu sections
- RED neon glow specifically on Logout section (danger indication)
- Glowing avatar with blue background
- Enhanced menu items with better icons
- Clean section separators

**Job Assignment Modal:**
- Pixel-perfect header alignment
- Green earnings badge with proper spacing
- Color-transitioning progress bar (Green→Yellow→Red)
- Shake animation for attention
- Clear 30-minute countdown timer
- Professional action buttons with shadows

### 🔧 Technical Improvements

#### Backend Integration
- Correct earnings calculation (shows driver earnings, not customer payment)
- Enhanced Pusher notification handling
- Better error handling and logging
- Unified API endpoints across iOS and Android

#### Performance
- Optimized database queries
- Reduced API call frequency
- Smooth animations using React Native Animated API
- Efficient re-rendering with proper memoization
- Faster initial load times

#### Reliability
- AsyncStorage persistence for critical data
- Auto-reconnect for Pusher disconnections
- Graceful error recovery
- Better background state management
- Improved location tracking reliability

#### Security
- Bearer token authentication
- Secure credential storage
- Email verification for account changes
- HTTPS-only communication

### 🐛 Fixed

#### Critical Bugs
- Fixed earnings display showing customer payment instead of driver earnings
- Fixed pop-up not appearing when driver is on non-dashboard screens
- Fixed assignment loss when app goes to background
- Fixed Pusher connection drops and reconnection issues
- Fixed notification sound errors and crashes

#### UI Bugs
- Fixed login subtitle not visible (white text on white background)
- Fixed job assignment modal value alignment and spacing
- Fixed neon glow effects not rendering properly on Android
- Fixed tab bar styling inconsistencies
- Fixed empty state designs and colors

#### API Bugs
- Fixed decline endpoint not finding assignments with "accepted" status
- Fixed unassign endpoint not handling single bookings (booking- prefix)
- Fixed schedule API not returning bookingId for navigation
- Fixed email notification not triggering from assignment endpoint

#### Android-Specific
- Fixed shadow rendering on Android (elevation values)
- Fixed border radius clipping issues
- Fixed status bar color handling
- Fixed gesture navigation conflicts

### 🔄 Changed

#### Breaking Changes
- **Minimum Android Version:** Now requires Android 6.0+ (API 23+)
- **New Permissions:** Added VIBRATE, WAKE_LOCK, RECEIVE_BOOT_COMPLETED

#### Architecture
- Moved job assignment logic to global context (JobAssignmentContext)
- Centralized Pusher listeners in global provider
- Unified notification handling across all screens
- Consolidated email service with fallback providers (Resend → SendGrid)

#### Version Numbers
- **Version Name:** 2.0.0 (from 1.0.0)
- **Version Code:** 2 (from 1)
- **iOS Build Number:** 2.0.0 (from 1.0.0)

### 🗑️ Removed

- Removed local job assignment modal from Dashboard (now global)
- Removed duplicate Pusher subscriptions
- Removed react-native-reanimated plugin (conflicts with Babel)
- Removed expo-linear-gradient dependency (used native alternatives)
- Removed localhost URLs from emails (now use production URLs only)
- Removed googleServicesFile reference (not configured yet)

### 🔐 Security

- All API calls use Bearer token authentication
- Email verification for account changes
- Secure storage for sensitive data (expo-secure-store)
- HTTPS-only endpoints
- No credentials in codebase

---

## [1.0.0] - 2024-12-XX

### Initial Release
- Basic driver authentication
- Dashboard with job overview
- Jobs list (assigned/available)
- Earnings tracking
- Profile management
- Basic notifications
- Location tracking

---

## Migration Guide: v1.0.0 → v2.0.0

### For Users (Automatic):
1. Google Play will prompt for update
2. Install update
3. Open app - all data preserved
4. New Schedule tab will appear
5. New features work immediately

### For Developers:
1. Update version in app.json ✅ Done
2. Update version in package.json ✅ Done
3. Run `eas build --platform android --profile production`
4. Download .aab file from Expo dashboard
5. Upload to Google Play Console → Internal Testing
6. Test with 5-10 drivers
7. Promote to production when stable

### API Compatibility:
- ✅ Backward compatible with existing backend
- ✅ No database migrations required
- ✅ Same authentication system
- ✅ Enhanced endpoints (fully compatible)

---

**For detailed build instructions, see BUILD_INSTRUCTIONS.md**

