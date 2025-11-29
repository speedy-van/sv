#!/bin/bash
# إصلاح TurboModule Crash - تنفيذ فوري
# تاريخ: 29 نوفمبر 2025

set -e  # Exit on error

echo "🔧 بدء إصلاح TurboModule Crash..."
echo ""

# التحقق من المجلد الحالي
if [ ! -f "app.json" ]; then
    echo "❌ خطأ: يجب تشغيل هذا السكريبت من داخل mobile/driver-app"
    exit 1
fi

echo "✅ المجلد الحالي: $(pwd)"
echo ""

# المرحلة 1: تثبيت expo-build-properties
echo "📦 المرحلة 1: تثبيت Dependencies المطلوبة..."
pnpm add expo-build-properties
echo "✅ تم تثبيت expo-build-properties"
echo ""

# المرحلة 2: تنظيف شامل
echo "🧹 المرحلة 2: تنظيف Cache والملفات القديمة..."
rm -rf node_modules
rm -rf .expo
rm -rf ios/build 2>/dev/null || true
rm -rf ios/Pods
rm -rf ios/Podfile.lock
rm -f package-lock.json
rm -f yarn.lock
echo "✅ تم التنظيف"
echo ""

# المرحلة 3: إعادة تثبيت Dependencies
echo "📦 المرحلة 3: إعادة تثبيت Dependencies..."
pnpm install
echo "✅ تم تثبيت Dependencies"
echo ""

# المرحلة 4: تحديث iOS Pods
echo "🍎 المرحلة 4: تحديث iOS Pods..."
cd ios
pod deintegrate 2>/dev/null || true
pod install --repo-update
cd ..
echo "✅ تم تحديث iOS Pods"
echo ""

# المرحلة 5: Prebuild
echo "🔨 المرحلة 5: Prebuild Native Modules..."
npx expo prebuild --clean
echo "✅ تم Prebuild"
echo ""

# عرض الملخص
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ اكتمل الإصلاح المحلي بنجاح!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "الخطوات التالية:"
echo "1. راجع app.json - تأكد من:"
echo "   - newArchEnabled: false"
echo "   - buildNumber: \"4\""
echo "   - version: \"2.0.4\""
echo ""
echo "2. بناء Production Build:"
echo "   eas build --platform ios --profile production --clear-cache"
echo ""
echo "3. انتظر اكتمال البناء (~20-30 دقيقة)"
echo ""
echo "4. حمّل وثبّت على iPhone حقيقي"
echo ""
echo "5. اختبر:"
echo "   - يجب أن يفتح مباشرة لشاشة Login"
echo "   - لا توجد شاشة \"Downloading 100%\""
echo "   - لا أخطاء TurboModule"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
