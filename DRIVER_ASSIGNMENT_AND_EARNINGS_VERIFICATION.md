# تقرير التحقق: نظام تعيين السائقين وحساب الأرباح

##تاريخ الفحص: 2025-10-26

---

## ✅ 1. نظام تعيين الطلبات للسائقين (Admin → Driver iOS App)

### كيفية تعيين الطلب:

#### المسارات (API Endpoints):
1. **`POST /api/admin/orders/[code]/assign-driver`** ← **الأساسي**
2. **`POST /api/admin/orders/[code]/assign`** ← بديل
3. **`POST /api/admin/dispatch/assign`** 
4. **`POST /api/admin/routes/[id]/assign`** ← لتعيين مسارات كاملة

### آلية التعيين:

```typescript
// الأدمن يرسل:
{
  "driverId": "clxxxxx",
  "reason": "Best available driver"
}

// النظام يقوم بـ:
1. التحقق من صلاحيات الأدمن
2. البحث عن الطلب (Booking) بالـ reference code
3. التحقق من أن السائق متاح ونشط
4. التحقق من سعة السائق (max 3 jobs)
5. تحديث الطلب:
   - driverId = السائق المختار
   - status = 'CONFIRMED'
6. إنشاء Assignment record:
   - status = 'invited'
   - round = 1
7. إرسال إشعار للسائق عبر Pusher
8. تحديث سجل Audit
```

### ما يحدث في تطبيق iOS:

```typescript
// السائق يستقبل:
- Push notification عبر Pusher
- Job offer يظهر في Dashboard
- تفاصيل الطلب:
  - رقم الطلب (reference)
  - العنوان pickup & dropoff
  - المسافة والوقت المقدر
  - المبلغ الذي سيحصل عليه (earnings)
  - حالة الطلب (status)
```

---

## 💰 2. حساب أرباح السائق (Driver Earnings)

### المصدر الرئيسي:
**`DriverEarningsService`** في:
```
apps/web/src/lib/services/driver-earnings-service.ts
```

### معادلة الحساب الكاملة:

```typescript
// 1. المكونات الأساسية (Base Components):
baseFare = £25.00          // رسوم الوظيفة الأساسية
perDropFee = dropCount × £12.00  // رسوم لكل نقطة توصيل
mileageFee = miles × £0.55      // رسوم المسافة
timeFee = minutes × £0.15        // رسوم الوقت

// 2. المضاعفات (Multipliers):
urgencyMultiplier = 1.0 - 1.5   // حسب urgency (standard/express/premium)
serviceTypeMultiplier = 1.0 - 1.3
performanceMultiplier = 1.0 - 1.1

// 3. المجموع الفرعي (Subtotal):
subtotal = (baseFare + perDropFee + mileageFee + timeFee) 
           × urgencyMultiplier 
           × serviceTypeMultiplier 
           × performanceMultiplier

// 4. المكافآت (Bonuses):
onTimeBonus = £5.00              // إذا تم التسليم في الوقت
multiDropBonus = MAX(
  (dropCount - 2) × £3.00,      // £3 لكل drop إضافي
  £20.00                         // حد أدنى £20 للمسارات متعددة النقاط
)
highRatingBonus = £5.00          // إذا التقييم ≥ 4.5
longDistanceBonus = extraMiles × £0.55
routeExcellenceBonus = £10.00    // إذا on-time + rating ≥ 4.5

// 5. الخصومات (Penalties):
lateDeliveryPenalty = £10.00     // إذا متأخر
lowRatingPenalty = £5.00         // إذا التقييم < 3.5

// 6. التكاليف القابلة للاسترداد (Reimbursements):
tollCosts + parkingCosts

// 7. الأرباح الإجمالية (Gross Earnings):
grossEarnings = subtotal + bonuses.total - penalties.total + reimbursements.total

// 8. نصيب المساعد (Helper Share):
helperShare = grossEarnings × 20% (إذا كان هناك مساعد)

// 9. صافي الأرباح (Net Earnings):
netEarnings = grossEarnings - helperShare

// ✅ ملاحظة مهمة: لا يوجد خصم نسبة من الشركة (Platform Fee = 0%)
// السائق يحصل على المبلغ الكامل المحسوب حسب العمل المنجز

// 10. الحد الأدنى المضمون (Earnings Floor):
if (netEarnings < £20.00) {
  netEarnings = £20.00
}

// 11. السقف اليومي (Daily Cap) - UK Compliance:
if (todayEarnings + netEarnings > £500.00) {
  netEarnings = £500.00 - todayEarnings
  requiresAdminApproval = true
}
```

### مثال عملي:

