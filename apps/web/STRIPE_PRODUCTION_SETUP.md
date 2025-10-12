# Stripe Production Setup Guide

## تم تحويل Stripe إلى وضع الإنتاج

### المتغيرات البيئية المطلوبة

أضف هذه المتغيرات إلى ملف `.env.local` أو متغيرات البيئة:

```bash
# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_your_production_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Base URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### المتغيرات البيئية الحالية (محدثة)

بناءً على ملف البيئة الإنتاجية الخاص بك، هذه هي المتغيرات المطلوبة:

```bash
# Stripe — LIVE
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51Rp06mBpmFIwZiSMBP8AYxDhTznhg6vBscxblxthVbk52ilyB4zlnKrC2IcnvVyXF2dv0mvOd2whaTXCZIsEonFo00izEP3DhS
STRIPE_WEBHOOK_SECRET=whsec_1fe8d3923c5aad30a4df3fe785c2db5b13c1ccbb4d3c333b311b5b3f5e366b72

# Base URL
NEXT_PUBLIC_BASE_URL=https://speedy-van.co.uk
```

### الحصول على مفاتيح Stripe الإنتاجية

1. **تسجيل الدخول إلى [Stripe Dashboard](https://dashboard.stripe.com/)**
2. **الانتقال إلى Developers > API keys**
3. **نسخ المفاتيح الإنتاجية:**
   - `sk_live_...` (Secret Key)
   - `pk_live_...` (Publishable Key)

### إعداد Webhooks

1. **في Stripe Dashboard: Developers > Webhooks**
2. **إضافة Endpoint جديد:**
   ```
   https://speedy-van.co.uk/api/webhooks/stripe
   ```
3. **اختيار الأحداث:**
   - `checkout.session.completed` - تأكيد الحجز بعد الدفع
   - `payment_intent.succeeded` - نجاح الدفع
   - `payment_intent.payment_failed` - فشل الدفع
   - `payment_intent.canceled` - إلغاء الدفع
   - `charge.refunded` - استرداد المبلغ
4. **نسخ Webhook Secret (whsec\_...)**
5. **اختبار Webhook:**
   - استخدم "Send test webhook" في Stripe Dashboard
   - تحقق من استلام الأحداث في سجلات التطبيق

### Webhook Handler Features

تم إنشاء webhook handler شامل يتعامل مع:

- ✅ **تأكيد الحجوزات** بعد الدفع الناجح
- ✅ **تحديث حالة الحجز** بناءً على حالة الدفع
- ✅ **معالجة فشل الدفع** وتحديث الحالة
- ✅ **معالجة الإلغاء** وتحديث التوفر
- ✅ **معالجة الاسترداد** وتحديث الحالة
- ✅ **تسجيل جميع الأحداث** للتتبع والمراقبة

### اختبار التكامل

1. **تشغيل التطبيق مع المفاتيح الإنتاجية**
2. **اختبار عملية دفع حقيقية**
3. **التحقق من Webhooks**
4. **مراجعة سجلات Stripe**

### ملاحظات مهمة

- ✅ **تم إزالة جميع المحاكيات التجريبية**
- ✅ **تم تفعيل التحقق الصارم من المفاتيح**
- ✅ **تم إعداد Stripe Checkout الحقيقي**
- ✅ **جاهز لمعالجة المدفوعات الفعلية**
- ✅ **تم تحديث الكود ليتعامل مع NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**

### الأمان

- لا تشارك `STRIPE_SECRET_KEY` أبداً
- استخدم HTTPS في الإنتاج
- فعّل 3D Secure
- راقب سجلات Stripe بانتظام

### حالة التكوين الحالية

بناءً على ملف البيئة الخاص بك:

- ✅ **STRIPE_SECRET_KEY**: مُكوّن (sk*live*...)
- ✅ **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**: مُكوّن (pk*live*...)
- ✅ **STRIPE_WEBHOOK_SECRET**: مُكوّن (whsec\_...)
- ✅ **NEXT_PUBLIC_BASE_URL**: مُكوّن (https://speedy-van.co.uk)

**النظام جاهز للإنتاج! 🎉**
