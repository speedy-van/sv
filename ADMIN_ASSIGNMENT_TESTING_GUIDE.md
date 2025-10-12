# 🧪 دليل اختبار نظام تعيين المشرف - Admin Assignment Testing Guide

**التاريخ:** 10 يناير 2025  
**الإصدار:** 2.0.0  
**الحالة:** ✅ جاهز للاختبار

---

## 📋 نظرة عامة / Overview

هذا الدليل الشامل لاختبار نظام تعيين المشرف المرن الذي يدعم:
1. ✅ تعيين طلبات فردية (Individual Orders)
2. ✅ تعيين مسارات كاملة (Full Routes)

كلا النوعين يُطلقان **نفس الإشعارات** للسائق مع نفس التجربة (صوت + modal + تحديث تلقائي).

---

## ✅ ما تم إصلاحه / What Was Fixed

### المشاكل السابقة:
1. ❌ Routes Dashboard كان يستخدم API قديم (PATCH)
2. ❌ لا يوجد زر "Assign Driver" للمسارات الجديدة
3. ❌ لا يُرسل `reason` للتعيين

### التحديثات المطبقة:
1. ✅ `handleReassignDriver` الآن يستخدم `/api/admin/routes/[id]/reassign`
2. ✅ أضفنا `handleAssignDriver` جديد يستخدم `/api/admin/routes/[id]/assign`
3. ✅ زر "Assign Driver" يظهر للمسارات غير المُعينة
4. ✅ Modal محدّث يدعم كلا النوعين (assign + reassign)
5. ✅ حقل `reason` مضاف للمشرف

---

## 🧪 خطة الاختبار / Testing Plan

### الاختبار 1: تعيين طلب فردي (Individual Order)

#### الخطوات:
1. افتح Admin Panel → Orders
2. اضغط على أي طلب
3. في OrderDetailDrawer، اضغط "Assign Driver"
4. اختر سائق من القائمة
5. (اختياري) أدخل سبب التعيين
6. اضغط "Assign Driver"

#### النتيجة المتوقعة:
```
✅ Backend:
- POST /api/admin/orders/[code]/assign-driver
- يُحدّث Booking.driverId
- يُنشئ Assignment جديد
- يُنشئ JobEvent
- يُنشئ AuditLog

✅ Pusher Events:
- pusher.trigger('driver-{driverId}', 'route-matched', {
    type: 'single-order',
    bookingId: ...,
    bookingReference: ...,
    ...
  })
- pusher.trigger('driver-{driverId}', 'job-assigned', {...})

✅ Driver (Web Portal):
- 🔔 Console: "🎯🎯🎯 ROUTE MATCHED via Pusher (Web)"
- 🎵 صوت تنبيه يُشغل
- 📱 Modal "New Route Matched!" يظهر
- 🔔 Toast notification "New job: SV-2024-001"
- 🔄 Dashboard يتحدّث تلقائيًا

✅ Driver (React Native):
- 🔔 Console: "🎯🎯🎯 ROUTE MATCHED EVENT RECEIVED!"
- 🎵 صوت تنبيه يُشغل
- 📱 Modal "New Route Matched!" يظهر
- 🔄 Dashboard يتحدّث تلقائيًا

✅ Admin:
- Toast: "Driver Assigned Successfully"
- Order details تتحدّث لتعرض السائق المُعين
```

---

### الاختبار 2: تعيين مسار كامل لأول مرة (First-time Route Assignment)

#### الخطوات:
1. افتح Admin Panel → Routes
2. ابحث عن مسار بحالة "planned" أو "Unassigned"
3. اضغط القائمة (⋮) → "Assign Driver"
4. اختر سائق من القائمة
5. أدخل سبب التعيين (مثلاً: "Best route for driver's area")
6. اضغط "Assign Driver"

