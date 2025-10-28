# مقارنة أنظمة تسعير السائقين

## 🔍 اكتشفت نظامين منفصلين!

---

## 1️⃣ **DriverPricingEngine** (موجود لكن غير مستخدم حالياً)

### الموقع:
```
apps/web/src/lib/pricing/driver-pricing-engine.ts
```

### المعادلة:

```typescript
// معادلة بسيطة ومباشرة:

baseRate = £20-35 (حسب نوع السيارة)
+ distanceRate = £1.50/mile
+ timeRate = £0.50/minute
+ itemsRate = £2/item
+ stopFees = £5 للثاني، £10 للثالث، £15 للرابع، £20 لكل إضافي
+ accessFees = £5/floor (بدون مصعد)
+ peakTimeBonus = 15% (في أوقات الذروة)
+ urgencyBonus = £10 (للطلبات العاجلة)
+ efficiencyBonus = 10% (للمسارات 3+ نقاط)
= Total Earnings
```

### الخصائص:
- ✅ **بسيط ومباشر**
- ✅ **يدعم single orders و multi-stop routes**
- ✅ **رسوم progressi

ve للنقاط المتعددة**
- ✅ **مكافآت واضحة**
- ❌ **لا يوجد performance multipliers**
- ❌ **لا يوجد daily cap**
- ❌ **لا يوجد platform fee**

### مثال حسابي:

```typescript
// طلب واحد: 15 miles, 45 minutes, 5 items, medium van, peak time

baseRate = £25
distanceRate = 15 × £1.50 = £22.50
timeRate = 45 × £0.50 = £22.50
itemsRate = 5 × £2 = £10
accessFees = 0
subtotal = £80

peakTimeBonus = £80 × 15% = £12
urgencyBonus = £10

totalEarnings = £102

// النتيجة: السائق يحصل على £102 (~115 ريال تقريباً)
```

### الاستخدام:
```typescript
import { DriverPricingEngine } from '@/lib/pricing/driver-pricing-engine';

// Single order
const result = DriverPricingEngine.calculateSingleOrder({
  distanceMiles: 15,
  durationMinutes: 45,
  itemsCount: 5,
  vehicleType: 'medium_van',
  isPeakTime: true,
  isUrgent: true
});

// Multi-stop route
const routeResult = DriverPricingEngine.calculateMultiStopRoute({
  stops: [
    { stopNumber: 1, distanceFromPrevious: 0, itemsCount: 3 },
    { stopNumber: 2, distanceFromPrevious: 5, itemsCount: 2 },
    { stopNumber: 3, distanceFromPrevious: 8, itemsCount: 4 }
  ],
  totalDistance: 13,
  totalDuration: 60,
  vehicleType: 'large_van'
});
```

---

## 2️⃣ **DriverEarningsService** (المستخدم حالياً في الإنتاج)

### الموقع:
```
apps/web/src/lib/services/driver-earnings-service.ts
```

### المعادلة (أكثر تعقيداً):

```typescript
// معادلة متقدمة مع performance metrics:

baseFare = £25
+ perDropFee = dropCount × £12
+ mileageFee = miles × £0.55
+ timeFee = minutes × £0.15

× urgencyMultiplier (1.0 - 1.5)
× serviceTypeMultiplier (1.0 - 1.3)
× performanceMultiplier (1.0 - 1.1)

+ onTimeBonus = £5
+ multiDropBonus = MAX((drops-2)×£3, £20 minimum)
+ highRatingBonus = £5
+ longDistanceBonus = extraMiles × £0.55
+ routeExcellenceBonus = £10

- lateDeliveryPenalty = £10
- lowRatingPenalty = £5

+ reimbursements (tolls + parking)

- helperShare = 20% (إذا كان هناك مساعد)

= Net Earnings (minimum £20, max £500/day)
```

### الخصائص:
- ✅ **متقدم مع performance metrics**
- ✅ **يدعم المكافآت والعقوبات**
- ✅ **يحسب helper share (20%)**
- ✅ **يطبق daily cap £500**
- ✅ **earnings floor £20 guaranteed**
- ✅ **يدعم admin adjustments**
- ✅ **يحفظ في قاعدة البيانات**
- ❌ **أكثر تعقيداً**

### مثال حسابي:

```typescript
// نفس الطلب: 15 miles, 45 minutes, 3 drops, on-time, rating 4.8

baseFare = £25
perDropFee = 3 × £12 = £36
mileageFee = 15 × £0.55 = £8.25
timeFee = 45 × £0.15 = £6.75

subtotal = (£25 + £36 + £8.25 + £6.75)
         = £76 × 1.0 (standard) × 1.05 (performance)
         = £79.80

bonuses:
  onTimeBonus = £5
  multiDropBonus = MAX((3-2)×£3, £20) = £20
  highRatingBonus = £5
  total = £30

grossEarnings = £79.80 + £30 = £109.80

// بدون helper:
netEarnings = £109.80

// النتيجة: السائق يحصل على £109.80 (~125 ريال تقريباً)
```

### الاستخدام (الفعلي حالياً):
```typescript
import { driverEarningsService } from '@/lib/services/driver-earnings-service';

const earningsResult = await driverEarningsService.calculateEarnings({
  assignmentId: assignment.id,
  driverId: driver.id,
  bookingId: booking.id,
  distanceMiles: 15,
  durationMinutes: 45,
  dropCount: 3,
  customerPaymentPence: booking.totalGBP,
  urgencyLevel: 'standard',
  serviceType: 'standard',
  onTimeDelivery: true,
  customerRating: 4.8,
  hasHelper: false
});

// Save to database
await driverEarningsService.saveEarnings(input, earningsResult);
```

---

