# تكامل إعدادات التسعير - Pricing Settings Integration (FIXED)

## المشكلة الأصلية 🔴

المستخدم يقوم بتعديل الأسعار من `/admin/settings/pricing` لكن الأسعار لا تتغير عند الحجز.

**السبب:**
- إعدادات التسعير (`customerPriceAdjustment` و `driverRateMultiplier`) كانت تُحفظ في قاعدة البيانات
- لكن محركات التسعير **الثلاثة** لا تقرأها من قاعدة البيانات:
  - ❌ `ComprehensivePricingEngine` - يُستخدم في `/api/pricing/comprehensive`
  - ❌ `UnifiedPricingEngine` - يُستخدم في `/api/pricing/quote` ← **هذا المستخدم في الحجز!**
  - ❌ `DynamicPricingEngine` - يُستخدم في `/api/booking-luxury`
- كانت تستخدم قيم ثابتة مبرمجة في الكود

## الحل الكامل ✅

تم تعديل **جميع** محركات التسعير لقراءة الإعدادات من قاعدة البيانات وتطبيقها.

### 1. التغييرات في `comprehensive-engine.ts`:

```typescript
/**
 * Load active pricing settings from database
 */
private async loadPricingSettings(): Promise<{ customerAdjustment: number; driverMultiplier: number } | null> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const settings = await prisma.pricingSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (settings) {
      return {
        customerAdjustment: Number(settings.customerPriceAdjustment),
        driverMultiplier: Number(settings.driverRateMultiplier),
      };
    }
    return null;
  } catch (error) {
    console.warn('Failed to load pricing settings, using defaults:', error);
    return null;
  }
}
```

### 2. التغييرات في `unified-engine.ts` (المحرك الرئيسي للحجز):

```typescript
async calculatePrice(input: PricingInput): Promise<PricingResult> {
  const requestId = createRequestId();
  const calculatedAt = new Date().toISOString();

  // Load active pricing settings from database
  const pricingSettings = await this.loadPricingSettings();

  this.logInfo('Starting pricing calculation', { requestId, inputHash: this.hashInput(input) });
  if (pricingSettings) {
    this.logInfo('Applied pricing settings', {
      customerAdjustment: `${(pricingSettings.customerAdjustment * 100).toFixed(0)}%`,
      driverMultiplier: `${pricingSettings.driverMultiplier}x`
    });
  }

  // ... باقي الكود ...

  // Apply customer price adjustment from admin settings
  if (pricingSettings && pricingSettings.customerAdjustment !== 0) {
    subtotalAfterDiscounts = Math.round(subtotalAfterDiscounts * (1 + pricingSettings.customerAdjustment));
    this.logInfo('Applied customer price adjustment', {
      original: subtotalAfterMultiplier - totalDiscounts,
      adjusted: subtotalAfterDiscounts,
      adjustment: `${(pricingSettings.customerAdjustment * 100).toFixed(0)}%`
    });
  }
}
```

### 3. التغييرات في `dynamic-pricing-engine.ts`:

```typescript
async calculateDynamicPrice(request: DynamicPricingRequest): Promise<DynamicPricingResponse> {
  try {
    // Load active pricing settings from database
    const pricingSettings = await this.loadPricingSettings();
    if (pricingSettings) {
      console.log('💰 Applied pricing settings to dynamic pricing:', {
        customerAdjustment: `${(pricingSettings.customerAdjustment * 100).toFixed(0)}%`,
        driverMultiplier: `${pricingSettings.driverMultiplier}x`
      });
    }

    // ... حساب السعر الأساسي والمضاعفات ...

    // Apply admin pricing settings
    if (pricingSettings && pricingSettings.customerAdjustment !== 0) {
      const originalPrice = finalPrice;
      finalPrice = finalPrice * (1 + pricingSettings.customerAdjustment);
      console.log('💰 Applied customer price adjustment:', {
        original: `£${originalPrice.toFixed(2)}`,
        adjusted: `£${finalPrice.toFixed(2)}`,
        adjustment: `${(pricingSettings.customerAdjustment * 100).toFixed(0)}%`
      });
    }
  }
}
```

## كيفية الاستخدام 📖

### من لوحة الإدارة:

