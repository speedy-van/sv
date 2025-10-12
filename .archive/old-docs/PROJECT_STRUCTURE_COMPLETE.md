# 🏗️ هيكل المشروع الكامل - Speedy Van

## 📁 الهيكل العام للمشروع

```
c:\sv\
├── 📄 Configuration Files
│   ├── package.json                    # إعدادات المشروع الرئيسي
│   ├── pnpm-workspace.yaml            # إعدادات مساحة عمل pnpm
│   ├── pnpm-lock.yaml                 # قفل تبعيات pnpm
│   ├── turbo.json                     # إعدادات Turbo
│   ├── tsconfig.json                  # إعدادات TypeScript الرئيسي
│   ├── jest.config.js                 # إعدادات Jest للاختبارات
│   ├── jest.setup.js                  # إعداد Jest
│   ├── docker-compose.yml             # Docker Compose
│   ├── Dockerfile                     # Docker image
│   ├── .gitignore                     # ملفات مستبعدة من Git
│   ├── env.example                    # مثال متغيرات البيئة
│   ├── env.production                 # متغيرات الإنتاج
│   └── env.download                   # متغيرات التحميل
│
├── 📱 Applications
│   └── apps/
│       └── web/                       # التطبيق الرئيسي Next.js
│
├── 📦 Packages (Monorepo)
│   └── packages/
│       ├── shared/                    # الحزمة المشتركة
│       ├── utils/                     # أدوات مساعدة
│       └── pricing/                   # محرك التسعير
│
├── 🗄️ Database
│   └── prisma/
│       └── migrations/                # هجرات قاعدة البيانات
│
├── 🧪 Testing
│   └── __tests__/
│       ├── pricing-unification.test.ts
│       └── temp/                      # ملفات اختبار مؤقتة
│
├── 📚 Documentation
│   ├── docs/                         # وثائق المشروع
│   ├── cursor_tasks/                 # مهام المطور
│   └── svs/                         # وثائق SVS
│
└── 📋 Project Documentation Files
    ├── BOOKING_STRUCTURE_EXPLANATION.md
    ├── UNIFIED_PROJECT_WORKFLOW.md
    ├── DEPLOYMENT_CHECKLIST.md
    ├── API_CONTRACTS.md
    └── [50+ other .md files]
```

---

## 🌐 التطبيق الرئيسي (apps/web/)

```
apps/web/
├── 📄 Configuration
│   ├── package.json                   # تبعيات التطبيق
│   ├── next.config.mjs               # إعدادات Next.js
│   ├── next-env.d.ts                 # تعريفات Next.js
│   ├── tsconfig.json                 # إعدادات TypeScript
│   ├── jest.config.js                # إعدادات الاختبارات
│   ├── playwright.config.ts          # إعدادات Playwright
│   ├── next-sitemap.config.js        # إعدادات Sitemap
│   └── lighthouserc.json             # إعدادات Lighthouse
│
├── 🗄️ Database & Schema
│   └── prisma/
│       ├── schema.prisma             # مخطط قاعدة البيانات
│       ├── seed.ts                   # بيانات أولية
│       └── migrations/               # هجرات قاعدة البيانات
│           ├── 20250814081640_driver_onboarding/
│           ├── 20250918173951_unified_booking_steps/
│           └── [25+ migration files]
│
├── 🌍 Public Assets
│   └── public/
│       ├── 🖼️ Images
│       │   ├── icons/               # أيقونات التطبيق
│       │   ├── logos/               # شعارات الشركة
│       │   ├── hero/                # صور الصفحة الرئيسية
│       │   ├── services/            # صور الخدمات
│       │   ├── testimonials/        # صور العملاء
│       │   └── [100+ image files]
│       ├── 📱 PWA Assets
│       │   ├── manifest.json        # PWA Manifest
│       │   ├── sw.js                # Service Worker
│       │   └── favicon.ico          # الأيقونة المفضلة
│       └── 📄 Static Files
│           ├── robots.txt           # ملف الروبوت
│           └── sitemap.xml          # خريطة الموقع
│
├── 📜 Scripts & Tools
│   └── scripts/
│       ├── 🔧 Database Scripts
│       │   ├── create-admin.sql
│       │   ├── fix-admin.sql
│       │   ├── check-user.sql
│       │   └── update-password.sql
│       ├── 🛠️ Setup Scripts
│       │   ├── setup-stripe-live.js
│       │   ├── generate-favicons.js
│       │   └── [30+ utility scripts]
│       └── 🔄 Fix Scripts
│           ├── fix-auth-imports.ps1
│           ├── fix-typescript-errors.ps1
│           └── [10+ PowerShell scripts]
│
└── 💾 Uploads & Storage
    └── uploads/
        └── driver-applications/       # ملفات طلبات السائقين
```

---

## 💻 Source Code (src/)

