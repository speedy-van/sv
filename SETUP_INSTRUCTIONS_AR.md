# 🚀 تعليمات الإعداد والتشغيل - iOS Driver App

**النسخة:** 1.0  
**التاريخ:** 10 أكتوبر 2025  
**الحالة:** ✅ جاهز للتثبيت والتشغيل

---

## 📋 المتطلبات الأساسية

- ✅ Node.js 18+ مثبت
- ✅ npm أو yarn مثبت
- ✅ Expo CLI مثبت (`npm install -g expo-cli`)
- ✅ Xcode 14+ (لـ iOS simulator)
- ✅ اتصال إنترنت للـ API

---

## 🔧 خطوات الإعداد (15 دقيقة)

### الخطوة 1: تثبيت Dependencies (5 دقائق)

```bash
# الانتقال إلى مجلد التطبيق
cd mobile/expo-driver-app

# تثبيت المكتبات المطلوبة
npm install zustand
npm install @react-native-community/netinfo
npm install axios-retry
npm install date-fns-tz
npm install expo-device

# أو كلها مرة واحدة
npm install zustand @react-native-community/netinfo axios-retry date-fns-tz expo-device

# أو باستخدام yarn
yarn add zustand @react-native-community/netinfo axios-retry date-fns-tz expo-device
```

---

### الخطوة 2: إنشاء Environment Files (5 دقائق)

**إنشاء `.env.development`:**

```bash
# في مجلد: mobile/expo-driver-app/
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_PUSHER_KEY=407cb06c423e6c032e9c
EXPO_PUBLIC_PUSHER_CLUSTER=eu
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

**إنشاء `.env.production`:**

```bash
# في مجلد: mobile/expo-driver-app/
EXPO_PUBLIC_API_URL=https://api.speedy-van.co.uk
EXPO_PUBLIC_PUSHER_KEY=407cb06c423e6c032e9c
EXPO_PUBLIC_PUSHER_CLUSTER=eu
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

