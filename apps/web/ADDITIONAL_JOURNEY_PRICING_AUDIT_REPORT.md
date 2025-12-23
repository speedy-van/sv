# تقرير فحص حساب السعر للرحلات الإضافية في حجز الرفاهية
## Additional Journey Pricing Audit Report

**تاريخ الفحص:** 2025-01-27  
**نطاق الفحص:** حساب السعر للرحلات الإضافية (Additional Journeys) في صفحة حجز الرفاهية  
**الملفات المفحوصة:**
- `src/app/booking-luxury/hooks/useBookingForm.ts`
- `src/app/api/booking-luxury/route.ts`
- `src/lib/pricing/unified-engine.ts`
- `src/lib/services/dynamic-pricing-engine.ts`
- `src/app/api/pricing/quote/route.ts`

---

## ملخص التنفيذي / Executive Summary

تم فحص منطق حساب السعر للرحلات الإضافية بشكل شامل. تم اكتشاف **5 مشاكل رئيسية** تؤثر على دقة حساب السعر:

1. ❌ **مشكلة حرجة:** التاريخ والوقت لا يُستخدمان في حساب الرسوم الإضافية
2. ⚠️ **مشكلة متوسطة:** جميع الرحلات تستخدم نفس timeSlot الرئيسي
3. ⚠️ **مشكلة متوسطة:** محرك التسعير الموحد لا يطبق مضاعفات الوقت
4. ✅ **يعمل بشكل صحيح:** حساب المسافة لكل رحلة
5. ✅ **يعمل بشكل صحيح:** حساب العناصر لكل رحلة

---

## 1. حساب المسافة / Distance Calculation

### ✅ الحالة: يعمل بشكل صحيح

**الملفات المعنية:**
- `src/app/booking-luxury/hooks/useBookingForm.ts` (lines 790-810, 825-826)
- `src/app/api/booking-luxury/route.ts` (lines 430-463)

**التحليل:**
- كل رحلة (segment) تستخدم عناوين الالتقاط والتسليم الخاصة بها
- الإحداثيات (coordinates) يتم التحقق منها لكل رحلة بشكل منفصل
- المسافة تُحسب بشكل منفصل لكل رحلة عبر API التسعير
- المسافات المجمعة تُجمع بشكل صحيح في `aggregatedDistance`

**الكود المرجعي:**
```790:810:src/app/booking-luxury/hooks/useBookingForm.ts
          const pickupAddress = segment.pickupAddress || step1.pickupAddress;
          const dropoffAddress = segment.dropoffAddress || step1.dropoffAddress;

          const pickupText = ensureAddressText(pickupAddress);
          const dropoffText = ensureAddressText(dropoffAddress);
          if (!pickupText || !dropoffText) {
            throw new Error(`Pickup and dropoff addresses are required for journey ${index + 1}`);
          }

          const pickupLat = pickupAddress?.coordinates?.lat;
          const pickupLng = pickupAddress?.coordinates?.lng;
          const dropoffLat = dropoffAddress?.coordinates?.lat;
          const dropoffLng = dropoffAddress?.coordinates?.lng;

          if (typeof pickupLat !== 'number' || typeof pickupLng !== 'number' || typeof dropoffLat !== 'number' || typeof dropoffLng !== 'number') {
            throw new Error(`Coordinates are missing for journey ${index + 1}`);
          }

          if ((pickupLat === 0 && pickupLng === 0) || (dropoffLat === 0 && dropoffLng === 0)) {
            throw new Error(`Coordinates are not resolved for journey ${index + 1}`);
          }
```

**الخلاصة:** ✅ حساب المسافة يعمل بشكل صحيح لكل رحلة إضافية.

---

## 2. حساب العناصر / Items Calculation

### ✅ الحالة: يعمل بشكل صحيح

**الملفات المعنية:**
- `src/app/booking-luxury/hooks/useBookingForm.ts` (lines 785, 813-824)