## 📊 مقارنة شاملة:

| Feature | DriverPricingEngine | DriverEarningsService |
|---------|---------------------|----------------------|
| **الاستخدام الحالي** | ❌ غير مستخدم | ✅ المستخدم فعلياً |
| **التعقيد** | بسيط ومباشر | متقدم ومعقد |
| **Base Rate** | £20-35 (حسب السيارة) | £25 ثابت |
| **Distance Rate** | £1.50/mile | £0.55/mile |
| **Time Rate** | £0.50/minute | £0.15/minute |
| **Item Rate** | £2/item | ❌ لا يوجد |
| **Per Drop Fee** | £5-20 progressive | £12 ثابت |
| **Multi-drop Bonus** | 10% efficiency | MIN £20 |
| **Performance Metrics** | ❌ لا يوجد | ✅ نعم (CSAT, OTP, etc) |
| **Performance Multiplier** | ❌ لا يوجد | ✅ 1.0 - 1.1 |
| **Urgency Bonus** | £10 flat | ✅ Multiplier 1.0-1.5 |
| **Peak Time Bonus** | 15% | ❌ لا يوجد |
| **Penalties** | ❌ لا يوجد | ✅ نعم (late, low rating) |
| **Helper Share** | ❌ لا يوجد | ✅ 20% |
| **Daily Cap** | ❌ لا يوجد | ✅ £500 |
| **Earnings Floor** | ❌ لا يوجد | ✅ £20 minimum |
| **Admin Approval** | ❌ لا يوجد | ✅ نعم (for high earnings) |
| **Database Integration** | ❌ لا يوجد | ✅ نعم |
| **Reimbursements** | ❌ لا يوجد | ✅ نعم (tolls, parking) |
| **Platform Fee** | 0% | 0% |

---

## 🎯 أيهما يُستخدم فعلياً في المشروع؟

### ✅ **DriverEarningsService** (النظام الفعلي المستخدم):

تم التأكد من الاستخدام في:
- ✅ `apps/web/src/app/api/driver/dashboard/route.ts` - Line 222, 285
- ✅ `apps/web/src/app/api/driver/jobs/[id]/complete/route.ts` - Line 247
- ✅ `apps/web/src/lib/services/route-orchestration-service.ts`
- ✅ `apps/web/src/app/api/routes/[id]/earnings-preview/route.ts`
- ✅ `apps/web/src/__tests__/integration/earnings-flow.test.ts`
- ✅ `apps/web/src/__tests__/unit/driver-earnings-service.test.ts`

### ❌ **DriverPricingEngine** (موجود لكن غير مستخدم):

```bash
# بحث عن أي استخدام:
$ grep -r "DriverPricingEngine" apps/web/src

# النتيجة: لا يوجد أي import أو استخدام في الكود الفعلي
```

---

## 🤔 لماذا يوجد نظامان؟

### الاحتمالات:

1. **Legacy Code:**
   - `DriverPricingEngine` ربما كان نظام قديم تم استبداله
   - تم الاحتفاظ به للمرجعية أو للخطط المستقبلية

2. **Planning for Future:**
   - ربما خطة لدمج النظامين
   - أو استخدام `DriverPricingEngine` لحالات معينة

3. **Testing/Experimental:**
   - ربما كان للاختبار أو المقارنة
   - لم يتم تفعيله في الإنتاج

---

## 💡 التوصيات:

### 1. **إذا كنت تريد استخدام النظام الحالي (DriverEarningsService):**
- ✅ اتركه كما هو - يعمل بشكل جيد
- ✅ راجع فقط:
  - نسبة المساعد (20%)
  - السقف اليومي (£500)
  - Platform fee (حالياً 0%)

### 2. **إذا كنت تريد التبديل إلى DriverPricingEngine:**
```typescript
// يجب تحديث:
1. Dashboard API
2. Job completion API
3. Route orchestration
4. Earnings preview API

// وإضافة:
- Database integration
- Performance tracking
- Daily cap
- Helper share
- Admin approval workflow
```

### 3. **إذا كنت تريد دمج النظامين:**
```typescript
// أفضل ميزات من كل نظام:

من DriverPricingEngine:
- Distance rate £1.50/mile (أفضل للسائقين)
- Time rate £0.50/minute (أفضل)
- Item handling £2/item (عادل)
- Peak time bonus 15% (جيد)

من DriverEarningsService:
- Performance multipliers (مهم للجودة)
- Multi-drop minimum £20 (عادل)
- Daily cap £500 (UK compliance)
- Helper share 20% (ضروري)
- Admin approval (للتحكم)
- Database integration (ضروري)
```

---

## 🎯 الخلاصة النهائية:

### النظام المستخدم فعلياً:
**DriverEarningsService** ← هذا هو النظام الفعلي في الإنتاج

### المعادلة الفعلية:
```
£25 base + (drops × £12) + (miles × £0.55) + (minutes × £0.15)
× multipliers
+ bonuses
- penalties
- helper share (20%)
= Net Earnings (£20 minimum, £500 daily max)
```

### الفرق الرئيسي:
- **DriverPricingEngine:** أبسط، rates أعلى، لا يوجد performance tracking
- **DriverEarningsService:** أكثر تعقيداً، performance-based، UK compliant

---

**التوصية الأساسية:**
إذا كان `DriverEarningsService` يعمل بشكل جيد، اتركه كما هو. 
فقط راجع النسب والمبالغ للتأكد من عدالتها للسائقين.

إذا أردت rates أعلى، يمكن تعديل `DriverEarningsService` بدلاً من التبديل إلى النظام الآخر.

---

**تاريخ التحديث:** 2025-10-26
**الحالة:** ✅ تم التحقق