**ملاحظة مهمة:**
- الـ `EXPO_PUBLIC_PROJECT_ID` يمكن الحصول عليه من [Expo Dashboard](https://expo.dev/)
- إذا لم يكن لديك Project ID، يمكنك استخدام قيمة مؤقتة مثل `speedy-van-driver-app`

---

### الخطوة 3: التحقق من gitignore (1 دقيقة)

تأكد أن `.gitignore` يحتوي على:

```bash
# Environment files
.env
.env.local
.env.development
.env.production
.env*.local
```

---

### الخطوة 4: تشغيل التطبيق (5 دقائق)

```bash
# في مجلد: mobile/expo-driver-app/

# بدء Expo Development Server
expo start

# أو
npx expo start
```

بعد التشغيل، ستظهر لك خيارات:

```
› Press i │ open iOS simulator
› Press a │ open Android emulator  
› Press w │ open web
› Press r │ reload app
› Press m │ toggle menu
```

اضغط `i` لفتح iOS Simulator.

---

## 🧪 الاختبار الأولي (10 دقائق)

### 1. تسجيل الدخول
```
Username: test-driver@speedy-van.co.uk
Password: [كلمة المرور الخاصة بالسائق الاختباري]
```

### 2. التحقق من Dashboard
- ✅ تحميل بيانات السائق
- ✅ عرض الإحصائيات
- ✅ AcceptanceRate يظهر

### 3. اختبار Jobs Screen
- ✅ Jobs تُحمل من API
- ✅ زر Accept يعمل
- ✅ زر Decline يعمل
- ✅ AcceptanceRate ينخفض 5% عند Decline
- ✅ Job يختفي فوراً عند Decline

### 4. اختبار Routes Screen
- ✅ Routes تُحمل من API
- ✅ Decline يعمل
- ✅ عرض الأرباح الجزئية عند الإلغاء

### 5. اختبار Earnings Screen
- ✅ Earnings تُحمل من API
- ✅ عرض الأرباح الكاملة
- ✅ عرض الأرباح الجزئية

---

## 🐛 حل المشاكل الشائعة

### المشكلة 1: "Cannot find module 'zustand'"
**الحل:**
```bash
npm install zustand
# ثم أعد تشغيل expo start
```

### المشكلة 2: "Cannot connect to API"
**الأسباب المحتملة:**
1. Backend غير مشغّل
2. API_URL خاطئ في `.env.development`
3. Network error

**الحل:**
```bash
# تأكد أن Backend يعمل على http://localhost:3000
# أو غيّر API_URL في .env.development
```

### المشكلة 3: "Pusher connection failed"
**الحل:**
- تحقق من `EXPO_PUBLIC_PUSHER_KEY` في `.env`
- تحقق من `EXPO_PUBLIC_PUSHER_CLUSTER` (يجب أن يكون `eu`)

### المشكلة 4: "No jobs/routes showing"
**الأسباب:**
1. لا توجد jobs في Backend
2. Driver غير معتمد (approved: false)
3. Driver offline

**الحل:**
```bash
# تحقق من حالة السائق في Admin Panel
# أو أنشئ test jobs في Backend
```

### المشكلة 5: "Notifications not showing"
**الحل:**
- يجب تشغيل التطبيق على جهاز حقيقي (ليس Simulator)
- Simulator لا يدعم Push Notifications بشكل كامل

---

## 📊 التحقق من النجاح

### ✅ Checklist
- [ ] التطبيق يفتح بدون أخطاء
- [ ] تسجيل الدخول يعمل
- [ ] Dashboard يُحمل بيانات حقيقية
- [ ] Jobs Screen يعرض jobs من API
- [ ] Decline job يقلل AcceptanceRate ب 5%
- [ ] Routes Screen يعرض routes من API
- [ ] Earnings Screen يعرض أرباح حقيقية
- [ ] Pusher events تعمل (jobs تختفي فوراً)
- [ ] Notifications تظهر (على جهاز حقيقي)

---

## 🔍 أدوات التشخيص

### عرض Console Logs
```bash
# في Terminal حيث يعمل expo start
# ستظهر جميع console.log من التطبيق
```

### عرض Network Requests
```bash
# في Metro Bundler
# يمكنك رؤية جميع API calls
```

### عرض Pusher Events
```bash
# في Console ستظهر رسائل مثل:
# 🎯 ROUTE MATCHED EVENT: {...}
# 🗑️ JOB REMOVED EVENT: {...}
# 📉 ACCEPTANCE RATE UPDATED: {...}
```

---

## 📱 البناء لـ Production

### iOS Build

```bash
# 1. تسجيل الدخول إلى Expo
expo login

# 2. إنشاء Build
eas build --platform ios --profile production

# 3. انتظر اكتمال البناء (10-15 دقيقة)
# 4. حمّل .ipa file
# 5. ارفعه على App Store Connect
```

---

## 🔐 ملاحظات أمنية

### Environment Variables
- ✅ `.env.*` files محظورة من Git
- ✅ لا تضع API keys في الكود
- ✅ استخدم `EXPO_PUBLIC_` prefix للمتغيرات العامة

### API Security
- ✅ جميع API calls تستخدم JWT token
- ✅ Token يُرسل في Authorization header
- ✅ Logout يمسح Token من AsyncStorage

---

## 📚 ملفات التوثيق

1. `IOS_DRIVER_APP_COMPLETE_AUDIT_REPORT.md` - تقرير التدقيق الشامل (إنجليزي)
2. `IOS_DRIVER_APP_ARABIC_AUDIT_SUMMARY.md` - ملخص التدقيق (عربي)
3. `IOS_DRIVER_APP_IMPLEMENTATION_PROGRESS.md` - تقرير التقدم التفصيلي
4. `IOS_DRIVER_APP_QUICK_COMPLETION_AR.md` - ملخص سريع (عربي)
5. `IOS_DRIVER_APP_PHASE_1_COMPLETE_AR.md` - تقرير الإكمال الكامل
6. **هذا الملف** - تعليمات الإعداد

---

## 🆘 الدعم

### إذا واجهت مشكلة:

1. **تحقق من Console Logs:**
   ```bash
   # ابحث عن رسائل تبدأ بـ:
   # ❌ Error
   # ⚠️ Warning
   ```

2. **تحقق من Network:**
   ```bash
   # تأكد من:
   # - Backend يعمل
   # - API_URL صحيح
   # - لا يوجد Firewall يمنع الاتصال
   ```

3. **أعد تشغيل كل شيء:**
   ```bash
   # 1. أوقف expo start (Ctrl+C)
   # 2. امسح Cache:
   expo start -c
   # 3. أعد تشغيل Backend
   # 4. جرب مرة أخرى
   ```

---

## ✅ النتيجة المتوقعة

بعد اتباع هذه التعليمات، يجب أن يكون لديك:

- ✅ تطبيق iOS Driver يعمل بشكل كامل
- ✅ Jobs, Routes, Earnings تُحمل من Backend
- ✅ AcceptanceRate يعمل بشكل صحيح (-5% لكل رفض)
- ✅ Partial earnings تُحسب وتُعرض
- ✅ Pusher events تحدث UI فوراً
- ✅ Notifications تعمل (على جهاز حقيقي)
- ✅ تطبيق جاهز للـ Production

---

## 🎯 الخطوات التالية

بعد التأكد أن كل شيء يعمل:

1. **اختبار شامل** (2 ساعة)
   - جميع Flows
   - Pusher events
   - Error handling

2. **تحديث DashboardScreen** (2 ساعة)
   - إضافة AcceptanceRateIndicator
   - ربط بـ APIs

3. **Performance Optimization** (2 ساعة)
   - Lazy loading
   - Image optimization
   - Reduce bundle size

4. **Production Build** (2 ساعة)
   - iOS build
   - Testing على TestFlight
   - Submit إلى App Store

---

**جاهز للبدء! 🚀**

إذا اتبعت هذه التعليمات، سيعمل التطبيق بنجاح بإذن الله.

