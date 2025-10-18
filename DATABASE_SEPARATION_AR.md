# 🔒 دليل فصل بيئات قاعدة البيانات

## نظرة عامة

تم إنشاء نظام حماية متقدم لفصل بيئة التطوير عن بيئة الإنتاج بشكل كامل، مع حماية قوية لمنع أي تعديل عرضي على قاعدة بيانات الإنتاج.

---

## ✅ ما تم إنجازه تلقائياً

### 1. نظام الحماية الآلي

تم إنشاء `packages/shared/src/database/db-protection.ts`:
- ✅ يكتشف تلقائياً إذا كنت تستخدم قاعدة بيانات الإنتاج
- ✅ يمنع التطبيق من العمل إذا كان هناك خطأ في الإعدادات
- ✅ يسجل جميع العمليات المدمرة في الإنتاج
- ✅ يمنع إضافة بيانات تجريبية في الإنتاج

### 2. عميل Prisma المحمي

تم إنشاء `packages/shared/src/database/index-protected.ts`:
- ✅ يتحقق من البيئة تلقائياً عند الاستيراد
- ✅ يطبق قواعد الحماية على جميع العمليات
- ✅ يوفر أدوات اتصال آمنة بقاعدة البيانات

### 3. ملفات البيئة

- ✅ `.env.development` - قالب لبيئة التطوير (تم إنشاؤه)
- ✅ `.env.production` - إعدادات الإنتاج (تم تحديثه)
- ✅ `env.example` - قالب عام (موجود)

### 4. أدوات التحقق

تم إنشاء سكريبتات للتحقق من البيئة:
- ✅ `scripts/verify-environment.ts` - أداة تحقق شاملة
- ✅ `scripts/check-db-environment.sh` - فحص سريع
- ✅ `scripts/create-dev-database-template.sql` - قالب SQL

### 5. توثيق شامل

- ✅ `ENVIRONMENT_SEPARATION_GUIDE.md` - دليل مفصل بالإنجليزية
- ✅ `QUICK_SETUP_DATABASE_SEPARATION.md` - دليل سريع
- ✅ `packages/shared/src/database/README.md` - توثيق تقني
- ✅ `DATABASE_SEPARATION_AR.md` - هذا الملف (بالعربية)

---

## 🎯 ما تحتاج القيام به يدوياً

### الخطوة 1: إنشاء قاعدة بيانات التطوير

1. **افتح Neon Console**: https://console.neon.tech/
2. **قم بتسجيل الدخول**
3. **أنشئ قاعدة بيانات جديدة** بالاسم: `speedyvan-dev`
4. **انسخ رابط الاتصال** (connection string)

سيكون الرابط بهذا الشكل:
```
postgresql://[username]:[password]@[host].neon.tech/speedyvan-dev?sslmode=require&channel_binding=require
```

### الخطوة 2: تحديث ملف `.env.local`

**مهم جداً**: ملف `.env.local` موجود لكنه مخفي لأسباب أمنية.

قم بتحديث **فقط السطر التالي** في ملف `.env.local`:

```bash
# استبدل هذا السطر برابط قاعدة بيانات التطوير الجديدة:
DATABASE_URL=postgresql://[DEV_USER]:[DEV_PASS]@[DEV_HOST].neon.tech/speedyvan-dev?sslmode=require&channel_binding=require

# أضف هذه الأسطر إذا لم تكن موجودة:
ENVIRONMENT_MODE=development
ALLOW_MIGRATIONS=true
ALLOW_DATA_SEEDING=true
NODE_ENV=development

# استخدم مفاتيح Stripe للاختبار (test keys):
STRIPE_SECRET_KEY=sk_test_[YOUR_STRIPE_TEST_SECRET_KEY]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[YOUR_STRIPE_TEST_PUBLISHABLE_KEY]

# احتفظ بجميع المتغيرات الأخرى كما هي
```

### الخطوة 3: نسخ Schema إلى قاعدة البيانات الجديدة

قم بتنفيذ الأوامر التالية:

```bash
# توليد Prisma client
pnpm run prisma:generate

# نسخ الـ schema إلى قاعدة بيانات التطوير
cd packages/shared
npx prisma db push

# (اختياري) إضافة بيانات تجريبية
npx prisma db seed

# التحقق من الاتصال
npx prisma studio
```

### الخطوة 4: التحقق من أن الحماية تعمل

```bash
# شغل التطبيق
pnpm run dev

# يجب أن ترى هذه الرسالة:
# 🔒 Database Environment Check:
#    Environment: DEVELOPMENT
#    Database: DEVELOPMENT
#    Status: ✅ VALID
```

---

## 🛡️ كيف يعمل نظام الحماية

### الكشف التلقائي

النظام يكتشف تلقائياً:

