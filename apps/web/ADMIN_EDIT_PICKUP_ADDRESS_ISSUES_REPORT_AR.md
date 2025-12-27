# تقرير شامل: تعديل عنوان المنزل القديم (Pickup Address) من لوحة التحكم الإدارية

**تاريخ التقرير:** 2025-01-27  
**النظام:** Speedy Van - نظام إدارة الحجوزات  
**الموضوع:** كيفية تعديل عنوان الاستلام (Pickup Address) والمشاكل الموجودة

---

## 📋 ملخص تنفيذي

يمكن للأدمن تعديل عنوان المنزل القديم (Pickup Address) من خلال واجهة `OrderDetailDrawer`، ولكن هناك عدة مشاكل خطيرة في عملية التعديل تمنع حفظ بيانات `flatNumber` (رقم الشقة) بشكل صحيح.

---

## 🔍 كيفية التعديل من قبل الأدمن

### **1. الواجهة الأمامية (Frontend)**

**الملف:** `src/components/admin/OrderDetailDrawer.tsx`

#### **الخطوات:**

1. **فتح صفحة الطلب:**
   - الأدمن يفتح لوحة التحكم الإدارية
   - يختار طلب (Order) من الجدول
   - يضغط على الطلب لفتح `OrderDetailDrawer`

2. **تفعيل وضع التعديل:**
   - الأدمن يضغط على زر "Edit" أو "تعديل"
   - يتم تفعيل `isEditing = true`
   - تظهر حقول التعديل

3. **تعديل عنوان الاستلام:**
   - الأدمن يجد قسم "Pickup Location" (موقع الاستلام)
   - يستخدم `UKAddressAutocomplete` لإدخال العنوان الجديد
   - يمكنه تعديل:
     - **العنوان الكامل** (`label`)
     - **الرمز البريدي** (`postcode`)
     - **الإحداثيات** (`lat`, `lng`)
     - **رقم الشقة** (`flatNumber`) ⚠️ **مشكلة هنا**

4. **تعديل تفاصيل العقار:**
   - **عدد الطوابق** (`floors`)
   - **نوع الوصول** (`accessType`: مع مصعد / بدون مصعد)

5. **حفظ التعديلات:**
   - الأدمن يضغط على "Save" أو "حفظ"
   - يتم استدعاء `handleEditSave()`
   - يتم إرسال البيانات إلى API

### **2. الواجهة الخلفية (Backend API)**

**الملف:** `src/app/api/admin/orders/[code]/route.ts`

#### **عملية التحديث:**

1. **استقبال البيانات:**
   - API يستقبل طلب `PUT` على `/api/admin/orders/[code]`
   - البيانات تحتوي على `pickupAddress` مع الحقول:
     ```typescript
     {
       label: string,
       postcode: string,
       lat: number,
       lng: number,
       flatNumber: string  // ⚠️ يتم إرساله ولكن...
     }
     ```

2. **معالجة العنوان:**
   - يتم استدعاء `buildBookingAddressUpdate(updateData.pickupAddress)`
   - هذه الدالة تقوم ببناء كائن التحديث

3. **حفظ في قاعدة البيانات:**
   - يتم تحديث `BookingAddress` عبر Prisma
   - يتم تحديث `Booking.pickupProperty` إذا تم تغيير تفاصيل العقار

---

## ❌ المشاكل والأخطاء الموجودة

### **🔴 المشكلة رقم 1: عدم حفظ `flatNumber` في `BookingAddress`**

#### **السبب الجذري:**

**في ملف API Route:**
```typescript
// src/app/api/admin/orders/[code]/route.ts - السطر 10-34
function buildBookingAddressUpdate(addressData: any) {
  const update: Record<string, unknown> = {};
  
  if (typeof addressData.label === 'string' && addressData.label.trim().length > 0) {
    update.label = addressData.label.trim();
  }
  
  if (typeof addressData.postcode === 'string' && addressData.postcode.trim().length > 0) {
    update.postcode = normalizePostcode(addressData.postcode);
  }
  
  if (typeof addressData.lat === 'number') {
    update.lat = addressData.lat;
  }
  
  if (typeof addressData.lng === 'number') {
    update.lng = addressData.lng;
  }
  
  // ⚠️ PROBLEM: flatNumber is NOT handled here!
  return Object.keys(update).length > 0 ? update : null;
}
```

