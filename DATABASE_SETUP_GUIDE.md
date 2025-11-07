# 🚨 قاعدة البيانات - دليل الإعداد والعزل

## ⚠️ تحذير حاسم: عزل بيئة التطوير عن الإنتاج

**لا تستخدم قاعدة بيانات الإنتاج أبداً في التطوير المحلي!**

---

## 📋 جدول المحتويات

1. [نظرة عامة](#overview)
2. [الإعداد السريع](#quick-setup)
3. [الخيار 1: PostgreSQL محلي](#option-1-local-postgresql)
4. [الخيار 2: Neon Database للتطوير](#option-2-neon-dev-database)
5. [تطبيق الترحيلات](#apply-migrations)
6. [التحقق من العزل](#verify-isolation)
7. [استكشاف الأخطاء](#troubleshooting)

---

## 🎯 Overview

هذا المشروع يستخدم بنية منفصلة تماماً بين:

- **الإنتاج (Production)**: قاعدة بيانات Neon على الخادم السحابي
- **التطوير (Development)**: قاعدة بيانات محلية أو Neon منفصلة

### البنية الحالية

```
├── .env.local                    # الإنتاج فقط (غير مرئي لأسباب أمنية)
├── .env.development.local        # التطوير المحلي (جديد)
├── packages/shared/prisma/
│   ├── schema.prisma            # المخطط الموحد
│   └── migrations/              # ملفات الترحيلات
```

---

## ⚡ Quick Setup

### الخطوات السريعة

```bash
# 1. انسخ ملف البيئة التطويرية
cp .env.development.local .env.local

# 2. حدّث DATABASE_URL في .env.local

# 3. قم بتطبيق الترحيلات
pnpm prisma migrate deploy --schema=./packages/shared/prisma/schema.prisma

# 4. أعد توليد Prisma Client
pnpm prisma generate --schema=./packages/shared/prisma/schema.prisma

# 5. شغّل السيرفر
pnpm dev
```

---

## 🐘 Option 1: Local PostgreSQL (الموصى به)

### 1. تثبيت PostgreSQL

#### على Windows:
```powershell
# باستخدام Chocolatey
choco install postgresql

# أو حمّل المثبت من:
# https://www.postgresql.org/download/windows/
```

#### على macOS:
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### على Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. إنشاء قاعدة البيانات المحلية

```bash
# الاتصال بـ PostgreSQL
psql -U postgres

# إنشاء قاعدة بيانات التطوير
CREATE DATABASE speedy_van_dev;

# إنشاء مستخدم (اختياري)
CREATE USER dev_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE speedy_van_dev TO dev_user;

# الخروج
\q
```

### 3. تحديث .env.local

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/speedy_van_dev"
# أو إذا أنشأت مستخدم مخصص:
# DATABASE_URL="postgresql://dev_user:dev_password@localhost:5432/speedy_van_dev"
```

### 4. التحقق من الاتصال

```bash
psql -U postgres -d speedy_van_dev -c "SELECT version();"
```

---

## ☁️ Option 2: Neon Database للتطوير

إذا كنت تفضل استخدام Neon (منفصلة عن الإنتاج):

### 1. إنشاء مشروع جديد في Neon

1. اذهب إلى [console.neon.tech](https://console.neon.tech)
2. أنشئ مشروع جديد (اسم مثل: `speedy-van-development`)
3. اختر المنطقة القريبة منك
4. انسخ Connection String

### 2. تحديث .env.local

```env
DATABASE_URL="postgresql://neondb_owner:YOUR_DEV_PASSWORD@YOUR_DEV_HOST.neon.tech/neondb?sslmode=require&channel_binding=require"
```

⚠️ **تأكد أن هذا رابط مختلف تماماً عن رابط الإنتاج!**

---

## 🔄 Apply Migrations

بعد إعداد قاعدة البيانات المحلية:

### 1. تطبيق جميع الترحيلات

```bash
cd packages/shared
pnpm prisma migrate deploy
```

أو من الجذر:
```bash
pnpm prisma migrate deploy --schema=./packages/shared/prisma/schema.prisma
```

### 2. إعادة توليد Prisma Client

```bash
pnpm prisma generate --schema=./packages/shared/prisma/schema.prisma
```

### 3. (اختياري) إضافة بيانات تجريبية

```bash
# إذا كان لديك سكريبت seed
cd apps/web
pnpm db:seed
```

---

## ✅ Verify Isolation

### تأكد أن التطوير لا يستخدم الإنتاج:

```bash
# افحص DATABASE_URL الحالي
node -e "console.log(process.env.DATABASE_URL)"

# يجب أن يحتوي على:
# - localhost:5432 (PostgreSQL محلي)
# أو
# - YOUR_DEV_HOST.neon.tech (Neon تطويري)

# ❌ يجب ألا يحتوي على:
# - ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech
```

### اختبار الاتصال بالقاعدة

```bash
# استخدم Prisma Studio للتحقق
pnpm prisma studio --schema=./packages/shared/prisma/schema.prisma

# تحقق من الجداول
psql $DATABASE_URL -c "\dt"
```

---

## 🐛 Troubleshooting

### مشكلة: "Can't reach database server"

```bash
# تحقق أن PostgreSQL يعمل
# Windows:
Get-Service postgresql*

# macOS/Linux:
brew services list | grep postgresql
# أو
sudo systemctl status postgresql
```

### مشكلة: "Authentication failed"

```bash
# تحقق من كلمة المرور
psql -U postgres -d speedy_van_dev

# إعادة تعيين كلمة المرور
sudo -u postgres psql
ALTER USER postgres PASSWORD 'new_password';
```

### مشكلة: "Migration failed"

```bash
# تحقق من حالة الترحيلات
pnpm prisma migrate status --schema=./packages/shared/prisma/schema.prisma

# إعادة تطبيق الترحيلات من الصفر
pnpm prisma migrate reset --schema=./packages/shared/prisma/schema.prisma
```

### مشكلة: "Prisma Client not found"

```bash
# أعد توليد Client
pnpm prisma generate --schema=./packages/shared/prisma/schema.prisma

# نظف وأعد التثبيت
pnpm clean
pnpm install
pnpm prisma generate --schema=./packages/shared/prisma/schema.prisma
```

---

## 🔒 Security Checklist

- [ ] ✅ استخدام قاعدة بيانات محلية أو Neon منفصلة للتطوير
- [ ] ✅ .env.local يحتوي على DATABASE_URL محلي فقط
- [ ] ✅ .env.production يحتوي على DATABASE_URL الإنتاج (على Render فقط)
- [ ] ✅ .gitignore يتضمن .env*.local
- [ ] ✅ لا يوجد رابط إنتاجي في أي ملف محلي
- [ ] ✅ NODE_ENV=development في التطوير
- [ ] ✅ SMS و Emails معطلة في التطوير (DISABLE_SMS=true)

---

## 📝 Next Steps

بعد إعداد قاعدة البيانات المحلية:

1. شغّل السيرفر: `pnpm dev`
2. افتح المتصفح: `http://localhost:3000`
3. تحقق من الوظائف الأساسية
4. ابدأ التطوير بأمان!

---

## 📞 Support

إذا واجهت أي مشكلة:

1. تحقق من [Troubleshooting](#troubleshooting)
2. فحص logs: `pnpm dev --debug`
3. راجع [Prisma Documentation](https://www.prisma.io/docs)

---

**آخر تحديث**: {{ current_date }}
**النسخة**: 1.0.0