**قاعدة بيانات الإنتاج**:
- تحتوي على `ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech`
- اسم القاعدة `neondb`
- بيانات اعتماد الإنتاج

**بيئة الإنتاج**:
- `NODE_ENV=production`
- `ENVIRONMENT_MODE=production`

### قواعد الحماية

| الحالة | الإجراء | السبب |
|--------|---------|--------|
| تطوير + قاعدة تطوير | ✅ مسموح | آمن |
| إنتاج + قاعدة إنتاج | ✅ مسموح | متوقع |
| تطوير + قاعدة إنتاج | ❌ محظور | خطير جداً |
| إنتاج + قاعدة تطوير | ⚠️ مسموح مع تحذير | غير عادي |

### رسالة الخطأ

إذا حاولت استخدام قاعدة بيانات الإنتاج في التطوير، ستظهر هذه الرسالة:

```
╔════════════════════════════════════════════════════════════════╗
║                   🚨 DATABASE PROTECTION 🚨                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  خطأ حرج: تم اكتشاف قاعدة بيانات الإنتاج في                ║
║  بيئة غير إنتاجية!                                          ║
║                                                                ║
║  البيئة الحالية: development                                 ║
║  قاعدة البيانات: PRODUCTION                                  ║
║                                                                ║
║  هذه آلية أمان لمنع التعديل أو الحذف العرضي                 ║
║  لبيانات قاعدة بيانات الإنتاج.                              ║
║                                                                ║
║  الحل:                                                        ║
║  1. حدث .env.local برابط قاعدة بيانات التطوير                ║
║  2. اضبط ENVIRONMENT_MODE=development                         ║
║  3. لا تستخدم DATABASE_URL الإنتاجي في التطوير أبداً          ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🚀 أوامر مفيدة

### التحقق من البيئة

```bash
# فحص شامل للبيئة
pnpm run env:verify

# فحص سريع (Bash)
pnpm run env:check

# عرض متغيرات البيئة الحالية
echo $NODE_ENV $ENVIRONMENT_MODE $DATABASE_URL
```

### عمليات قاعدة البيانات

```bash
# إعداد قاعدة البيانات (development فقط)
pnpm run db:setup

# إنشاء migration جديد (development فقط)
cd packages/shared
npx prisma migrate dev --name migration_name

# دفع الـ schema مباشرة (development فقط)
npx prisma db push

# إضافة بيانات تجريبية (development فقط)
npx prisma db seed

# فتح محرر قاعدة البيانات المرئي
npx prisma studio
```

### التحقق من الاتصال

```bash
# التحقق من اسم قاعدة البيانات الحالية
cd packages/shared
npx prisma db execute --stdin <<< "SELECT current_database();"

# اختبار الاتصال
npx prisma db execute --stdin <<< "SELECT 1;"
```

---

## ⚙️ العمليات المسموحة حسب البيئة

### بيئة التطوير ✅

**مسموح تماماً**:
- ✅ إنشاء وتعديل migrations
- ✅ دفع الـ schema مباشرة
- ✅ إضافة بيانات تجريبية
- ✅ إعادة تعيين قاعدة البيانات
- ✅ حذف البيانات
- ✅ تجربة تغييرات الـ schema
- ✅ استعلامات SQL مباشرة

### بيئة الإنتاج ⚠️

**محدود ومراقب**:
- ⚠️ Migrations: فقط عبر عملية النشر المعتمدة
- ⚠️ تغييرات Schema: تتطلب موافقة يدوية
- ❌ إضافة بيانات تجريبية: **محظور تماماً**
- ⚠️ SQL مباشر: فقط بتصريح صريح
- ⚠️ العمليات المدمرة: مسجلة ومراقبة

---

## 🔍 التحقق من الإعدادات

### قائمة التحقق لبيئة التطوير

في ملف `.env.local`:

- [ ] `DATABASE_URL` يشير إلى **قاعدة بيانات التطوير** (`speedyvan-dev`)
- [ ] `NODE_ENV=development`
- [ ] `ENVIRONMENT_MODE=development`
- [ ] `ALLOW_MIGRATIONS=true`
- [ ] `ALLOW_DATA_SEEDING=true`
- [ ] مفاتيح Stripe **للاختبار** (`sk_test_...`, `pk_test_...`)
- [ ] `NEXT_PUBLIC_API_URL=http://localhost:3000`

### قائمة التحقق لبيئة الإنتاج

في ملف `.env.production`:

- [ ] `DATABASE_URL` يشير إلى **قاعدة بيانات الإنتاج** (`neondb`)
- [ ] `NODE_ENV=production`
- [ ] `ENVIRONMENT_MODE=production`
- [ ] `ALLOW_MIGRATIONS=false` (أو غير موجود)
- [ ] `ALLOW_DATA_SEEDING=false` (أو غير موجود)
- [ ] مفاتيح Stripe **المباشرة** (`sk_live_...`, `pk_live_...`)
- [ ] `NEXT_PUBLIC_API_URL=https://api.speedy-van.co.uk`

