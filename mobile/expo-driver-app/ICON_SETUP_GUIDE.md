# 🎨 App Icon & Splash Screen Setup Guide

## 📁 Files Created

✅ **icon-source.svg** - Main app icon (1024x1024)  
✅ **splash-source.svg** - Splash screen (1284x2778)  
✅ **adaptive-icon-source.svg** - Android adaptive icon (1024x1024)

## 🔄 Convert SVG to PNG (Required)

### Method 1: Online Converter (Easiest)

1. Visit: https://cloudconvert.com/svg-to-png
2. Upload each SVG file
3. Set output dimensions:
   - **icon.png**: 1024×1024
   - **splash.png**: 1284×2778
   - **adaptive-icon.png**: 1024×1024
4. Download and place in `assets/` folder

### Method 2: Using ImageMagick (Command Line)

```bash
# Install ImageMagick first
# Windows: choco install imagemagick
# Mac: brew install imagemagick

cd mobile/expo-driver-app/assets

# Convert icon
magick icon-source.svg -resize 1024x1024 icon.png

# Convert splash
magick splash-source.svg -resize 1284x2778 splash.png

# Convert adaptive icon
magick adaptive-icon-source.svg -resize 1024x1024 adaptive-icon.png
```

### Method 3: Using Inkscape

```bash
# Install Inkscape: https://inkscape.org/

cd mobile/expo-driver-app/assets

# Convert all
inkscape icon-source.svg --export-type=png --export-filename=icon.png -w 1024 -h 1024
inkscape splash-source.svg --export-type=png --export-filename=splash.png -w 1284 -h 2778
inkscape adaptive-icon-source.svg --export-type=png --export-filename=adaptive-icon.png -w 1024 -h 1024
```

### Method 4: Using Node.js (Sharp)

```bash
cd mobile/expo-driver-app/assets

# Install sharp temporarily
npm install -g sharp-cli

# Convert
sharp -i icon-source.svg -o icon.png --width 1024 --height 1024
sharp -i splash-source.svg -o splash.png --width 1284 --height 2778
sharp -i adaptive-icon-source.svg -o adaptive-icon.png --width 1024 --height 1024
```

## 📝 Update app.json

After converting to PNG, update `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1E40AF"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1E40AF"
      }
    }
  }
}
```

## ✨ Icon Design Details

### Main Icon (`icon.png`)
- **Size**: 1024×1024 pixels
- **Design**: Speedy Van logo with delivery van
- **Colors**: Blue gradient background (#1E40AF → #3B82F6)
- **Elements**: 
  - White delivery van with "SV" branding
  - Motion lines showing speed
  - Green arrow indicating fast delivery
  - "Speedy Van DRIVER" text at bottom

### Splash Screen (`splash.png`)
- **Size**: 1284×2778 pixels (iPhone 14 Pro Max)
- **Design**: Full-screen branding
- **Colors**: Deep blue gradient
- **Elements**:
  - Centered larger van illustration
  - "Speedy Van" title
  - "Driver Portal" subtitle
  - "Delivering Excellence" tagline
  - Animated loading dots

### Adaptive Icon (`adaptive-icon.png`)
- **Size**: 1024×1024 pixels
- **Design**: Simplified van for Android
- **Safe Zone**: Icon elements within 75% center
- **Background**: Solid #1E40AF (set in app.json)

## 🧪 Test Your Icons

### Preview in Expo Go
```bash
cd mobile/expo-driver-app
pnpm run start
```

### Build for TestFlight (with new icons)
```bash
pnpm exec eas build --platform ios --profile production
```

## 🎯 Quick Steps Summary

1. ✅ SVG files already created in `assets/` folder
2. ⏳ Convert SVG to PNG using any method above
3. ⏳ Update `app.json` with icon paths
4. ⏳ Test in Expo Go
5. ⏳ Build new version for TestFlight

## 🔍 Verify Your Icons

After conversion, check:
- ✅ `icon.png` is 1024×1024 pixels
- ✅ `splash.png` is 1284×2778 pixels  
- ✅ `adaptive-icon.png` is 1024×1024 pixels
- ✅ Files are in PNG format
- ✅ app.json is updated

## 💡 Tips

- **Icon should be simple**: Clear at small sizes (60×60)
- **No text in adaptive icon**: May be cropped on Android
- **Test on real device**: Icons look different than desktop preview
- **Consistent branding**: Use same colors as app theme

## 🚀 Ready for Apple Review

Once icons are in place:
1. Update version in `app.json` (already at 1.0.1)
2. Build new version
3. Submit to TestFlight
4. Apple reviewers will see professional branding!

---

**Design by**: Cursor AI  
**Color Scheme**: Blue gradient (#1E40AF → #3B82F6)  
**Brand**: Speedy Van Driver App

