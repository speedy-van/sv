# 🔴 CRITICAL: TurboModule Crash Fix Guide
**التاريخ:** 29 نوفمبر 2025  
**الحالة:** 🔴 BLOCKING - التطبيق لا يعمل إطلاقاً  
**الخطورة:** CRITICAL - يمنع أي استخدام للتطبيق

---

## 📋 المشكلة

### الأعراض:
```
1. التطبيق يفتح ويظهر شاشة سوداء "Downloading 100%"
2. ثم يتعطل (crash) مع خطأ أحمر:

[runtime not ready]: Invariant Violation: 
TurboModuleRegistry.getEnforcing(...): 'PlatformConstants' 
could not be found. Verify that a module by this name is 
registered in the native binary.

3. التطبيق لا يصل أبداً لشاشة تسجيل الدخول
```

### السبب الجذري:

هذا الخطأ يحدث عندما:

1. **Dev Build بدلاً من Production Build**
   - التطبيق المُرسل هو dev/debug bundle
   - يعتمد على Metro bundler
   - لم يتم إنشاء production build صحيح

2. **عدم تطابق بين JS Bundle و Native Binary**
   - JavaScript code يحاول استخدام TurboModule `PlatformConstants`
   - Native binary لا يحتوي على هذا Module مُسجّل
   - Mismatch في إعدادات React Native

3. **لم يتم الاختبار على جهاز حقيقي**
   - Build لم يُختبر على iPhone فعلي قبل الإرسال
   - Simulator قد يعمل لكن الجهاز الحقيقي يفشل

---

## 🔧 الحل الشامل

### المرحلة 1: التحقق من إعدادات Expo (15 دقيقة)

#### 1.1 فحص app.json
```bash
cd mobile/driver-app
cat app.json | grep -A 20 "ios"
```

**تأكد من:**
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "uk.co.speedyvan.driver",
      "buildNumber": "1", // زيّد الرقم مع كل build
      "supportsTablet": false,
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "...",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "...",
        "UIBackgroundModes": ["location", "fetch"]
      }
    },
    "plugins": [
      "expo-location",
      "expo-notifications",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static" // ⚠️ مهم جداً
          }
        }
      ]
    ]
  }
}
```

#### 1.2 فحص eas.json
```bash
cat eas.json
```

**يجب أن يحتوي على:**
```json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release", // ⚠️ ليس Debug!
        "distribution": "internal", // أو "store"
        "autoIncrement": true,
        "cache": {
          "key": "production",
          "paths": [
            "node_modules",
            "ios/Pods"
          ]
        }
      }
    },
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Debug"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### 1.3 فحص package.json
```bash
cat package.json | grep -A 5 "expo"
```

**تأكد من الإصدارات:**
```json
{
  "dependencies": {
    "expo": "~52.0.0", // أو أحدث
    "expo-location": "~18.0.0",
    "expo-notifications": "~0.29.0",
    "react-native": "0.76.5",
    "react": "18.2.0"
  }
}
```

---

### المرحلة 2: تنظيف البيئة (10 دقائق)

```bash
cd mobile/driver-app

# 1. حذف جميع الـ caches
rm -rf node_modules
rm -rf .expo
rm -rf ios/build
rm -rf android/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
rm package-lock.json
rm yarn.lock

# 2. تنظيف npm/pnpm cache
pnpm store prune
npm cache clean --force

# 3. إعادة تثبيت Dependencies
pnpm install

# 4. Prebuild (إذا كنت تستخدم expo-dev-client)
npx expo prebuild --clean
```

---

### المرحلة 3: إصلاح Native Configuration (20 دقيقة)

#### 3.1 إنشاء/تحديث ios/Podfile
```ruby
# mobile/driver-app/ios/Podfile

require File.join(File.dirname(`node --print "require.resolve('expo/package.json')"`), "scripts/autolinking")
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")

platform :ios, '13.4'
install! 'cocoapods', :deterministic_uuids => false

target 'SpeedyVanDriver' do
  use_expo_modules!
  
  config = use_native_modules!
  
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true, # ⚠️ استخدم Hermes
    :fabric_enabled => false # Disable Fabric إذا كان يسبب مشاكل
  )

  # ⚠️ مهم: Force static linkage
  use_frameworks! :linkage => :static

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
  end
end
```

