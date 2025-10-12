# إصلاح Bearer Token Authentication في Driver Jobs API

## المشكلة
تطبيق iOS Driver يحصل على 401 Unauthorized عند محاولة الوصول إلى `/api/driver/jobs/[id]`:
```
🔑 Token added to request: Y21nMHBrc25xMDA3d2t6...
❌ API Error: Request failed with status code 401
🔐 Unauthorized - clearing auth
```

## السبب الجذري
endpoint `/api/driver/jobs/[id]` كان يستخدم فقط `getServerSession(authOptions)` والذي يعمل مع session cookies فقط. التطبيق المحمول يستخدم Bearer token في Authorization header لكن الـ endpoint لم يكن يتحقق منه.

## الإصلاحات المطبقة

### 1. إضافة Bearer Token Authentication
```typescript
// قبل
const session = await getServerSession(authOptions);
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// بعد
const bearerAuth = await authenticateBearerToken(request);
let userId: string;

if (bearerAuth.success) {
  userId = bearerAuth.user.id;
  console.log('🔑 Bearer token authenticated for user:', userId);
} else {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  userId = (session.user as any).id;
}
```

### 2. تصحيح أسماء العلاقات في Prisma
```typescript
// قبل (أسماء خاطئة)
include: {
  pickupAddress: true,
  dropoffAddress: true,
  items: true,
  Assignment: {
    include: {
      Driver: {
        include: {
          user: { ... }  // خطأ: user بحروف صغيرة
        }
      }
    }
  }
}

// بعد (أسماء صحيحة من schema.prisma)
include: {
  BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
  BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
  BookingItem: true,
  Assignment: {
    include: {
      Driver: {
        include: {
          User: { ... }  // صحيح: User بحرف كبير
        }
      }
    }
  }
}
```

### 3. تحديث استخدام الحقول في الكود
```typescript
// إنشاء متغيرات مختصرة للوضوح
const pickupAddress = booking.BookingAddress_Booking_pickupAddressIdToBookingAddress;
const dropoffAddress = booking.BookingAddress_Booking_dropoffAddressIdToBookingAddress;
const pickupProperty = booking.PropertyDetails_Booking_pickupPropertyIdToPropertyDetails;
const dropoffProperty = booking.PropertyDetails_Booking_dropoffPropertyIdToPropertyDetails;

// استخدام المتغيرات في البيانات
addresses: {
  pickup: {
    line1: pickupAddress?.label,
    postcode: pickupAddress?.postcode,
    ...
  }
}
```

### 4. تصحيح Authorization Check
```typescript
// قبل
const isAssigned = booking.Assignment?.Driver?.id === session.user.id;

// بعد
const isAssigned = booking.Assignment?.Driver?.User?.id === userId;
```

### 5. تطبيق نفس الإصلاح على PUT method
تم إضافة Bearer token authentication لـ PUT method أيضًا لدعم عمليات Accept/Start/Complete من التطبيق.

## الملفات المعدلة
- ✅ `apps/web/src/app/api/driver/jobs/[id]/route.ts`

## النتيجة
- ✅ التطبيق المحمول يمكنه الآن الوصول إلى تفاصيل الوظائف باستخدام Bearer token
- ✅ Web dashboard لا يزال يعمل باستخدام session cookies
- ✅ جميع أسماء العلاقات تطابق schema.prisma
- ✅ لا توجد أخطاء TypeScript

## الاختبار
1. سجل دخول في تطبيق iOS Driver
2. انقر على "View Now" لوظيفة معينة
3. تأكد من ظهور تفاصيل الوظيفة بدون 401 error
4. تأكد من أن التطبيق لا يفقد الـ token بعد طلب ناجح
