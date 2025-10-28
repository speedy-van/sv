# ✅ Company Information Updated

## التاريخ: 2025-10-26

---

## 📋 التغييرات المطبقة

### رقم الهاتف:
```
القديم: +44 7901846297
الجديد: +44 1202129746
```

### العنوان:
```
القديم: 140 Charles Street, Glasgow City, G21 2QB
الجديد: Office 2.18, 1 Barrack street, Hamilton ML3 0DG
```

### البريد الإلكتروني (بدون تغيير):
```
support@speedy-van.co.uk ✅
```

---

## 📁 الملفات المحدثة

### Backend:
1. ✅ `apps/web/src/lib/constants/company.ts`
   - COMPANY_INFO.phone
   - COMPANY_INFO.address
   - COMPANY_CONTACT.phone
   - COMPANY_CONTACT.address
   - COMPANY_CONTACT.supportPhone
   - COMPANY_CONTACT.emergencyPhone

2. ✅ `env.example`
   - NEXT_PUBLIC_COMPANY_PHONE
   - NEXT_PUBLIC_COMPANY_ADDRESS

---

## ⚠️ يجب تحديث `.env.local` يدوياً

يرجى تحديث ملف `.env.local` الخاص بك:

```bash
# في apps/web/.env.local

# Company Information
NEXT_PUBLIC_COMPANY_ADDRESS=Office 2.18, 1 Barrack street, Hamilton ML3 0DG
NEXT_PUBLIC_COMPANY_PHONE=+44 1202129746
NEXT_PUBLIC_COMPANY_EMAIL=support@speedy-van.co.uk
```

---

## 📊 الأماكن التي سيظهر فيها التغيير

### Frontend (UI):
- ✅ Contact page
- ✅ Footer
- ✅ Header
- ✅ About page
- ✅ Privacy policy
- ✅ Terms & conditions
- ✅ Booking success pages
- ✅ Driver application pages

### Schema Markup (SEO):
- ✅ LocalBusinessSchema
- ✅ ContactPointSchema
- ✅ ServicePageSchema
- ✅ StructuredData

### APIs:
- ✅ Invoice generation
- ✅ Email templates
- ✅ SMS messages
- ✅ Support messages

---

## ✅ التحقق

بعد تحديث `.env.local` وإعادة التشغيل، تحقق من:

```bash
# 1. Contact Page
https://speedy-van.co.uk/contact
# يجب أن يظهر:
# Phone: +44 1202129746
# Address: Office 2.18, 1 Barrack street, Hamilton ML3 0DG

# 2. Footer
# يجب أن يظهر الرقم والعنوان الجديد

# 3. Schema Markup (View Source)
# يجب أن يحتوي على الرقم والعنوان الجديد
```

---

## 📝 ملاحظات

1. **الرقم المحلي:** 01202129746
2. **الرقم الدولي:** +44 1202129746
3. **العنوان الرسمي:** Office 2.18, 1 Barrack street, Hamilton ML3 0DG
4. **المدينة:** Hamilton
5. **الرمز البريدي:** ML3 0DG

---

**Last Updated:** 2025-10-26  
**Status:** ✅ Complete  
**Files Updated:** 2 code files + env.example

