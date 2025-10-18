# 🧪 دليل اختبار Route Reassignment API

## ✅ التأكد من تشغيل الخادم

أولاً، تأكد أن الخادم يعمل:

```powershell
cd apps/web
npm run dev
```

انتظر حتى ترى:
```
✓ Ready in 3s
○ Local: http://localhost:3000
```

---

## 🔧 طرق الاختبار

### **الطريقة 1: استخدام PowerShell Scripts (موصى بها)** ✨

#### 1. احصل على Route ID و Driver ID المتاحين:
```powershell
.\get-test-data.ps1
```

سيعرض لك:
```
📋 Available Routes:
  • ID: RT1A2B3C4D
    Driver: clxxx...
    Status: assigned
    Bookings: 3

👷 Available Drivers:
  • ID: clyyy...
    Name: John Doe
    Status: AVAILABLE
```

#### 2. اختبر إعادة التعيين:
```powershell
.\test-reassign.ps1 -RouteId "RT1A2B3C4D" -DriverId "clyyy..." -Reason "Testing fix"
```

**النتيجة المتوقعة:**
```
✅ Success!

Response:
{
  "success": true,
  "message": "Route with 3 jobs reassigned successfully to John Doe",
  "data": {
    "routeId": "RT1A2B3C4D",
    "oldDriver": "Old Driver Name",
    "newDriver": {
      "id": "clyyy...",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "bookingsCount": 3,
    "reassignedAt": "2025-01-18T..."
  }
}
```

---

### **الطريقة 2: استخدام curl (إذا متاح)**

```bash
# على Windows (Git Bash أو WSL)
./test-reassign-curl.sh "RT1A2B3C4D" "clyyy..." "Testing fix"

# أو مباشرة:
curl -X POST "http://localhost:3000/api/admin/routes/RT1A2B3C4D/reassign" \
  -H "Content-Type: application/json" \
  -d '{"driverId": "clyyy...", "reason": "Testing fix"}'
```

---

### **الطريقة 3: استخدام VS Code Rest Client** 🎯

1. ثبّت Extension: **REST Client** by Huachao Mao

2. أنشئ ملف `test.http`:

```http
### Get Available Routes
GET http://localhost:3000/api/admin/routes

### Get Available Drivers
GET http://localhost:3000/api/admin/drivers/available

### Test Reassignment
POST http://localhost:3000/api/admin/routes/RT1A2B3C4D/reassign
Content-Type: application/json

{
  "driverId": "clyyy...",
  "reason": "Testing reassignment fix"
}
```

3. اضغط على "Send Request" فوق كل طلب

---

### **الطريقة 4: استخدام Postman أو Thunder Client**

#### Thunder Client (VS Code Extension):
1. افتح Thunder Client
2. New Request
3. Method: `POST`
4. URL: `http://localhost:3000/api/admin/routes/{routeId}/reassign`
5. Body (JSON):
```json
{
  "driverId": "your-driver-id",
  "reason": "Testing fix"
}
```
6. Send

---

## ✅ التحقق من النجاح

### ✓ استجابة ناجحة:
```json
{
  "success": true,
  "message": "Route with X jobs reassigned successfully to Driver Name",
  "route": { ... },
  "data": { ... }
}
```

### ✓ في قاعدة البيانات:
يمكنك التحقق من جدول `Assignment`:

```sql
SELECT 
  id,
  "bookingId",
  "driverId",
  status,
  "createdAt",
  "updatedAt"
FROM "Assignment"
WHERE "bookingId" = 'your-booking-id'
ORDER BY "createdAt" DESC;
```

يجب أن ترى:
- ✅ Assignment جديد بـ status = 'invited' أو 'accepted'
- ✅ Assignment(s) قديم بـ status = 'cancelled'
- ✅ عدة سجلات لنفس bookingId (التاريخ)

---

## ❌ الأخطاء المحتملة

### 1. **خطأ P2002 (تم حله)**
```json
{
  "error": "Failed to reassign driver",
  "details": "Unique constraint failed on the fields: (`bookingId`)"
}
```
✅ **الحل:** تم حله بإزالة unique constraint و إضافة deleteMany

### 2. **Route not found**
```json
{
  "error": "Route not found"
}
```
✅ **الحل:** تأكد من Route ID صحيح (استخدم `get-test-data.ps1`)

### 3. **Driver not found**
```json
{
  "error": "Driver not found"
}
```
✅ **الحل:** تأكد من Driver ID صحيح وموجود

### 4. **Driver not available**
```json
{
  "error": "Driver is not available for assignments (status: offline)"
}
```
✅ **الحل:** اختر سائق بـ status = 'AVAILABLE' أو 'online'

### 5. **Unauthorized**
```json
{
  "error": "Unauthorized"
}
```
✅ **الحل:** تحتاج تسجيل دخول كـ admin. أضف session/cookie في الطلب.

---

## 🔍 تتبع الأخطاء (Debugging)

### تفعيل Logs في Terminal:
راقب terminal حيث يعمل `npm run dev`:

```
🔄 Admin reassigning route to different driver: { routeId: 'RT...', driverId: 'cl...', reason: '...' }
✅ Real-time notifications sent for route reassignment
🎉 Route reassignment completed: { routeId: '...', oldDriver: '...', newDriver: '...', bookingsCount: 3 }
```

### إذا ظهر خطأ:
```
❌ Reassign driver error: [PrismaClientKnownRequestError]
```

1. انسخ الرسالة الكاملة
2. ابحث عن error code (مثل P2002)
3. تحقق من الـ stack trace

---

## 📊 أمثلة عملية

### مثال 1: إعادة تعيين route بسيط
```powershell
.\test-reassign.ps1 -RouteId "RT1A2B3C4D" -DriverId "clxxx123" -Reason "Driver sick"
```

### مثال 2: اختبار متعدد
```powershell
# احصل على البيانات
.\get-test-data.ps1

# اختبر إعادة التعيين لسائق 1
.\test-reassign.ps1 -RouteId "RT1A2B3C4D" -DriverId "driver1-id"

# اختبر إعادة التعيين لسائق 2 (نفس الـ route)
.\test-reassign.ps1 -RouteId "RT1A2B3C4D" -DriverId "driver2-id"

# يجب أن يعمل الاثنان بدون P2002 ✅
```

---

## 🎯 الهدف من الاختبار

تأكد من:
- ✅ لا يظهر خطأ P2002
- ✅ يتم إنشاء assignment جديد بنجاح
- ✅ Assignment القديم يُلغى (status = 'cancelled')
- ✅ يمكن إعادة تعيين نفس route عدة مرات
- ✅ يتم حفظ تاريخ التعيينات في قاعدة البيانات
- ✅ الإشعارات تُرسل للسائقين (Pusher)

---

## 💡 نصائح

1. **ابدأ بـ `get-test-data.ps1`** للحصول على IDs صحيحة
2. **استخدم VS Code Rest Client** للاختبار السريع
3. **راقب terminal logs** لفهم ما يحدث
4. **تحقق من قاعدة البيانات** بعد كل اختبار
5. **اختبر سيناريوهات متعددة** (reassign نفس route عدة مرات)

---

حظاً موفقاً! 🚀
