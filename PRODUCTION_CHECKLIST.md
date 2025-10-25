# قائمة التحقق من الإنتاج - Speedy Van

## ✅ الملفات الحساسة في .gitignore

تم إضافة جميع الملفات الحساسة إلى `.gitignore`:
- ملفات البيئة (.env*)
- مفاتيح الأمان (*.key, *.pem, *.crt)
- ملفات قاعدة البيانات (*.db, *.sqlite)
- ملفات السجلات (*.log)
- ملفات التخزين المؤقت (.cache, .turbo)
- ملفات الاختبار (__tests__, coverage)
- ملفات IDE (.vscode, .idea)

## ✅ إعدادات النشر على Render

### 1. ملفات النشر المطلوبة
- ✅ `render.yaml` - إعدادات Render
- ✅ `Dockerfile` - إعدادات Docker
- ✅ `.dockerignore` - ملفات مستبعدة من Docker
- ✅ `env.example` - قالب متغيرات البيئة

### 2. سكريبتات البناء
- ✅ `package.json` محدث مع سكريبتات البناء
- ✅ `turbo.json` محدث مع المهام المطلوبة

## ✅ متغيرات البيئة المطلوبة

### متغيرات أساسية (مطلوبة)
- `DATABASE_URL` - رابط قاعدة البيانات PostgreSQL
- `NEXTAUTH_SECRET` - مفتاح NextAuth
- `NEXTAUTH_URL` - رابط التطبيق
- `JWT_SECRET` - مفتاح JWT
- `STRIPE_SECRET_KEY` - مفتاح Stripe السري
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - مفتاح Stripe العام
- `STRIPE_WEBHOOK_SECRET` - مفتاح webhook Stripe

### متغيرات Pusher (مطلوبة)
- `PUSHER_APP_ID` - معرف تطبيق Pusher
- `PUSHER_KEY` - مفتاح Pusher
- `PUSHER_SECRET` - سر Pusher
- `PUSHER_CLUSTER` - مجموعة Pusher
- `NEXT_PUBLIC_PUSHER_KEY` - المفتاح العام لـ Pusher
- `NEXT_PUBLIC_PUSHER_CLUSTER` - المجموعة العامة لـ Pusher

### متغيرات الخرائط (مطلوبة)
- `NEXT_PUBLIC_MAPBOX_TOKEN` - مفتاح Mapbox

### متغيرات البريد الإلكتروني (اختيارية)
- `SENDGRID_API_KEY` - مفتاح SendGrid
- `RESEND_API_KEY` - مفتاح Resend
- `MAIL_FROM` - عنوان البريد الإلكتروني المرسل

### متغيرات الرسائل النصية (اختيارية)
- `THESMSWORKS_KEY` - مفتاح The SMS Works
- `THESMSWORKS_SECRET` - السر لـ The SMS Works
- `THESMSWORKS_JWT` - JWT لـ The SMS Works

### متغيرات التطبيق (مطلوبة)
- `NEXT_PUBLIC_API_URL` - رابط API
- `NEXT_PUBLIC_BASE_URL` - رابط التطبيق الأساسي
- `NEXT_PUBLIC_COMPANY_NAME` - اسم الشركة
- `NEXT_PUBLIC_COMPANY_ADDRESS` - عنوان الشركة
- `NEXT_PUBLIC_COMPANY_PHONE` - هاتف الشركة
- `NEXT_PUBLIC_COMPANY_EMAIL` - بريد الشركة
- `CUSTOM_KEY` - مفتاح مخصص
- `LOG_LEVEL` - مستوى السجلات

### متغيرات إضافية (اختيارية)
- `NEXT_PUBLIC_WEATHER_API_KEY` - مفتاح API الطقس
- `GOOGLE_CLIENT_ID` - معرف Google Client
- `GOOGLE_CLIENT_SECRET` - سر Google Client
- `CONSENT_HMAC_SECRET` - سر HMAC للموافقة

## ✅ خطوات النشر على Render

### 1. إعداد المستودع
```bash
# التأكد من أن جميع التغييرات محفوظة
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2. إنشاء خدمة في Render
1. تسجيل الدخول إلى [Render Dashboard](https://dashboard.render.com)
2. النقر على "New +" ثم "Web Service"
3. ربط المستودع من GitHub
4. اختيار الفرع `main`

### 3. إعداد الخدمة
- **Name**: speedy-van-web
- **Environment**: Node
- **Plan**: Starter (أو أعلى حسب الحاجة)
- **Build Command**: 
  ```bash
  corepack enable
  pnpm install
  pnpm run prisma:generate
  pnpm run build
  ```
- **Start Command**: 
  ```bash
  pnpm start --filter=@speedy-van/app
  ```

### 4. إعداد قاعدة البيانات
1. إنشاء PostgreSQL database في Render
2. نسخ connection string إلى `DATABASE_URL`
3. تشغيل migrations بعد النشر:
   ```bash
   pnpm run prisma:migrate
   ```

### 5. إضافة متغيرات البيئة
إضافة جميع المتغيرات المذكورة أعلاه في قسم Environment Variables

### 6. إعداد النطاق
1. ربط النطاق `speedy-van.co.uk` مع خدمة Render
2. إعداد SSL certificate
3. التأكد من أن `NEXTAUTH_URL` يشير إلى النطاق الصحيح

## ✅ التحقق من النشر

### 1. فحص السجلات
- مراجعة build logs للتأكد من نجاح البناء
- فحص runtime logs للتأكد من عدم وجود أخطاء

### 2. اختبار الوظائف الأساسية
- ✅ تسجيل الدخول
- ✅ إنشاء طلب توصيل
- ✅ معالجة الدفع
- ✅ تتبع الطلب
- ✅ إشعارات الوقت الفعلي

### 3. اختبار الأداء
- فحص سرعة التحميل
- اختبار الاستجابة على الأجهزة المختلفة
- مراقبة استخدام الموارد

## ✅ الأمان

### 1. متغيرات البيئة
- ✅ جميع المفاتيح السرية محمية في Render
- ✅ لا توجد مفاتيح مكشوفة في الكود
- ✅ ملف .env.local محمي في .gitignore

### 2. قاعدة البيانات
- ✅ اتصال آمن بـ PostgreSQL
- ✅ SSL مفعل
- ✅ نسخ احتياطي دوري

### 3. الدفع
- ✅ Stripe مفعل مع مفاتيح الإنتاج
- ✅ Webhook محمي
- ✅ معالجة آمنة للمعاملات

## ✅ المراقبة والصيانة

### 1. السجلات
- ✅ تسجيل جميع العمليات المهمة
- ✅ مراقبة الأخطاء
- ✅ تتبع الأداء

### 2. النسخ الاحتياطي
- ✅ نسخ احتياطي دوري لقاعدة البيانات
- ✅ حفظ نسخ من متغيرات البيئة
- ✅ توثيق التغييرات

### 3. التحديثات
- ✅ تحديثات دورية للـ dependencies
- ✅ اختبار الوظائف بعد التحديثات
- ✅ مراجعة السجلات

## ✅ الدعم

للحصول على الدعم:
- البريد الإلكتروني: support@speedy-van.co.uk
- الهاتف: +44 1202129746

---

## ملاحظات مهمة

1. **تأكد من إضافة جميع متغيرات البيئة** قبل النشر
2. **اختبر جميع الوظائف** بعد النشر
3. **راقب الأداء** في الأيام الأولى
4. **احتفظ بنسخ احتياطية** من قاعدة البيانات
5. **وثق جميع التغييرات** للمراجعة المستقبلية
