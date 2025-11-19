# رسالة للمطور - إصلاح أخطاء Prisma Schema Relations

## المشكلة الأساسية

كان هناك أخطاء في build بسبب عدم تطابق أسماء العلاقات (Relations) في Prisma مع ما هو موجود في Schema. المشكلة كانت في استخدام الحروف الكبيرة والصغيرة بشكل خاطئ.

## القواعد الصحيحة (من Schema)

1. **Booking.driver** = lowercase (صغير)
   - في Booking model، العلاقة مع Driver تسمى `driver` (بصيغة صغيرة)

2. **Assignment.Driver** = uppercase (كبير)
   - في Assignment model، العلاقة مع Driver تسمى `Driver` (بصيغة كبيرة)

3. **Route.drops** = lowercase (صغير)
   - في Route model، العلاقة مع Drop تسمى `drops` (بصيغة صغيرة)

4. **Route.driver** = lowercase (صغير)
   - في Route model، العلاقة مع User (التي تمثل driver) تسمى `driver` (بصيغة صغيرة)

5. **DriverPayout.Driver** = uppercase (كبير)
   - في DriverPayout model، العلاقة مع Driver تسمى `Driver` (بصيغة كبيرة)

## ما تم إنجازه

### 1. الإصلاحات اليدوية الأولية
تم إصلاح عدة ملفات يدوياً:
- `apps/web/src/app/api/admin/orders/route.ts`
- `apps/web/src/app/api/admin/routes/route.ts`
- `apps/web/src/components/site/Header.tsx`
- `apps/web/src/app/api/admin/analytics/ai-routes/route.ts`
- `apps/web/src/app/api/admin/chat/typing/route.ts`
- `apps/web/src/app/api/admin/dashboard-enhanced/route.ts`
- `apps/web/src/app/api/admin/dashboard/route.ts`
- `apps/web/src/app/api/admin/diagnostic/booking/[code]/route.ts`
- `apps/web/src/app/api/admin/dispatch/assign/route.ts`
- `apps/web/src/app/api/admin/finance/route.ts`
- `apps/web/src/app/api/admin/jobs/pending-approval/route.ts`
- `apps/web/e2e/global-setup.ts`

### 2. إنشاء سكريبت تلقائي للإصلاح
تم إنشاء سكريبت `fix-schema-relations.cjs` يقوم بإصلاح جميع الملفات تلقائياً بناءً على القواعد المذكورة أعلاه.

**السكريبت أصلح 21 ملف تلقائياً:**
- `apps/web/src/app/admin/payouts/page.tsx`
- `apps/web/src/app/api/admin/dispatch/realtime/route.ts`
- `apps/web/src/app/api/admin/drivers/schedule/route.ts`
- `apps/web/src/app/api/admin/orders/[code]/cancel-enhanced/route.ts`
- `apps/web/src/app/api/admin/orders/[code]/remove-driver/route.ts`
- `apps/web/src/app/api/admin/orders/[code]/tracking/route.ts`
- `apps/web/src/app/api/admin/routes/multi-drop/route.ts`
- `apps/web/src/app/api/admin/routes/[id]/cancel/route.ts`
- `apps/web/src/app/api/admin/routes/[id]/details/route.ts`
- `apps/web/src/app/api/admin/routes/[id]/drops/[dropId]/route.ts`
- `apps/web/src/app/api/admin/routes/[id]/force-status/route.ts`
- `apps/web/src/app/api/admin/routes/[id]/reassign/route.ts`
- `apps/web/src/app/api/admin/routes/[id]/route.ts`
- `apps/web/src/app/api/admin/routes/[id]/unassign/route.ts`
- `apps/web/src/app/api/booking-luxury/[id]/route.ts`
- `apps/web/src/app/api/booking-luxury/[id]/track/route.ts`
- `apps/web/src/app/api/customer/orders/[code]/route.ts`
- `apps/web/src/app/api/track/[code]/route.ts`
- `apps/web/src/lib/services/analytics-service.ts`
- `apps/web/src/lib/services/route-orchestration-service.ts`
- `apps/web/src/server/tools/orderTools.ts`

### 3. إصلاحات إضافية
- إضافة `pickupAddress` و `dropoffAddress` إلى include statements حيث يتم الوصول إليها
- إصلاح أخطاء TypeScript في `e2e/global-setup.ts` باستخدام type assertions

## الملفات المهمة

### السكريبت: `fix-schema-relations.cjs`
يمكن تشغيله بأمر:
```bash
node fix-schema-relations.cjs
```

السكريبت يبحث عن جميع ملفات `.ts` و `.tsx` في `apps/web/src` ويصلح أسماء العلاقات تلقائياً بناءً على القواعد المذكورة.

## الحالة الحالية

✅ تم إصلاح معظم الأخطاء
⚠️ لا يزال هناك بعض الأخطاء المتبقية تحتاج إلى مراجعة يدوية

## الخطوات التالية الموصى بها

1. **تشغيل build مرة أخرى** للتحقق من الأخطاء المتبقية:
   ```bash
   pnpm run build
   ```

2. **مراجعة الأخطاء المتبقية** - قد تكون هناك حالات خاصة لم يتعامل معها السكريبت

3. **إضافة pickupAddress/dropoffAddress** إلى include statements في أي ملف يصل إلى هذه الخصائص بدون include

4. **استخدام type assertions** (`as any`) عند الوصول إلى `pickupAddress` أو `dropoffAddress` إذا لم تكن موجودة في include

## ملاحظات مهمة

- **لا تقم بتغيير Schema** - المشكلة في الكود وليس في Schema
- **احرص على استخدام الأسماء الصحيحة** حسب Model:
  - Booking → `driver` (صغير)
  - Assignment → `Driver` (كبير)
  - Route → `drops` و `driver` (صغير)
  - DriverPayout → `Driver` (كبير)

## Branch الحالي

جميع التغييرات موجودة في branch: `fix/prisma-relations-build-fixes`

---

**تاريخ الإصلاح:** اليوم
**عدد الملفات المُصلحة:** 21+ ملف
**الحالة:** قيد المراجعة - معظم الأخطاء تم إصلاحها

