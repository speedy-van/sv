# Quick Build Commands - Speedy Van Driver App

## 🚀 Quick Start (Copy & Paste)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
cd mobile/expo-driver-app
eas login
```

### Step 3: Configure Project
```bash
eas build:configure
```

### Step 4: Set up Apple Credentials
```bash
eas credentials
```

Select:
1. **iOS**
2. **Production**
3. **Set up credentials from scratch**

### Step 5: Build iOS App
```bash
eas build --platform ios --profile production
```

### Step 6: Submit to TestFlight
```bash
eas submit --platform ios --latest
```

---

## 🎯 Alternative: Run Setup Script

### On macOS/Linux:
```bash
cd mobile/expo-driver-app
chmod +x ios-build-setup.sh
./ios-build-setup.sh
```

### On Windows:
```powershell
cd mobile\expo-driver-app
.\ios-build-setup.ps1
```

---

## 📊 Monitor Build Progress

After running `eas build`, you can monitor progress at:
- **Expo Dashboard**: https://expo.dev
- **Build Logs**: https://expo.dev/accounts/[your-account]/projects/speedy-van-driver/builds

---

## 🔧 Useful Commands

### Check build status
```bash
eas build:list
```

### View build logs
```bash
eas build:view [BUILD_ID]
```

### Cancel a build
```bash
eas build:cancel [BUILD_ID]
```

### Check credentials
```bash
eas credentials
```

### Update credentials
```bash
eas credentials --clear-cache
```

---

## 📱 After Build Completes

1. Download the `.ipa` file from the build page
2. Or submit directly to TestFlight using `eas submit`
3. Check App Store Connect for processing status
4. Add testers in TestFlight
5. Send test invitations

---

## ⚡ Super Quick Commands (All-in-One)

```bash
# Navigate to app directory
cd mobile/expo-driver-app

# Install EAS CLI (if not installed)
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build and submit
eas build --platform ios --profile production --auto-submit
```

The `--auto-submit` flag will automatically submit to TestFlight after the build completes.

---

## 🐛 Common Issues & Fixes

### "Command not found: eas"
```bash
npm install -g eas-cli
```

### "Not logged in"
```bash
eas login
```

### "Project not configured"
```bash
eas build:configure
```

### "Invalid credentials"
```bash
eas credentials --clear-cache
eas credentials
```

### "Build failed"
Check logs and ensure:
- Bundle ID matches Apple Developer: `com.speedyvan.driverapp`
- All dependencies are installed
- `app.json` configuration is correct

---

## 📞 Need Help?

- **Expo Documentation**: https://docs.expo.dev/build/introduction/
- **EAS Build Guide**: https://docs.expo.dev/build/setup/
- **Expo Discord**: https://chat.expo.dev/

---

**Bundle ID**: `com.speedyvan.driverapp`  
**Last Updated**: 2025-10-11







