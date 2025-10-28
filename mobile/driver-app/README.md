# Speedy Van Driver App (iOS & Android)

A professional cross-platform driver application for Speedy Van delivery service, built with Expo and React Native.

## 🚨 IMPORTANT: Localhost Setup Required!

**Before running the app**, you must configure the API URL. The app defaults to production (`https://speedy-van.co.uk`) but for development you need to use localhost.

### Quick Setup (3 Commands):
```bash
# 1. Create .env.local (Windows)
create-env.bat

# OR (Mac/Linux)
chmod +x create-env.sh && ./create-env.sh

# 2. Start backend (in project root)
cd ../../apps/web && npm run dev

# 3. Restart Expo (in mobile/driver-app)
npx expo start --clear
```

📖 **Troubleshooting "Network Error"?** See `QUICK_FIX_NETWORK_ERROR.md`

## Features (v2.0.0)

### Core Features
- ✅ **Authentication**: Secure login with Bearer token authentication
- ✅ **Dashboard**: Real-time overview with animated UI and neon effects
- ✅ **Location Tracking**: Live GPS tracking with foreground and background support
- ✅ **Real-time Updates**: Pusher integration for instant notifications
- ✅ **Jobs Management**: View, accept, and manage delivery jobs
- ✅ **Earnings Tracking**: Accurate driver earnings (not customer payment)
- ✅ **Profile Management**: Enhanced UI with neon sections
- ✅ **Password Recovery**: Forgot/reset password functionality
- ✅ **Job Details**: Interactive map with navigation and progress steps
- ✅ **Settings**: Profile editing, email change verification, and privacy controls
- ✅ **History**: Completed jobs tracking
- ✅ **Notifications**: Multi-channel (Email, Push, Sound, Vibration)

### NEW in v2.0.0
- ✅ **Global Job Assignment Pop-ups**: Works on ALL screens, persists through restarts
- ✅ **Email Notifications**: Instant emails with direct app links
- ✅ **Schedule Tab**: View all upcoming jobs with color-coded dates
- ✅ **Enhanced UI**: Neon glows, animations, modern design across all screens
- ✅ **Sound Alerts**: 10-second repeat notification sounds
- ✅ **Vibration Patterns**: Strong haptic feedback for job assignments
- ✅ **Cross-Platform**: 100% feature parity between iOS and Android

## Technology Stack

- **Framework**: Expo SDK 54
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context + Hooks
- **API Communication**: Axios with Bearer Token Authentication
- **Real-time**: Pusher.js
- **Maps**: React Native Maps
- **Location**: expo-location with background tracking
- **Notifications**: expo-notifications
- **Storage**: expo-secure-store

## Prerequisites

- Node.js 20.x or higher
- pnpm 10.17.0
- Expo CLI
- iOS Simulator (for iOS development) or physical iOS device
- Expo Go app (for testing on physical device)

## Installation

1. Navigate to the driver app directory:
```bash
cd mobile/driver-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```
EXPO_PUBLIC_API_BASE_URL=https://speedy-van.co.uk
EXPO_PUBLIC_PUSHER_KEY=your_pusher_key
EXPO_PUBLIC_PUSHER_CLUSTER=eu
```

## Running the App

### Development Mode

Start the Expo development server:
```bash
pnpm start
```

Or use specific platform commands:

```bash
# iOS Simulator (macOS only)
pnpm ios

# Android Emulator
pnpm android

# Web Browser
pnpm web
```

### Testing on Physical Device

1. Install Expo Go app from App Store
2. Scan the QR code shown in terminal
3. App will load on your device

## Project Structure

```
mobile/driver-app/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   ├── job/               # Job details
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── components/            # Reusable components
├── services/              # API and business logic
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
├── types/                 # TypeScript types
├── utils/                 # Utility functions
├── assets/                # Images, sounds, etc.
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Key Features Implementation

### 1. Location Tracking

The app implements comprehensive location tracking:

- **Foreground Tracking**: Active when app is open
- **Background Tracking**: Continues when app is in background
- **Permission Handling**: User-friendly permission requests
- **Live Map**: Interactive map showing current location
- **Location Updates**: Automatic updates sent to backend

