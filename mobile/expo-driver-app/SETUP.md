# Setup Guide - Expo Driver App

## Prerequisites

- Node.js 18+ installed
- Expo Go app on your iPhone (already have it ✅)
- Same WiFi network for phone and computer

## Installation

### 1. Navigate to Project

```bash
cd mobile/expo-driver-app
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- React Native
- Expo SDK
- React Navigation
- Location services
- All other dependencies

### 3. Start Expo Server

```bash
npx expo start
```

You'll see:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or Camera app (iOS)
```

### 4. Open on iPhone

**Option A: QR Code (Easiest)**
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Scan the QR code from terminal
4. App loads automatically!

**Option B: URL**
1. Note the `exp://` URL in terminal
2. Open Expo Go
3. Type URL manually
4. App loads

## Test Credentials

```
Email: driver@test.com
Password: password123
```

## Troubleshooting

### "Unable to connect"

**Solution**:
- Ensure phone and computer on same WiFi
- Disable VPN if active
- Restart: `npx expo start -c`

### "Network error"

**Solution**:
- Check internet connection
- Verify backend API is accessible
- Try: `curl https://api.speedy-van.co.uk/api/driver/session`

### Location not updating

**Solution**:
- Grant location permissions
- Choose "Allow While Using App"
- For background: Choose "Always Allow"

### App crashes

**Solution**:
- Check terminal for errors
- Reload: Shake phone → Reload
- Clear cache: `npx expo start -c`

## Development Commands

```bash
# Start development server
npm start

# Start with cache cleared
npx expo start -c

# iOS Simulator (requires Mac + Xcode)
npm run ios

# Android Emulator (requires Android Studio)
npm run android

# Web browser
npm run web
```

## Project Configuration

### API Endpoint

Located in `src/config/api.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://api.speedy-van.co.uk',
};
```

Change for local development:
```typescript
BASE_URL: 'http://192.168.x.x:3000', // Use your computer's IP
```

### Location Settings

In `src/config/api.ts`:

```typescript
export const APP_CONFIG = {
  LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds
  LOCATION_DISTANCE_FILTER: 50, // 50 meters
};
```

## Building for Production

### Setup EAS Build

```bash
npm install -g eas-cli
eas login
eas build:configure
```

### Build iOS

```bash
eas build --platform ios
```

### Build Android

```bash
eas build --platform android
```

## Support

**Email**: support@speedy-van.co.uk
**Phone**: 07901846297

---

**Quick Start**: Just run `npx expo start` and scan! 🚀

