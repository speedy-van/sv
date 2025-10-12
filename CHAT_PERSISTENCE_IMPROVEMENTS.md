# تحسينات نظام الدردشة - حفظ الدردشة عند تحديث المتصفح

## المشكلة الأصلية

كانت الدردشة تفقد عند تحديث المتصفح، مما يجبر المستخدم على بدء دردشة جديدة في كل مرة.

## الحلول المطبقة

### 1. حفظ الدردشة في localStorage

- **الملفات المحدثة:**
  - `apps/web/src/components/Chat/ChatBox.tsx`
  - `apps/web/src/components/Chat/ChatInterface.tsx`
  - `apps/web/src/components/Chat/CustomerChatWidget.tsx`

- **الميزات:**
  - حفظ جميع الرسائل في localStorage
  - تحميل الرسائل المحفوظة عند إعادة تحميل الصفحة
  - تنظيف تلقائي للبيانات القديمة (أكثر من 24 ساعة)
  - دعم للعملاء المسجلين والزوار

### 2. مكون CustomerChatWidget الجديد

- **الملف:** `apps/web/src/components/Chat/CustomerChatWidget.tsx`
- **الميزات:**
  - واجهة دردشة متطورة للعملاء
  - دعم للعملاء المسجلين والزوار
  - مؤشر للرسائل غير المقروءة
  - إمكانية التصغير والتكبير
  - رسائل مؤقتة أثناء الإرسال
  - مؤشر الكتابة

### 3. API Endpoints الجديدة

- **ملفات API:**
  - `apps/web/src/app/api/chat/customer/[customerId]/messages/route.ts`
  - `apps/web/src/app/api/chat/guest/messages/route.ts`
  - `apps/web/src/app/api/chat/[bookingId]/route.ts`

- **الميزات:**
  - دعم رسائل العملاء المسجلين
  - دعم رسائل الزوار
  - دعم رسائل الحجوزات
  - تكامل مع Pusher للرسائل الفورية

### 4. تكامل مع الصفحات

- **الملفات المحدثة:**
  - `apps/web/src/app/(customer-portal)/customer-portal/layout.tsx`
  - `apps/web/src/app/(public)/layout.tsx`

- **الميزات:**
  - إضافة CustomerChatWidget إلى صفحة العملاء
  - إضافة CustomerChatWidget إلى الصفحة الرئيسية للزوار

## الميزات الجديدة

### 1. حفظ تلقائي للرسائل

```javascript
// حفظ الرسائل في localStorage
const saveMessagesToStorage = messages => {
  localStorage.setItem(
    `chat_${bookingId}`,
    JSON.stringify({
      messages,
      timestamp: Date.now(),
    })
  );
};
```

### 2. تحميل الرسائل المحفوظة

```javascript
// تحميل الرسائل من localStorage
const loadMessagesFromStorage = () => {
  const stored = localStorage.getItem(`chat_${bookingId}`);
  if (stored) {
    const data = JSON.parse(stored);
    if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
      return data.messages;
    }
  }
  return [];
};
```

### 3. رسائل مؤقتة أثناء الإرسال

```javascript
// إضافة رسالة مؤقتة
const tempMessage = {
  id: `temp_${Date.now()}`,
  content: newMessage.trim(),
  isPending: true,
};
```

### 4. تنظيف تلقائي للبيانات القديمة

```javascript
// تنظيف localStorage القديم
const cleanupOldStorage = () => {
  const keys = Object.keys(localStorage);
  const chatKeys = keys.filter(key => key.startsWith('chat_'));

  chatKeys.forEach(key => {
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key);
      }
    }
  });
};
```

## كيفية الاستخدام

### للعملاء المسجلين

```jsx
<CustomerChatWidget
  customerId={session.user?.id}
  customerName={session.user?.name}
  customerEmail={session.user?.email}
/>
```

### للزوار

```jsx
<CustomerChatWidget />
```

### للحجوزات

```jsx
<ChatBox bookingId={bookingId} />
```

## المزايا

1. **استمرارية الدردشة:** لا تفقد الرسائل عند تحديث المتصفح
2. **تجربة مستخدم محسنة:** واجهة حديثة وسهلة الاستخدام
3. **دعم متعدد:** للعملاء المسجلين والزوار والحجوزات
4. **أداء محسن:** تحميل فوري للرسائل المحفوظة
5. **تنظيف تلقائي:** حذف البيانات القديمة تلقائياً
6. **رسائل فورية:** تكامل مع Pusher للرسائل المباشرة

## الخطوات التالية

1. **تكامل قاعدة البيانات:** ربط API endpoints مع قاعدة البيانات
2. **إشعارات:** إضافة إشعارات للرسائل الجديدة
3. **ملفات مرفقة:** دعم إرسال الصور والملفات
4. **تاريخ الدردشات:** حفظ تاريخ الدردشات السابقة
5. **تصدير المحادثات:** إمكانية تصدير المحادثات كملف PDF

## ملاحظات تقنية

- يتم حفظ البيانات في localStorage لمدة 24 ساعة فقط
- الرسائل المؤقتة تُحذف تلقائياً في حالة فشل الإرسال
- يتم تنظيف البيانات القديمة عند تحميل المكون
- دعم كامل للعملاء المسجلين والزوار
- تكامل مع نظام المصادقة الحالي