---

## 🚨 أخطاء شائعة يجب تجنبها

### ❌ لا تفعل:

1. نسخ `DATABASE_URL` الإنتاجي إلى `.env.local`
2. تشغيل `prisma db push` في الإنتاج دون اختبار
3. إضافة بيانات تجريبية في قاعدة بيانات الإنتاج
4. حذف ملفات `.env` الإنتاجية من git
5. مشاركة ملفات `.env.local` (شخصية)
6. استخدام مفاتيح API الإنتاجية في التطوير

### ✅ افعل:

1. استخدم دائماً قاعدة بيانات التطوير للعمل المحلي
2. اختبر migrations في التطوير أولاً
3. احتفظ بملف `.env.local` سرياً وشخصياً
4. ارفع قوالب `.env.production` و `.env.development` على git
5. استخدم مفاتيح Stripe للاختبار في التطوير
6. راجع تغييرات قاعدة البيانات قبل النشر للإنتاج

---

## 🧪 اختبار نظام الحماية

للتأكد أن الحماية تعمل:

```bash
# 1. مؤقتاً، ضع DATABASE_URL الإنتاجي في .env.local
# (اختبار فقط - لا تتركه!)

# 2. حاول تشغيل التطبيق
pnpm run dev

# النتيجة المتوقعة: التطبيق يجب أن يتوقف مع رسالة خطأ ✅
# إذا عمل التطبيق: الحماية لا تعمل ❌

# 3. أعد DATABASE_URL للتطوير فوراً
```

---

## 📋 سير عمل Migrations

### من التطوير إلى الإنتاج

```bash
# 1. التطوير
cd packages/shared
npx prisma migrate dev --name add_feature
# اختبر جيداً

# 2. Staging (اختياري)
# شغل في بيئة staging
npx prisma migrate deploy
# اختبر في staging

# 3. الإنتاج
# فقط بعد اختبار شامل
# اضبط NODE_ENV=production
npx prisma migrate deploy
```

---

## 💡 نصائح مهمة

### 1. النسخ الاحتياطي

```bash
# قاعدة بيانات الإنتاج: نسخ احتياطي تلقائي يومي عبر Neon
# قاعدة بيانات التطوير: نسخ احتياطي يدوي حسب الحاجة
```

### 2. الأمان

```bash
# احتفظ بمفاتيح منفصلة لكل بيئة:
التطوير:  sk_test_***, pk_test_***
الإنتاج:   sk_live_***, pk_live_***
```

### 3. المراقبة

```bash
# جميع العمليات المدمرة في الإنتاج مسجلة
# راجع السجلات بانتظام
```

---

## 🎓 ملخص سريع

### ما تم إنجازه

✅ **نظام حماية شامل**: يمنع الوصول العرضي لقاعدة بيانات الإنتاج
✅ **عميل Prisma محمي**: يتحقق من البيئة تلقائياً
✅ **ملفات بيئة منفصلة**: لكل بيئة إعداداتها الخاصة
✅ **أدوات تحقق**: للتأكد من صحة الإعدادات
✅ **توثيق شامل**: باللغتين العربية والإنجليزية

### ما تحتاج فعله

1. ✅ إنشاء قاعدة بيانات `speedyvan-dev` على Neon
2. ✅ تحديث `.env.local` برابط قاعدة التطوير
3. ✅ تشغيل `pnpm run db:setup`
4. ✅ التحقق بواسطة `pnpm run env:verify`

### الفائدة

**حتى لو ارتكبت خطأ، قاعدة بيانات الإنتاج محمية!**

---

## 📞 الدعم

إذا واجهت مشاكل:

1. شغل: `pnpm run env:verify`
2. راجع رسائل الخطأ
3. تأكد من متغيرات البيئة
4. راجع دليل الإعداد السريع

---

## 📚 مراجع إضافية

- [Environment Separation Guide (EN)](./ENVIRONMENT_SEPARATION_GUIDE.md)
- [Quick Setup Guide (EN)](./QUICK_SETUP_DATABASE_SEPARATION.md)
- [Database Module README](./packages/shared/src/database/README.md)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**آخر تحديث**: 18 أكتوبر 2025
**الإصدار**: 1.0.0
**الفريق**: Speedy Van Development Team

---

## 🎉 ملاحظة نهائية

نظام الحماية الآن نشط ويعمل! 

جميع ما تحتاجه هو:
1. إنشاء قاعدة بيانات التطوير على Neon
2. تحديث `.env.local`
3. البدء بالعمل بأمان تام

**قاعدة بيانات الإنتاج الآن محمية ضد أي خطأ بشري!** 🛡️

