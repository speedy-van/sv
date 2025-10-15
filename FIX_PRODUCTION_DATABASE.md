# إصلاح مشكلة قاعدة البيانات Production

## المشكلة
Prisma schema يحتوي على حقل `phone` في User model، لكن قاعدة البيانات production لا تحتوي على هذا الحقل، مما يسبب 500 Internal Server Error عند محاولة driver login.

## الحل

### الخيار 1: تشغيل Migration على Production (الأفضل)

#### على Render.com:

1. **افتح Render Dashboard**
   - اذهب إلى: https://dashboard.render.com
   - اختر web service الخاص بـ Speedy Van

2. **أضف Build Command جديد:**
   ```bash
   cd packages/shared && npx prisma migrate deploy && npx prisma generate && cd ../.. && pnpm install && pnpm run build
   ```

3. **أو استخدم Shell في Render:**
   - اضغط على "Shell" في dashboard
   - شغّل الأوامر التالية:
   ```bash
   cd packages/shared
   npx prisma migrate deploy
   npx prisma generate
   ```

#### باستخدام Database URL مباشرة:

إذا كان لديك DATABASE_URL من Neon:

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run migration
cd packages/shared
npx prisma migrate deploy
npx prisma generate
```

### الخيار 2: تشغيل SQL مباشرة على Neon

1. **افتح Neon Console:**
   - اذهب إلى: https://console.neon.tech
   - اختر project: Speedy Van
   - اذهب إلى SQL Editor

2. **شغّل هذا SQL:**
   ```sql
   -- Add phone column if it doesn't exist
   ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
   ```

3. **بعد ذلك، على Render:**
   ```bash
   cd packages/shared
   npx prisma generate
   ```

### الخيار 3: تحديث Render Build Command

قم بتحديث Build Command في Render settings إلى:

```bash
./deploy-migrations.sh && pnpm install && pnpm run build
```

## التحقق من نجاح الإصلاح

بعد تشغيل migration، اختبر driver login:

```bash
curl -X POST https://speedy-van.co.uk/api/driver/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "zadfad41@gmail.com",
    "password": "112233"
  }'
```

يجب أن تحصل على response ناجح مع token.

## الملفات التي تم إنشاؤها

1. **Migration File:**
   - `packages/shared/prisma/migrations/20251014_add_phone_to_user/migration.sql`
   - يحتوي على SQL لإضافة حقل phone

2. **Deployment Script:**
   - `deploy-migrations.sh`
   - يشغل migrations ويعيد generate Prisma Client

## Next Steps بعد الإصلاح

1. ✅ تشغيل migration على production
2. ✅ اختبار driver login
3. ✅ Build iOS app جديد (Build 23)
4. ✅ Submit للـ App Store

## معلومات إضافية

- **Production URL:** https://speedy-van.co.uk
- **Test Account:** zadfad41@gmail.com / 112233
- **Database:** Neon PostgreSQL
- **Render Service:** speedy-van-web

## استكشاف الأخطاء

إذا استمرت المشكلة:

1. **تحقق من Render Logs:**
   ```
   Render Dashboard > Logs
   ```

2. **تحقق من Prisma Client:**
   ```bash
   cd packages/shared
   npx prisma validate
   npx prisma format
   ```

3. **أعد build Prisma Client:**
   ```bash
   rm -rf node_modules/.prisma
   npx prisma generate
   ```

4. **أعد deploy على Render:**
   - Manual Deploy من Dashboard
   - أو push commit جديد

## الملخص

المشكلة الأساسية هي **schema/database mismatch**. الحل هو تشغيل migration لإضافة حقل `phone` إلى جدول User في production database.

بعد ذلك، driver login سيعمل بشكل صحيح وسنستطيع build iOS app وsubmit للـ App Store.

