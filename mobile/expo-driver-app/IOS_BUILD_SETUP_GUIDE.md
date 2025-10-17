# iOS Build Setup Guide - Speedy Van Driver App

## ✅ What's Already Done

1. **Bundle ID Updated**: Changed from `uk.co.speedyvan.driver` to `com.speedyvan.driverapp` in both iOS and Android configurations
2. **EAS Configuration Created**: `eas.json` file is now in place with production, preview, and development build profiles
3. **Apple Developer Setup Complete**: App ID registered on Apple Developer Portal with necessary capabilities

## 📋 Next Steps

### Step 1: Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo Account

```bash
eas login
```

If you don't have an Expo account, create one at: https://expo.dev/signup

### Step 3: Configure EAS Project

Navigate to the app directory:

```bash
cd mobile/expo-driver-app
```

Then run:

```bash
eas build:configure
```

This will:
- Link your project to Expo Application Services
- Generate a project ID and update `app.json`
- Verify your configuration

### Step 4: Connect Apple Developer Account

```bash
eas credentials
```

Select:
1. **iOS** platform
2. **Production** profile
3. Choose "Set up credentials from scratch" or "Use existing credentials"

You'll need:
- Your Apple Developer account credentials
- Apple Team ID (found in Apple Developer Portal)
- Distribution Certificate (EAS can generate this for you)
- Provisioning Profile (EAS can generate this for you)

### Step 5: Build iOS App for TestFlight

```bash
eas build --platform ios --profile production
```

This will:
- Upload your project to EAS servers
- Build the iOS app on their cloud infrastructure
- Generate an `.ipa` file
- Provide a download link

**Build time**: Usually 10-20 minutes

### Step 6: Submit to TestFlight

After the build completes successfully:

```bash
eas submit --platform ios --latest
```

You'll be asked for:
- Your Apple ID email
- App-specific password (generate one at: https://appleid.apple.com)
- ASC App ID (App Store Connect App ID - optional)

Alternatively, you can manually upload the `.ipa` to App Store Connect using **Transporter** app.

## 🔧 Configuration Notes

### Build Profiles

- **development**: For local development with Expo Go simulator
- **preview**: For internal testing (TestFlight beta)
- **production**: For App Store submission

### Required Information

Before starting, make sure you have:

- ✅ Apple Developer Account (active)
- ✅ App ID: `com.speedyvan.driverapp`
- ✅ Expo Account
- ✅ Apple Team ID
- ✅ App-specific password for automation

### Update eas.json with Your Apple Information

Open `eas.json` and update the `submit.production.ios` section:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-apple-id@example.com",
      "ascAppId": "1234567890",
      "appleTeamId": "ABC123XYZ"
    }
  }
}
```

## 📱 App Capabilities Enabled

The following capabilities are already configured in the app:

- ✅ Push Notifications
- ✅ Location Services (Always + When In Use)
- ✅ Background Modes (location, fetch, remote-notification, processing)

These match the capabilities enabled in your Apple Developer App ID.

## 🐛 Troubleshooting

### Issue: "No bundle identifier found"
**Solution**: Make sure you're in the `mobile/expo-driver-app` directory when running EAS commands.

### Issue: "Invalid provisioning profile"
**Solution**: Run `eas credentials` and regenerate the provisioning profile.

### Issue: "Build failed"
**Solution**: Check the build logs on the EAS dashboard. Common issues include:
- Missing dependencies
- Incorrect SDK versions
- Capability mismatches

### Issue: "Submit failed"
**Solution**: 
1. Verify your Apple ID credentials
2. Generate a new app-specific password
3. Ensure 2FA is enabled on your Apple account

## 📊 Build Status Monitoring

Monitor your builds at: https://expo.dev/accounts/[your-account]/projects/speedy-van-driver/builds

## 🚀 After TestFlight Upload

1. **Open App Store Connect**: https://appstoreconnect.apple.com
2. Navigate to **"My Apps"** > **"Speedy Van Driver"**
3. Go to **"TestFlight"** tab
4. Wait for processing (usually 5-15 minutes)
5. Add internal testers
6. Provide "What to Test" notes
7. Enable external testing when ready

## 📞 Support

If you encounter any issues:
- Check EAS documentation: https://docs.expo.dev/build/introduction/
- Check build logs in Expo dashboard
- Contact Expo support through their Discord channel

## ✅ Completion Checklist

- [ ] EAS CLI installed
- [ ] Logged into Expo account
- [ ] Project configured with `eas build:configure`
- [ ] Apple credentials set up with `eas credentials`
- [ ] iOS build completed successfully
- [ ] App submitted to TestFlight
- [ ] TestFlight processing complete
- [ ] Internal testers added
- [ ] App tested on real devices

---

**Project**: Speedy Van Driver App  
**Bundle ID**: com.speedyvan.driverapp  
**Platform**: iOS  
**Last Updated**: 2025-10-11