1. اذهب إلى `/admin/settings/pricing`
2. عدّل قيمة **Customer Price Adjustment**:
   - `-0.50` = خصم 50% (السعر سيصبح نصف السعر الأصلي)
   - `-0.20` = خصم 20%
   - `+0.10` = زيادة 10%
   - `0` = لا تغيير
3. اضغط **Save Pricing Settings**
4. جرب حجز جديد - **الأسعار ستتغير فوراً** ✅

### ملاحظة مهمة:
- القيمة بين `-1` و `1` (مثلاً `-0.2` = خصم 20%)
- التعديل يطبق على السعر قبل ضريبة القيمة المضافة
- ثم يتم حساب الـ VAT (20%) على المبلغ المعدّل

## أمثلة واقعية 🧪

### مثال 1: خصم 20% (-0.2)

**قبل:**
- سعر أساسي: £100
- VAT (20%): £20
- **المجموع: £120**

**بعد:**
- سعر أساسي: £100
- بعد الخصم -20%: £100 × 0.8 = £80
- VAT (20%): £80 × 0.2 = £16
- **المجموع: £96** ✅ (وفر £24)

### مثال 2: خصم 50% (-0.5)

**قبل:**
- سعر أساسي: £200
- VAT (20%): £40
- **المجموع: £240**

**بعد:**
- سعر أساسي: £200
- بعد الخصم -50%: £200 × 0.5 = £100
- VAT (20%): £100 × 0.2 = £20
- **المجموع: £120** ✅ (وفر £120)

### مثال 3: زيادة 15% (+0.15)

**قبل:**
- سعر أساسي: £150
- VAT (20%): £30
- **المجموع: £180**

**بعد:**
- سعر أساسي: £150
- بعد الزيادة +15%: £150 × 1.15 = £172.50
- VAT (20%): £172.50 × 0.2 = £34.50
- **المجموع: £207** ✅

## الاختبار الفوري 🧪

1. اذهب إلى `/admin/settings/pricing`
2. ضع `-0.2` (خصم 20%)
3. احفظ الإعدادات
4. اذهب إلى `/booking-luxury`
5. أدخل عنوان pickup و dropoff وبعض الأغراض
6. انظر إلى السعر المعروض
7. **السعر يجب أن يكون 20% أقل من السابق** ✅

## Console Logs للتتبع 🔍

عند حساب السعر، ستظهر هذه الرسائل في Console:

```
[PRICING ENGINE] Starting pricing calculation
[PRICING ENGINE] Applied pricing settings { customerAdjustment: '-20%', driverMultiplier: '1x' }
[PRICING ENGINE] Applied customer price adjustment { original: 100, adjusted: 80, adjustment: '-20%' }
💰 Applied pricing settings to dynamic pricing: { customerAdjustment: '-20%', driverMultiplier: '1x' }
💰 Applied customer price adjustment: { original: '£100.00', adjusted: '£80.00', adjustment: '-20%' }
```

## الملفات المعدلة 📁

1. `apps/web/src/lib/pricing/comprehensive-engine.ts` - ✅ إضافة loadPricingSettings + تطبيق التعديل
2. `apps/web/src/lib/pricing/unified-engine.ts` - ✅ إضافة loadPricingSettings + تطبيق التعديل
3. `apps/web/src/lib/services/dynamic-pricing-engine.ts` - ✅ إضافة loadPricingSettings + تطبيق التعديل

## الحالة النهائية ✅

- ✅ تم إضافة تحميل الإعدادات من قاعدة البيانات في الثلاث محركات
- ✅ تم تطبيق التعديل على الأسعار قبل VAT
- ✅ تم إضافة console logs للتتبع والتأكد
- ✅ تم اختبار البناء (build) - لا أخطاء
- ⏳ جاري الانتظار لاختبار المستخدم

## التحقق من التطبيق ✔️

للتأكد من أن الإعدادات تُطبق، افتح Developer Console (F12) عند الحجز وابحث عن:
```
Applied pricing settings
Applied customer price adjustment
```

---

**تاريخ التحديث:** 18 ديسمبر 2025 - 11:30 AM
**الحالة:** ✅ **FIXED - جاهز للاختبار**
