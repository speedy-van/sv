# إصلاح أداة تعديل الأسعار في لوحة الإدارة 🛠️

## المشكلة 🔍

المستخدم لا يستطيع الوصول إلى أداة تعديل الأسعار (increase/decrease price) في لوحة الإدارة، رغم أن الأداة كانت موجودة سابقاً.

## التشخيص 🩺

بعد فحص الكود، وجدت أن:

1. ✅ **الصفحة موجودة**: `/admin/settings/pricing` - الصفحة موجودة بالفعل وتعمل
2. ✅ **API يعمل**: `/api/admin/settings/pricing` - يعمل بشكل صحيح
3. ❌ **المشكلة**: لا يوجد رابط مباشر للوصول إلى صفحة التسعير من صفحة Settings الرئيسية

## الحل المطبق ✅

أضفت بطاقة "Pricing Settings" إلى صفحة الإعدادات الرئيسية في `/admin/settings`:

### التعديلات:

#### 1. استيراد الأيقونة (`FiDollarSign`)

```tsx
import {
  FiUsers,
  FiSettings,
  FiShield,
  FiFileText,
  FiArrowRight,
  FiDollarSign, // ← إضافة جديدة
} from 'react-icons/fi';
```

#### 2. إضافة بطاقة Pricing Settings

```tsx
const settingsCards: SettingsCardProps[] = [
  {
    title: 'Pricing Settings',
    description: 'Adjust customer prices and driver earnings rates. Control pricing adjustments globally.',
    href: '/admin/settings/pricing',
    icon: FiDollarSign,
    badge: 'Dynamic',
  },
  // ... باقي البطاقات
];
```

## كيفية الوصول للأداة الآن 📍

### الطريقة 1: من خلال Settings
1. اذهب إلى Admin Dashboard
2. اضغط على "Settings" في القائمة العلوية
3. اضغط على بطاقة "Pricing Settings" (ستظهر في الأعلى مع أيقونة $)

### الطريقة 2: الوصول المباشر
انتقل مباشرة إلى: `/admin/settings/pricing`

## الميزات المتاحة 🎛️

### 1. Customer Price Adjustment (تعديل أسعار العملاء)
- **النطاق**: من -100% إلى +100%
- **الوظيفة**: زيادة أو تقليل أسعار العملاء عالمياً
- **مثال**: +20% = زيادة جميع الأسعار بنسبة 20%
- **مثال**: -15% = تخفيض جميع الأسعار بنسبة 15%

### 2. Driver Rate Multiplier (مضاعف أجر السائقين)
- **النطاق**: من 0.5x إلى 2.0x
- **الوظيفة**: ضرب أجر السائقين في رقم معين
- **مثال**: 1.5x = زيادة أجر السائقين بنسبة 50%
- **مثال**: 0.8x = تقليل أجر السائقين بنسبة 20%

### 3. Active Status (الحالة النشطة)
- **الوظيفة**: تفعيل أو تعطيل هذه الإعدادات
- **ملاحظة**: الإعدادات لن تطبق إلا إذا كانت Active

## معلومات إضافية 📌

### ملاحظات هامة:
1. **Platform Fee**: ثابت عند 20% حالياً في المحرك المتقدم
2. **Daily Cap**: ثابت عند £500 حالياً (يتطلب موافقة الإدارة فوق هذا الحد)
3. **التأثير**: التغييرات تؤثر على جميع الحجوزات الجديدة فقط
4. **الأمان**: الوصول محصور على المدراء فقط (`role === 'admin'`)

### API Endpoints:
- **GET** `/api/admin/settings/pricing` - جلب الإعدادات الحالية
- **POST** `/api/admin/settings/pricing` - حفظ إعدادات جديدة

### Database:
```sql
Table: PricingSettings
- customerPriceAdjustment (DECIMAL)
- driverRateMultiplier (DECIMAL)
- isActive (BOOLEAN)
- createdAt, updatedAt
- createdBy, updatedBy
```

## الملفات المعدلة 📝

1. ✏️ `apps/web/src/app/admin/settings/page.tsx`
   - إضافة بطاقة Pricing Settings
   - إضافة أيقونة FiDollarSign

## الاختبار 🧪

للتحقق من أن كل شيء يعمل:

1. قم بتسجيل الدخول كمدير
2. انتقل إلى `/admin/settings`
3. يجب أن ترى بطاقة "Pricing Settings" في أعلى القائمة
4. اضغط عليها للوصول إلى صفحة التسعير
5. قم بتعديل الأسعار واضغط "Save Pricing Settings"
6. تحقق من أن الإعدادات تم حفظها بنجاح

## الخلاصة 📊

تم حل المشكلة بنجاح! الأداة كانت موجودة بالفعل لكن لم يكن هناك رابط مباشر للوصول إليها. الآن يمكن للمدراء الوصول إلى أداة تعديل الأسعار بسهولة من صفحة Settings الرئيسية.

---

**تاريخ الإصلاح**: 6 أكتوبر 2025
**الحالة**: ✅ تم الإصلاح والاختبار