### 2. Real-time Notifications

Pusher integration provides instant updates:

- `route-matched`: New route assigned
- `job-assigned`: New job assigned
- `route-removed`: Route removed
- `route-cancelled`: Route cancelled by admin
- `drop-removed`: Drop removed from route
- `notification`: General notifications

### 3. Authentication

Secure authentication system:

- Bearer token authentication
- Secure token storage with expo-secure-store
- Automatic token refresh
- Session persistence

### 4. API Integration

Full integration with backend APIs:

- `/api/driver/auth/login` - Login
- `/api/driver/dashboard` - Dashboard data
- `/api/driver/jobs` - Jobs management
- `/api/driver/earnings` - Earnings data
- `/api/driver/location` - Location updates

## Apple Requirements Compliance

The app meets all iOS App Store requirements:

### Technical Requirements
- ✅ iOS 13.4+ support
- ✅ 64-bit architecture
- ✅ IPv6 compatibility
- ✅ HTTPS only
- ✅ Background location usage declared
- ✅ Privacy permissions with clear descriptions

### Privacy & Permissions
- ✅ Location permission descriptions
- ✅ Notification permission handling
- ✅ Background modes declared
- ✅ Privacy policy link (to be added)

### App Store Assets
- ✅ App icon (1024x1024)
- ✅ Launch screen
- ✅ App description
- ✅ Screenshots (to be captured)

## Testing

### Manual Testing Checklist

- [ ] Login with valid credentials
- [ ] Location permission flow
- [ ] Dashboard loads correctly
- [ ] Real-time notifications work
- [ ] Location tracking active/inactive
- [ ] Map displays current location
- [ ] Jobs list loads
- [ ] Job details view
- [ ] Earnings display
- [ ] Profile view
- [ ] Logout functionality
- [ ] Background location tracking
- [ ] Push notifications

### Test Credentials

Contact your administrator for test driver credentials.

## Building for Production

### Quick Build Commands

```bash
# Android (Production AAB for Play Store)
pnpm build:android

# Android (Preview APK for testing)
pnpm build:android:preview

# iOS (Production for App Store)
pnpm build:ios

# Both platforms
pnpm build:all
```

### Detailed Build Instructions

**For Android v2.0.0 deployment**, see:
- 📄 **ANDROID_V2_DEPLOYMENT_GUIDE.md** - Complete deployment guide
- 📄 **BUILD_INSTRUCTIONS.md** - Detailed build steps
- 📄 **ANDROID_RELEASE_NOTES.md** - Release notes for Play Store
- 🔧 **build-android.ps1** - Automated PowerShell script (Windows)

### Manual Build Process

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login to Expo:
```bash
eas login
```

3. Build for your platform:
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

### App Store Submission

**iOS:**
1. Build with `pnpm build:ios`
2. Upload to App Store Connect
3. Submit for review

**Android:**
1. Build with `pnpm build:android`
2. Upload to Google Play Console
3. Start with Internal Testing track
4. Promote to Production when stable

## Environment Variables

Required environment variables:

- `EXPO_PUBLIC_API_BASE_URL`: Backend API URL
- `EXPO_PUBLIC_PUSHER_KEY`: Pusher app key
- `EXPO_PUBLIC_PUSHER_CLUSTER`: Pusher cluster (eu)

## Troubleshooting

### Location Not Working

1. Check permissions in device settings
2. Ensure location services are enabled
3. Verify API_BASE_URL is correct
4. Check network connectivity

### Pusher Not Connecting

1. Verify PUSHER_KEY is correct
2. Check PUSHER_CLUSTER matches backend
3. Ensure internet connection
4. Check Pusher dashboard for errors

### Login Failed

1. Verify API_BASE_URL is correct
2. Check credentials are valid
3. Ensure backend is running
4. Check network connectivity

## Support

For issues or questions:
- Email: support@speedy-van.co.uk
- Documentation: See DRIVER_IOS_APP_DESIGN.md

## License

Proprietary - Speedy Van Ltd.

