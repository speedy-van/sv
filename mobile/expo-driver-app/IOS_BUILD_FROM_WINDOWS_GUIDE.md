# دليل رفع Build iOS من Windows باستخدام Expo EAS

## 📋 الحالة الحالية

✅ **تم إنجازه:**
- تثبيت EAS CLI
- إنشاء حساب Expo
- إنشاء مشروع EAS
- Project ID: `7fc30f9d-100c-4f78-8d9d-37052623ee11`
- Project URL: https://expo.dev/accounts/ahmadawadalwakai/projects/speedy-van-driver

❌ **يحتاج إلى إكمال:**
- إعداد iOS Credentials (الشهادات)
- بناء التطبيق
- رفع Build إلى App Store Connect

---

## 🔐 المشكلة: iOS Credentials

EAS يحتاج إلى شهادات Apple Developer لبناء التطبيق:
1. **Distribution Certificate** - شهادة التوزيع
2. **Provisioning Profile** - ملف التوفير
3. **Push Notification Key** - مفتاح الإشعارات (اختياري)

---

## ✅ الحل: استخدام Apple ID Managed Credentials

### الخطوة 1: إعداد الشهادات تلقائياً

من جهاز Windows الخاص بك، قم بتشغيل:

```bash
cd /home/ubuntu/speedy-van-sv/mobile/expo-driver-app
eas credentials
```

ثم:
1. اختر **iOS**
2. اختر **production**
3. اختر **Set up App Store Connect API Key**
4. ستحتاج إلى:
   - **Key ID**
   - **Issuer ID**
   - **Key file (.p8)**

---

### الخطوة 2: الحصول على App Store Connect API Key

1. اذهب إلى: https://appstoreconnect.apple.com/access/api
2. اضغط على **"+"** لإنشاء مفتاح جديد
3. أعطه اسم: "EAS Build Key"
4. اختر Access: **Admin** أو **App Manager**
5. اضغط **Generate**
6. قم بتنزيل ملف `.p8` (سيتم تنزيله مرة واحدة فقط!)
7. احفظ:
   - **Key ID** (مثل: ABC123XYZ)
   - **Issuer ID** (مثل: 12345678-1234-1234-1234-123456789012)
   - **Key file** (AuthKey_ABC123XYZ.p8)

---

### الخطوة 3: إضافة API Key إلى EAS

```bash
eas credentials
```

ثم:
1. اختر **iOS**
2. اختر **production**
3. اختر **Set up App Store Connect API Key**
4. أدخل:
   - **Key ID**: [من الخطوة 2]
   - **Issuer ID**: [من الخطوة 2]
   - **Key file path**: [مسار ملف .p8]

---

### الخطوة 4: بناء التطبيق

بعد إعداد API Key، قم بتشغيل:

```bash
eas build --platform ios --profile production
```

سيتم:
1. ✅ إنشاء الشهادات تلقائياً
2. ✅ بناء التطبيق على سيرفرات Expo
3. ✅ إنشاء ملف `.ipa`

**الوقت المتوقع:** 15-30 دقيقة

---

### الخطوة 5: رفع Build إلى App Store Connect

بعد اكتمال البناء، قم بتشغيل:

```bash
eas submit --platform ios --profile production
```

سيتم رفع Build تلقائياً إلى App Store Connect!

---

## 🎯 الطريقة البديلة: استخدام واجهة Expo Web

إذا واجهت صعوبة مع CLI، يمكنك:

1. اذهب إلى: https://expo.dev/accounts/ahmadawadalwakai/projects/speedy-van-driver
2. اضغط على **"Builds"**
3. اضغط على **"Create a build"**
4. اختر **iOS**
5. اختر **production**
6. اتبع الخطوات على الشاشة

---

## 📝 معلومات مهمة

### Bundle Identifier
```
com.speedyvan.driverapp
```

### Apple ID
```
ahmadalwakai@gmx.com
```

### Apple Team ID
```
BXK52CMHR2
```

### ASC App ID
```
6753916830
```

---

## ⚠️ ملاحظات مهمة

1. **لا تحتاج Mac** - كل شيء يتم على سيرفرات Expo
2. **مجاني** - Expo تقدم builds مجانية (محدودة)
3. **الوقت** - البناء يستغرق 15-30 دقيقة
4. **الرفع** - يتم تلقائياً إلى App Store Connect

---

## 🚀 بعد رفع Build

1. انتظر 5-10 دقائق حتى تتم معالجة Build في App Store Connect
2. ستصلك رسالة بريد إلكتروني عند اكتمال المعالجة
3. اذهب إلى App Store Connect
4. **Prepare for Submission** > **Build**
5. اضغط **"Add Build"** أو **"Select Build"**
6. اختر Build المرفوع
7. أجب على أسئلة Export Compliance
8. احفظ واضغط **"Add for Review"**

---

## 📞 الدعم

إذا واجهت أي مشكلة:
- Expo Docs: https://docs.expo.dev/build/introduction/
- Expo Discord: https://chat.expo.dev/
- Expo Forums: https://forums.expo.dev/

---

## ✅ الخطوات التالية

1. ✅ احصل على App Store Connect API Key
2. ✅ أضف API Key إلى EAS
3. ✅ قم ببناء التطبيق
4. ✅ ارفع Build إلى App Store Connect
5. ✅ اختر Build في App Store Connect
6. ✅ أرسل التطبيق للمراجعة

---

**تم إنشاء هذا الدليل في:** 12 أكتوبر 2025
**المشروع:** Speedy Van Driver iOS App
**الحالة:** جاهز للبناء بعد إعداد API Key

