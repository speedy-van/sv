# Multi-Leg Booking System - دليل الاختبار الشامل

## 🎯 السيناريوهات المطلوب اختبارها

### ✅ 1. إنشاء Booking بـ Single Journey (مكتمل)
**الحالة**: يعمل بشكل افتراضي - النظام القديم

**الخطوات**:
1. افتح: http://localhost:3000/booking-luxury
2. املأ Pickup Address
3. املأ Dropoff Address
4. اختر Date/Time
5. أضف Items
6. أكمل Customer Details
7. ادفع

**النتيجة المتوقعة**: 
- Booking يُنشأ بـ `isMultiLeg: false`
- `totalSegments: 1`
- لا توجد segments في جدول BookingSegment

---

### ⏳ 2. إنشاء Booking بـ Outbound + Return

#### الخطوات التفصيلية:

**Step 1: Addresses (صفحة 1)**
1. افتح: http://localhost:3000/booking-luxury
2. املأ Pickup Address:
   - Postcode: `SW1A 1AA` (Buckingham Palace)
   - Street: `Buckingham Palace`
   - City: `London`
3. املأ Dropoff Address:
   - Postcode: `EC4M 7JN` (St Paul's Cathedral)
   - Street: `St Paul's Churchyard`
   - City: `London`
4. املأ Property Details (كلاهما):
   - Type: House
   - Floors: 2
   - Has Lift: No
5. اختر Date/Time: Tomorrow 10:00 AM
6. انقر "Continue"

**في نهاية Step 1 - SegmentManager يظهر**:
7. يجب أن ترى زرين:
   - "Add Return Journey" (أزرق)
   - "Add New Journey" (بنفسجي)
8. انقر "Add Return Journey"
9. يجب أن ترى:
   - Toast notification: "✅ Return journey added"
   - Tabs ظهرت (Segment 1, Segment 2)
   - Segment 1 = Outbound (Badge أخضر)
   - Segment 2 = Return (Badge أزرق)
   - Addresses معكوسة (Pickup ↔ Dropoff)
   - Return datetime = Outbound arrival + 30 minutes

**Step 2: Items**
10. انقر "Continue" للانتقال لـ Step 2
11. يجب أن ترى في الأعلى:
    - Badge أزرق: "2 Journeys"
    - Text: "Items will apply to all segments"
12. أضف Items (مثلاً: Sofa, Table, Chairs)
13. انقر "Continue"

**Step 3: Customer Details & Payment**
14. يجب أن ترى في Booking Summary:
    - "Journey Segments (2)"
    - Card لـ Segment 1: Outbound
      * Route: SW1A 1AA → EC4M 7JN
      * Date/Time
      * Items count
      * Price
    - Card لـ Segment 2: Return
      * Route: EC4M 7JN → SW1A 1AA (معكوس)
      * Date/Time (لاحق بـ 30 دقيقة)
      * Items count
      * Price
    - Service type
15. املأ Customer Details
16. قبل الدفع، افتح Dev Tools (F12):
    ```javascript
    // في Console، راقب network request
    // عند النقر على Pay
    ```

**التحقق من API Request**:
17. في Network tab، ابحث عن POST `/api/booking-luxury`
18. في Request Payload، يجب أن ترى:
```json
{
  "segments": [
    {
      "segmentType": "outbound",
      "sequenceNumber": 0,
      "pickupAddress": { "postcode": "SW1A 1AA", ... },
      "dropoffAddress": { "postcode": "EC4M 7JN", ... },
      "datetime": "2025-12-20T10:00:00Z",
      "items": [...],
      "pricing": { "total": 150 }
    },
    {
      "segmentType": "return",
      "sequenceNumber": 1,
      "pickupAddress": { "postcode": "EC4M 7JN", ... },
      "dropoffAddress": { "postcode": "SW1A 1AA", ... },
      "datetime": "2025-12-20T11:30:00Z",
      "items": [...],
      "pricing": { "total": 150 }
    }
  ],
  "isMultiLeg": true,
  "totalSegments": 2
}
```

**التحقق من Database**:
19. افتح Prisma Studio:
```bash
cd c:\sv\apps\web
pnpm prisma studio
```
20. افتح جدول `Booking`
21. ابحث عن آخر booking
22. تحقق من:
    - `isMultiLeg = true`
    - `totalSegments = 2`
23. افتح جدول `BookingSegment`
24. ابحث عن segments بنفس `bookingId`
25. يجب أن ترى 2 records:
    - Segment 1: `segmentType = 'outbound'`, `sequenceNumber = 0`
    - Segment 2: `segmentType = 'return'`, `sequenceNumber = 1`
26. تحقق من:
    - `pickupAddressId` و `dropoffAddressId` معكوسة بين الـ segments
    - `scheduledAt` للـ return أكبر من outbound
    - `items` JSON متطابق
    - `priceGBP` محفوظ بالـ pence

---

### ⏳ 3. إنشاء Booking بـ Outbound + Return + Additional

**خطوات إضافية بعد السيناريو 2**:

**في Step 1 - بعد إضافة Return**:
1. انقر "Add New Journey" (الزر البنفسجي)
2. يجب أن ترى:
   - Toast: "New journey segment added"
   - Tab جديد: "Segment 3" (Badge بنفسجي)
   - Segment 3 فارغ (no addresses, no items)
3. انقر على Tab "Segment 3"
4. يجب أن ترى:
   - "Route: — → —" (فارغ)
   - "Items: 0 items"
   - "Price: £0.00"
   - Note: "Edit addresses, items, and timing in the main form above"

**ملاحظة مهمة**: 
- Additional segments تُنشأ فارغة
- المستخدم يجب أن يملأها يدوياً في النموذج الرئيسي
- في التطبيق الحالي، لا يوجد UI لتعديل segment معين
- **هذا limitation معروف** - كل segments تشارك نفس الـ items

**التحقق من Database**:
- `totalSegments = 3`
- 3 records في `BookingSegment`:
  * Segment 1: outbound
  * Segment 2: return
  * Segment 3: additional

---

### ⏳ 4. التحقق من حفظ Segments في Database

**SQL Queries للتحقق**:

```sql
-- 1. أحدث booking مع segments
SELECT 
  b.id,
  b.reference,
  b.isMultiLeg,
  b.totalSegments,
  b.customerName,
  b.createdAt
FROM Booking b
WHERE b.isMultiLeg = true
ORDER BY b.createdAt DESC
LIMIT 1;

-- 2. Segments لآخر multi-leg booking
SELECT 
  bs.id,
  bs.segmentType,
  bs.sequenceNumber,
  bs.scheduledAt,
  bs.estimatedArrival,
  bs.priceGBP,
  bs.distanceMeters,
  bs.durationSeconds,
  pickup.postcode as pickupPostcode,
  dropoff.postcode as dropoffPostcode
FROM BookingSegment bs
JOIN Booking b ON bs.bookingId = b.id
JOIN BookingAddress pickup ON bs.pickupAddressId = pickup.id
JOIN BookingAddress dropoff ON bs.dropoffAddressId = dropoff.id
WHERE b.isMultiLeg = true
ORDER BY b.createdAt DESC, bs.sequenceNumber ASC
LIMIT 10;

-- 3. التحقق من Items JSON
SELECT 
  bs.segmentType,
  bs.sequenceNumber,
  bs.items
FROM BookingSegment bs
JOIN Booking b ON bs.bookingId = b.id
WHERE b.reference = 'YOUR_BOOKING_REFERENCE'
ORDER BY bs.sequenceNumber;

-- 4. التحقق من Chronology
SELECT 
  bs.sequenceNumber,
  bs.segmentType,
  bs.scheduledAt,
  bs.estimatedArrival,
  EXTRACT(EPOCH FROM (bs.scheduledAt - LAG(bs.estimatedArrival) OVER (ORDER BY bs.sequenceNumber))) as gap_seconds
FROM BookingSegment bs
WHERE bs.bookingId = 'YOUR_BOOKING_ID'
ORDER BY bs.sequenceNumber;
```

**استخدام Prisma Studio**:
1. `cd c:\sv\apps\web`
2. `pnpm prisma studio`
3. افتح: http://localhost:5555
4. Navigate:
   - Booking table → Filter `isMultiLeg = true`
   - BookingSegment table → Filter by `bookingId`
5. تحقق من Relations:
   - Click على segment → ترى pickup/dropoff addresses
   - Click على booking → ترى all segments

---

### ⏳ 5. التحقق من Validation Errors Display

#### السيناريو أ: Chronology Validation

**الخطوات**:
1. افتح booking-luxury
2. أضف outbound journey:
   - Date: Tomorrow 10:00 AM
   - Estimated arrival: 11:00 AM
3. أضف return journey (auto-calculated: 11:30 AM)
4. في Dev Tools Console:
```javascript
// محاكاة تعديل return datetime ليكون قبل outbound arrival
const formData = {
  step1: {
    segments: [
      { datetime: '2025-12-20T10:00:00Z', estimatedArrival: '2025-12-20T11:00:00Z' },
      { datetime: '2025-12-20T10:30:00Z', estimatedArrival: '2025-12-20T11:30:00Z' } // خطأ!
    ]
  }
};
```
5. انقر "Show Validation"
6. يجب أن ترى:
   - Alert أحمر
   - "Segment 2 must start after Segment 1 ends (11:00 AM)"

#### السيناريو ب: Required Fields Validation

**الخطوات**:
1. أضف return journey
2. لا تملأ addresses (اترك الـ main form فارغ)
3. في SegmentManager:
   - انقر "Show Validation"
4. يجب أن ترى Errors:
   - "Segment 1: Pickup postcode required"
   - "Segment 1: Dropoff postcode required"
   - "Segment 1: Date/time required"
   - "Segment 1: At least 1 item required"
   - (نفس الأخطاء للـ Segment 2)

#### السيناريو ج: Cannot Remove Last Segment

**الخطوات**:
1. أضف return journey (2 segments)
2. احذف Segment 2 (يعمل)
3. حاول حذف Segment 1 (الأخير)
4. يجب أن ترى:
   - Toast warning: "Cannot remove the last segment"
   - Segment 1 لا يُحذف

#### السيناريو د: Cannot Add Return Without Addresses

**الخطوات**:
1. افتح booking-luxury جديد
2. لا تملأ أي addresses
3. انقر "Add Return Journey"
4. يجب أن ترى:
   - Toast warning: "Please complete the outbound journey first"
   - لا يُضاف return segment

---

## 🧪 استخدام Browser Dev Tools

### 1. Network Inspection

```javascript
// في Console، راقب API calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  if (args[0].includes('/api/booking-luxury')) {
    console.log('📤 Booking API Request:', {
      url: args[0],
      body: args[1]?.body ? JSON.parse(args[1].body) : null
    });
  }
  const response = await originalFetch(...args);
  if (args[0].includes('/api/booking-luxury')) {
    const clone = response.clone();
    console.log('📥 Booking API Response:', await clone.json());
  }
  return response;
};
```

### 2. FormData Inspection

```javascript
// في Console، اطبع formData
const formDataDiv = document.querySelector('[data-form-data]');
if (formDataDiv) {
  const formData = JSON.parse(formDataDiv.textContent);
  console.log('📋 Form Data:', formData);
  console.log('🎯 Segments:', formData.step1?.segments);
}
```

### 3. Validation Testing

```javascript
// في Console، اختبر validation
const validateSegments = () => {
  // استدعِ الـ validation function من الـ component
  // (يحتاج React DevTools للوصول)
};
```

---

## 📊 Expected Database State

### After Single Journey Booking:
```
Booking:
  id: "abc123"
  isMultiLeg: false
  totalSegments: 1
  
BookingSegment: (empty - no records)
```

### After Outbound + Return Booking:
```
Booking:
  id: "def456"
  isMultiLeg: true
  totalSegments: 2
  
BookingSegment:
  [
    {
      id: "seg1",
      bookingId: "def456",
      segmentType: "outbound",
      sequenceNumber: 0,
      pickupAddressId: "addr1",
      dropoffAddressId: "addr2",
      scheduledAt: "2025-12-20T10:00:00Z",
      estimatedArrival: "2025-12-20T11:00:00Z",
      items: [...],
      priceGBP: 15000
    },
    {
      id: "seg2",
      bookingId: "def456",
      segmentType: "return",
      sequenceNumber: 1,
      pickupAddressId: "addr3", // same postcode as addr2
      dropoffAddressId: "addr4", // same postcode as addr1
      scheduledAt: "2025-12-20T11:30:00Z",
      estimatedArrival: "2025-12-20T12:30:00Z",
      items: [...],
      priceGBP: 15000
    }
  ]
```

---

## 🐛 Known Issues & Limitations

### 1. **Items Sharing**
- **المشكلة**: كل segments تشارك نفس الـ items
- **التأثير**: لا يمكن تحديد items مختلفة لكل segment
- **الحل المستقبلي**: إضافة UI لتعديل items per segment

### 2. **Datetime Editing**
- **المشكلة**: لا يمكن تعديل datetime لـ segment معين بعد الإنشاء
- **التأثير**: Return datetime محسوب تلقائياً فقط
- **الحل المستقبلي**: إضافة datetime picker لكل segment

### 3. **Segment Address Editing**
- **المشكلة**: لا يوجد UI لتعديل addresses لـ additional segments
- **التأثير**: Additional segments تبقى فارغة
- **الحل المستقبلي**: إضافة form لكل segment

### 4. **Pricing Per Segment**
- **الحالة**: يعمل - لكن يعتمد على main pricing engine
- **التحسين المستقبلي**: حساب pricing مستقل لكل segment

---

## ✅ Checklist للاختبار الكامل

### Frontend:
- [ ] SegmentManager يظهر في Step 1
- [ ] "Add Return Journey" يعمل
- [ ] "Add New Journey" يعمل
- [ ] Tabs navigation يعمل
- [ ] Color-coded badges صحيحة
- [ ] Remove segment يعمل
- [ ] Show/Hide validation يعمل
- [ ] Validation errors تظهر بشكل صحيح
- [ ] Total price يُحسب بشكل صحيح
- [ ] Step 2 badge يظهر segment count
- [ ] Step 3 review table يعرض all segments

### Backend:
- [ ] API يقبل segments[] array
- [ ] Booking يُنشأ بـ isMultiLeg: true
- [ ] totalSegments صحيح
- [ ] BookingSegment records تُنشأ
- [ ] Addresses منفصلة لكل segment
- [ ] Property details منفصلة
- [ ] Items JSON محفوظ
- [ ] Prices بالـ pence
- [ ] SequenceNumber صحيح
- [ ] Relations تعمل (booking ↔ segments)

### Database:
- [ ] Booking.isMultiLeg = true
- [ ] Booking.totalSegments = N
- [ ] BookingSegment table بها N records
- [ ] pickupAddressId ≠ dropoffAddressId
- [ ] Return segment: addresses معكوسة
- [ ] scheduledAt في ترتيب زمني
- [ ] Indexes تعمل

### Validation:
- [ ] Chronology validation يكشف الأخطاء
- [ ] Required fields validation يعمل
- [ ] Cannot remove last segment
- [ ] Cannot add return without addresses
- [ ] Toast notifications تظهر

---

## 🚀 Quick Test Script

```bash
# 1. Start dev server
cd c:\sv\apps\web
pnpm run dev

# 2. Open Prisma Studio (terminal جديد)
cd c:\sv\apps\web
pnpm prisma studio

# 3. Open browser
start http://localhost:3000/booking-luxury

# 4. في Dev Tools Console:
# راقب network requests
# اطبع formData
# اختبر validation
```

---

## 📝 Test Report Template

```markdown
### Test: Outbound + Return Booking

**Date**: 2025-12-19
**Tester**: [Your Name]

**Steps Completed**:
- [x] Added outbound journey
- [x] Clicked "Add Return Journey"
- [x] Verified return addresses mirrored
- [x] Completed booking
- [x] Checked database

**Results**:
- Frontend: ✅ Tabs showed correctly
- Backend: ✅ Segments saved to database
- Database: ✅ isMultiLeg = true, totalSegments = 2

**Issues Found**:
- None

**Screenshots**:
- [Attach screenshots]

**Database Records**:
```sql
SELECT * FROM Booking WHERE reference = 'BOOKING-123';
SELECT * FROM BookingSegment WHERE bookingId = 'abc123';
```
```

---

## 🎓 إرشادات الاختبار

### للمبتدئين:
1. ابدأ بالسيناريو البسيط (single journey)
2. انتقل للـ return journey
3. اختبر validation errors
4. تحقق من database

### للمتقدمين:
1. استخدم Browser Dev Tools
2. راقب Network requests
3. اختبر Edge cases
4. اكتب Automated tests

### للخبراء:
1. اختبر Performance (100 segments)
2. اختبر Concurrent requests
3. اختبر Database transactions
4. راجع Security implications

---

**ملاحظة نهائية**: النظام جاهز للاختبار! ابدأ من السيناريو 2 واستخدم هذا الدليل كمرجع. 🚀
