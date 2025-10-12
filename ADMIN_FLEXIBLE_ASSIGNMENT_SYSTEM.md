# نظام تعيين مرن للإدارة - Admin Flexible Assignment System

## 📋 نظرة عامة / Overview

تم تحديث نظام تعيين السائقين بنجاح ليمنح المشرف (Admin) مرونة كاملة في تعيين كل من:
1. **الطلبات الفردية** (Individual Orders/Jobs)
2. **المسارات الكاملة** (Complete Routes with multiple orders)

كلا النوعين من التعيينات يرسلان نفس الإشعارات الفورية، التنبيه الصوتي، ونافذة "New Route Matched" للسائق.

---

## 🎯 الميزات الرئيسية / Key Features

### ✅ تعيين الطلبات الفردية (Individual Order Assignment)

**API Endpoint:**
```
POST /api/admin/orders/[code]/assign-driver
```

**الاستخدام:**
- تعيين طلب واحد لسائق محدد
- مثالي للطلبات العاجلة أو الطلبات الفردية
- يدعم إعادة التعيين من سائق لآخر

**Request Body:**
```json
{
  "driverId": "driver_123",
  "reason": "Urgent delivery - Customer request"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver assigned successfully",
  "data": {
    "bookingId": "booking_xyz",
    "bookingReference": "SV-2024-001",
    "driver": {
      "id": "driver_123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "assignmentId": "assignment_...",
    "assignedAt": "2025-01-10T15:30:00.000Z"
  }
}
```

---

### ✅ تعيين المسارات الكاملة (Full Route Assignment)

**API Endpoints:**

#### أ) تعيين مسار لأول مرة (First-time Assignment)
```
POST /api/admin/routes/[id]/assign
```

**الاستخدام:**
- تعيين مسار كامل يحتوي على عدة طلبات لسائق
- يتم تعيين جميع الطلبات (bookings) في المسار للسائق تلقائيًا
- مثالي لتحسين الكفاءة التشغيلية

**Request Body:**
```json
{
  "driverId": "driver_456",
  "reason": "Optimal route for driver's area"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Route with 5 jobs assigned successfully",
  "data": {
    "routeId": "route_abc",
    "driver": {
      "id": "driver_456",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "bookingsCount": 5,
    "dropsCount": 8,
    "totalDistance": 24.5,
    "estimatedDuration": 180,
    "assignedAt": "2025-01-10T16:00:00.000Z"
  }
}
```

---

#### ب) إعادة تعيين مسار موجود (Route Reassignment)
```
POST /api/admin/routes/[id]/reassign
```

**الاستخدام:**
- نقل مسار موجود من سائق إلى سائق آخر
- يُستخدم في حالات الطوارئ أو إعادة التوزيع

**Request Body:**
```json
{
  "driverId": "driver_789",
  "reason": "Driver 456 unavailable - urgent reassignment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Route with 5 jobs reassigned successfully to Ahmed Ali",
  "data": {
    "routeId": "route_abc",
    "oldDriver": "Jane Smith",
    "newDriver": {
      "id": "driver_789",
      "name": "Ahmed Ali",
      "email": "ahmed@example.com"
    },
    "bookingsCount": 5,
    "dropsCount": 8,
    "reassignedAt": "2025-01-10T17:00:00.000Z"
  }
}
```

---

## 🔔 الإشعارات الفورية / Real-time Notifications

### للسائق الجديد (New Driver)

#### 1. إشعار `route-matched` (الرئيسي)
```javascript
{
  type: 'single-order' | 'full-route',
  // For single order:
  bookingId: "booking_xyz",
  bookingReference: "SV-2024-001",
  customerName: "Customer Name",
  assignmentId: "assignment_...",
  
  // For full route:
  routeId: "route_abc",
  bookingsCount: 5,
  dropsCount: 8,
  totalDistance: 24.5,
  estimatedDuration: 180,
  totalEarnings: 12500, // in pence
  drops: [
    {
      id: "drop_1",
      pickupAddress: "...",
      deliveryAddress: "..."
    }
  ],
  
  // Common:
  assignedAt: "2025-01-10T15:30:00.000Z",
  message: "New job assigned to you"
}
```

**هذا الإشعار يؤدي إلى:**
- 📢 تشغيل التنبيه الصوتي
- 📱 ظهور نافذة "New Route Matched"
- 🔄 تحديث لوحة السائق فورًا

#### 2. إشعار `job-assigned` (للدعم القديم)
```javascript
{
  type: 'single-order' | 'route',
  bookingId: "...", // for single
  routeId: "...",   // for route
  bookingReference: "SV-2024-001",
  customerName: "...",
  bookingsCount: 5,  // for route
  assignedAt: "2025-01-10T15:30:00.000Z",
  message: "You have been assigned a new job"
}
```

