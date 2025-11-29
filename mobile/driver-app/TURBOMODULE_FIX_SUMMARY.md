# TurboModule PlatformConstants Error - Root Cause & Solution

## Problem Analysis

### Symptoms
```
[runtime not ready]: Invariant Violation: TurboModuleRegistry.getEnforcing(...): 
'PlatformConstants' could not be found. Verify that a module by this name is 
registered in the native binary.
```

- App shows "Downloading 100%" Metro dev screen
- Crashes immediately with TurboModule error
- Never reaches login screen
- Completely unusable

## Root Cause

**The app was being built as a development client instead of a production standalone binary.**

### Technical Details:

1. **Missing iOS Native Code**
   - No `ios/` directory in the project
   - App depends on EAS Build for iOS compilation
   - Cannot use `expo prebuild` on Windows

2. **expo-dev-client Dependency**
   - Was included in production dependencies
   - Causes app to expect Metro dev server connection
   - Creates "Downloading 100%" screen behavior
   - Introduces TurboModule mismatches

3. **Development Build Configuration**
   - EAS build profile had `developmentClient: true` in some profiles
   - This creates a dev client that requires Metro connection
   - Not suitable for standalone production distribution

4. **Bundle Mismatch**
   - Dev client JS bundle expects dev server modules
   - Production native binary doesn't include dev modules
   - Results in PlatformConstants and other TurboModule errors

## Solution Implemented

### 1. Dependency Management
**Changed:** Moved `expo-dev-client` from dependencies to devDependencies

```json
// package.json
"devDependencies": {
  "expo-dev-client": "~6.0.17",  // Only for local development
  ...
}
```

### 2. EAS Build Configuration
**Fixed:** `eas.json` production profile

```json
{
  "production": {
    "distribution": "internal",
    "ios": {
      "resourceClass": "m-medium",
      "buildConfiguration": "Release",
      "simulator": false,
      "autoIncrement": true
    },
    "android": {
      "buildType": "apk",
      "gradleCommand": ":app:assembleRelease"
    },
    "env": {
      "EXPO_PUBLIC_API_BASE_URL": "https://speedy-van.co.uk"
    }
  }
}
```

**Key Changes:**
- Removed `developmentClient: true` flag
- Removed `channel: "production"` (requires expo-updates)
- Changed resource class from deprecated `m1-medium` to `m-medium`
- Ensured Release buildConfiguration for iOS

### 3. App Configuration
**Verified:** `app.json` settings

```json
{
  "expo": {
    "newArchEnabled": false,  // Using stable architecture
    "plugins": [
      "expo-router",
      ["expo-location", { ... }],
      ["expo-notifications", { ... }]
    ]
  }
}
```

## Build Process

### Prerequisites
1. **macOS Required**: iOS builds must be created on macOS or via EAS Build
2. **Apple Developer Account**: Required for internal distribution
3. **EAS CLI**: `npm install -g eas-cli@latest`

### Production Build Commands

#### iOS Production Build
```bash
cd mobile/driver-app
npx eas build --platform ios --profile production
```

#### Android Production Build
```bash
cd mobile/driver-app
npx eas build --platform android --profile production
```

### Build Features
- ✅ **Standalone Binary**: No Metro dependency
- ✅ **Native Modules**: All properly registered
- ✅ **Immediate Launch**: No "Downloading" screen
- ✅ **Production Ready**: Release configuration
- ✅ **Internal Distribution**: Can install on devices directly

## Testing Checklist

Before sending to client, verify:

- [ ] Build completes successfully on EAS
- [ ] Download .ipa file from EAS dashboard
- [ ] Install on physical iOS device via Xcode or TestFlight
- [ ] App launches immediately (no Metro screen)
- [ ] Login screen appears correctly
- [ ] No TurboModule errors
- [ ] All core features work (location, notifications, etc.)
- [ ] Test in offline mode (no dev server dependency)

## Development vs Production

### Development Build (Local Testing)
```bash
# Install expo-dev-client
pnpm add -D expo-dev-client

# Build development client
npx eas build --platform ios --profile development

# Start dev server
npx expo start --dev-client
```

### Production Build (Client Distribution)
```bash
# expo-dev-client stays in devDependencies only
# Build standalone app
npx eas build --platform ios --profile production

# No dev server needed - app is self-contained
```

## Key Differences

| Feature | Development Build | Production Build |
|---------|------------------|------------------|
| Metro Server | Required | Not needed |
| Launch Time | Shows "Downloading" | Immediate |
| TurboModules | Dev modules | Production only |
| Size | Larger | Optimized |
| Distribution | Internal testing | Client-ready |
| Updates | Fast Refresh | Static |

## Next Steps

1. **Complete Build**: Wait for EAS build to finish
2. **Download IPA**: From EAS dashboard
3. **Install & Test**: On physical iOS device
4. **Verify Functionality**: All features work standalone
5. **Send to Client**: Only after local verification

## Technical Notes

### Why This Happened

The previous build was likely created with development profile or had `expo-dev-client` in production dependencies. This caused:

1. Native binary compiled with dev client modules
2. JS bundle expected Metro connection
3. TurboModule registry included dev-only modules
4. Mismatch between expected and available modules

### Prevention

To avoid this in future:

1. Always use `--profile production` for client builds
2. Keep `expo-dev-client` in devDependencies only
3. Test builds on real devices before distribution
4. Verify no Metro dependency in production builds
5. Check EAS build logs for warnings

## Resources

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)
- [Production Build Best Practices](https://docs.expo.dev/build-reference/best-practices/)

---

**Status**: Configuration fixed, ready for production build
**Next**: Build via EAS and test on physical device