**التحليل:**
- كل رحلة تستخدم العناصر الخاصة بها من `segment.items`
- إذا لم تكن هناك عناصر في الرحلة، يتم استخدام العناصر الرئيسية كـ fallback
- العناصر تُحول بشكل صحيح إلى تنسيق API التسعير
- كل رحلة تُحسب بشكل منفصل مع عناصرها الخاصة

**الكود المرجعي:**
```785:824:src/app/booking-luxury/hooks/useBookingForm.ts
          const segment = segments[index];
          const segmentItems = buildSegmentItems(segment.items);
          if (segmentItems.length === 0) {
            throw new Error(`Items are required for journey ${index + 1}`);
          }

          // ... address validation ...

          const pricingData = {
            items: segmentItems.map(item => ({
              id: item.id || `item-${Date.now()}-${Math.random()}`,
              name: item.name || 'Unknown Item',
              category: item.category || 'furniture',
              quantity: item.quantity || 1,
              weight: item.weight || 10,
              volume: item.volume || 0.1,
              fragile: item.fragility_level === 'High' || item.fragility_level === 'Medium',
              oversize: (item.weight || 0) > 100 || (item.volume || 0) > 2,
              disassemblyRequired: item.dismantling_required === 'Yes',
              specialHandling: item.special_handling_notes ? [item.special_handling_notes] : [],
            })),
```

**الخلاصة:** ✅ حساب العناصر يعمل بشكل صحيح لكل رحلة إضافية.

---

## 3. حساب التاريخ والوقت / Date and Time Calculation

### ❌ المشكلة الحرجة #1: التاريخ والوقت لا يُستخدمان في حساب الرسوم الإضافية

**الملفات المعنية:**
- `src/lib/pricing/unified-engine.ts` (lines 1059-1119)
- `src/app/booking-luxury/hooks/useBookingForm.ts` (lines 829-839)

**المشكلة:**
1. **محرك التسعير الموحد (`unified-engine.ts`) لا يستخدم `scheduledDate` أو `timeSlot` في حساب الرسوم الإضافية:**
   - دالة `calculateSurcharges` (lines 1059-1119) تحسب فقط:
     - رسوم التوقفات الإضافية
     - رسوم العناصر الهشة
     - رسوم العناصر كبيرة الحجم
     - رسوم الوصول للممتلكات (السلالم)
   - **لا تحسب:**
     - رسوم عطلة نهاية الأسبوع
     - رسوم ساعات الذروة
     - رسوم الأوقات المسائية
     - مضاعفات الوقت الموسمية

2. **مقارنة مع محرك التسعير الشامل (`comprehensive-engine.ts`):**
   - محرك التسعير الشامل يستخدم `calculateSeasonalMultiplier` (lines 1062-1086)
   - يطبق مضاعفات للعطلات الأسبوعية، ساعات الذروة، والمواسم
   - محرك التسعير الموحد **لا يطبق هذه المضاعفات**

**الكود المرجعي للمشكلة:**
```1059:1119:src/lib/pricing/unified-engine.ts
  private calculateSurcharges(input: PricingInput, items: any[], route: any) {
    const surcharges = [];
    
    // Extra stops surcharge (multi-drop)
    if (input.dropoffs.length > 1) {
      const extraStops = input.dropoffs.length - 1;
      surcharges.push({
        category: 'extra_stops',
        amount: Math.round(extraStops * 6.25 * 100), // £6.25 per extra stop (in pence, reduced by 4x)
        reason: `${extraStops} additional stop(s)`
      });
    }
    
    // Fragile items
    const fragileItems = items.filter(item => item.fragile);
    if (fragileItems.length > 0) {
      surcharges.push({
        category: 'fragile',
        amount: Math.round(fragileItems.length * 2.00 * 100), // £2 per fragile item (in pence, reduced by 4x)
        reason: `${fragileItems.length} fragile item(s)`
      });
    }
    
    // Oversize items
    const oversizeItems = items.filter(item => item.oversize);
    if (oversizeItems.length > 0) {
      surcharges.push({
        category: 'oversize',
        amount: Math.round(oversizeItems.length * 3.75 * 100), // £3.75 per oversize item (in pence, reduced by 4x)
        reason: `${oversizeItems.length} oversize item(s)`
      });
    }

    // Property access surcharges (stairs)
    // ... stairs calculation ...
    
    return surcharges;
  }
```