```
src/
├── 🏠 App Directory (Next.js 13+ App Router)
│   └── app/
│       ├── 🌐 Public Routes
│       │   ├── (public)/
│       │   │   ├── page.tsx                    # الصفحة الرئيسية
│       │   │   ├── about/page.tsx              # صفحة عن الشركة
│       │   │   ├── how-it-works/page.tsx       # كيف يعمل النظام
│       │   │   ├── terms/page.tsx              # الشروط والأحكام
│       │   │   ├── privacy/page.tsx            # سياسة الخصوصية
│       │   │   ├── legal/cookies/page.tsx      # سياسة ملفات تعريف الارتباط
│       │   │   └── cancellation/page.tsx       # سياسة الإلغاء
│       │   │
│       │   ├── 🇬🇧 UK Location Pages
│       │   │   └── uk/
│       │   │       ├── page.tsx                # صفحة المملكة المتحدة
│       │   │       ├── london/page.tsx         # صفحة لندن
│       │   │       ├── [place]/page.tsx        # صفحات المدن الديناميكية
│       │   │       ├── [...slug]/page.tsx      # مسارات ديناميكية
│       │   │       └── regions/[region]/page.tsx # صفحات المناطق
│       │   │
│       │   └── 🛣️ Route Pages
│       │       └── routes/[from]-to-[to]/page.tsx # صفحات الطرق
│       │
│       ├── 🔐 Authentication
│       │   └── auth/
│       │       ├── login/page.tsx              # صفحة تسجيل الدخول
│       │       ├── forgot/page.tsx             # نسيان كلمة المرور
│       │       ├── reset/page.tsx              # إعادة تعيين كلمة المرور
│       │       ├── verify/page.tsx             # التحقق من البريد
│       │       └── error/page.tsx              # أخطاء المصادقة
│       │
│       ├── 📋 Booking System
│       │   ├── booking/
│       │   │   ├── page.tsx                   # صفحة الحجز القديمة
│       │   │   └── success/page.tsx           # صفحة نجاح الحجز
│       │   └── booking-luxury/
│       │       ├── page.tsx                   # صفحة الحجز الجديدة
│       │       ├── hooks/useBookingForm.ts    # منطق نموذج الحجز
│       │       ├── README.md                  # وثائق نظام الحجز
│       │       └── components/
│       │           ├── WhereAndWhatStep.tsx   # الخطوة الأولى
│       │           ├── WhoAndPaymentStep.tsx  # الخطوة الثانية
│       │           └── PaymentSuccessPage.tsx # صفحة نجاح الدفع
│       │
│       ├── 👤 Customer Portal
│       │   └── customer/
│       │       ├── page.tsx                   # لوحة تحكم العميل
│       │       └── bookings/page.tsx          # حجوزات العميل
│       │
│       ├── 🚚 Driver Portal
│       │   ├── driver/
│       │   │   ├── page.tsx                   # لوحة تحكم السائق
│       │   │   ├── login/page.tsx             # تسجيل دخول السائق
│       │   │   └── jobs/page.tsx              # وظائف السائق
│       │   └── driver-application/
│       │       ├── page.tsx                   # طلب انضمام السائق
│       │       └── success/page.tsx           # نجاح طلب الانضمام
│       │
│       ├── 👨‍💼 Admin Dashboard
│       │   └── admin/
│       │       ├── page.tsx                   # لوحة تحكم الإدارة
│       │       ├── login/page.tsx             # تسجيل دخول الإدارة
│       │       ├── dashboard/page.tsx         # الصفحة الرئيسية للإدارة
│       │       ├── orders/
│       │       │   ├── page.tsx               # إدارة الطلبات
│       │       │   └── [id]/page.tsx          # تفاصيل الطلب
│       │       ├── customers/
│       │       │   ├── page.tsx               # إدارة العملاء
│       │       │   └── [id]/page.tsx          # ملف العميل
│       │       ├── drivers/
│       │       │   ├── page.tsx               # إدارة السائقين
│       │       │   └── applications/page.tsx  # طلبات السائقين
│       │       ├── finance/
│       │       │   ├── page.tsx               # الإدارة المالية
│       │       │   ├── invoices/page.tsx      # الفواتير
│       │       │   ├── ledger/page.tsx        # دفتر الحسابات
│       │       │   ├── payouts/page.tsx       # المدفوعات للسائقين
│       │       │   └── refunds/page.tsx       # المبالغ المستردة
│       │       ├── analytics/
│       │       │   ├── page.tsx               # التحليلات
│       │       │   └── reports/page.tsx       # التقارير
│       │       ├── dispatch/
│       │       │   ├── page.tsx               # نظام الإرسال
│       │       │   └── map/page.tsx           # خريطة الإرسال
│       │       ├── tracking/
│       │       │   ├── page.tsx               # التتبع الأساسي
│       │       │   └── enhanced/page.tsx      # التتبع المحسن
│       │       ├── settings/
│       │       │   ├── page.tsx               # الإعدادات العامة
│       │       │   ├── pricing/page.tsx       # إعدادات التسعير
│       │       │   ├── team/page.tsx          # إدارة الفريق
│       │       │   ├── security/page.tsx      # إعدادات الأمان
│       │       │   ├── integrations/page.tsx  # التكاملات
│       │       │   └── legal/page.tsx         # الإعدادات القانونية
│       │       ├── content/
│       │       │   ├── page.tsx               # إدارة المحتوى
│       │       │   ├── areas/page.tsx         # إدارة المناطق
│       │       │   └── promos/page.tsx        # إدارة العروض
│       │       ├── chat/page.tsx              # نظام الدردشة
│       │       ├── audit/page.tsx             # سجل المراجعة
│       │       ├── health/page.tsx            # صحة النظام
│       │       ├── logs/
│       │       │   ├── page.tsx               # السجلات
│       │       │   └── errors/page.tsx        # سجل الأخطاء
│       │       ├── users/page.tsx             # إدارة المستخدمين
│       │       ├── visitors/page.tsx          # إحصائيات الزوار
│       │       └── payouts/page.tsx           # مدفوعات السائقين
│       │
│       ├── 📊 Dashboard
│       │   └── dashboard/page.tsx             # لوحة تحكم عامة
│       │
│       ├── 🛠️ Developer Tools
│       │   └── developer/page.tsx             # أدوات المطور
│       │
│       ├── 📱 Offline Support
│       │   └── offline/page.tsx               # صفحة عدم الاتصال
│       │
│       ├── 📄 SEO & Meta
│       │   ├── layout.tsx                     # تخطيط عام
│       │   ├── favicon.ico                    # الأيقونة المفضلة
│       │   ├── icon.svg                       # أيقونة SVG
│       │   ├── robots.txt/route.ts            # ملف الروبوت الديناميكي
│       │   ├── sitemap.xml/route.ts           # خريطة الموقع
│       │   ├── sitemap-index.xml/route.ts     # فهرس خريطة الموقع
│       │   └── sitemaps/[n]/route.ts          # خرائط مواقع ديناميكية
│       │
│       └── 🔗 API Routes (189 files)
│           └── api/
│               ├── 🔐 Authentication
│               │   ├── auth/[...nextauth]/route.ts    # NextAuth
│               │   ├── auth/forgot/route.ts           # نسيان كلمة المرور
│               │   ├── auth/register/route.ts         # التسجيل
│               │   ├── auth/verify-email/route.ts     # التحقق من البريد
│               │   └── auth/resend-verification/route.ts
│               │
│               ├── 📋 Booking APIs
│               │   ├── bookings/create/route.ts       # إنشاء حجز
│               │   ├── bookings/[id]/route.ts         # تفاصيل الحجز
│               │   ├── booking/send-confirmations/route.ts
│               │   └── availability/check/route.ts    # التحقق من التوفر
│               │
│               ├── 💳 Payment APIs
│               │   ├── payment/create-checkout-session/route.ts
│               │   ├── payment/webhook/route.ts       # Webhook عام
│               │   ├── payment/apple-pay-validate/route.ts
│               │   ├── payment/apple-pay-process/route.ts
│               │   ├── payment/google-pay-process/route.ts
│               │   └── stripe/
│               │       ├── create-payment-intent/route.ts
│               │       ├── cancel-order/route.ts
│               │       ├── session/[sessionId]/route.ts
│               │       └── webhooks/stripe/route.ts   # Stripe Webhook
│               │
│               ├── 👤 Customer APIs
│               │   ├── customer/me/route.ts           # بيانات العميل
│               │   ├── customer/dashboard/route.ts    # لوحة تحكم العميل
│               │   ├── customer/bookings/route.ts     # حجوزات العميل
│               │   ├── customer/bookings/[id]/link/route.ts
│               │   ├── customer/orders/route.ts       # طلبات العميل
│               │   ├── customer/orders/[code]/route.ts
│               │   ├── customer/orders/[code]/cancel/route.ts
│               │   ├── customer/orders/[code]/invoice/route.ts
│               │   ├── customer/orders/[code]/receipt/route.ts
│               │   └── customer/settings/
│               │       ├── route.ts                   # إعدادات العميل
│               │       ├── profile/route.ts           # الملف الشخصي
│               │       ├── password/route.ts          # تغيير كلمة المرور
│               │       ├── notifications/route.ts     # إعدادات الإشعارات
│               │       └── 2fa/route.ts               # المصادقة الثنائية
│               │
│               ├── 🚚 Driver APIs
│               │   ├── driver/auth/
│               │   │   ├── login/route.ts             # تسجيل دخول السائق
│               │   │   ├── forgot/route.ts            # نسيان كلمة المرور
│               │   │   └── reset/route.ts             # إعادة تعيين كلمة المرور
│               │   ├── driver/applications/route.ts   # طلبات انضمام السائقين
│               │   ├── driver/dashboard/route.ts      # لوحة تحكم السائق
│               │   ├── driver/profile/route.ts        # ملف السائق الشخصي
│               │   ├── driver/availability/route.ts   # توفر السائق
│               │   ├── driver/availability/windows/route.ts
│               │   ├── driver/session/route.ts        # جلسة السائق
│               │   ├── driver/jobs/
│               │   │   ├── available/route.ts         # الوظائف المتاحة
│               │   │   ├── active/route.ts            # الوظائف النشطة
│               │   │   ├── expire-claimed/route.ts    # انتهاء صلاحية المطالبة
│               │   │   └── [id]/
│               │   │       ├── route.ts               # تفاصيل الوظيفة
│               │   │       ├── accept/route.ts        # قبول الوظيفة
│               │   │       ├── decline/route.ts       # رفض الوظيفة
│               │   │       ├── claim/route.ts         # المطالبة بالوظيفة
│               │   │       ├── details/route.ts       # تفاصيل إضافية
│               │   │       ├── progress/route.ts      # تقدم الوظيفة
│               │   │       └── media/route.ts         # وسائط الوظيفة
│               │   ├── driver/earnings/route.ts       # أرباح السائق
│               │   ├── driver/payouts/route.ts        # مدفوعات السائق
│               │   ├── driver/payout-settings/route.ts
│               │   ├── driver/performance/route.ts    # أداء السائق
│               │   ├── driver/schedule/route.ts       # جدول السائق
│               │   ├── driver/schedule/export/route.ts
│               │   ├── driver/shifts/route.ts         # نوبات السائق
│               │   ├── driver/shifts/[id]/route.ts    # تفاصيل النوبة
│               │   ├── driver/location/route.ts       # موقع السائق
│               │   ├── driver/tracking/route.ts       # تتبع السائق
│               │   ├── driver/notifications/route.ts  # إشعارات السائق
│               │   ├── driver/notifications/read/route.ts
│               │   ├── driver/incidents/route.ts      # حوادث السائق
│               │   ├── driver/tips/route.ts           # إكراميات السائق
│               │   ├── driver/documents/route.ts      # وثائق السائق
│               │   ├── driver/onboarding/route.ts     # تأهيل السائق
│               │   ├── driver/push-subscription/route.ts
│               │   ├── driver/privacy/
│               │   │   ├── export/route.ts            # تصدير البيانات
│               │   │   └── delete/route.ts            # حذف البيانات
│               │   └── driver/security/2fa/route.ts   # المصادقة الثنائية
│               │
│               ├── 👨‍💼 Admin APIs
│               │   ├── admin/dashboard/route.ts       # لوحة تحكم الإدارة
│               │   ├── admin/dashboard-enhanced/route.ts
│               │   ├── admin/orders/
│               │   │   ├── route.ts                   # إدارة الطلبات
│               │   │   ├── bulk/route.ts              # عمليات مجمعة
│               │   │   └── [code]/
│               │   │       ├── route.ts               # تفاصيل الطلب
│               │   │       ├── assign/route.ts        # تعيين السائق
│               │   │       └── tracking/route.ts      # تتبع الطلب
│               │   ├── admin/customers/
│               │   │   ├── route.ts                   # إدارة العملاء
│               │   │   ├── export/route.ts            # تصدير العملاء
│               │   │   └── [id]/
│               │   │       ├── route.ts               # ملف العميل
│               │   │       └── actions/route.ts       # إجراءات العميل
│               │   ├── admin/drivers/
│               │   │   ├── route.ts                   # إدارة السائقين
│               │   │   ├── applications/route.ts      # طلبات السائقين
│               │   │   ├── applications/[id]/
│               │   │   │   ├── approve/route.ts       # الموافقة على الطلب
│               │   │   │   ├── reject/route.ts        # رفض الطلب
│               │   │   │   └── request_info/route.ts  # طلب معلومات إضافية
│               │   │   └── [id]/
│               │   │       ├── route.ts               # ملف السائق
│               │   │       ├── activate/route.ts      # تفعيل السائق
│               │   │       ├── suspend/route.ts       # تعليق السائق
│               │   │       ├── review/route.ts        # مراجعة السائق
│               │   │       ├── force-logout/route.ts  # إجبار تسجيل الخروج
│               │   │       └── reset-device/route.ts  # إعادة تعيين الجهاز
│               │   ├── admin/finance/
│               │   │   ├── route.ts                   # الإدارة المالية
│               │   │   ├── ledger/route.ts            # دفتر الحسابات
│               │   │   ├── payouts/route.ts           # المدفوعات
│               │   │   ├── payouts/[id]/process/route.ts
│               │   │   └── refunds/route.ts           # المبالغ المستردة
│               │   ├── admin/analytics/
│               │   │   ├── route.ts                   # التحليلات
│               │   │   ├── reports/route.ts           # التقارير
│               │   │   └── reports/
│               │   │       ├── [id]/route.ts          # تفاصيل التقرير
│               │   │       ├── [id]/export/route.ts   # تصدير التقرير
│               │   │       ├── [id]/run/route.ts      # تشغيل التقرير
│               │   │       └── preview/route.ts       # معاينة التقرير
│               │   ├── admin/dispatch/
│               │   │   ├── assign/route.ts            # تعيين يدوي
│               │   │   ├── auto-assign/route.ts       # تعيين تلقائي
│               │   │   ├── smart-assign/route.ts      # تعيين ذكي
│               │   │   ├── realtime/route.ts          # الوقت الفعلي
│               │   │   ├── incidents/route.ts         # الحوادث
│               │   │   └── incidents/[id]/route.ts    # تفاصيل الحادثة
│               │   ├── admin/tracking/route.ts        # التتبع
│               │   ├── admin/content/
│               │   │   ├── route.ts                   # إدارة المحتوى
│               │   │   ├── areas/route.ts             # المناطق
│               │   │   └── promos/route.ts            # العروض
│               │   ├── admin/settings/pricing/route.ts # إعدادات التسعير
│               │   ├── admin/audit/route.ts           # سجل المراجعة
│               │   ├── admin/health/route.ts          # صحة النظام
│               │   ├── admin/logs/
│               │   │   ├── route.ts                   # السجلات
│               │   │   └── export/route.ts            # تصدير السجلات
│               │   ├── admin/users/route.ts           # إدارة المستخدمين
│               │   ├── admin/users/[id]/route.ts      # تفاصيل المستخدم
│               │   ├── admin/search/route.ts          # البحث العام
│               │   ├── admin/performance/route.ts     # أداء النظام
│               │   ├── admin/auto-assignment/route.ts # التعيين التلقائي
│               │   ├── admin/notifications/route.ts   # الإشعارات
│               │   ├── admin/notifications/[id]/read/route.ts
│               │   └── admin/refunds/route.ts         # المبالغ المستردة
│               │
│               ├── 🌍 Location & Mapping
│               │   ├── places/
│               │   │   ├── suggest/route.ts           # اقتراحات الأماكن
│               │   │   └── reverse/route.ts           # البحث العكسي
│               │   ├── autocomplete/addresses/route.ts # إكمال العناوين
│               │   ├── geo/search/route.ts            # البحث الجغرافي
│               │   ├── geocoding/reverse/route.ts     # التكويد الجغرافي العكسي
│               │   ├── routing/calculate/route.ts     # حساب الطرق
│               │   ├── routes/optimize/route.ts       # تحسين الطرق
│               │   └── traffic/route/route.ts         # معلومات المرور
│               │
│               ├── 💰 Pricing
│               │   └── pricing/quote/route.ts         # حساب عرض السعر
│               │
│               ├── 🔔 Notifications
│               │   ├── notifications/email/send/route.ts
│               │   ├── notifications/sms/send/route.ts
│               │   ├── notifications/push/send/route.ts
│               │   └── notifications/push/subscribe/route.ts
│               │
│               ├── 💬 Chat System
│               │   ├── chat/guest/route.ts            # دردشة الضيوف
│               │   ├── chat/guest/messages/route.ts   # رسائل الضيوف
│               │   ├── chat/sessions/route.ts         # جلسات الدردشة
│               │   ├── chat/sessions/[sessionId]/
│               │   │   ├── messages/route.ts          # رسائل الجلسة
│               │   │   ├── typing/route.ts            # حالة الكتابة
│               │   │   └── close/route.ts             # إغلاق الجلسة
│               │   ├── chat/[bookingId]/route.ts      # دردشة الحجز
│               │   ├── chat/customer/[customerId]/messages/route.ts
│               │   └── chat/driver/[driverId]/route.ts
│               │
│               ├── 📊 Tracking & Monitoring
│               │   ├── track/[code]/route.ts          # تتبع الطلب
│               │   ├── track/eta/route.ts             # وقت الوصول المتوقع
│               │   ├── telemetry/analytics/route.ts   # تحليلات القياس
│               │   ├── weather/route.ts               # معلومات الطقس
│               │   └── weather/forecast/route.ts      # توقعات الطقس
│               │
│               ├── 📄 Portal APIs
│               │   ├── portal/summary/route.ts        # ملخص البوابة
│               │   ├── portal/profile/route.ts        # الملف الشخصي
│               │   ├── portal/bookings/route.ts       # حجوزات البوابة
│               │   ├── portal/bookings/[id]/track/route.ts
│               │   ├── portal/addresses/route.ts      # عناوين البوابة
│               │   ├── portal/addresses/test/route.ts
│               │   ├── portal/contacts/route.ts       # جهات اتصال البوابة
│               │   ├── portal/invoices/route.ts       # فواتير البوابة
│               │   ├── portal/invoices/[id]/pdf/route.ts
│               │   ├── portal/invoices/export/route.ts
│               │   └── portal/settings/notifications/route.ts
│               │
│               ├── 📧 Email Services
│               │   ├── email/driver-application-notification/route.ts
│               │   └── invoice/generate/route.ts      # توليد الفواتير
│               │
│               ├── 🔄 Real-time Services
│               │   ├── pusher/auth/route.ts           # مصادقة Pusher
│               │   └── dispatch/
│               │       ├── accept/route.ts            # قبول المهمة
│               │       └── decline/route.ts           # رفض المهمة
│               │
│               ├── 🛠️ Utility & System APIs
│               │   ├── me/route.ts                    # معلومات المستخدم الحالي
│               │   ├── health/route.ts                # صحة النظام
│               │   ├── db/ping/route.ts               # اختبار قاعدة البيانات
│               │   ├── consent/route.ts               # إدارة الموافقة
│               │   ├── upload/route.ts                # رفع الملفات
│               │   ├── uploads/[...path]/route.ts     # الوصول للملفات المرفوعة
│               │   ├── errors/route.ts                # تسجيل الأخطاء
│               │   └── errors/reports/route.ts        # تقارير الأخطاء
│               │
│               ├── 🧪 Debug & Testing APIs
│               │   └── debug/
│               │       ├── route.ts                   # صفحة التشخيص
│               │       ├── nextauth/route.ts          # تشخيص NextAuth
│               │       ├── email-test/route.ts        # اختبار البريد الإلكتروني
│               │       ├── mapbox/route.ts            # تشخيص Mapbox
│               │       ├── mapbox-test/route.ts       # اختبار Mapbox
│               │       ├── test-email-flow/route.ts   # اختبار تدفق البريد
│               │       ├── trigger-payment-confirmation/route.ts
│               │       └── trigger-sms-notification/route.ts
│               │
│               └── 🤖 Agent & AI
│                   └── agent/chat/route.ts            # دردشة الوكيل الذكي
│
├── 🧩 Components
│   └── components/
│       ├── 🏠 Site Components
│       │   ├── Hero.tsx                       # بطل الصفحة الرئيسية
│       │   ├── HeroMessage.tsx                # رسالة البطل
│       │   ├── ServiceMapSection.tsx          # قسم خريطة الخدمات
│       │   └── site/
│       │       ├── Header.tsx                 # رأس الموقع
│       │       ├── Footer.tsx                 # تذييل الموقع
│       │       └── Navigation.tsx             # التنقل
│       │
│       ├── 📱 Mobile Components
│       │   └── mobile/
│       │       ├── MobileHeader.tsx           # رأس الجوال
│       │       └── MobileNavigation.tsx       # تنقل الجوال
│       │
│       ├── 🎨 UI Components
│       │   └── ui/
│       │       ├── Button.tsx                 # زر
│       │       ├── Modal.tsx                  # نافذة منبثقة
│       │       └── LoadingSpinner.tsx         # مؤشر التحميل
│       │
│       ├── 📋 Booking Components
│       │   └── booking/
│       │       ├── BookingForm.tsx            # نموذج الحجز
│       │       ├── PricingCalculator.tsx      # حاسبة التسعير
│       │       └── StripePaymentButton.tsx    # زر الدفع
│       │
│       ├── 👨‍💼 Admin Components
│       │   └── admin/
│       │       ├── AdminLayout.tsx            # تخطيط الإدارة
│       │       ├── AdminSidebar.tsx           # الشريط الجانبي
│       │       ├── AdminHeader.tsx            # رأس الإدارة
│       │       ├── DataTable.tsx              # جدول البيانات
│       │       ├── StatsCard.tsx              # بطاقة الإحصائيات
│       │       ├── OrdersTable.tsx            # جدول الطلبات
│       │       ├── CustomersTable.tsx         # جدول العملاء
│       │       ├── DriversTable.tsx           # جدول السائقين
│       │       └── AnalyticsCharts.tsx        # الرسوم البيانية
│       │
│       ├── 👤 Customer Components
│       │   └── customer/
│       │       ├── CustomerDashboard.tsx      # لوحة تحكم العميل
│       │       └── BookingHistory.tsx         # تاريخ الحجوزات
│       │
│       ├── 🚚 Driver Components
│       │   └── driver/
│       │       └── DriverDashboard.tsx        # لوحة تحكم السائق
│       │
│       ├── 💬 Chat Components
│       │   └── Chat/
│       │       ├── ChatWidget.tsx             # ودجة الدردشة
│       │       └── ChatWindow.tsx             # نافذة الدردشة
│       │
│       ├── 🗺️ Map Components
│       │   └── Map/
│       │       └── MapboxMap.tsx              # خريطة Mapbox
│       │
│       ├── 💰 Pricing Components
│       │   └── pricing/
│       │       └── PricingDisplay.tsx         # عرض التسعير
│       │
│       ├── 📄 Schema Components
│       │   └── Schema/
│       │       ├── LocalBusinessSchema.tsx    # مخطط الأعمال المحلية
│       │       ├── ServiceSchema.tsx          # مخطط الخدمة
│       │       └── BreadcrumbSchema.tsx       # مخطط التنقل
│       │
│       ├── 🔒 Consent Components
│       │   └── Consent/
│       │       ├── ConsentBanner.tsx          # شعار الموافقة
│       │       ├── ConsentModal.tsx           # نافذة الموافقة
│       │       ├── CookieSettings.tsx         # إعدادات ملفات تعريف الارتباط
│       │       └── GDPRCompliance.tsx         # امتثال GDPR
│       │
│       ├── 🔄 Shared Components
│       │   └── shared/
│       │       ├── ErrorBoundary.tsx          # حدود الخطأ
│       │       └── LoadingState.tsx           # حالة التحميل
│       │
│       ├── 🎨 Providers
│       │   ├── Providers.tsx                  # موفرو الخدمة الرئيسيون
│       │   ├── ChakraProviders.tsx            # موفر Chakra UI
│       │   └── MotionProvider.tsx             # موفر Framer Motion
│       │
│       └── 🤖 AI Components
│           └── DeveloperAssistant.tsx         # مساعد المطور الذكي
│
├── 🔧 Libraries & Utilities
│   └── lib/
│       ├── 🔐 Authentication
│       │   ├── auth.ts                        # إعدادات المصادقة
│       │   ├── nextauth-config.ts             # إعدادات NextAuth
│       │   ├── nextauth-client.ts             # عميل NextAuth
│       │   ├── nextauth-session.ts            # جلسة NextAuth
│       │   ├── nextauth-middleware.ts         # وسطية NextAuth
│       │   ├── nextauth-debug.ts              # تشخيص NextAuth
│       │   ├── nextauth-fix.ts                # إصلاحات NextAuth
│       │   ├── auth-middleware.ts             # وسطية المصادقة
│       │   └── totp.ts                        # TOTP للمصادقة الثنائية
│       │
│       ├── 📊 Database
│       │   ├── prisma.ts                      # عميل Prisma
│       │   └── audit.ts                       # نظام المراجعة
│       │
│       ├── 💳 Payment Systems
│       │   ├── stripe.ts                      # تكامل Stripe
│       │   └── payment.ts                     # نظام الدفع العام
│       │
│       ├── 📧 Communication
│       │   ├── email/
│       │   │   ├── UnifiedEmailService.ts     # خدمة البريد الموحدة
│       │   │   └── templates.ts               # قوالب البريد
│       │   ├── sms/
│       │   │   └── TheSMSWorksService.ts      # خدمة الرسائل النصية
│       │   ├── notifications/
│       │   │   ├── push-notifications.ts      # الإشعارات الفورية
│       │   │   └── email-notifications.ts     # إشعارات البريد
│       │   ├── notifications.ts               # نظام الإشعارات العام
│       │   └── driver-notifications.ts        # إشعارات السائقين
│       │
│       ├── 🌍 Location & Mapping
│       │   ├── mapbox.ts                      # تكامل Mapbox
│       │   ├── location.ts                    # خدمات الموقع
│       │   ├── location-services.ts           # خدمات الموقع المتقدمة
│       │   ├── routing.ts                     # حساب الطرق
│       │   ├── places.ts                      # إدارة الأماكن
│       │   └── autocomplete/
│       │       ├── mapbox-autocomplete.ts     # إكمال Mapbox التلقائي
│       │       └── places-autocomplete.ts     # إكمال الأماكن التلقائي
│       │
│       ├── 💰 Pricing Engine
│       │   └── pricing/
│       │       ├── calculator.ts              # حاسبة التسعير
│       │       └── rules.ts                   # قواعد التسعير
│       │
│       ├── 📋 Booking System
│       │   └── booking/
│       │       ├── booking-service.ts         # خدمة الحجز
│       │       ├── booking-validation.ts      # التحقق من الحجز
│       │       ├── booking-workflow.ts        # تدفق الحجز
│       │       ├── booking-notifications.ts   # إشعارات الحجز
│       │       ├── booking-status.ts          # حالة الحجز
│       │       └── BookingFormProvider.tsx    # موفر نموذج الحجز
│       │
│       ├── 🔄 Real-time Services
│       │   ├── pusher.ts                      # عميل Pusher
│       │   ├── pusher-client.ts               # عميل Pusher للمتصفح
│       │   ├── pusher-singleton.ts            # Pusher Singleton
│       │   ├── realtime.ts                    # خدمات الوقت الفعلي
│       │   ├── realtime-channels.ts           # قنوات الوقت الفعلي
│       │   └── realtime/
│       │       ├── pusher-service.ts          # خدمة Pusher
│       │       └── websocket-service.ts       # خدمة WebSocket
│       │
│       ├── 📊 Analytics & Monitoring
│       │   ├── analytics.ts                   # نظام التحليلات
│       │   ├── analytics/
│       │   │   ├── google-analytics.ts        # Google Analytics
│       │   │   └── mixpanel.ts                # Mixpanel
│       │   ├── telemetry.ts                   # القياس عن بعد
│       │   ├── performance-monitor.ts         # مراقب الأداء
│       │   ├── system-monitor.ts              # مراقب النظام
│       │   ├── security-monitor.ts            # مراقب الأمان
│       │   ├── monitoring/
│       │   │   └── error-tracking.ts          # تتبع الأخطاء
│       │   └── performance/
│       │       ├── metrics.ts                 # مقاييس الأداء
│       │       └── optimization.ts            # تحسين الأداء
│       │
│       ├── 🛡️ Security & Validation
│       │   ├── validation/
│       │   │   ├── schemas.ts                 # مخططات التحقق
│       │   │   ├── booking-validation.ts      # التحقق من الحجز
│       │   │   └── user-validation.ts         # التحقق من المستخدم
│       │   ├── rate-limit.ts                  # تحديد المعدل
│       │   └── consent.ts                     # إدارة الموافقة
│       │
│       ├── 🔧 Utilities
│       │   ├── utils/
│       │   │   ├── date-utils.ts              # أدوات التاريخ
│       │   │   ├── string-utils.ts            # أدوات النص
│       │   │   ├── format-utils.ts            # أدوات التنسيق
│       │   │   ├── validation-utils.ts        # أدوات التحقق
│       │   │   └── currency-utils.ts          # أدوات العملة
│       │   ├── currency.ts                    # إدارة العملة
│       │   ├── logger.ts                      # نظام السجلات
│       │   ├── cache.ts                       # نظام التخزين المؤقت
│       │   ├── cache/
│       │   │   ├── redis-cache.ts             # تخزين Redis المؤقت
│       │   │   └── memory-cache.ts            # تخزين الذاكرة المؤقت
│       │   ├── retry.ts                       # إعادة المحاولة
│       │   └── ref.ts                         # إدارة المراجع
│       │
│       ├── 🎨 UI & Styling
│       │   ├── motion.ts                      # Framer Motion
│       │   └── rotatingPhrases.ts             # العبارات المتناوبة
│       │
│       ├── 📱 Mobile & Offline
│       │   ├── sw.ts                          # Service Worker
│       │   └── offline.ts                     # الدعم غير المتصل
│       │
│       ├── 🔗 API Integration
│       │   ├── api-client.ts                  # عميل API
│       │   ├── api-response.ts                # استجابة API
│       │   ├── api-error-handler.ts           # معالج أخطاء API
│       │   └── api/
│       │       └── client.ts                  # عميل API متقدم
│       │
│       ├── 🧪 Testing
│       │   ├── test-utils.ts                  # أدوات الاختبار
│       │   └── testing/
│       │       └── test-helpers.ts            # مساعدات الاختبار
│       │
│       ├── 🔄 Services
│       │   ├── services/
│       │   │   └── booking-service.ts         # خدمة الحجز
│       │   ├── customer-bookings.ts           # حجوزات العملاء
│       │   ├── invoices-client.ts             # عميل الفواتير
│       │   └── tracking-service.ts            # خدمة التتبع
│       │
│       ├── 🌤️ Weather & External APIs
│       │   └── useForecast.ts                 # توقعات الطقس
│       │
│       ├── 📄 File Management
│       │   ├── file-upload/
│       │   │   └── upload-service.ts          # خدمة رفع الملفات
│       │   ├── pdf.ts                         # إنشاء PDF
│       │   ├── pdf-server.ts                  # خادم PDF
│       │   └── log-export.ts                  # تصدير السجلات
│       │
│       ├── 🎯 Feature Management
│       │   ├── feature-flags.ts               # أعلام الميزات
│       │   └── image-selection/
│       │       └── image-service.ts           # خدمة اختيار الصور
│       │
│       ├── 🔧 Configuration
│       │   ├── config/
│       │   │   └── app-config.ts              # إعدادات التطبيق
│       │   └── constants/
│       │       └── app-constants.ts           # ثوابت التطبيق
│       │
│       ├── 📚 Documentation
│       │   └── INTEGRATION_README.md          # دليل التكامل
│       │
│       ├── 🔍 SEO & Meta
│       │   └── seo.ts                         # تحسين محركات البحث
│       │
│       ├── 🏢 Business Logic
│       │   ├── booking-id.ts                  # معرفات الحجز
│       │   └── server-actions.ts              # إجراءات الخادم
│       │
│       ├── 🔄 Error Handling
│       │   ├── error-handling.ts              # معالجة الأخطاء
│       │   ├── error-types.ts                 # أنواع الأخطاء
│       │   ├── unified-error-handler-v2.ts    # معالج الأخطاء الموحد
│       │   └── logging/
│       │       ├── error-logger.ts            # مسجل الأخطاء
│       │       └── audit-logger.ts            # مسجل المراجعة
│       │
│       ├── 🧪 Testing & Development
│       │   └── svs-integration-test.ts        # اختبار تكامل SVS
│       │
│       └── 🔗 Schema Management
│           └── schemas/
│               ├── booking-schemas.ts         # مخططات الحجز
│               ├── user-schemas.ts            # مخططات المستخدم
│               └── api-schemas.ts             # مخططات API
│
├── 🎣 Custom Hooks
│   └── hooks/
│       ├── index.ts                           # تصدير الخطافات
│       ├── useAuthRedirect.ts                 # إعادة توجيه المصادقة
│       ├── useChat.ts                         # دردشة
│       ├── useCustomerBookings.ts             # حجوزات العملاء
│       ├── useLoadingStates.ts                # حالات التحميل
│       ├── useMediaQuery.ts                   # استعلامات الوسائط
│       ├── usePerformance.ts                  # الأداء
│       ├── useRealtimeData.ts                 # البيانات في الوقت الفعلي
│       ├── useRealTimeTracking.ts             # التتبع في الوقت الفعلي
│       ├── useRoleBasedRedirect.ts            # إعادة التوجيه حسب الدور
│       ├── useSafeProps.ts                    # الخصائص الآمنة
│       ├── useTrackingUpdates.ts              # تحديثات التتبع
│       └── __tests__/
│           └── hooks.test.ts                  # اختبارات الخطافات
│
├── 🎨 Styling & Theming
│   ├── styles/
│   │   ├── globals.css                        # الأنماط العامة
│   │   ├── mobile-fixes.css                   # إصلاحات الجوال
│   │   ├── mobile-enhancements.css            # تحسينات الجوال
│   │   ├── mobile-chat-improvements.css       # تحسينات دردشة الجوال
│   │   ├── ios-fixes.css                      # إصلاحات iOS
│   │   ├── ios-safari-fixes.css               # إصلاحات Safari iOS
│   │   ├── responsive-design.css              # التصميم المتجاوب
│   │   ├── performance-optimizations.css      # تحسينات الأداء
│   │   ├── booking-fixes.css                  # إصلاحات الحجز
│   │   ├── charts.css                         # أنماط الرسوم البيانية
│   │   ├── video-background.css               # خلفية الفيديو
│   │   ├── route-pages.css                    # صفحات الطرق
│   │   └── uk-place-pages.css                 # صفحات الأماكن البريطانية
│   ├── theme/
│   │   ├── tokens.json                        # رموز التصميم
│   │   └── mobile-theme.ts                    # موضوع الجوال
│   └── theme.ts                               # الموضوع الرئيسي
│
├── 📊 Data & Configuration
│   ├── data/
│   │   ├── places.json                        # بيانات الأماكن
│   │   ├── places.sample.json                 # عينة الأماكن
│   │   └── places.schema.ts                   # مخطط الأماكن
│   └── config/
│       └── env.ts                             # إعدادات البيئة
│
├── 🔧 Types & Interfaces
│   └── types/
│       ├── global.d.ts                        # التعريفات العامة
│       ├── next-auth.d.ts                     # تعريفات NextAuth
│       ├── react-scheduler.d.ts               # تعريفات المجدول
│       ├── shared.ts                          # الأنواع المشتركة
│       ├── api-contracts.ts                   # عقود API
│       └── image-selection.ts                 # اختيار الصور
│
├── 🤖 AI Agent System
│   └── agent/
│       ├── core/                              # النواة الأساسية
│       │   ├── AgentManager.ts                # مدير الوكيل
│       │   ├── CustomerAgentManager.ts        # مدير وكيل العميل
│       │   ├── CustomerAssistant.ts           # مساعد العميل
│       │   ├── DeveloperAssistant.ts          # مساعد المطور
│       │   ├── DevelopmentAdminManager.ts     # مدير إدارة التطوير
│       │   └── MasterAgentManager.ts          # المدير الرئيسي
│       ├── rag/                               # نظام RAG
│       │   ├── embedder.ts                    # المضمن
│       │   ├── loader.ts                      # المحمل
│       │   ├── retriever.ts                   # المسترجع
│       │   └── store.ts                       # المخزن
│       ├── tools/                             # أدوات الوكيل
│       │   ├── booking-tools.ts               # أدوات الحجز
│       │   ├── customer-tools.ts              # أدوات العميل
│       │   ├── driver-tools.ts                # أدوات السائق
│       │   ├── admin-tools.ts                 # أدوات الإدارة
│       │   ├── analytics-tools.ts             # أدوات التحليلات
│       │   ├── notification-tools.ts          # أدوات الإشعارات
│       │   ├── payment-tools.ts               # أدوات الدفع
│       │   ├── location-tools.ts              # أدوات الموقع
│       │   ├── database-tools.ts              # أدوات قاعدة البيانات
│       │   └── system-tools.ts                # أدوات النظام
│       ├── index.ts                           # نقطة الدخول
│       ├── llm.ts                             # نموذج اللغة الكبير
│       ├── router.ts                          # موجه الوكيل
│       ├── types.ts                           # أنواع الوكيل
│       ├── README.md                          # وثائق الوكيل
│       ├── ARCHITECTURE.md                    # هندسة الوكيل
│       └── __tests__/
│           └── agent.smoke.test.ts            # اختبار دخان الوكيل
│
├── 🔄 Middleware
│   ├── middleware.ts                          # الوسطية الرئيسية
│   └── middleware/
│       └── errorCollection.ts                 # جمع الأخطاء
│
├── 📄 Legacy Pages (Pages Router)
│   └── pages/
│       └── api/                               # APIs قديمة (إن وجدت)
│
└── 🧪 Testing
    └── __tests__/
        └── temp/                              # ملفات اختبار مؤقتة
            ├── api-test.ts
            └── zepto-debug.ts
```