---

### للسائق القديم (Old Driver - في حالة إعادة التعيين)

#### إشعار `route-removed`
```javascript
{
  routeId: "route_abc" | bookingId: "booking_xyz",
  reason: "Reassigned to different driver",
  removedAt: "2025-01-10T17:00:00.000Z",
  message: "A route has been removed from your assignments"
}
```

---

### للمشرف (Admin Dashboard)

#### إشعار `driver-assigned` أو `route-assigned`
```javascript
{
  bookingId: "...", // or routeId
  bookingReference: "SV-2024-001",
  driverName: "John Doe",
  bookingsCount: 5, // for routes
  assignedAt: "2025-01-10T15:30:00.000Z"
}
```

---

### للسائقين الآخرين (Other Drivers)

#### إشعار `job-assigned-to-other` أو `route-assigned`
```javascript
{
  bookingId: "...", // or routeId
  bookingReference: "SV-2024-001",
  assignedTo: "John Doe",
  bookingsCount: 5, // for routes
  message: "This job has been assigned to another driver"
}
```

---

## 🔍 التحقق من الحالة / Status Validation

### للسائق:
✅ يجب أن يكون السائق:
- موجود في النظام (Driver exists)
- لديه سجل توفر (DriverAvailability exists)
- الحالة: `AVAILABLE` أو `online` أو `available`

❌ إذا كانت الحالة:
- `offline`
- `busy`
- `on_break`

سيرفض النظام التعيين ويعيد خطأ.

### للطلب/المسار:
✅ يمكن التعيين إذا كانت الحالة:
- `DRAFT`
- `PENDING`
- `PENDING_PAYMENT`
- `planned` (للمسارات)

❌ لا يمكن التعيين إذا كانت الحالة:
- `CANCELLED`
- `COMPLETED`

---

## 📊 قاعدة البيانات / Database Operations

### عند تعيين طلب أو مسار:

#### 1. تحديث الطلب (Booking Update)
```sql
UPDATE Booking SET
  driverId = 'driver_123',
  status = 'CONFIRMED',
  updatedAt = NOW()
WHERE id = 'booking_xyz';
```

#### 2. إنشاء التعيين (Assignment Creation)
```sql
INSERT INTO Assignment (
  id, bookingId, driverId, status, claimedAt, updatedAt
) VALUES (
  'assignment_...', 'booking_xyz', 'driver_123', 'accepted', NOW(), NOW()
);
```

#### 3. إنشاء حدث الوظيفة (Job Event Creation)
```sql
INSERT INTO JobEvent (
  id, assignmentId, step, payload, notes, createdBy
) VALUES (
  'event_...', 'assignment_...', 'navigate_to_pickup',
  '{"assignedBy":"admin","action":"job_assigned"}',
  'Job assigned to driver John Doe by admin',
  'admin_user_id'
);
```

#### 4. إنشاء سجل التدقيق (Audit Log Creation)
```sql
INSERT INTO AuditLog (
  actorId, actorRole, action, targetType, targetId, details
) VALUES (
  'admin_user_id', 'admin', 'driver_assigned', 'booking', 'booking_xyz',
  '{"driverName":"John Doe","reason":"Assigned by admin"}'
);
```

---

## 🎨 واجهة المستخدم (UI Implementation)

### صفحة الطلبات (Orders Page)

```typescript
// apps/web/src/app/admin/orders/table.tsx

const handleAssignDriver = async (orderCode: string, driverId: string, reason?: string) => {
  try {
    const response = await fetch(`/api/admin/orders/${orderCode}/assign-driver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, reason })
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast({
        title: 'تم التعيين بنجاح',
        description: `تم تعيين الطلب ${orderCode} للسائق ${data.data.driver.name}`,
        status: 'success'
      });
    }
  } catch (error) {
    toast({
      title: 'خطأ في التعيين',
      status: 'error'
    });
  }
};
```

---

### صفحة المسارات (Routes Page)

```typescript
// Example component for routes