#### النتيجة المتوقعة:
```
✅ Backend:
- POST /api/admin/routes/[id]/assign
- يُحدّث Route.driverId
- يُحدّث Route.status → 'assigned'
- يُحدّث جميع Bookings في المسار
- يُنشئ Assignment لكل booking
- يُنشئ JobEvent لكل booking
- يُنشئ AuditLog

✅ Pusher Events:
- pusher.trigger('driver-{driverId}', 'route-matched', {
    type: 'full-route',
    routeId: ...,
    bookingsCount: 5,
    dropsCount: 8,
    totalDistance: 24.5,
    totalEarnings: 12500,
    drops: [...],
    ...
  })
- pusher.trigger('driver-{driverId}', 'job-assigned', {
    type: 'route',
    ...
  })

✅ Driver (Web Portal):
- 🔔 Console: "🎯🎯🎯 ROUTE MATCHED via Pusher (Web)"
- 🎵 صوت تنبيه يُشغل
- 📱 Modal "New Route Matched!" يظهر
- 🔔 Toast notification "New route with 5 jobs"
- 🔄 Dashboard يتحدّث تلقائيًا
- 💰 Modal يعرض: "£125.00" estimated earnings

✅ Driver (React Native):
- 🔔 Console: "🎯🎯🎯 ROUTE MATCHED EVENT RECEIVED!"
- 🎵 صوت تنبيه يُشغل
- 📱 Modal "New route with 5 jobs assigned to you"
- 🔄 Dashboard يتحدّث تلقائيًا

✅ Admin:
- Toast: "Route with 5 jobs assigned successfully"
- Routes table تتحدّث
- المسار الآن يعرض اسم السائق بدلاً من "Unassigned"
- زر "Assign Driver" يتحول إلى "Reassign Driver"
```

---

### الاختبار 3: إعادة تعيين مسار موجود (Route Reassignment)

#### الخطوات:
1. افتح Admin Panel → Routes
2. ابحث عن مسار مُعين لسائق
3. اضغط القائمة (⋮) → "Reassign Driver"
4. Modal يعرض: "Current Driver: [Name]"
5. اختر سائق جديد من القائمة
6. أدخل سبب إعادة التعيين (مثلاً: "Driver 1 unavailable - urgent")
7. اضغط "Reassign Driver"

#### النتيجة المتوقعة:
```
✅ Backend:
- POST /api/admin/routes/[id]/reassign
- يُحدّث Route.driverId → السائق الجديد
- يُلغي جميع Assignments القديمة
- يُنشئ Assignments جديدة
- يُنشئ JobEvents (removed + assigned)
- يُنشئ AuditLog

✅ Pusher Events (للسائق القديم):
- pusher.trigger('driver-{oldDriverId}', 'route-removed', {
    routeId: ...,
    reason: "Driver 1 unavailable - urgent",
    message: "A route has been removed from your assignments"
  })

✅ Pusher Events (للسائق الجديد):
- pusher.trigger('driver-{newDriverId}', 'route-matched', {
    type: 'full-route',
    routeId: ...,
    bookingsCount: 5,
    ...
  })
- pusher.trigger('driver-{newDriverId}', 'job-assigned', {...})

✅ Old Driver (Web Portal):
- 🔔 Console: "❌ ROUTE REMOVED via Pusher (Web)"
- ⚠️ Toast warning: "Route Removed - Driver 1 unavailable - urgent"
- 🔄 Dashboard يتحدّث (المسار يختفي من قائمته)

✅ New Driver (Web Portal):
- 🔔 Console: "🎯🎯🎯 ROUTE MATCHED via Pusher (Web)"
- 🎵 صوت تنبيه يُشغل
- 📱 Modal "New Route Matched!"
- 🔄 Dashboard يتحدّث (المسار يظهر في قائمته)

✅ Admin:
- Toast: "Route with 5 jobs reassigned successfully to [New Driver Name]"
- Routes table تتحدّث
- المسار الآن يعرض السائق الجديد
```

---

## 🎯 سيناريوهات الاختبار المتقدمة / Advanced Test Scenarios

### السيناريو 4: إعادة تعيين طلب فردي

**الخطوات:**
1. عيّن طلب لسائق (من OrderDetailDrawer)
2. في نفس الصفحة، اضغط "Reassign Driver"
3. اختر سائق آخر
4. أدخل سبب (مثلاً: "Customer requested different driver")
5. اضغط "Reassign Driver"

**النتيجة:**
- السائق القديم لا يتلقى `route-removed` (فقط للمسارات)
- السائق الجديد يتلقى `route-matched` + `job-assigned`

---

### السيناريو 5: تعيين متعدد سريع (Rapid Assignment)

**الخطوات:**
1. عيّن 3 طلبات مختلفة لنفس السائق بسرعة (خلال 10 ثواني)

**النتيجة المتوقعة:**
- ✅ السائق يتلقى 3 أحداث `route-matched` منفصلة
- ✅ كل حدث يُشغل صوت منفصل
- ✅ 3 modals تظهر (أو متتالية)
- ✅ Dashboard يتحدّث 3 مرات

---

### السيناريو 6: تعيين بدون سائقين متاحين