**ملاحظة:** لا يوجد أي استخدام لـ `input.scheduledDate` أو `input.timeSlot` في هذه الدالة!

**التأثير:**
- رحلة في عطلة نهاية الأسبوع لا تحصل على رسوم إضافية
- رحلة في ساعات الذروة (8-10 صباحاً، 5-7 مساءً) لا تحصل على رسوم إضافية
- رحلة في المساء (7-11 مساءً) لا تحصل على رسوم إضافية
- رحلة في موسم الذروة (يوليو-أغسطس) لا تحصل على رسوم إضافية

**الخلاصة:** ❌ **مشكلة حرجة** - التاريخ والوقت لا يؤثران على السعر في محرك التسعير الموحد.

---

### ⚠️ المشكلة المتوسطة #2: جميع الرحلات تستخدم نفس timeSlot الرئيسي

**الملفات المعنية:**
- `src/app/booking-luxury/hooks/useBookingForm.ts` (line 839)

**المشكلة:**
- عند حساب السعر لكل رحلة، يتم استخدام `step1.pickupTimeSlot` (الوقت الرئيسي للحجز)
- **لا يتم استخدام `segment.timeSlot`** حتى لو كانت الرحلة لها timeSlot خاص بها
- هذا يعني أن جميع الرحلات الإضافية تستخدم نفس timeSlot حتى لو كانت في أوقات مختلفة

**الكود المرجعي:**
```829:839:src/app/booking-luxury/hooks/useBookingForm.ts
            scheduledDate: segment.datetime
              ? new Date(segment.datetime).toISOString()
              : step1.pickupDate
                ? new Date(step1.pickupDate + 'T10:00:00').toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            pickupDate: segment.datetime
              ? new Date(segment.datetime).toISOString()
              : step1.pickupDate
                ? new Date(step1.pickupDate + 'T10:00:00').toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            timeSlot: mapTimeSlotToAPI(step1.pickupTimeSlot) || 'flexible',
```

**المشكلة:** السطر 839 يستخدم دائماً `step1.pickupTimeSlot` بدلاً من `segment.timeSlot`.

**التأثير:**
- إذا كانت رحلة إضافية في وقت مختلف (مثلاً صباحاً بينما الرئيسية مساءً)، لا يتم تطبيق الرسوم الصحيحة
- حتى لو كان محرك التسعير يدعم timeSlot، لن يحصل على القيمة الصحيحة

**الخلاصة:** ⚠️ **مشكلة متوسطة** - timeSlot لا يُستخدم بشكل صحيح للرحلات الإضافية.

---

### ⚠️ المشكلة المتوسطة #3: محرك التسعير الموحد لا يطبق مضاعفات الوقت

**الملفات المعنية:**
- `src/lib/pricing/unified-engine.ts` (lines 264-398)
- `src/lib/pricing/comprehensive-engine.ts` (lines 1062-1086)

**المقارنة:**

**محرك التسعير الشامل (`comprehensive-engine.ts`):**
```1062:1086:src/lib/pricing/comprehensive-engine.ts
  private calculateSeasonalMultiplier(timeFactors: any, config: OperationalPricingConfig): number {
    let multiplier = 1.0;

    // Peak season (July-August from Section 7)
    if (config.seasonalNotes.summerPeak.active) {
      multiplier *= (1 + config.seasonalNotes.summerPeak.surcharge);
    }

    // Student season (September from Section 7)
    if (config.seasonalNotes.studentMoves.active) {
      multiplier *= (1 + config.seasonalNotes.studentMoves.surcharge);
    }

    // Rush hour
    if (timeFactors.isRushHour) {
      multiplier *= (1 + config.surcharges.rushHour);
    }

    // Weekend
    if (timeFactors.isWeekend) {
      multiplier *= (1 + config.surcharges.weekend);
    }

    return multiplier;
  }
```