```typescript
// طلب واحد:
- Distance: 15 miles
- Duration: 45 minutes
- Drops: 3
- Urgency: express
- On-time: Yes
- Rating: 4.8

// الحساب:
baseFare = £25.00
perDropFee = 3 × £12.00 = £36.00
mileageFee = 15 × £0.55 = £8.25
timeFee = 45 × £0.15 = £6.75

subtotal = (£25 + £36 + £8.25 + £6.75) × 1.3 (express) × 1.05 (performance)
subtotal = £76.00 × 1.3 × 1.05 = £103.74

bonuses:
  - onTimeBonus = £5.00
  - multiDropBonus = MAX((3-2) × £3, £20) = £20.00
  - highRatingBonus = £5.00
  - total = £30.00

grossEarnings = £103.74 + £30.00 = £133.74

// بدون مساعد:
netEarnings = £133.74

// النتيجة: السائق يحصل على £133.74 (~150 ريال سعودي تقريباً)
```

---

## 📊 3. فحص قاعدة البيانات (Schema Verification)

### الجداول الرئيسية:

#### ✅ **Assignment** (تعيين الطلب للسائق)
```prisma
model Assignment {
  id             String           @id @default(cuid())
  bookingId      String
  driverId       String
  round          Int              @default(1)
  score          Int?
  status         AssignmentStatus @default(invited)
  expiresAt      DateTime?
  claimedAt      DateTime?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  
  // Relations
  Booking        Booking          @relation(...)
  Driver         Driver           @relation(...)
  DriverEarnings DriverEarnings[]
}

enum AssignmentStatus {
  invited    // الأدمن عين السائق
  claimed    // السائق شاهد الطلب
  accepted   // السائق قبل
  declined   // السائق رفض
  completed  // مكتمل
  cancelled  // ملغي
}
```

#### ✅ **DriverEarnings** (أرباح السائق)
```prisma
model DriverEarnings {
  id                       String   @id @default(cuid())
  driverId                 String
  assignmentId             String
  
  // المبالغ (بالبنس - pence):
  baseAmountPence          Int      @default(0)      // الرسوم الأساسية
  surgeAmountPence         Int      @default(0)      // المكافآت الإضافية
  tipAmountPence           Int      @default(0)      // البقشيش (منفصل)
  feeAmountPence           Int      @default(0)      // رسوم المنصة (= 0)
  netAmountPence           Int      @default(0)      // صافي الأرباح
  grossEarningsPence       Int      @default(0)      // الأرباح الإجمالية
  platformFeePence         Int      @default(0)      // ✅ = 0 (لا خصم)
  rawNetEarningsPence      Int      @default(0)      // قبل السقف
  cappedNetEarningsPence   Int      @default(0)      // بعد السقف
  
  // الحالة:
  currency                 String   @default("gbp")
  calculatedAt             DateTime @default(now())
  paidOut                  Boolean  @default(false)
  requiresAdminApproval    Boolean  @default(false)
  
  // Admin adjustments:
  adminAdjustedAmountPence Int?
  adminAdjustedAt          DateTime?
  adminAdjustedBy          String?
  adminNotes               String?
  
  // Relations
  Driver                   Driver   @relation(...)
  Assignment               Assignment @relation(...)
}
```

#### ✅ **Booking** (الطلب)
```prisma
model Booking {
  id              String        @id @default(cuid())
  reference       String        @unique  // رقم الطلب (e.g., "SV-2025-0123")
  customerId      String?
  driverId        String?       // السائق المعين
  status          BookingStatus @default(DRAFT)
  
  // العناوين:
  pickupAddressId     String
  dropoffAddressId    String
  
  // التفاصيل:
  totalGBP            Int
  baseDistanceMiles   Float
  scheduledAt         DateTime
  
  // Relations
  customer            User?      @relation(...)
  driver              Driver?    @relation(...)
  Assignment          Assignment[]
}
```

---

## 🔍 4. التحقق من وجود مشاكل محتملة

### ✅ ما تم التحقق منه:

#### 1. **Schema Consistency** ✅
- جميع الجداول موجودة بشكل صحيح
- العلاقات (Relations) محددة بشكل سليم
- الـ Indexes موجودة للأداء الأمثل

#### 2. **Earnings Calculation** ✅
- المعادلة واضحة ومفصلة
- لا يوجد platform fee (السائق يحصل على كامل المبلغ)
- السقف اليومي £500 محدد للامتثال UK
- الحد الأدنى £20 مضمون