---

## 📦 Packages (Monorepo Structure)

```
packages/
├── 🤝 Shared Package
│   └── shared/
│       ├── package.json                       # تبعيات الحزمة المشتركة
│       ├── tsconfig.json                      # إعدادات TypeScript
│       ├── jest.config.js                     # إعدادات الاختبارات
│       ├── prisma/
│       │   └── schema.prisma                  # مخطط قاعدة البيانات المشترك
│       ├── src/
│       │   ├── index.ts                       # نقطة الدخول
│       │   ├── types/index.ts                 # الأنواع المشتركة
│       │   ├── constants/index.ts             # الثوابت المشتركة
│       │   ├── schemas/index.ts               # المخططات المشتركة
│       │   ├── utils/index.ts                 # الأدوات المشتركة
│       │   ├── validators/index.ts            # المدققات المشتركة
│       │   └── errors/index.ts                # الأخطاء المشتركة
│       └── dist/                              # الملفات المبنية
│           ├── [12 compiled files]
│           └── [12 source maps]
│
├── 💰 Pricing Package
│   └── pricing/
│       ├── package.json                       # تبعيات محرك التسعير
│       ├── tsconfig.json                      # إعدادات TypeScript
│       ├── src/
│       │   ├── index.ts                       # نقطة الدخول
│       │   ├── calculator/
│       │   │   └── PricingCalculator.ts       # حاسبة التسعير
│       │   ├── models/
│       │   │   └── PricingModels.ts           # نماذج التسعير
│       │   └── rules/
│       │       └── PricingRules.ts            # قواعد التسعير
│       └── dist/                              # الملفات المبنية
│           ├── [8 compiled files]
│           └── [8 source maps]
│
└── 🔧 Utils Package
    └── utils/
        ├── package.json                       # تبعيات الأدوات
        ├── tsconfig.json                      # إعدادات TypeScript
        ├── src/
        │   ├── index.ts                       # نقطة الدخول
        │   ├── date-utils.ts                  # أدوات التاريخ
        │   ├── string-utils.ts                # أدوات النصوص
        │   ├── validation-utils.ts            # أدوات التحقق
        │   ├── format-utils.ts                # أدوات التنسيق
        │   ├── currency-utils.ts              # أدوات العملة
        │   └── api-utils.ts                   # أدوات API
        └── dist/                              # الملفات المبنية
            ├── [12 compiled files]
            └── [12 source maps]
```