**المشكلة:**
- الدالة `buildBookingAddressUpdate` لا تتعامل مع `flatNumber` على الإطلاق
- حتى لو أرسل الـ Frontend `flatNumber`، يتم تجاهله تماماً
- لا يتم حفظ `flatNumber` في قاعدة البيانات

#### **الموقع في قاعدة البيانات:**

`flatNumber` **لا يوجد في جدول `BookingAddress`** في Prisma Schema:

```prisma
// prisma/schema.prisma - السطر 270-280
model BookingAddress {
  id       String @id @default(cuid())
  label    String
  postcode String
  lat      Float
  lng      Float
  // ⚠️ flatNumber غير موجود هنا!
}
```

**الحل الحالي (المؤقت):**
- `flatNumber` يُخزن في `Booking.customerPreferences.pickupAddressMeta.flatNumber` (حقل JSON)
- ولكن عند التعديل من الأدمن، لا يتم تحديث هذا الحقل

---

### **🔴 المشكلة رقم 2: عدم تحديث `customerPreferences.pickupAddressMeta.flatNumber`**

#### **السبب:**

في ملف `PUT` endpoint، لا يوجد كود لتحديث `customerPreferences`:

```typescript
// src/app/api/admin/orders/[code]/route.ts - السطر 361-411
const updatedOrder = await prisma.booking.update({
  where: { reference: code },
  data: {
    // ... حقول أخرى ...
    ...(pickupAddressUpdate
      ? {
          pickupAddress: {
            update: pickupAddressUpdate,
          },
        }
      : {}),
    // ⚠️ لا يوجد تحديث لـ customerPreferences.pickupAddressMeta.flatNumber
  },
});
```

**النتيجة:**
- حتى لو تم حفظ `flatNumber` في مكان ما، لا يتم تحديثه في `customerPreferences`
- البيانات القديمة تبقى موجودة
- النظام يفقد `flatNumber` عند التعديل

---

### **🔴 المشكلة رقم 3: عدم إرجاع `flatNumber` في GET Response**

#### **السبب:**

في ملف `GET` endpoint، `flatNumber` لا يتم إضافته إلى الـ Response:

```typescript
// src/app/api/admin/orders/[code]/route.ts - السطر 153-164
pickupAddress: order.pickupAddress ? {
  label: order.pickupAddress.label,
  postcode: order.pickupAddress.postcode,
  lat: order.pickupAddress.lat,
  lng: order.pickupAddress.lng,
  // ⚠️ flatNumber غير موجود هنا!
} : null,
```

**المشكلة:**
- حتى لو كان `flatNumber` موجوداً في قاعدة البيانات (في `customerPreferences`)، لا يتم إرجاعه للـ Frontend
- الـ Frontend لا يمكنه عرض `flatNumber` الحالي عند فتح وضع التعديل

---

### **🔴 المشكلة رقم 4: Frontend يقرأ `flatNumber` من مكان خاطئ**

#### **السبب:**

في ملف `OrderDetailDrawer.tsx`، الكود يحاول قراءة `flatNumber` من `pickupAddress`:

```typescript
// src/components/admin/OrderDetailDrawer.tsx - السطر 1875
flatNumber: editedOrder.pickupAddress?.flatNumber || order?.pickupAddress?.flatNumber || '',
```

**المشكلة:**
- `order.pickupAddress` لا يحتوي على `flatNumber` (لأن API لا يرجعه)
- يجب قراءته من `order.customerPreferences.pickupAddressMeta.flatNumber`
- ولكن الكود الحالي لا يفعل ذلك

---

### **🟡 المشكلة رقم 5: عدم التحقق من تغيير `flatNumber` في منطق إعادة حساب السعر**

#### **السبب:**

في ملف `OrderDetailDrawer.tsx`، الدالة `handleEditSave` تتحقق من التغييرات:

```typescript
// src/components/admin/OrderDetailDrawer.tsx - السطر 853-861
const hasPropertyChanges = 
  editedOrder.pickupProperty?.floors !== order.pickupProperty?.floors ||
  editedOrder.dropoffProperty?.floors !== order.dropoffProperty?.floors ||
  editedOrder.pickupProperty?.accessType !== order.pickupProperty?.accessType ||
  editedOrder.dropoffProperty?.accessType !== order.dropoffProperty?.accessType ||
  editedOrder.pickupAddress?.label !== order.pickupAddress?.label ||
  editedOrder.pickupAddress?.postcode !== order.pickupAddress?.postcode ||
  editedOrder.dropoffAddress?.label !== order.dropoffAddress?.label ||
  editedOrder.dropoffAddress?.postcode !== order.dropoffAddress?.postcode;
  // ⚠️ flatNumber غير مشمول في التحقق!
```

