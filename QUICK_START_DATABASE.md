# 🚀 Quick Start: Database Setup (5 دقائق)

## ⚠️ تحذير حاسم

**لا تستخدم قاعدة بيانات الإنتاج في التطوير المحلي أبداً!**

---

## الإعداد السريع (3 خطوات فقط)

### 1️⃣ إنشاء ملف .env.local

انسخ المحتوى التالي إلى ملف جديد اسمه `.env.local` في جذر المشروع:

```env
# Local Development Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/speedy_van_dev"

# Copy all other variables from env.example
# BUT make sure DATABASE_URL points to localhost!
```

**⚠️ تأكد أن DATABASE_URL يحتوي على `localhost` وليس رابط Neon الإنتاجي!**

---

### 2️⃣ تشغيل سكريبت الإعداد الآلي

```bash
# سيقوم بكل شيء تلقائياً: إنشاء قاعدة البيانات + تطبيق الترحيلات + توليد Client
pnpm tsx scripts/setup-local-database.ts
```

إذا فشل السكريبت أو لم يكن PostgreSQL مثبت، اتبع [الخطوات اليدوية](#الإعداد-اليدوي) أدناه.

---

### 3️⃣ التحقق من العزل

```bash
# تأكد أنك لا تستخدم قاعدة الإنتاج
pnpm tsx scripts/verify-database-isolation.ts
```

إذا رأيت ✅ "All Checks Passed" يمكنك المتابعة بأمان!

---

## تشغيل السيرفر

```bash
pnpm dev
```

افتح المتصفح: http://localhost:3000

---

## الإعداد اليدوي (إذا لم ينجح السكريبت)

### 1. تثبيت PostgreSQL

#### Windows:
```powershell
choco install postgresql
```

#### macOS:
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Linux:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. إنشاء قاعدة البيانات

```bash
psql -U postgres -c "CREATE DATABASE speedy_van_dev;"
```

### 3. تطبيق الترحيلات

```bash
cd packages/shared
pnpm prisma migrate deploy
```

### 4. توليد Prisma Client

```bash
pnpm prisma generate --schema=./packages/shared/prisma/schema.prisma
```

### 5. التحقق

```bash
pnpm tsx scripts/verify-database-isolation.ts
```

---

## ✅ Checklist

قبل البدء في التطوير، تأكد من:

- [ ] ✅ PostgreSQL مثبت ويعمل
- [ ] ✅ `.env.local` موجود ويحتوي على `DATABASE_URL` محلي
- [ ] ✅ قاعدة البيانات `speedy_van_dev` موجودة
- [ ] ✅ الترحيلات مطبقة بنجاح
- [ ] ✅ Prisma Client مُولّد
- [ ] ✅ سكريبت التحقق يمر بنجاح (✅ All Checks Passed)
- [ ] ✅ لا يوجد أي رابط لقاعدة بيانات الإنتاج في `.env.local`

---

## 🐛 Troubleshooting

### المشكلة: "Can't reach database server"

```bash
# تحقق أن PostgreSQL يعمل
# Windows:
Get-Service postgresql*

# macOS:
brew services list

# Linux:
sudo systemctl status postgresql
```

### المشكلة: "Authentication failed"

```bash
# أعد تعيين كلمة المرور
sudo -u postgres psql
ALTER USER postgres PASSWORD 'postgres';
```

### المشكلة: "Database does not exist"

```bash
psql -U postgres -c "CREATE DATABASE speedy_van_dev;"
```

### المشكلة: سكريبت التحقق يفشل

إذا رأيت 🚨 CRITICAL SECURITY ALERT:

1. **توقف فوراً** عن تشغيل أي سيرفر
2. افتح `.env.local`
3. تأكد أن `DATABASE_URL` يحتوي على `localhost` وليس رابط Neon الإنتاجي
4. أعد التحقق: `pnpm tsx scripts/verify-database-isolation.ts`

---

## 📚 للمزيد

راجع [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md) للتفاصيل الكاملة.

---

## 🆘 المساعدة

إذا واجهت أي مشكلة:

1. تحقق من القسم [Troubleshooting](#-troubleshooting)
2. راجع logs: `pnpm dev --debug`
3. راجع [Prisma Docs](https://www.prisma.io/docs)
4. تأكد من إعدادات PostgreSQL

---

**آخر تحديث**: {{ current_date }}