const handleAssignRoute = async (routeId: string, driverId: string, reason?: string) => {
  try {
    const response = await fetch(`/api/admin/routes/${routeId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId, reason })
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast({
        title: 'تم تعيين المسار',
        description: `تم تعيين ${data.data.bookingsCount} طلبات للسائق ${data.data.driver.name}`,
        status: 'success'
      });
    }
  } catch (error) {
    toast({
      title: 'خطأ في التعيين',
      status: 'error'
    });
  }
};

const handleReassignRoute = async (routeId: string, newDriverId: string, reason?: string) => {
  try {
    const response = await fetch(`/api/admin/routes/${routeId}/reassign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driverId: newDriverId, reason })
    });
    
    const data = await response.json();
    
    if (data.success) {
      toast({
        title: 'تمت إعادة التعيين',
        description: `تم نقل المسار من ${data.data.oldDriver} إلى ${data.data.newDriver.name}`,
        status: 'success'
      });
    }
  } catch (error) {
    toast({
      title: 'خطأ في إعادة التعيين',
      status: 'error'
    });
  }
};
```

---

## 🧪 الاختبار / Testing

### اختبار تعيين طلب فردي

```bash
curl -X POST http://localhost:3000/api/admin/orders/SV-2024-001/assign-driver \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "driverId": "driver_123",
    "reason": "Test assignment"
  }'
```

### اختبار تعيين مسار

```bash
curl -X POST http://localhost:3000/api/admin/routes/route_abc/assign \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "driverId": "driver_456",
    "reason": "Test route assignment"
  }'
```

### اختبار إعادة تعيين مسار

```bash
curl -X POST http://localhost:3000/api/admin/routes/route_abc/reassign \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "driverId": "driver_789",
    "reason": "Driver change due to emergency"
  }'
```

---

## 📝 ملاحظات مهمة / Important Notes

### 1. **المعاملات (Transactions)**
جميع عمليات التعيين تتم داخل معاملة database transaction لضمان سلامة البيانات:
- إذا فشل أي جزء من العملية، يتم الرجوع عن جميع التغييرات (rollback)
- لا توجد حالات غير متسقة في قاعدة البيانات

### 2. **الإشعارات الاحتياطية (Fallback)**
إذا فشلت الإشعارات الفورية عبر Pusher:
- لا تفشل عملية التعيين
- يتم تسجيل الخطأ في console
- يتم تحديث قاعدة البيانات بنجاح

### 3. **التوافق مع الأنظمة القديمة (Backward Compatibility)**
- يتم إرسال كل من `route-matched` و `job-assigned`
- الأنظمة القديمة تستمع لـ `job-assigned`
- الأنظمة الجديدة تستمع لـ `route-matched`

### 4. **السجلات (Audit Logs)**
كل عملية تعيين يتم توثيقها بالكامل:
- من قام بالعملية (Admin user)
- متى تمت العملية (Timestamp)
- ما هي التفاصيل (Details object)
- السبب إذا تم توفيره (Reason)

---

## 🚀 الخطوات التالية / Next Steps

### لاستكمال التكامل:

1. **إضافة واجهة مستخدم في صفحة الطلبات:**
   - زر "Assign Driver" لكل طلب
   - Modal لاختيار السائق وإدخال السبب
   - عرض السائق الحالي إن وُجد

2. **إضافة واجهة مستخدم في صفحة المسارات:**
   - زر "Assign to Driver" للمسارات غير المعينة
   - زر "Reassign" للمسارات المعينة
   - عرض معلومات المسار والسائق الحالي

3. **تحديث لوحة السائق:**
   - الاستماع لإشعارات `route-matched`
   - عرض نافذة منبثقة عند تلقي تعيين جديد
   - تشغيل صوت تنبيه
   - تحديث قائمة الوظائف فورًا

4. **الاختبار النهائي:**
   - اختبار تعيين طلب فردي
   - اختبار تعيين مسار كامل
   - اختبار إعادة تعيين مسار
   - اختبار الإشعارات على جانب السائق
   - اختبار حالات الخطأ

---

## ✅ الملخص / Summary

✅ **تم الإنجاز:**
- ✅ API لتعيين الطلبات الفردية
- ✅ API لتعيين المسارات الكاملة
- ✅ API لإعادة تعيين المسارات
- ✅ إشعارات فورية متكاملة (Pusher)
- ✅ التحقق من حالة السائق والطلب
- ✅ معاملات قاعدة البيانات الآمنة
- ✅ سجلات التدقيق الكاملة
- ✅ التوافق مع الأنظمة القديمة

🔄 **يتطلب إضافة:**
- واجهة مستخدم في صفحة الإدارة
- تحديثات في تطبيق السائق للاستماع للإشعارات الجديدة

---

## 📞 الدعم / Support

إذا كانت لديك أي أسئلة أو مشاكل:
1. تحقق من console logs للخطأ التفصيلي
2. تأكد من أن Pusher يعمل بشكل صحيح
3. تحقق من حالة السائق في قاعدة البيانات
4. راجع سجلات التدقيق (AuditLog) لمعرفة ما حدث

---

**تاريخ آخر تحديث:** 10 يناير 2025
**الإصدار:** 1.0.0
**الحالة:** ✅ جاهز للإنتاج (Production Ready)

