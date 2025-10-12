# 🚨 URGENT: Stripe Keys Expired - Need New Live Keys

## المشكلة
```
❌ Stripe session creation failed: {
  error: k [Error]: Expired API Key provided: sk_live_*********************************************************************************************dzXjCx
```

**المفتاح الحالي منتهي الصلاحية!**

## الحل السريع

### 1. اذهب إلى Stripe Dashboard
1. سجل دخول إلى [Stripe Dashboard](https://dashboard.stripe.com)
2. اذهب إلى **Developers** → **API Keys**
3. تأكد من أنك في **Live mode** (ليس Test mode)

### 2. احصل على مفاتيح جديدة
1. **Secret Key**: انسخ المفتاح الجديد (يبدأ بـ `sk_live_...`)
2. **Publishable Key**: انسخ المفتاح الجديد (يبدأ بـ `pk_live_...`)
3. **Webhook Secret**: اذهب إلى **Webhooks** → **Add endpoint** → انسخ الـ secret

### 3. حدث متغيرات البيئة في Render
اذهب إلى Render Dashboard → Environment Variables وأضف:

```
STRIPE_SECRET_KEY=sk_live_[YOUR_NEW_SECRET_KEY]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[YOUR_NEW_PUBLISHABLE_KEY]
STRIPE_WEBHOOK_SECRET=whsec_[YOUR_NEW_WEBHOOK_SECRET]
```

### 4. تأكد من إعداد Webhook
1. في Stripe Dashboard → **Webhooks**
2. أضف endpoint جديد: `https://speedy-van.co.uk/api/webhooks/stripe`
3. اختر هذه الأحداث:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`

### 5. اختبر المدفوعات
1. أعد تشغيل الخدمة في Render
2. جرب عملية دفع في booking-luxury
3. تأكد من أن المدفوعات تعمل

## ملاحظات مهمة
- **لا تستخدم مفاتيح الاختبار** (`sk_test_` أو `pk_test_`)
- **تأكد من أنك في Live mode** في Stripe Dashboard
- **احفظ المفاتيح الجديدة بأمان** - لا تشاركها أبداً
- **حدث جميع البيئات** (Render, Vercel, إلخ)

## إذا لم تكن تملك حساب Stripe Live
1. اذهب إلى [Stripe Dashboard](https://dashboard.stripe.com)
2. اذهب إلى **Settings** → **Account**
3. فعّل **Live mode** (قد تحتاج إلى إكمال التحقق من الهوية)
4. احصل على المفاتيح الجديدة

## التحقق من الإعداد
بعد إضافة المفاتيح الجديدة:
1. ✅ المدفوعات تعمل في booking-luxury
2. ✅ Webhook يستقبل الأحداث
3. ✅ البريد الإلكتروني يصل للعملاء
4. ✅ الحجوزات تُؤكد تلقائياً

**هذا سيحل مشكلة المفتاح المنتهي الصلاحية!** 🔑✅