---

## 🧪 Testing Structure

```
Testing Files:
├── 📋 Unit Tests
│   ├── __tests__/
│   │   ├── pricing-unification.test.ts       # اختبارات توحيد التسعير
│   │   └── temp/                             # اختبارات مؤقتة
│   │       ├── api-test.ts
│   │       └── zepto-debug.ts
│   ├── apps/web/__tests__/
│   │   └── temp/                             # اختبارات التطبيق المؤقتة
│   │       ├── api-test.ts
│   │       └── zepto-debug.ts
│   └── src/lib/__tests__/
│       ├── currency.test.ts                   # اختبارات العملة
│       ├── validation.test.ts                 # اختبارات التحقق
│       └── booking.test.ts                    # اختبارات الحجز
│
├── 🎭 E2E Tests (Playwright)
│   └── apps/web/e2e/
│       ├── auth.spec.ts                       # اختبارات المصادقة
│       ├── booking.spec.ts                    # اختبارات الحجز
│       ├── payment.spec.ts                    # اختبارات الدفع
│       ├── admin.spec.ts                      # اختبارات الإدارة
│       ├── driver.spec.ts                     # اختبارات السائق
│       ├── customer.spec.ts                   # اختبارات العميل
│       ├── mobile.spec.ts                     # اختبارات الجوال
│       ├── api.spec.ts                        # اختبارات API
│       ├── performance.spec.ts                # اختبارات الأداء
│       ├── accessibility.spec.ts              # اختبارات إمكانية الوصول
│       ├── seo.spec.ts                        # اختبارات SEO
│       ├── offline.spec.ts                    # اختبارات عدم الاتصال
│       ├── chat.spec.ts                       # اختبارات الدردشة
│       ├── notifications.spec.ts              # اختبارات الإشعارات
│       ├── tracking.spec.ts                   # اختبارات التتبع
│       ├── pricing.spec.ts                    # اختبارات التسعير
│       └── integration.spec.ts                # اختبارات التكامل
│
└── 🔧 Test Configuration
    ├── apps/web/tests/
    │   ├── booking-flow.spec.ts               # تدفق الحجز
    │   ├── schema-validator.spec.ts           # مدقق المخطط
    │   ├── global-setup.ts                    # إعداد عام
    │   └── global-teardown.ts                 # تنظيف عام
    ├── jest.config.js                         # إعدادات Jest الرئيسي
    ├── jest.setup.js                          # إعداد Jest
    ├── apps/web/jest.config.js                # إعدادات Jest للتطبيق
    ├── apps/web/jest.setup.js                 # إعداد Jest للتطبيق
    ├── apps/web/playwright.config.ts          # إعدادات Playwright
    └── packages/shared/jest.config.js         # إعدادات Jest للحزمة المشتركة
```