**محرك التسعير الموحد (`unified-engine.ts`):**
- لا يحتوي على دالة `calculateSeasonalMultiplier`
- لا يطبق أي مضاعفات زمنية
- لا يفحص `scheduledDate` أو `timeSlot` لتحديد الرسوم الإضافية

**التأثير:**
- حتى لو تم إصلاح المشكلة #2 وإرسال timeSlot الصحيح، محرك التسعير الموحد لن يستخدمه
- السعر لن يعكس التغيرات الموسمية أو ساعات الذروة

**الخلاصة:** ⚠️ **مشكلة متوسطة** - محرك التسعير الموحد لا يدعم مضاعفات الوقت.

---

## 4. Dynamic Pricing Engine (Backend API)

### ✅ الحالة: يعمل بشكل صحيح (لكن مع قيود)

**الملفات المعنية:**
- `src/app/api/booking-luxury/route.ts` (lines 426-499)
- `src/lib/services/dynamic-pricing-engine.ts` (lines 264-330)

**التحليل:**
- عند إرسال الحجز إلى API، يتم حساب السعر لكل رحلة بشكل منفصل
- `dynamicPricingEngine.calculateDynamicPrice` يستخدم `scheduledDate` من كل رحلة
- محرك التسعير الديناميكي **يدعم** حساب مضاعفات الوقت:
  - `calculateTimeMultiplier` (lines 305-330) يطبق رسوم عطلة نهاية الأسبوع وساعات الذروة
  - `calculateWeatherMultiplier` (lines 332-361) يطبق رسوم الطقس
  - `calculateDemandMultiplier` (lines 281-290) يطبق رسوم الطلب

**الكود المرجعي:**
```305:330:src/lib/services/dynamic-pricing-engine.ts
  private calculateTimeMultiplier(scheduledDate: Date): number {
    const hour = scheduledDate.getHours();
    const dayOfWeek = scheduledDate.getDay();
    
    // Weekend multiplier
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 1.25;
    }
    
    // Peak hours (8-10 AM, 5-7 PM)
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
      return 1.3;
    }
    
    // Evening hours (7-11 PM)
    if (hour >= 19 && hour <= 23) {
      return 1.15;
    }
    
    // Early morning (6-8 AM)
    if (hour >= 6 && hour <= 8) {
      return 1.1;
    }
    
    return 1.0;
  }
```

**الخلاصة:** ✅ محرك التسعير الديناميكي في API يعمل بشكل صحيح ويطبق مضاعفات الوقت، **لكن** الواجهة الأمامية تستخدم محرك التسعير الموحد الذي لا يطبق هذه المضاعفات.

---

## 5. ملخص المشاكل / Issues Summary

### المشاكل الحرجة (Critical Issues)

| # | المشكلة | الملف | التأثير | الأولوية |
|---|---------|------|---------|----------|
| 1 | التاريخ والوقت لا يُستخدمان في حساب الرسوم الإضافية | `unified-engine.ts` | السعر لا يعكس عطلة نهاية الأسبوع، ساعات الذروة، أو المواسم | 🔴 عالية |

### المشاكل المتوسطة (Medium Issues)

| # | المشكلة | الملف | التأثير | الأولوية |
|---|---------|------|---------|----------|
| 2 | جميع الرحلات تستخدم نفس timeSlot الرئيسي | `useBookingForm.ts:839` | الرحلات الإضافية لا تحصل على timeSlot الصحيح | 🟡 متوسطة |
| 3 | محرك التسعير الموحد لا يطبق مضاعفات الوقت | `unified-engine.ts` | حتى مع إصلاح المشكلة #2، لن يتم تطبيق المضاعفات | 🟡 متوسطة |

### ما يعمل بشكل صحيح (Working Correctly)