**المشكلة:**
- تغيير `flatNumber` قد يؤثر على السعر (خاصة في الشقق)
- لكن النظام لا يكتشف هذا التغيير
- لا يتم طلب إعادة حساب السعر عند تغيير `flatNumber`

---

### **🟡 المشكلة رقم 6: عدم التحقق من صحة البيانات**

#### **المشاكل:**

1. **لا يوجد تحقق من صحة `postcode`:**
   - يمكن إدخال أي نص في حقل `postcode`
   - لا يوجد تحقق من صيغة الرمز البريدي البريطاني

2. **لا يوجد تحقق من `lat/lng`:**
   - يمكن إدخال إحداثيات غير صحيحة
   - لا يوجد تحقق من النطاق (-90 إلى 90 للاتجاه العرضي، -180 إلى 180 للطولي)

3. **لا يوجد تحقق من `flatNumber`:**
   - يمكن إدخال أي قيمة
   - لا يوجد تحقق من التنسيق

---

## 📊 ملخص المشاكل

| رقم المشكلة | الوصف | الخطورة | الملف المتأثر |
|------------|------|---------|-------------|
| 1 | `flatNumber` لا يتم حفظه في `BookingAddress` | 🔴 عالية | `src/app/api/admin/orders/[code]/route.ts` |
| 2 | `customerPreferences.pickupAddressMeta.flatNumber` لا يتم تحديثه | 🔴 عالية | `src/app/api/admin/orders/[code]/route.ts` |
| 3 | `flatNumber` لا يتم إرجاعه في GET Response | 🔴 عالية | `src/app/api/admin/orders/[code]/route.ts` |
| 4 | Frontend يقرأ `flatNumber` من مكان خاطئ | 🔴 عالية | `src/components/admin/OrderDetailDrawer.tsx` |
| 5 | عدم التحقق من تغيير `flatNumber` في منطق السعر | 🟡 متوسطة | `src/components/admin/OrderDetailDrawer.tsx` |
| 6 | عدم التحقق من صحة البيانات | 🟡 متوسطة | `src/app/api/admin/orders/[code]/route.ts` |

---

## 🔧 الحلول المقترحة

### **الحل 1: إضافة دعم `flatNumber` في `BookingAddress`**

#### **الخيار أ: إضافة حقل `flatNumber` إلى Prisma Schema**

```prisma
model BookingAddress {
  id        String @id @default(cuid())
  label     String
  postcode  String
  lat       Float
  lng       Float
  flatNumber String?  // ⬅️ إضافة هذا الحقل
}
```

**المزايا:**
- ✅ `flatNumber` يصبح جزءاً من البيانات الأساسية للعنوان
- ✅ يسهل البحث والاستعلام
- ✅ البيانات منظمة بشكل أفضل

**العيوب:**
- ❌ يحتاج إلى migration في قاعدة البيانات
- ❌ يحتاج إلى تحديث البيانات القديمة

#### **الخيار ب: الاستمرار في استخدام `customerPreferences` (الموصى به حالياً)**

**الإجراءات المطلوبة:**

1. **تحديث `buildBookingAddressUpdate` لقراءة `flatNumber`:**
   - لا حاجة لتغييرها (لأن `flatNumber` ليس في `BookingAddress`)

2. **تحديث PUT endpoint لتحديث `customerPreferences`:**
   ```typescript
   const updatedOrder = await prisma.booking.update({
     where: { reference: code },
     data: {
       // ... حقول أخرى ...
       customerPreferences: {
         ...(existingOrder.customerPreferences as any || {}),
         pickupAddressMeta: {
           ...((existingOrder.customerPreferences as any)?.pickupAddressMeta || {}),
           flatNumber: updateData.pickupAddress?.flatNumber || undefined,
         },
       },
     },
   });
   ```