---

## 📚 Documentation Files

```
Documentation:
├── 📋 Project Documentation (Root Level - 50+ files)
│   ├── BOOKING_STRUCTURE_EXPLANATION.md      # شرح هيكل الحجز
│   ├── UNIFIED_PROJECT_WORKFLOW.md           # سير العمل الموحد
│   ├── API_CONTRACTS.md                      # عقود API
│   ├── DEPLOYMENT_CHECKLIST.md               # قائمة النشر
│   ├── STRIPE_PAYMENT_AMOUNT_FIX.md          # إصلاح مبلغ Stripe
│   ├── BOOKING_VS_JOB_STEPS_CLARIFICATION.md # توضيح خطوات الحجز مقابل المهمة
│   ├── DYNAMIC_PRICING_IMPLEMENTATION.md     # تنفيذ التسعير الديناميكي
│   ├── CHAT_SYSTEM_IMPLEMENTATION.md         # تنفيذ نظام الدردشة
│   ├── DRIVER_PORTAL_FOUNDATIONS.md          # أسس بوابة السائق
│   ├── MOBILE_RESPONSIVE_IMPROVEMENTS.md     # تحسينات الاستجابة للجوال
│   ├── EMAIL_SUGGESTIONS_IMPLEMENTATION.md   # تنفيذ اقتراحات البريد
│   ├── ENHANCED_TRACKING_SYSTEM.md           # نظام التتبع المحسن
│   ├── INVOICE_SYSTEM_IMPLEMENTATION.md      # تنفيذ نظام الفواتير
│   ├── NEON_DARK_DESIGN_SYSTEM.md            # نظام التصميم المظلم
│   ├── PERFORMANCE_FIX_INSTRUCTIONS.md       # تعليمات إصلاح الأداء
│   ├── SECURITY_IMPLEMENTATION.md            # تنفيذ الأمان
│   ├── SEO_WORKFLOW.md                       # سير عمل SEO
│   ├── WEATHER_HERO_IMPLEMENTATION.md        # تنفيذ بطل الطقس
│   └── [30+ more documentation files]
│
├── 📖 Docs Directory
│   └── docs/
│       ├── README.md                          # دليل المشروع الرئيسي
│       ├── development-setup.md               # إعداد التطوير
│       ├── seo-runbook.md                     # دليل SEO
│       ├── QUICK_REFERENCE_GUIDE.md           # دليل المرجع السريع
│       ├── TRAINING_MATERIALS.md              # مواد التدريب
│       ├── PRODUCTION_LAUNCH_CHECKLIST.md     # قائمة إطلاق الإنتاج
│       ├── PHASE_7_COMPLETION_SUMMARY.md      # ملخص إكمال المرحلة 7
│       ├── PHASE_7_DOCUMENTATION_AND_TRAINING.md
│       ├── PHASE_8_COMPLETION_SUMMARY.md      # ملخص إكمال المرحلة 8
│       ├── PHASE_8_PRODUCTION_DEPLOYMENT_PLAN.md
│       ├── adr/                               # سجلات قرارات الهندسة المعمارية
│       ├── operations/
│       │   ├── performance.md                 # دليل الأداء
│       │   └── security.md                    # دليل الأمان
│       └── services/
│           └── moving-services.md             # خدمات النقل
│
├── 📋 App-Specific Documentation
│   └── apps/web/
│       ├── README files (30+ files)
│       ├── COMPONENTS_STRUCTURE_FIX.md        # إصلاح هيكل المكونات
│       ├── DESIGN_SYSTEM.md                   # نظام التصميم
│       ├── ENVIRONMENT_SETUP.md               # إعداد البيئة
│       ├── MIDDLEWARE_IMPLEMENTATION.md       # تنفيذ الوسطية
│       ├── NEXTAUTH_IMPLEMENTATION.md         # تنفيذ NextAuth
│       ├── NOTIFICATIONS_IMPLEMENTATION.md    # تنفيذ الإشعارات
│       ├── PRICING_SECURITY_AUDIT.md          # مراجعة أمان التسعير
│       ├── PRODUCTION_CHECKLIST.md            # قائمة الإنتاج
│       ├── QUICK_REFERENCE.md                 # مرجع سريع
│       ├── STRIPE_PRODUCTION_SETUP.md         # إعداد Stripe للإنتاج
│       ├── UK_LOCATION_PAGES_README.md        # صفحات المواقع البريطانية
│       └── [20+ more app documentation files]
│
└── 🎯 Component Documentation
    └── apps/web/src/app/booking-luxury/
        └── README.md                          # وثائق نظام الحجز الفاخر
```