| # | المكون | الحالة | الملاحظات |
|---|--------|--------|-----------|
| 1 | حساب المسافة | ✅ | كل رحلة تُحسب بشكل منفصل |
| 2 | حساب العناصر | ✅ | كل رحلة تستخدم عناصرها الخاصة |
| 3 | Dynamic Pricing Engine | ✅ | يدعم مضاعفات الوقت (لكن لا يُستخدم في الواجهة الأمامية) |

---

## 6. التوصيات / Recommendations

### التوصية #1: إضافة حساب مضاعفات الوقت في محرك التسعير الموحد

**الإجراء:**
1. إضافة دالة `calculateTimeBasedSurcharges` في `unified-engine.ts`
2. استخدام `input.scheduledDate` و `input.timeSlot` لحساب:
   - رسوم عطلة نهاية الأسبوع
   - رسوم ساعات الذروة
   - رسوم الأوقات المسائية
   - مضاعفات المواسم

**الكود المقترح:**
```typescript
private calculateTimeBasedSurcharges(input: PricingInput): number {
  if (!input.scheduledDate) return 0;
  
  const date = new Date(input.scheduledDate);
  const hour = date.getHours();
  const dayOfWeek = date.getDay();
  const month = date.getMonth();
  
  let surcharge = 0;
  
  // Weekend surcharge (25%)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    surcharge += 0.25;
  }
  
  // Peak hours (8-10 AM, 5-7 PM) - 30%
  if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
    surcharge += 0.30;
  }
  
  // Evening hours (7-11 PM) - 15%
  if (hour >= 19 && hour <= 23) {
    surcharge += 0.15;
  }
  
  // Summer peak (July-August) - 20%
  if (month === 6 || month === 7) {
    surcharge += 0.20;
  }
  
  return surcharge;
}
```

### التوصية #2: استخدام timeSlot الخاص بكل رحلة

**الإجراء:**
تعديل `useBookingForm.ts` line 839:
```typescript
// قبل:
timeSlot: mapTimeSlotToAPI(step1.pickupTimeSlot) || 'flexible',

// بعد:
timeSlot: mapTimeSlotToAPI(segment.timeSlot || step1.pickupTimeSlot) || 'flexible',
```

### التوصية #3: استخدام Dynamic Pricing Engine في الواجهة الأمامية

**البديل:** بدلاً من إصلاح محرك التسعير الموحد، يمكن استخدام `dynamicPricingEngine` مباشرة في الواجهة الأمامية لأنه يدعم بالفعل مضاعفات الوقت.

---

## 7. الخلاصة النهائية / Final Conclusion

### ✅ ما يعمل بشكل صحيح:
1. حساب المسافة لكل رحلة إضافية
2. حساب العناصر لكل رحلة إضافية
3. تجميع الأسعار بشكل صحيح

### ❌ المشاكل الرئيسية:
1. **مشكلة حرجة:** التاريخ والوقت لا يؤثران على السعر في محرك التسعير الموحد
2. **مشكلة متوسطة:** timeSlot لا يُستخدم بشكل صحيح للرحلات الإضافية
3. **مشكلة متوسطة:** محرك التسعير الموحد لا يدعم مضاعفات الوقت

### 📊 التأثير الإجمالي:
- **دقة السعر:** ⚠️ غير دقيقة - السعر لا يعكس الوقت والتاريخ بشكل صحيح
- **الوظائف الأساسية:** ✅ تعمل - المسافة والعناصر تُحسب بشكل صحيح
- **الرسوم الإضافية:** ❌ غير مكتملة - رسوم الوقت والتاريخ مفقودة

### 🎯 الأولوية للإصلاح:
1. **عاجل:** إضافة حساب مضاعفات الوقت في محرك التسعير الموحد
2. **مهم:** استخدام timeSlot الخاص بكل رحلة
3. **مستحسن:** توحيد محرك التسعير لاستخدام نفس المنطق في الواجهة الأمامية والخلفية

---

**تم إنشاء التقرير بواسطة:** AI Assistant  
**التاريخ:** 2025-01-27  
**الإصدار:** 1.0

