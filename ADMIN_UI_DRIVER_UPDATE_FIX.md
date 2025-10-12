# إصلاح تحديث واجهة المشرف بعد تعيين السائق

## المشكلة
بعد تعيين سائق للطلب من لوحة المشرف:
- زر "Assign Driver" لا يتغير إلى "Change Driver"
- زر "Remove Driver" غير ظاهر

## السبب الجذري
عدم تطابق في أسماء الحقول بين API والواجهة الأمامية:
- API يرجع `Driver` (بحرف كبير)
- الواجهة الأمامية تتوقع `driver` (بحروف صغيرة)

## الإصلاحات المطبقة

### 1. تصحيح استجابة GET API (`apps/web/src/app/api/admin/orders/[code]/route.ts`)
```typescript
// قبل
Driver: order.Driver ? {
  User: { name, email }
} : null

// بعد
driver: order.Driver ? {
  user: { name, email }
} : null
```

### 2. إضافة زر Remove Driver (`apps/web/src/components/admin/OrderDetailDrawer.tsx`)
```tsx
{order?.driver && (
  <Button
    leftIcon={<FiTrash2 />}
    colorScheme="orange"
    variant="outline"
    size="sm"
    flex={1}
    onClick={handleRemoveDriver}
    isDisabled={order?.status === 'CANCELLED' || order?.status === 'COMPLETED'}
  >
    Remove Driver
  </Button>
)}
```

### 3. تصحيح Remove Driver API (`apps/web/src/app/api/admin/orders/[code]/remove-driver/route.ts`)
تم تصحيح المشاكل التالية:
- أسماء العلاقات في Prisma: `driver` → `Driver`, `user` → `User`
- **معالجة `Assignment` كعلاقة واحدة (optional) وليس مصفوفة**
  - قبل: `if (!booking.Assignment)` و `assignment.id`
  - بعد: `if (booking.Assignment)` مع optional chaining
- استخدام `driverId` المحفوظ بدلاً من `booking.driverId` بعد الحذف
- إضافة معالجة آمنة للحالات التي لا يوجد فيها Assignment

التغييرات الرئيسية:
```typescript
// حفظ driverId قبل الحذف
const driverId = booking.driverId;

// معالجة Assignment كـ optional single relation
if (booking.Assignment) {
  await tx.jobEvent.create({ assignmentId: booking.Assignment.id, ... });
  await tx.assignment.update({ where: { id: booking.Assignment.id }, ... });
}

// استخدام driverId المحفوظ في Pusher و audit log
await pusher.trigger(`driver-${driverId}`, ...);
```

## السلوك المتوقع
1. **عند تعيين سائق جديد:**
   - زر "Assign Driver" يتغير فورًا إلى "Change Driver"
   - يظهر زر "Remove Driver" بلون برتقالي

2. **عند إزالة سائق:**
   - زر "Change Driver" يعود إلى "Assign Driver"
   - يختفي زر "Remove Driver"

3. **الإشعارات:**
   - السائق يتلقى إشعار Pusher عند إزالته
   - لوحة المشرف تُحدث فورًا بعد العمليات

## الملفات المعدلة
- ✅ `apps/web/src/app/api/admin/orders/[code]/route.ts`
- ✅ `apps/web/src/components/admin/OrderDetailDrawer.tsx`
- ✅ `apps/web/src/app/api/admin/orders/[code]/remove-driver/route.ts`

## الاختبار
1. افتح لوحة المشرف → Orders
2. اختر طلبًا بدون سائق
3. اضغط "Assign Driver" → اختر سائقًا
4. تأكد من تغيير الزر إلى "Change Driver"
5. تأكد من ظهور "Remove Driver"
6. اضغط "Remove Driver"
7. تأكد من عودة الزر إلى "Assign Driver"

## الحالة
✅ مكتمل - لا توجد أخطاء TypeScript