#### 3.2 تحديث Pods
```bash
cd ios
pod deintegrate
pod install --repo-update
cd ..
```

---

### المرحلة 4: إنشاء Production Build الصحيح (30 دقيقة)

#### 4.1 تحديث رقم الإصدار
```bash
# في app.json
nano app.json
```

```json
{
  "expo": {
    "version": "2.0.4", // زيّد الإصدار
    "ios": {
      "buildNumber": "4" // زيّد build number
    }
  }
}
```

#### 4.2 بناء Production Build عبر EAS
```bash
# تسجيل الدخول لـ EAS
eas login

# التأكد من المشروع
eas whoami
eas project:info

# بناء iOS Production
eas build --platform ios --profile production --clear-cache

# ⚠️ انتظر حتى ينتهي البناء (~20-30 دقيقة)
```

#### 4.3 تحميل وتثبيت Build
```bash
# بعد اكتمال البناء، سيعطيك EAS رابط تحميل
# مثال: https://expo.dev/accounts/.../builds/...

# حمّل الـ .ipa file
# ثبّت على جهازك عبر:
# - TestFlight (إذا رفعته لـ App Store Connect)
# - Apple Configurator (USB)
# - Diawi.com (مشاركة direct install)
```

---

### المرحلة 5: الاختبار على جهاز حقيقي (15 دقيقة)

#### 5.1 اختبار أساسي
```
✅ Checklist:
[ ] فتح التطبيق بدون Metro/dev server
[ ] لا توجد شاشة "Downloading 100%"
[ ] يظهر شاشة Splash الفعلية
[ ] يصل لشاشة Login بنجاح
[ ] يمكن إدخال email وpassword
[ ] لا crashes أو red screens
[ ] الـ console logs تظهر بشكل صحيح
```

#### 5.2 فحص TurboModules
```typescript
// إضافة في App.tsx للتحقق:
import { Platform, NativeModules } from 'react-native';

useEffect(() => {
  console.log('Platform:', Platform.OS, Platform.Version);
  console.log('TurboModules available:', Object.keys(NativeModules).length);
  console.log('PlatformConstants:', NativeModules.PlatformConstants);
}, []);
```

---

## 🔍 Troubleshooting

### إذا استمر الخطأ:

#### خيار 1: استخدام expo-dev-client
```bash
# أضف expo-dev-client للـ dependencies
pnpm add expo-dev-client

# في app.json
{
  "plugins": [
    "expo-dev-client"
  ]
}

# أعد البناء
eas build --platform ios --profile production
```

#### خيار 2: تعطيل TurboModules مؤقتاً
```typescript
// في metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    // استبعاد TurboModules المشكلة
    blockList: [
      /PlatformConstants/
    ]
  }
};
```

#### خيار 3: استخدام Hermes بدلاً من JSC
```json
// في app.json
{
  "expo": {
    "jsEngine": "hermes" // بدلاً من "jsc"
  }
}
```

---

## 📊 الفحوصات النهائية

### قبل إرسال Build للعميل:

```bash
# 1. التحقق من configuration
grep -r "localhost" mobile/driver-app/
grep -r "192.168" mobile/driver-app/
grep -r "metro" mobile/driver-app/app.json

# 2. التحقق من dependencies
cd mobile/driver-app
pnpm list expo
pnpm list react-native
pnpm list expo-location

# 3. فحص iOS configuration
cd ios
xcodebuild -showBuildSettings -scheme SpeedyVanDriver | grep PRODUCT_BUNDLE_IDENTIFIER
cd ..

# 4. التحقق من EAS build logs
eas build:list --platform ios --limit 1
```

### ✅ Checklist قبل الإرسال:

```
Pre-Flight Checklist:
[ ] app.json يحتوي على URL الإنتاج
[ ] buildNumber تم زيادته
[ ] version تم زيادته
[ ] eas build --profile production (ليس development)
[ ] Build اكتمل بنجاح بدون أخطاء
[ ] تم تحميل .ipa
[ ] تم التثبيت على iPhone حقيقي
[ ] فُتح التطبيق بنجاح
[ ] وصل لشاشة Login
[ ] تم تسجيل الدخول بنجاح
[ ] لا red screens
[ ] لا "Downloading 100%"
[ ] console logs تعمل
[ ] Pusher يتصل
[ ] API calls تعمل
[ ] Location permissions تعمل
```

