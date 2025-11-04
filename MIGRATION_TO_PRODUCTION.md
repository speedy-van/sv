# 🚀 دليل الانتقال من Development إلى Production

## 📋 نظرة عامة

هذا الدليل يشرح كيفية الانتقال من قاعدة بيانات Development إلى Production بشكل آمن.

---

## 🔍 المرحلة الحالية

### Development Database
- **Host**: `ep-round-morning-afkxnska-pooler.c-2.us-west-2.aws.neon.tech`
- **Database**: `neondb`
- **Usage**: للتطوير والاختبار فقط

### Production Database
- **Host**: `ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech`
- **Database**: `neondb`
- **Usage**: قاعدة البيانات الحية للعملاء

---

## ⚠️ مهم جداً: قبل البدء

1. **خذ backup من Production** قبل أي تغييرات
2. **اختبر كل شيء في Development** أولاً
3. **راجع migrations** قبل التطبيق على Production
4. **تأكد من أن Schema محدث** في `packages/shared/prisma/schema.prisma`

---

## 📝 الخطوات المطلوبة

### 1. تحديث `.env.local` لاستخدام Production Database

```env
# في .env.local - استبدل DATABASE_URL بـ Production URL
DATABASE_URL=postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**⚠️ تحذير**: بعد تحديث `.env.local`، الكود سيتصل بقاعدة بيانات Production مباشرة!

---

### 2. مراجعة Schema والتغييرات

```bash
# تأكد من أن Schema محدث
cd packages/shared
npx prisma validate
```

---

### 3. إنشاء Migrations (في Development أولاً)

```bash
# في Development - إنشاء migrations للتغييرات
cd packages/shared
npx prisma migrate dev --name your_migration_name
```

هذا ينشئ ملفات migration في `packages/shared/prisma/migrations/`

---

### 4. مراجعة Migrations للتأكد من الأمان

افتح ملفات migration في `packages/shared/prisma/migrations/` وافحص:

✅ **تغييرات آمنة**:
- `ALTER TABLE ADD COLUMN` - إضافة عمود
- `CREATE INDEX` - إضافة index
- `ALTER TABLE ALTER COLUMN` - تعديل نوع العمود (بحذر)

❌ **تغييرات خطرة** (تجنبها):
- `DROP TABLE` - حذف جدول
- `DELETE FROM` - حذف بيانات
- `TRUNCATE TABLE` - مسح بيانات
- `DROP COLUMN` - حذف عمود (يؤدي لفقدان البيانات)

---

### 5. أخذ Backup من Production

**قبل تطبيق أي migrations على Production، خذ backup:**

```bash
# استخدام Neon Console
# 1. اذهب إلى https://console.neon.tech/
# 2. اختر Production database
# 3. انقر على "Create Branch" لإنشاء نسخة احتياطية
# أو
# 4. استخدم "Export" لتحميل backup
```

---

### 6. تطبيق Migrations على Production

```bash
# في Production - تطبيق migrations
cd packages/shared

# تأكد من أن DATABASE_URL يشير إلى Production
echo $DATABASE_URL

# تطبيق migrations
npx prisma migrate deploy
```

**⚠️ تحذير**: هذا سيطبق migrations على قاعدة بيانات Production مباشرة!

---

### 7. التحقق من النجاح

```bash
# التحقق من حالة migrations
npx prisma migrate status

# التحقق من الاتصال
npx prisma db execute --stdin <<< "SELECT current_database();"
```

---

### 8. اختبار التطبيق

1. ✅ تحقق من أن `/api/admin/me` يعمل
2. ✅ تحقق من أن APIs تعمل بشكل صحيح
3. ✅ تحقق من أن البيانات موجودة
4. ✅ تحقق من أن لا توجد أخطاء في الـ logs

---

## 🔒 أفضل الممارسات

### 1. لا تستخدم `prisma db push` في Production

```bash
# ❌ لا تفعل هذا في Production
npx prisma db push

# ✅ استخدم migrations بدلاً من ذلك
npx prisma migrate deploy
```

### 2. اختبر migrations في Development أولاً

```bash
# 1. أنشئ migration في Development
npx prisma migrate dev --name test_migration

# 2. راجع ملفات migration
# 3. اختبر في Development
# 4. ثم طبق على Production
npx prisma migrate deploy
```

### 3. احتفظ بنسخة احتياطية دائماً

- قبل أي تغييرات، خذ backup
- استخدم Neon Console لإنشاء branches
- احتفظ بنسخة احتياطية محلية إذا لزم

---

## 📊 مراقبة Production

بعد التطبيق على Production، راقب:

1. **Logs**: تحقق من عدم وجود أخطاء
2. **Performance**: تحقق من أن الأداء طبيعي
3. **Data**: تحقق من أن البيانات موجودة وصحيحة
4. **APIs**: تحقق من أن جميع APIs تعمل

---

## 🆘 في حالة المشاكل

### إذا فشل migration:

```bash
# 1. تحقق من حالة migrations
npx prisma migrate status

# 2. راجع الـ logs
# 3. استرجع backup إذا لزم
```

### إذا كانت هناك مشاكل في البيانات:

```bash
# 1. استرجع backup
# 2. راجع migration files
# 3. أصلح المشكلة
# 4. طبق migration مرة أخرى
```

---

## ✅ Checklist قبل الانتقال

- [ ] Schema محدث في `packages/shared/prisma/schema.prisma`
- [ ] Migrations تم إنشاؤها ومراجعتها
- [ ] Backup من Production تم أخذه
- [ ] `.env.local` محدث بـ Production DATABASE_URL
- [ ] تم اختبار migrations في Development
- [ ] جاهز لتطبيق migrations على Production

---

## 📞 ملاحظات إضافية

1. **لا تنسخ بيانات تجريبية** من Development إلى Production
2. **استخدم migrations فقط** لتطبيق التغييرات
3. **راجع migrations مرتين** قبل التطبيق
4. **احتفظ بنسخة احتياطية** دائماً

---

**آخر تحديث**: 2025-11-04
**الإصدار**: 1.0.0

