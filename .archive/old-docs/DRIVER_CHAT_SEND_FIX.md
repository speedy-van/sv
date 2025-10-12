# إصلاح Driver Chat Send API - 500 Error

## المشكلة
```
❌ API Error: Request failed with status code 500 /api/driver/chat/send
```

التطبيق المحمول كان يحصل على 500 error عند محاولة إرسال رسالة chat.

## السبب الجذري

الكود كان يخلط بين `userId` (من جدول User) و `driverId` (من جدول Driver):

```typescript
// ❌ خطأ: استخدام driverId في أماكن تتوقع userId
ChatParticipant: {
  some: {
    userId: driverId,  // driverId هو من جدول Driver، لكن userId يجب أن يكون من جدول User
    role: 'driver'
  }
}

createdBy: driverId,  // نفس المشكلة
senderId: driverId,   // نفس المشكلة
```

### العلاقات في Database:
```
User (id) ──┬──> Driver (userId)
            │
            └──> ChatParticipant (userId)
            └──> Message (senderId)
```

## الإصلاح المطبق

**الملف**: `apps/web/src/app/api/driver/chat/send/route.ts`

### 1. إصلاح findFirst للـ chatSession
```typescript
// ✅ صحيح
let chatSession = await prisma.chatSession.findFirst({
  where: {
    type: 'driver_admin',
    isActive: true,
    ChatParticipant: {
      some: {
        userId: userId,  // ✅ استخدام userId من User table
        role: 'driver'
      }
    }
  }
});
```

### 2. إصلاح create للـ chatSession
```typescript
// ✅ صحيح
chatSession = await prisma.chatSession.create({
  data: {
    id: sessionId,
    type: 'driver_admin',
    title: `Driver Support - ${userInfo.firstName} ${userInfo.lastName}`,
    createdBy: userId,  // ✅ استخدام userId
    updatedAt: new Date(),
    ChatParticipant: {
      create: [
        {
          id: participantId,
          userId: userId,  // ✅ استخدام userId
          role: 'driver'
        }
      ]
    }
  }
});
```

### 3. إصلاح create للـ message
```typescript
// ✅ صحيح
const newMessage = await prisma.message.create({
  data: {
    id: messageId,
    senderId: userId,  // ✅ استخدام userId بدلاً من driverId
    sessionId: chatSession.id,
    content: message,
    type: 'text',
    status: 'sent',
    updatedAt: new Date()
  }
});
```

## الفرق بين userId و driverId

| Field | Table | Purpose |
|-------|-------|---------|
| `userId` | User | المعرف الأساسي للمستخدم (سواء كان driver, customer, أو admin) |
| `driverId` | Driver | معرف سجل السائق المرتبط بـ userId |

### مثال:
```typescript
// Driver record
{
  id: "driver_abc123",           // driverId
  userId: "user_xyz789",         // userId (foreign key to User table)
  status: "active",
  ...
}

// User record
{
  id: "user_xyz789",             // userId
  name: "John Driver",
  email: "john@example.com",
  role: "driver",
  ...
}
```

## تدفق البيانات الصحيح

1. **Authentication** → يحصل على `userId` من token
2. **Get Driver** → يجلب `driver` record للتحقق من `userId`
3. **Find/Create ChatSession** → يستخدم `userId` (ليس `driverId`)
4. **Create Message** → يستخدم `userId` كـ `senderId`
5. **Pusher Notification** → يرسل لـ `driver-${driverId}` (channel name)

## النتيجة

- ✅ Chat messages تُحفظ بشكل صحيح في database
- ✅ ChatParticipant يربط بـ User.id بشكل صحيح
- ✅ Message.senderId يشير إلى User.id
- ✅ لا توجد foreign key constraint errors
- ✅ Chat يعمل من التطبيق المحمول

## الملفات المعدلة

- ✅ `apps/web/src/app/api/driver/chat/send/route.ts`

## الاختبار

1. ✅ افتح التطبيق المحمول
2. ✅ سجل دخول كسائق
3. ✅ افتح Chat screen
4. ✅ أرسل رسالة
5. ✅ تحقق من عدم ظهور 500 error
6. ✅ الرسالة تظهر في UI
7. ✅ Admin يستقبل notification

## ملاحظات إضافية

⚠️ **تنبيه مهم**: في جميع endpoints التي تتعامل مع Chat، يجب استخدام `userId` (من User table) وليس `driverId` عند:
- البحث عن ChatParticipant
- إنشاء ChatSession
- إنشاء Message
- أي foreign key يشير إلى User table

✅ استخدم `driverId` فقط في:
- Pusher channel names: `driver-${driverId}`
- Route parameters المتعلقة بـ Driver-specific data
- Foreign keys التي تشير مباشرة إلى Driver table