**الخطوات:**
1. تأكد أن جميع السائقين offline
2. حاول تعيين طلب/مسار

**النتيجة:**
- ❌ Modal تعرض: "No available drivers"
- أو: القائمة فارغة
- لا يمكن إتمام التعيين

---

### السيناريو 7: إلغاء modal التعيين

**الخطوات:**
1. افتح modal "Assign Driver"
2. اختر سائق
3. أدخل سبب
4. اضغط "Cancel"

**النتيجة:**
- Modal تُغلق
- لا يتم إرسال أي API request
- لا يتغير أي شيء

---

## 📊 جدول اختبار النتائج / Test Results Table

| Test Case | Backend API | Pusher Events | Driver UI | Admin UI | Status |
|-----------|-------------|---------------|-----------|----------|--------|
| 1. Assign Individual Order | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending |
| 2. Assign Full Route (First Time) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending |
| 3. Reassign Route | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending |
| 4. Reassign Individual Order | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending |
| 5. Rapid Assignment (3 jobs) | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ Pending |
| 6. No Available Drivers | ⬜ | N/A | N/A | ⬜ | ⬜ Pending |
| 7. Cancel Assignment Modal | N/A | N/A | N/A | ⬜ | ⬜ Pending |

**Legend:**
- ⬜ Pending (لم يُختبر بعد)
- ✅ Pass (نجح)
- ❌ Fail (فشل)
- 🟡 Partial (جزئي)
- N/A (لا ينطبق)

---

## 🔍 نقاط التحقق / Verification Checklist

### أثناء الاختبار، تحقق من:

#### Backend:
- [ ] API response returns `success: true`
- [ ] Response contains correct data structure
- [ ] Database updated correctly (check via Prisma Studio)
- [ ] Assignment created with correct status
- [ ] JobEvent created with correct payload
- [ ] AuditLog created with actor, action, details

#### Pusher:
- [ ] `route-matched` event sent to correct driver channel
- [ ] Event payload contains all required fields
- [ ] Event payload `type` is correct ('single-order' or 'full-route')
- [ ] `job-assigned` event sent for backward compatibility

#### Driver UI (Web Portal):
- [ ] Console shows "🎯🎯🎯 ROUTE MATCHED via Pusher (Web)"
- [ ] Notification sound plays
- [ ] Modal appears with correct title and message
- [ ] Toast notification shows correct text
- [ ] Dashboard data refreshes automatically
- [ ] New job/route appears in list

#### Driver UI (React Native):
- [ ] Console shows "🎯🎯🎯 ROUTE MATCHED EVENT RECEIVED!"
- [ ] Notification sound plays
- [ ] Modal appears with correct title
- [ ] Dashboard data refreshes automatically
- [ ] New job/route appears in list

#### Admin UI:
- [ ] Toast shows success message
- [ ] Order/Route details refresh automatically
- [ ] Driver name appears in UI
- [ ] Button changes from "Assign" to "Reassign" (for routes)
- [ ] No console errors

---

## 🐛 الأخطاء المحتملة / Potential Issues

### إذا لم يعمل الاختبار:

#### 1. السائق لا يتلقى إشعار

**الأسباب المحتملة:**
- Pusher credentials خاطئة
- Driver ID غير صحيح في session/storage
- Pusher لم يتصل (check console: "✅ Pusher connected")
- Channel subscription فشل

**الحل:**
```javascript
// Check console for:
🔌 Initializing Pusher...
✅ Pusher connected successfully
📡 Subscribed to channel: driver-{driverId}
```

---

#### 2. API يعيد خطأ "Driver not available"

**السبب:**
- حالة السائق ليست `AVAILABLE` أو `online`

**الحل:**
```sql
-- Check driver status:
SELECT id, status FROM "DriverAvailability" WHERE driverId = 'driver_123';

-- Update if needed:
UPDATE "DriverAvailability" 
SET status = 'AVAILABLE' 
WHERE driverId = 'driver_123';
```

---

#### 3. Modal لا يظهر للسائق

**الأسباب:**
- `isNotificationOpen` state لم يتحدّث
- Modal handler لم يُستدعى
- Pusher event لم يُستلم

**الحل:**
```javascript
// Add debug logs:
channel.bind('route-matched', (data: any) => {
  console.log('🎯 ROUTE MATCHED:', data);
  console.log('📱 Opening modal...');
  onNotificationOpen();
});
```

---

#### 4. صوت التنبيه لا يُشغل