---

## 🔧 Configuration Files

```
Configuration:
├── 📦 Package Management
│   ├── package.json                          # المشروع الرئيسي
│   ├── pnpm-workspace.yaml                   # مساحة عمل pnpm
│   ├── pnpm-lock.yaml                        # قفل التبعيات
│   └── apps/web/package.json                 # تطبيق الويب
│
├── 🏗️ Build Tools
│   ├── turbo.json                             # إعدادات Turbo
│   ├── tsconfig.json                          # TypeScript الرئيسي
│   ├── apps/web/tsconfig.json                 # TypeScript للتطبيق
│   ├── apps/web/next.config.mjs               # إعدادات Next.js
│   └── apps/web/next-env.d.ts                 # تعريفات Next.js
│
├── 🧪 Testing
│   ├── jest.config.js                         # Jest الرئيسي
│   ├── jest.setup.js                          # إعداد Jest
│   ├── apps/web/jest.config.js                # Jest للتطبيق
│   ├── apps/web/jest.setup.js                 # إعداد Jest للتطبيق
│   ├── apps/web/playwright.config.ts          # إعدادات Playwright
│   └── packages/shared/jest.config.js         # Jest للحزمة المشتركة
│
├── 🌐 Web & SEO
│   ├── apps/web/next-sitemap.config.js        # إعدادات Sitemap
│   └── apps/web/lighthouserc.json             # إعدادات Lighthouse
│
├── 🔒 Environment
│   ├── env.example                            # مثال متغيرات البيئة
│   ├── env.production                         # متغيرات الإنتاج
│   ├── env.download                           # متغيرات التحميل
│   └── apps/web/env.template                  # قالب متغيرات التطبيق
│
├── 🐳 Docker
│   ├── Dockerfile                             # صورة Docker
│   └── docker-compose.yml                     # Docker Compose
│
└── 🔧 Other Tools
    ├── .gitignore                             # ملفات مستبعدة من Git
    ├── apps/web/staging-demo/                 # عرض المرحلة التجريبية
    └── cursor_tasks/
        └── catalog-dataset.csv                # بيانات الكتالوج
```

هذا هو الهيكل الكامل للمشروع مع جميع أسماء الملفات والمجلدات. المشروع يتبع هيكل **Monorepo** مع **Next.js 13+ App Router** ويتضمن أكثر من **1000 ملف** موزعة على **189 API route** و**50+ صفحة** و**100+ مكون** و**مئات الأدوات والخدمات**.