3. **تحديث GET endpoint لإرجاع `flatNumber`:**
   ```typescript
   pickupAddress: order.pickupAddress ? {
     label: order.pickupAddress.label,
     postcode: order.pickupAddress.postcode,
     lat: order.pickupAddress.lat,
     lng: order.pickupAddress.lng,
     flatNumber: (order.customerPreferences as any)?.pickupAddressMeta?.flatNumber || null,
   } : null,
   ```

4. **تحديث Frontend لقراءة `flatNumber` من المكان الصحيح:**
   ```typescript
   flatNumber: editedOrder.pickupAddress?.flatNumber 
     || order?.customerPreferences?.pickupAddressMeta?.flatNumber 
     || '',
   ```

---

### **الحل 2: إضافة التحقق من صحة البيانات**

```typescript
function buildBookingAddressUpdate(addressData: any) {
  if (!addressData || typeof addressData !== 'object') {
    return null;
  }

  const update: Record<string, unknown> = {};

  // Validate and update label
  if (typeof addressData.label === 'string' && addressData.label.trim().length > 0) {
    update.label = addressData.label.trim();
  }

  // Validate and update postcode (UK format)
  if (typeof addressData.postcode === 'string' && addressData.postcode.trim().length > 0) {
    const postcode = normalizePostcode(addressData.postcode);
    const ukPostcodeRegex = /^([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}|GIR\s?0AA)$/i;
    if (ukPostcodeRegex.test(postcode)) {
      update.postcode = postcode;
    } else {
      throw new Error('Invalid UK postcode format');
    }
  }

  // Validate and update lat (must be between -90 and 90)
  if (typeof addressData.lat === 'number') {
    if (addressData.lat >= -90 && addressData.lat <= 90) {
      update.lat = addressData.lat;
    } else {
      throw new Error('Invalid latitude (must be between -90 and 90)');
    }
  }

  // Validate and update lng (must be between -180 and 180)
  if (typeof addressData.lng === 'number') {
    if (addressData.lng >= -180 && addressData.lng <= 180) {
      update.lng = addressData.lng;
    } else {
      throw new Error('Invalid longitude (must be between -180 and 180)');
    }
  }

  return Object.keys(update).length > 0 ? update : null;
}
```

---

### **الحل 3: إضافة التحقق من تغيير `flatNumber` في منطق السعر**

```typescript
const hasPropertyChanges = 
  editedOrder.pickupProperty?.floors !== order.pickupProperty?.floors ||
  editedOrder.dropoffProperty?.floors !== order.dropoffProperty?.floors ||
  editedOrder.pickupProperty?.accessType !== order.pickupProperty?.accessType ||
  editedOrder.dropoffProperty?.accessType !== order.dropoffProperty?.accessType ||
  editedOrder.pickupAddress?.label !== order.pickupAddress?.label ||
  editedOrder.pickupAddress?.postcode !== order.pickupAddress?.postcode ||
  editedOrder.dropoffAddress?.label !== order.dropoffAddress?.label ||
  editedOrder.dropoffAddress?.postcode !== order.dropoffAddress?.postcode ||
  editedOrder.pickupAddress?.flatNumber !== order?.customerPreferences?.pickupAddressMeta?.flatNumber ||  // ⬅️ إضافة
  editedOrder.dropoffAddress?.flatNumber !== order?.customerPreferences?.dropoffAddressMeta?.flatNumber;   // ⬅️ إضافة
```

---

## 📝 الخلاصة

### **المشاكل الرئيسية:**

1. ✅ `flatNumber` يتم إرساله من Frontend ولكن لا يتم حفظه
2. ✅ `flatNumber` لا يتم إرجاعه من API
3. ✅ Frontend يحاول قراءة `flatNumber` من مكان خاطئ
4. ✅ عدم وجود تحقق من صحة البيانات
5. ✅ عدم إعادة حساب السعر عند تغيير `flatNumber`

### **التوصيات:**

1. **الأولوية العالية:**
   - تحديث PUT endpoint لحفظ `flatNumber` في `customerPreferences`
   - تحديث GET endpoint لإرجاع `flatNumber`
   - تحديث Frontend لقراءة `flatNumber` من المكان الصحيح

2. **الأولوية المتوسطة:**
   - إضافة التحقق من صحة البيانات
   - إضافة التحقق من تغيير `flatNumber` في منطق السعر

3. **الأولوية المنخفضة:**
   - النظر في إضافة `flatNumber` إلى `BookingAddress` Schema (في المستقبل)

---

**نهاية التقرير**

