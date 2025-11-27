# CRITICAL: Cookie Issue with 0.0.0.0 vs localhost

## المشكلة المكتشفة

في الـ logs، السيرفر يعمل على:
```
- Local:        http://localhost:3000
- Network:      http://0.0.0.0:3000
```

### 🔴 المشكلة الحرجة

إذا كنت تفتح التطبيق في المتصفح باستخدام:
- `http://0.0.0.0:3000` ❌
- أو `http://192.168.x.x:3000` ❌

**الكوكيز لن تعمل!**

### ✅ الحل

**استخدم دائماً `localhost` في المتصفح:**
```
http://localhost:3000
```

## لماذا؟

### Cookie Domain Restrictions

1. **`0.0.0.0` ليس domain صالح**
   - المتصفحات ترفض تعيين cookies على `0.0.0.0`
   - `0.0.0.0` هو "bind address" للسيرفر فقط، ليس domain للمتصفح

2. **IP Address Cookies**
   - بعض المتصفحات تحجب cookies على عناوين IP
   - خاصة في بيئة development

3. **`localhost` Exception**
   - المتصفحات تسمح بـ `Secure` cookies على `localhost` بدون HTTPS
   - `localhost` معامل معاملة خاصة في Web Security

## خطوات التشخيص السريع

### 1. تحقق من العنوان في المتصفح

انظر إلى شريط العنوان (Address Bar):

```
✅ CORRECT:
http://localhost:3000/admin

❌ WRONG:
http://0.0.0.0:3000/admin
http://127.0.0.1:3000/admin
http://192.168.1.100:3000/admin
```

### 2. إذا كنت تستخدم عنواناً خاطئاً

1. **أغلق جميع tabs**
2. **افتح tab جديد**
3. **اكتب العنوان الصحيح:**
   ```
   http://localhost:3000
   ```

### 3. تحقق من الكوكيز

بعد تسجيل الدخول:
1. F12 → Application → Cookies
2. يجب أن ترى:
   ```
   http://localhost:3000
   └─ auth-token: eyJhbGci...
   ```

إذا رأيت:
```
http://0.0.0.0:3000
└─ (no cookies)
```
**هذا هو السبب!**

## الإصلاح في package.json (اختياري)

يمكنك تعديل script الـ dev ليستخدم `localhost` فقط:

### الحالي:
```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0"
  }
}
```

### المقترح:
```json
{
  "scripts": {
    "dev": "next dev",
    "dev:network": "next dev -H 0.0.0.0"
  }
}
```

**الفائدة:**
- `pnpm dev` → يستخدم `localhost` فقط (أفضل للكوكيز)
- `pnpm dev:network` → يستخدم `0.0.0.0` (للوصول من أجهزة أخرى)

## اختبار الحل

### قبل:
```powershell
# في المتصفح
http://0.0.0.0:3000/auth/login

# بعد login
http://0.0.0.0:3000/admin
# ❌ يعيد توجيهك إلى /auth/login
```

### بعد:
```powershell
# في المتصفح
http://localhost:3000/auth/login

# بعد login
http://localhost:3000/admin
# ✅ يعمل!
```

## Technical Details

### من MDN و RFC 6265:

> Cookies cannot be set for:
> - IP addresses (with exceptions for localhost/127.0.0.1)
> - Invalid hostnames
> - Top-level domains without subdomain

### Chrome DevTools Console

إذا حاولت على `0.0.0.0`، قد ترى:
```
Set-Cookie was blocked because the domain attribute was invalid
```

## Next.js Server Binding

عندما تستخدم `-H 0.0.0.0`:
- **السيرفر يستمع على:** جميع network interfaces
- **يمكن الوصول من:**
  - `localhost:3000` ✅
  - `127.0.0.1:3000` ⚠️ (قد يعمل لكن أفضل استخدام localhost)
  - `192.168.x.x:3000` ⚠️ (للشبكة المحلية، لكن الكوكيز معقدة)
  - `0.0.0.0:3000` ❌ (لا يعمل في المتصفح)

## Development vs Production

### Development (الآن):
```
URL: http://localhost:3000
Cookies: secure=false, sameSite=lax
Works on: localhost only
```

### Production (بعد Deploy):
```
URL: https://yourapp.com
Cookies: secure=true, sameSite=lax
Works on: yourapp.com and subdomains
```

## Troubleshooting Steps

إذا استمرت المشكلة بعد استخدام `localhost`:

1. **Clear All Cookies:**
   ```
   F12 → Application → Cookies → Right-click → Clear
   ```

2. **Check Console for Warnings:**
   ```
   Look for: "Cookie was blocked" messages
   ```

3. **Try Incognito Mode:**
   ```
   Ctrl+Shift+N (Chrome/Edge)
   ```

4. **Check cookie in Response Headers:**
   ```
   Network → custom-login → Response Headers
   Should see: Set-Cookie: auth-token=...
   ```

5. **Check cookie in Request Headers:**
   ```
   Network → admin → Request Headers
   Should see: Cookie: auth-token=...
   ```

## Summary

| Aspect | ❌ Wrong | ✅ Correct |
|--------|---------|-----------|
| **Browser URL** | `http://0.0.0.0:3000` | `http://localhost:3000` |
| **Server Binding** | `-H 0.0.0.0` (ok) | Default or `-H 0.0.0.0` |
| **Cookie Domain** | `0.0.0.0` | `localhost` |
| **Cookie Works?** | ❌ No | ✅ Yes |

## الحل النهائي

1. ✅ **في المتصفح:** استخدم `http://localhost:3000`
2. ✅ **في السيرفر:** يمكنك ترك `-H 0.0.0.0` كما هو
3. ✅ **تأكد من:** الكود الذي أصلحناه في `custom-login` يستخدم `secure: false` في dev
4. ✅ **امسح الكوكيز** وحاول مجدداً

---

**إذا اتبعت هذه الخطوات، المشكلة يجب أن تُحل!**
