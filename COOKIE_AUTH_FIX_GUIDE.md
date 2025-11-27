# Cookie Authentication Fix Guide

## المشكلة الأساسية
بعد تسجيل الدخول بنجاح، لا يتم إرسال الكوكيز من المتصفح إلى السيرفر في الطلبات اللاحقة، مما يؤدي إلى:
- `getCustomSession` لا يجد الـ `auth-token` cookie
- إعادة التوجيه المتكررة إلى صفحة تسجيل الدخول
- رسالة "No auth-token cookie found (no token present)"

## الأسباب المحتملة

### 1. **إعدادات Cookie غير صحيحة**

#### المشكلة في بيئة التطوير (Development)
```typescript
// ❌ خطأ - secure: true لن يعمل على HTTP localhost
response.cookies.set('auth-token', token, {
  secure: true, // يتطلب HTTPS
  sameSite: 'strict', // قد يمنع الكوكيز بعد redirect
});
```

#### الحل الصحيح
```typescript
// ✅ صحيح - يتكيف مع البيئة
const isProduction = process.env.NODE_ENV === 'production';

response.cookies.set('auth-token', token, {
  httpOnly: true,           // منع الوصول من JavaScript (أمان)
  secure: isProduction,     // HTTPS في production فقط
  sameSite: 'lax',         // يسمح بالكوكيز بعد navigation/redirect
  maxAge: 60 * 60 * 24 * 30, // 30 يوم
  path: '/',               // متاح لكل المسارات
  // لا تحدد domain في development
});
```

### 2. **SameSite Attribute**

| القيمة | السلوك | متى تستخدم |
|--------|---------|-----------|
| `'strict'` | لا يُرسل الكوكيز في أي cross-site request | أعلى أمان، لكن قد يكسر التطبيق |
| `'lax'` | يُرسل في top-level navigation (GET) | **الأفضل للـ auth** - يعمل مع redirects |
| `'none'` | يُرسل في كل الطلبات (يتطلب `secure: true`) | للـ cross-origin APIs |

### 3. **Domain Attribute**

```typescript
// ❌ في development على localhost
domain: 'localhost' // قد يسبب مشاكل

// ✅ الأفضل
// لا تحدد domain - سيستخدم exact host تلقائياً
```

### 4. **Browser Privacy Settings**

#### Microsoft Edge - Tracking Prevention
```
الرسالة في Console:
"Tracking Prevention blocked access to storage"
"SessionStorage blocked"
```

**الحل:**
1. افتح Edge Settings → Privacy, search, and services
2. اختر "Balanced" أو "Basic" بدلاً من "Strict"
3. أو أضف `localhost` إلى قائمة الاستثناءات

#### Chrome/Firefox - Third-party Cookies
إذا كان الـ frontend والـ API على domains مختلفة، تأكد من:
```typescript
// في fetch/axios requests
fetch('/api/auth/session', {
  credentials: 'include' // مهم جداً!
});
```

## الإصلاحات المطبقة

### 1. تحسين `custom-login/route.ts`

```typescript
// إعدادات كوكيز محسّنة مع logging مفصّل
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  maxAge: maxAge,
  path: '/',
};

response.cookies.set('auth-token', token, cookieOptions);

console.log('🍪 Cookie set successfully:', {
  tokenPreview: token.substring(0, 30) + '...',
  environment: process.env.NODE_ENV,
  cookieSettings: cookieOptions,
});
```

### 2. تحسين `getCustomSession` في `custom-auth.ts`

```typescript
// Logging مفصّل لتشخيص المشاكل
console.log('🔍 getCustomSession - Cookie check:', {
  hasToken: !!token,
  tokenLength: token?.length,
  totalCookies: allCookies.length,
  cookieNames: allCookies.map(c => c.name),
  authTokenCookie: // تفاصيل الكوكيز
});

if (!token) {
  console.log('⚠️  This usually means:');
  console.log('   1. Browser did not send the cookie (check SameSite/Secure/Domain)');
  console.log('   2. Cookie was blocked by browser privacy settings');
  console.log('   3. Cookie expired or was deleted');
  console.log('   4. Different domain/port between login and current request');
}
```

## خطوات التشخيص

### 1. فحص الكوكيز في المتصفح

**في Chrome/Edge DevTools:**
1. افتح Developer Tools (F12)
2. اذهب إلى **Application** tab
3. في القائمة الجانبية: **Cookies** → `http://localhost:3000`
4. ابحث عن `auth-token`

**تحقق من:**
- ✅ الكوكيز موجود بعد login
- ✅ `HttpOnly` = true
- ✅ `Secure` = false (في dev) أو true (في prod)
- ✅ `SameSite` = Lax
- ✅ `Path` = /
- ✅ `Expires` في المستقبل

### 2. فحص Network Requests

