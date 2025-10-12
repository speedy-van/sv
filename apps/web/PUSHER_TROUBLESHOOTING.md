# دليل استكشاف أخطاء Pusher WebSocket

## المشكلة
```
Pusher — WebSocket is closed before the connection is established
```

## الأسباب المحتملة والحلول

### 1. مشكلة في تطابق المفاتيح بين Server و Client

**المشكلة**: Server-side يستخدم `NEXT_PUBLIC_PUSHER_KEY` بدلاً من `PUSHER_KEY`

**الحل**: ✅ تم إصلاحه
```typescript
// ❌ خطأ (قبل الإصلاح)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,  // خطأ!
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,  // خطأ!
  useTLS: true,
});

// ✅ صحيح (بعد الإصلاح)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});
```

### 2. React Strict Mode يسبب multiple instances

**المشكلة**: React Strict Mode في التطوير يسبب إعادة تشغيل المكونات مرتين

**الحل**: ✅ تم إصلاحه بإنشاء PusherSingleton
```typescript
// إنشاء instance واحد فقط
const pusher = PusherSingleton.getInstance();
```

### 3. إعدادات CORS وAllowed Origins

**الفحص المطلوب**:
1. تأكد من أن Pusher App في لوحة التحكم يحتوي على:
   - `https://speedy-van.co.uk` في Allowed Origins
   - `http://localhost:3000` للتطوير

2. تحقق من إعدادات Firewall/AdBlock

### 4. تهيئة غير ثابتة (multiple instances)

**المشكلة**: إنشاء أكثر من instance لـ Pusher

**الحل**: ✅ تم إصلاحه باستخدام Singleton Pattern

## التحقق من الإصلاحات

### 1. فحص إعدادات البيئة
```bash
# تأكد من وجود هذه المتغيرات في .env.local
PUSHER_APP_ID=2034743
PUSHER_KEY=407cb06c423e6c032e9c
PUSHER_SECRET=bf769b4fd7a3cf95a803
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=407cb06c423e6c032e9c
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

### 2. فحص Console Logs
ابحث عن هذه الرسائل في Console:
```
✅ Pusher connected successfully
📡 Subscribing to channel: public-guest-chat
✅ Successfully subscribed to channel: public-guest-chat
```

### 3. فحص Network Tab
- تأكد من وجود WebSocket connection في Network tab
- تحقق من عدم وجود 403/404 errors

## إعدادات Pusher الموصى بها

### للبيئة الإنتاجية
```typescript
const pusher = new Pusher(pusherKey, {
  cluster: pusherCluster,
  useTLS: true,
  enabledTransports: ['ws', 'wss'],
  forceTLS: true,
  activityTimeout: 30000,
  pongTimeout: 6000,
  unavailableTimeout: 10000,
});
```

### للبيئة التطوير
```typescript
const pusher = new Pusher(pusherKey, {
  cluster: pusherCluster,
  useTLS: true,
  enabledTransports: ['ws', 'wss'],
  forceTLS: true,
  activityTimeout: 60000, // أطول في التطوير
  pongTimeout: 10000,
  unavailableTimeout: 10000,
  enableStats: false,
});
```

## استكشاف الأخطاء المتقدمة

### 1. فحص Pusher Dashboard
- اذهب إلى [Pusher Dashboard](https://dashboard.pusher.com/)
- تحقق من Connection logs
- تأكد من صحة App credentials

### 2. فحص Network Connectivity
```bash
# اختبار الاتصال بـ Pusher
curl -I https://ws-eu.pusher.com/app/407cb06c423e6c032e9c
```

### 3. فحص Browser Console
```javascript
// فحص حالة Pusher
console.log('Pusher state:', PusherSingleton.getConnectionState());
console.log('Pusher connected:', PusherSingleton.isConnected());
```

## الملفات المحدثة

1. `apps/web/src/lib/pusher-singleton.ts` - Pusher Singleton جديد
2. `apps/web/src/components/Chat/CustomerChatWidget.tsx` - استخدام Singleton
3. `apps/web/src/app/api/pusher/auth/route.ts` - إصلاح Server-side config

## اختبار الإصلاحات

1. أعد تشغيل التطبيق
2. افتح Developer Tools
3. اذهب إلى صفحة Chat
4. تحقق من Console logs
5. تأكد من عدم وجود WebSocket errors

## إذا استمرت المشكلة

1. تحقق من إعدادات Pusher Dashboard
2. تأكد من صحة Allowed Origins
3. فحص Firewall/AdBlock settings
4. تحقق من Network connectivity
5. راجع Pusher logs في Dashboard