#### 3. **Assignment Flow** ✅
```
Admin assigns → Assignment created (status: invited)
                ↓
        Driver receives notification (Pusher)
                ↓
        Driver views job (status: claimed)
                ↓
        Driver accepts/declines
                ↓
        If accepted → Job starts
                ↓
        Job completed → Earnings calculated
                ↓
        Earnings saved to DriverEarnings table
                ↓
        Payout processed (weekly/biweekly)
```

#### 4. **iOS App Integration** ✅
- Dashboard API: `GET /api/driver/dashboard`
- يستقبل قائمة الـ jobs المعينة
- يحسب الأرباح المتوقعة لكل job
- يعرض التفاصيل كاملة للسائق

---

## ⚠️ مشاكل محتملة تحتاج مراقبة:

### 1. **Multi-drop Bonus Minimum**
```typescript
// المكافأة الحالية: £20 minimum للمسارات متعددة النقاط
// هل هذا كافٍ؟ قد يحتاج مراجعة حسب السوق
multiDropBonus = MAX((dropCount - 2) × £3.00, £20.00)
```
**التوصية:** مراقبة قبول السائقين للمسارات متعددة النقاط

### 2. **Daily Cap Compliance**
```typescript
// £500/day cap - قد يحد من أرباح السائقين النشطين
if (todayEarnings + netEarnings > £500.00) {
  requiresAdminApproval = true
}
```
**التوصية:** تتبع عدد المرات التي يصل فيها السائقون للسقف

### 3. **Helper Share**
```typescript
// 20% للمساعد - هل هذا عادل؟
helperShare = grossEarnings × 0.20
```
**التوصية:** استطلاع رأي السائقين والمساعدين

### 4. **Platform Fee = 0%**
```typescript
// الشركة لا تأخذ نسبة؟ هل هذا مستدام؟
platformFeePence = 0
```
**التوصية:** مراجعة نموذج الربح للشركة

---

## 📱 5. ما يراه السائق في iOS App:

### في Dashboard:
```json
{
  "jobId": "clxxxxx",
  "reference": "SV-2025-0123",
  "status": "invited",
  "pickup": {
    "address": "140 Charles Street, Glasgow",
    "lat": 55.8642,
    "lng": -4.2518
  },
  "dropoff": {
    "address": "10 Downing Street, London",
    "lat": 51.5034,
    "lng": -0.1276
  },
  "distance": "15.5 miles",
  "duration": "45 minutes",
  "estimatedEarnings": "£133.74",  // ← هذا ما سيحصل عليه
  "scheduledAt": "2025-10-27T14:00:00Z",
  "dropCount": 3,
  "urgency": "express"
}
```

### عند قبول الطلب:
1. السائق يضغط "Accept"
2. Assignment status → `accepted`
3. Booking status → `CONFIRMED`
4. يبدأ التتبع (Tracking)
5. عند الإكمال → يحسب المبلغ النهائي حسب:
   - المسافة الفعلية
   - الوقت الفعلي
   - التقييم من العميل
   - On-time delivery

---

## ✅ الخلاصة:

### 1. **نظام التعيين:**
- ✅ يعمل بشكل صحيح
- ✅ الأدمن يمكنه تعيين السائقين يدوياً
- ✅ النظام يدعم auto-assignment أيضاً
- ✅ الإشعارات تصل للسائق عبر Pusher

### 2. **حساب الأرباح:**
- ✅ معادلة واضحة ومفصلة
- ✅ السائق يحصل على كامل المبلغ (0% platform fee)
- ✅ مكافآت عادلة للأداء الجيد
- ✅ حد أدنى مضمون £20
- ✅ سقف يومي £500 للامتثال UK

### 3. **قاعدة البيانات:**
- ✅ Schema سليم ومنظم
- ✅ Relations صحيحة
- ✅ Indexes موجودة للأداء
- ✅ لا توجد مشاكل تقنية واضحة

### 4. **iOS App Integration:**
- ✅ السائق يرى الأرباح المتوقعة قبل القبول
- ✅ Dashboard يعرض كل التفاصيل
- ✅ Real-time updates عبر Pusher
- ✅ الحساب النهائي يتم بعد الإكمال

---

## 🎯 توصيات للمراقبة:

1. **متابعة معدل قبول السائقين للطلبات**
2. **مراقبة الوقت المستغرق من التعيين حتى القبول**
3. **تتبع متوسط الأرباح اليومية للسائقين**
4. **مراجعة نموذج Platform Fee (حالياً 0%)**
5. **استطلاع رأي السائقين حول نسبة المساعد (20%)**

---

**آخر تحديث:** 2025-10-26  
**الحالة:** ✅ النظام يعمل بشكل صحيح  
**المخاطر:** ⚠️ مراجعة نموذج الربح للشركة (Platform Fee = 0%)