---

## 🚨 الأخطاء الشائعة

### ❌ خطأ 1: استخدام development profile
```bash
# ❌ خطأ
eas build --platform ios --profile development

# ✅ صحيح
eas build --platform ios --profile production
```

### ❌ خطأ 2: نسيان clear cache
```bash
# ❌ خطأ
eas build --platform ios

# ✅ صحيح
eas build --platform ios --clear-cache
```

### ❌ خطأ 3: Pods قديمة
```bash
# ❌ خطأ - تشغيل على Simulator مباشرة

# ✅ صحيح - تحديث Pods أولاً
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### ❌ خطأ 4: استخدام npx expo start بدلاً من production build
```bash
# ❌ خطأ - هذا للتطوير فقط
npx expo start

# ✅ صحيح - بناء production binary
eas build --platform ios --profile production
```

---

## 📝 الخطوات القادمة

### فوراً (اليوم):
1. ✅ تنفيذ جميع خطوات المرحلة 1-5 أعلاه
2. ✅ بناء production build جديد
3. ✅ اختبار على iPhone حقيقي
4. ✅ إرسال build يعمل فقط

### هذا الأسبوع:
1. 🔄 إنشاء CI/CD pipeline للبناء التلقائي
2. 🔄 إضافة automated testing على أجهزة حقيقية
3. 🔄 توثيق عملية البناء

### المستقبل:
1. 📋 إعداد TestFlight beta testing
2. 📋 إنشاء staging builds منفصلة
3. 📋 مراقبة crash reports (Sentry/Crashlytics)

---

## 🔗 مراجع مفيدة

### Expo Documentation:
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Production Builds](https://docs.expo.dev/build-reference/build-configuration/)
- [iOS Build Configuration](https://docs.expo.dev/build-reference/ios-builds/)

### React Native Documentation:
- [TurboModules](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)
- [Hermes Engine](https://reactnative.dev/docs/hermes)

### Troubleshooting:
- [Expo Build Troubleshooting](https://docs.expo.dev/build-reference/troubleshooting/)
- [iOS Build Issues](https://docs.expo.dev/build-reference/ios-builds/#troubleshooting)

---

## 💬 Template للرد على العميل

```
Subject: Re: TurboModule Crash - Fixed and Tested

Hi [Name],

I've identified and fixed the TurboModule crash issue. Here's what happened:

**Root Cause:**
The build sent was a development build that depended on Metro bundler instead 
of a proper production binary. This caused the PlatformConstants TurboModule 
mismatch error.

**What I Fixed:**
1. ✅ Cleaned all caches and rebuilt dependencies
2. ✅ Updated iOS configuration to use static frameworks
3. ✅ Built proper production build with EAS (not development)
4. ✅ Verified Hermes engine is enabled
5. ✅ Tested on physical iPhone - app launches cleanly to login screen

**Verification:**
✅ No more "Downloading 100%" Metro screen
✅ No TurboModule errors
✅ App launches directly to login screen
✅ All native modules load correctly
✅ Production API URL configured

**New Build:**
- Version: 2.0.4
- Build Number: 4
- Download: [insert link]

The app has been tested on a physical iPhone and works correctly. 
No Metro dependency, no crashes.

Please test and confirm on your end.

Best regards,
[Your Name]
```

---

## 📞 Support

إذا استمرت المشكلة بعد تنفيذ جميع الخطوات:

1. شارك EAS build logs:
   ```bash
   eas build:view [BUILD_ID]
   ```

2. شارك Xcode build errors إن وجدت

3. شارك crash logs من الجهاز:
   - Settings → Privacy → Analytics → Analytics Data
   - ابحث عن SpeedyVanDriver crashes

4. تأكد من:
   - Xcode version: 15.0+
   - CocoaPods version: 1.15.0+
   - Node version: 18.0+
   - pnpm version: 9.0+

---

**End of Guide**

تم إنشاء: 29 نوفمبر 2025  
آخر تحديث: 29 نوفمبر 2025  
الحالة: ✅ جاهز للتنفيذ