**في Developer Tools → Network:**
1. سجل دخول
2. افتح صفحة `/admin`
3. انقر على request `/admin` أو `/api/auth/session`
4. انظر إلى **Request Headers**

```
✅ يجب أن ترى:
Cookie: auth-token=eyJhbGciOiJIUzI1NiJ9...

❌ إذا لم تجد Cookie header:
المتصفح لا يرسل الكوكيز (مشكلة في الإعدادات)
```

### 3. فحص Console Logs

```bash
# عند تسجيل الدخول
🔐 Login endpoint called
✅ Login successful: user@example.com
🍪 Cookie set successfully: { ... }

# عند فتح /admin
🔍 getCustomSession - Cookie check: { hasToken: true, ... }
✅ getCustomSession - Token verified successfully for: user@example.com

# أو إذا فشل
🔍 getCustomSession - Cookie check: { hasToken: false, ... }
❌ getCustomSession - No auth-token cookie found (no token present)
⚠️  This usually means: ...
```

## اختبار الإصلاح

### 1. إعادة تشغيل السيرفر

```powershell
# في terminal
cd C:\sv\apps\web
pnpm dev
```

### 2. Clear Cookies

في المتصفح:
- اضغط F12 → Application → Cookies
- احذف كل الكوكيز لـ `localhost:3000`
- أو استخدم Incognito/Private mode

### 3. Test Login Flow

1. افتح `http://localhost:3000/auth/login`
2. سجل دخول بحساب admin
3. افتح Developer Tools → Console
4. يجب أن ترى:
   ```
   🍪 Cookie set successfully
   ```
5. اذهب إلى `/admin`
6. يجب أن ترى:
   ```
   ✅ getCustomSession - Token verified successfully
   ✅ Admin Layout - Access granted
   ```

### 4. Verify Cookie in Browser

في Application → Cookies يجب أن ترى:

| Name | Value | Domain | Path | Expires | HttpOnly | Secure | SameSite |
|------|-------|--------|------|---------|----------|--------|----------|
| auth-token | eyJhbG... | localhost | / | (30 days) | ✓ | ✗ (dev) | Lax |

## مشاكل شائعة وحلولها

### المشكلة: "Cookie blocked by tracking prevention"

**الحل:**
```
Edge → Settings → Privacy → Tracking prevention → Basic
أو أضف localhost للاستثناءات
```

### المشكلة: Cookie لا يظهر في Application tab

**الحل:**
```typescript
// تأكد من أن login API يرجع status 200
// تأكد من عدم وجود JavaScript errors
// جرب Hard Refresh (Ctrl+Shift+R)
```

### المشكلة: Cookie موجود لكن لا يُرسل في requests

**الأسباب المحتملة:**
1. `SameSite=strict` مع redirect - غيره إلى `lax`
2. `Secure=true` على HTTP - غيره إلى `false` في dev
3. `Domain` mismatch - احذف domain attribute
4. CORS issue - أضف `credentials: 'include'` في fetch

### المشكلة: "Session check: hasSession: false" مباشرة بعد login

**الحل:**
```typescript
// تأكد من استخدام redirect() من next/navigation
import { redirect } from 'next/navigation';

// بعد login ناجح
redirect('/admin'); // لا تستخدم router.push
```

## Best Practices

### 1. استخدم Environment Variables

```env
# .env.local
NODE_ENV=development
NEXTAUTH_SECRET=your-secret-key-here
```

### 2. لا تستخدم `secure: true` في Development

```typescript
secure: process.env.NODE_ENV === 'production'
```

### 3. استخدم `sameSite: 'lax'` للـ Authentication

```typescript
// ✅ يعمل مع redirects وnavigation
sameSite: 'lax'

// ❌ قد يكسر auth flow
sameSite: 'strict'
```

### 4. أضف Logging مفصل

```typescript
console.log('Cookie settings:', {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  // ...
});
```

### 5. اختبر في Multiple Browsers

- Chrome
- Firefox
- Edge
- Safari (إذا ممكن)

## Resources

- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- [Next.js: Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [SameSite Cookies Explained](https://web.dev/samesite-cookies-explained/)
- [Edge Tracking Prevention](https://learn.microsoft.com/en-us/microsoft-edge/web-platform/tracking-prevention)

## ملخص التغييرات

تم إصلاح الملفات التالية:

1. ✅ `apps/web/src/app/api/auth/custom-login/route.ts`
   - إعدادات كوكيز محسّنة تتكيف مع البيئة
   - Logging مفصّل للتشخيص

2. ✅ `apps/web/src/lib/custom-auth.ts`
   - Logging محسّن في `getCustomSession`
   - رسائل خطأ تفصيلية لتحديد المشكلة

## Next Steps

1. أعد تشغيل السيرفر: `pnpm dev`
2. امسح الكوكيز في المتصفح
3. سجل دخول من جديد
4. تحقق من Console logs
5. إذا استمرت المشكلة، تحقق من browser privacy settings