**الأسباب:**
- ملف `/public/sounds/notification.mp3` مفقود
- Browser autoplay policy يمنع الصوت
- Audio permissions مرفوضة

**الحل:**
```javascript
// Test sound manually:
const audio = new Audio('/sounds/notification.mp3');
audio.play().catch(err => console.error('Audio error:', err));
```

---

## 🎯 معايير النجاح / Success Criteria

### ✅ الاختبار يُعتبر ناجحاً إذا:

1. **Backend:**
   - API يعيد `success: true` خلال < 2 ثانية
   - Database تُحدّث بشكل صحيح
   - لا أخطاء في server logs

2. **Pusher:**
   - أحداث تُرسل خلال < 100ms من API response
   - Payload كامل وصحيح
   - Driver يستلم الحدث فوراً

3. **Driver UI:**
   - إشعار يظهر خلال < 500ms من إرسال Pusher
   - صوت يُشغل تلقائيًا
   - Modal يعرض معلومات صحيحة
   - Dashboard يتحدّث خلال < 1 ثانية

4. **Admin UI:**
   - Toast يظهر فوراً
   - UI يتحدّث بدون refresh يدوي
   - لا أخطاء في console

---

## 📝 نموذج تقرير الاختبار / Test Report Template

```markdown
### Test Report - [Test Case Name]

**Date:** YYYY-MM-DD  
**Tester:** [Your Name]  
**Environment:** [Production/Staging/Local]

#### Test Details:
- Order/Route ID: ___________
- Driver ID: ___________
- Assigned By: ___________

#### Results:

**Backend API:**
- [ ] Request sent successfully
- [ ] Response time: ___ ms
- [ ] Response status: ___
- [ ] Response body: ✅ / ❌

**Database:**
- [ ] Booking.driverId updated: ✅ / ❌
- [ ] Assignment created: ✅ / ❌
- [ ] JobEvent created: ✅ / ❌
- [ ] AuditLog created: ✅ / ❌

**Pusher Events:**
- [ ] route-matched sent: ✅ / ❌
- [ ] job-assigned sent: ✅ / ❌
- [ ] Event payload correct: ✅ / ❌

**Driver UI:**
- [ ] Notification received: ✅ / ❌
- [ ] Sound played: ✅ / ❌
- [ ] Modal displayed: ✅ / ❌
- [ ] Dashboard refreshed: ✅ / ❌

**Admin UI:**
- [ ] Toast displayed: ✅ / ❌
- [ ] UI updated: ✅ / ❌

**Overall Result:** ✅ Pass / ❌ Fail / 🟡 Partial

**Notes:**
[Any additional observations or issues]
```

---

## 🚀 خطوات الاختبار السريع / Quick Test Steps

### للاختبار السريع (5 دقائق):

```bash
# 1. تعيين طلب فردي
POST https://speedy-van.co.uk/api/admin/orders/SV-2024-001/assign-driver
Body: { "driverId": "driver_123", "reason": "Test" }

# 2. تحقق من console السائق
# يجب أن ترى:
🎯🎯🎯 ROUTE MATCHED via Pusher!
🎵 Playing notification sound...
📱 Modal displayed

# 3. تعيين مسار كامل
POST https://speedy-van.co.uk/api/admin/routes/route_abc/assign
Body: { "driverId": "driver_456", "reason": "Test route" }

# 4. تحقق من console السائق
# يجب أن ترى نفس النتيجة أعلاه

# ✅ إذا رأيت النتائج أعلاه → النظام يعمل!
```

---

## 📞 الدعم / Support

إذا واجهت أي مشكلة أثناء الاختبار:

1. **تحقق من Console Logs:**
   - Backend: Server logs
   - Frontend: Browser DevTools Console
   - React Native: Metro bundler console

2. **تحقق من Network Tab:**
   - API requests/responses
   - Status codes
   - Response bodies

3. **تحقق من Database:**
   - Prisma Studio: `npx prisma studio`
   - Check: Booking, Assignment, JobEvent, AuditLog tables

4. **راجع الوثائق:**
   - `DEEP_CHECK_ADMIN_ASSIGNMENT_FLEXIBILITY.md`
   - `REALTIME_NOTIFICATIONS_UNIFIED.md`
   - `ADMIN_FLEXIBLE_ASSIGNMENT_SYSTEM.md`

---

**الحالة:** ✅ **جاهز للاختبار**  
**آخر تحديث:** 10 يناير 2025  
**الإصدار:** 2.0.0


