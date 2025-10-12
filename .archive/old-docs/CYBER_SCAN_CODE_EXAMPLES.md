# 💻 أمثلة كود قابلة للنسخ - تأثير المسح السيبراني

## 🎯 نظرة عامة
هذا الملف يحتوي على أمثلة كود جاهزة للنسخ واللصق من تطبيق تأثير المسح السيبراني.

---

## 📦 1. State Variables

```typescript
// إضافة هذه الـ states إلى المكون
const [resolvedSrc, setResolvedSrc] = useState<string>(
  src && src.length > 0 ? src : datasetFallbackImage
);
const [isScanning, setIsScanning] = useState<boolean>(false);
const [isHidden, setIsHidden] = useState<boolean>(false);
const [hasScanned, setHasScanned] = useState<boolean>(false);
```

---

## 🔄 2. useEffect للتحكم في الصورة

```typescript
// useEffect لتحديث الصورة عند تغيير المصدر
useEffect(() => {
  setResolvedSrc(src && src.length > 0 ? src : datasetFallbackImage);
}, [src]);
```

---

## ⏱️ 3. useEffect للتحكم في التوقيت

```typescript
// Trigger scanning effect only once when image is loaded
useEffect(() => {
  if (resolvedSrc && resolvedSrc !== datasetFallbackImage && !hasScanned) {
    // Start scanning immediately
    setIsScanning(true);
    setHasScanned(true);

    // Hide image after 3 seconds (scan duration)
    const hideTimer = setTimeout(() => {
      setIsScanning(false);
      setIsHidden(true);
    }, 3000);

    // Show image again after 10 seconds total
    const showTimer = setTimeout(() => {
      setIsHidden(false);
    }, 10000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(showTimer);
    };
  }
}, [resolvedSrc, hasScanned]);
```

---

## 📦 4. Container الرئيسي

```typescript
<Box
  w={`${size}px`}
  h={`${size}px`}
  borderRadius="xl"
  overflow="hidden"
  border="1px solid"
  borderColor="gray.600"
  bg="gray.900"
  display="flex"
  alignItems="center"
  justifyContent="center"
  position="relative"
>
  {/* المحتوى هنا */}
</Box>
```

---

## 💬 5. رسالة المسح (Scanning Message)

```typescript
{isHidden && (
  <VStack spacing={2}>
    <Text
      color="cyan.400"
      fontWeight="bold"
      fontSize="md"
      textAlign="center"
      sx={{
        animation: 'cyberPulse 1s ease-in-out infinite',
        '@keyframes cyberPulse': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.7, transform: 'scale(1.05)' },
        },
      }}
    >
      ⚡️ SCANNING... ⚡️
    </Text>
  </VStack>
)}
```

---

## 🖼️ 6. Container الصورة مع التأثير

```typescript
{!isHidden && (
  <Box
    position="relative"
    w="full"
    h="full"
    sx={{
      animation: isScanning ? 'cyberFadeOut 3s ease-out forwards' : 'none',
      '@keyframes cyberFadeOut': {
        '0%': { opacity: 1 },
        '90%': { opacity: 1 },
        '100%': { opacity: 0 },
      },
    }}
  >
    <Image
      src={resolvedSrc}
      alt={alt}
      w="full"
      h="full"
      objectFit="cover"
      loading="lazy"
      onError={() =>
        setResolvedSrc((current) => 
          current === datasetFallbackImage ? current : datasetFallbackImage
        )
      }
    />
    
    {/* التأثيرات البصرية هنا */}
  </Box>
)}
```

---

## 🌟 7. Glow Overlay (توهج الخلفية)

```typescript
{isScanning && (
  <Box
    position="absolute"
    top="0"
    left="0"
    right="0"
    bottom="0"
    pointerEvents="none"
    sx={{
      background: 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.1) 48%, rgba(0, 255, 255, 0.3) 50%, rgba(0, 255, 255, 0.1) 52%, transparent 100%)',
      animation: 'cyberGlow 3s ease-in-out forwards',
      '@keyframes cyberGlow': {
        '0%': { 
          background: 'radial-gradient(circle at center, transparent 0%, transparent 100%)',
        },
        '50%': { 
          background: 'radial-gradient(circle at center, rgba(0, 255, 255, 0.2) 0%, transparent 70%)',
        },
        '100%': { 
          background: 'radial-gradient(circle at center, rgba(0, 255, 255, 0.4) 0%, transparent 70%)',
        },
      },
    }}
  />
)}
```

---

## 🔷 8. الشعاع الرئيسي (Main Scan Beam)

```typescript
{isScanning && (
  <Box
    position="absolute"
    top="0"
    left="-10%"
    width="6px"
    height="100%"
    bg="cyan.400"
    sx={{
      boxShadow: '0 0 20px 4px rgba(0, 255, 255, 0.8), 0 0 40px 8px rgba(0, 255, 255, 0.4), 0 0 60px 12px rgba(0, 255, 255, 0.2)',
      filter: 'blur(1px)',
      animation: 'cyberScan 3s ease-in-out forwards',
      '@keyframes cyberScan': {
        '0%': { left: '-10%' },
        '100%': { left: '110%' },
      },
    }}
  />
)}
```

---

## 🔹 9. الخطوط الإضافية (Secondary Scan Lines)

```typescript
{isScanning && (
  <>
    {/* الخط الأول - يظهر عند 25% */}
    <Box
      position="absolute"
      top="0"
      left="-10%"
      width="2px"
      height="100%"
      bg="cyan.300"
      sx={{
        boxShadow: '0 0 10px 2px rgba(0, 255, 255, 0.6)',
        filter: 'blur(0.5px)',
        animation: 'cyberScanSecondary1 3s ease-in-out forwards',
        '@keyframes cyberScanSecondary1': {
          '0%': { left: '-10%', opacity: 0 },
          '25%': { opacity: 1 },
          '100%': { left: '110%', opacity: 0.3 },
        },
      }}
    />
    
    {/* الخط الثاني - يظهر عند 75% */}
    <Box
      position="absolute"
      top="0"
      left="-10%"
      width="2px"
      height="100%"
      bg="cyan.300"
      sx={{
        boxShadow: '0 0 10px 2px rgba(0, 255, 255, 0.6)',
        filter: 'blur(0.5px)',
        animation: 'cyberScanSecondary2 3s ease-in-out forwards',
        '@keyframes cyberScanSecondary2': {
          '0%': { left: '-10%', opacity: 0 },
          '75%': { opacity: 1 },
          '100%': { left: '110%', opacity: 0.3 },
        },
      }}
    />
  </>
)}
```

---

## 🎨 10. CSS Keyframes (للاستخدام في ملفات CSS عادية)

```css
/* حركة الشعاع الرئيسي */
@keyframes cyberScan {
  0% { 
    left: -10%; 
  }
  100% { 
    left: 110%; 
  }
}

/* حركة الخط الأول */
@keyframes cyberScanSecondary1 {
  0% { 
    left: -10%; 
    opacity: 0; 
  }
  25% { 
    opacity: 1; 
  }
  100% { 
    left: 110%; 
    opacity: 0.3; 
  }
}

/* حركة الخط الثاني */
@keyframes cyberScanSecondary2 {
  0% { 
    left: -10%; 
    opacity: 0; 
  }
  75% { 
    opacity: 1; 
  }
  100% { 
    left: 110%; 
    opacity: 0.3; 
  }
}

/* توهج الخلفية */
@keyframes cyberGlow {
  0% { 
    background: radial-gradient(circle at center, transparent 0%, transparent 100%);
  }
  50% { 
    background: radial-gradient(circle at center, rgba(0, 255, 255, 0.2) 0%, transparent 70%);
  }
  100% { 
    background: radial-gradient(circle at center, rgba(0, 255, 255, 0.4) 0%, transparent 70%);
  }
}

/* الاختفاء التدريجي */
@keyframes cyberFadeOut {
  0% { 
    opacity: 1; 
  }
  90% { 
    opacity: 1; 
  }
  100% { 
    opacity: 0; 
  }
}

/* نبض الرسالة */
@keyframes cyberPulse {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.05); 
  }
}
```

---

## 🔧 11. تخصيص الألوان

```typescript
// تغيير لون الشعاع من Cyan إلى Purple
bg="purple.400"  // بدلاً من cyan.400

// تغيير box-shadow للون Purple
boxShadow: '0 0 20px 4px rgba(147, 51, 234, 0.8), 0 0 40px 8px rgba(147, 51, 234, 0.4), 0 0 60px 12px rgba(147, 51, 234, 0.2)'

// تغيير لون التوهج
background: 'radial-gradient(circle at center, rgba(147, 51, 234, 0.4) 0%, transparent 70%)'
```

---

## ⏱️ 12. تخصيص التوقيت

```typescript
// تغيير مدة المسح من 3 ثواني إلى 5 ثواني
const hideTimer = setTimeout(() => {
  setIsScanning(false);
  setIsHidden(true);
}, 5000);  // كان 3000

// تغيير مدة الإخفاء من 10 ثواني إلى 15 ثانية
const showTimer = setTimeout(() => {
  setIsHidden(false);
}, 15000);  // كان 10000

// تغيير مدة الـ animation في CSS
animation: 'cyberScan 5s ease-in-out forwards'  // كان 3s
```

---

## 🔄 13. السماح بالتكرار

```typescript
// إزالة منطق hasScanned للسماح بتكرار التأثير
useEffect(() => {
  if (resolvedSrc && resolvedSrc !== datasetFallbackImage) {
    // لاحظ: أزلنا && !hasScanned
    setIsScanning(true);
    // أزلنا: setHasScanned(true);
    
    const hideTimer = setTimeout(() => {
      setIsScanning(false);
      setIsHidden(true);
    }, 3000);

    const showTimer = setTimeout(() => {
      setIsHidden(false);
    }, 10000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(showTimer);
    };
  }
}, [resolvedSrc]); // أزلنا hasScanned من dependencies
```

---

## 📏 14. تخصيص الحجم

```typescript
// تغيير عرض الشعاع الرئيسي من 6px إلى 10px
width="10px"  // بدلاً من 6px

// تغيير عرض الخطوط الإضافية من 2px إلى 4px
width="4px"  // بدلاً من 2px

// تغيير blur من 1px إلى 2px
filter: 'blur(2px)'  // بدلاً من 1px
```

---

## 🎭 15. إضافة خط ثالث

```typescript
{isScanning && (
  <>
    {/* الخطوط الموجودة */}
    
    {/* خط ثالث جديد - يظهر عند 50% */}
    <Box
      position="absolute"
      top="0"
      left="-10%"
      width="2px"
      height="100%"
      bg="cyan.200"
      sx={{
        boxShadow: '0 0 10px 2px rgba(0, 255, 255, 0.6)',
        filter: 'blur(0.5px)',
        animation: 'cyberScanSecondary3 3s ease-in-out forwards',
        '@keyframes cyberScanSecondary3': {
          '0%': { left: '-10%', opacity: 0 },
          '50%': { opacity: 1 },
          '100%': { left: '110%', opacity: 0.3 },
        },
      }}
    />
  </>
)}
```

---

## 🔊 16. إضافة صوت (مثال)

```typescript
// في بداية المكون
const audioRef = useRef<HTMLAudioElement | null>(null);

// في useEffect
useEffect(() => {
  if (resolvedSrc && resolvedSrc !== datasetFallbackImage && !hasScanned) {
    setIsScanning(true);
    setHasScanned(true);
    
    // تشغيل الصوت
    if (audioRef.current) {
      audioRef.current.play();
    }
    
    // ... باقي الكود
  }
}, [resolvedSrc, hasScanned]);

// في JSX
<audio ref={audioRef} src="/sounds/scan.mp3" preload="auto" />
```

---

## 📊 17. Progress Bar (مثال)

```typescript
{isScanning && (
  <Box
    position="absolute"
    bottom="0"
    left="0"
    right="0"
    height="4px"
    bg="gray.800"
  >
    <Box
      height="100%"
      bg="cyan.400"
      sx={{
        animation: 'progressBar 3s linear forwards',
        '@keyframes progressBar': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      }}
    />
  </Box>
)}
```

---

## 🎨 18. تأثير Particles (مثال بسيط)

```typescript
{isScanning && (
  <Box
    position="absolute"
    top="50%"
    left="50%"
    transform="translate(-50%, -50%)"
  >
    {[...Array(5)].map((_, i) => (
      <Box
        key={i}
        position="absolute"
        width="4px"
        height="4px"
        bg="cyan.400"
        borderRadius="full"
        sx={{
          animation: `particle${i} 3s ease-out forwards`,
          '@keyframes particle0': {
            '0%': { transform: 'translate(0, 0)', opacity: 1 },
            '100%': { transform: 'translate(50px, -50px)', opacity: 0 },
          },
          '@keyframes particle1': {
            '0%': { transform: 'translate(0, 0)', opacity: 1 },
            '100%': { transform: 'translate(-50px, -50px)', opacity: 0 },
          },
          // ... المزيد من الاتجاهات
        }}
      />
    ))}
  </Box>
)}
```

---

## 🧪 19. للاختبار في Console

```javascript
// للتحكم اليدوي في التأثير
// افتح Developer Tools → Console واكتب:

// لبدء المسح
document.querySelector('.image-container').classList.add('scanning');

// لإخفاء الصورة
document.querySelector('.image-container').classList.add('hidden');

// لإعادة الصورة
document.querySelector('.image-container').classList.remove('hidden', 'scanning');
```

---

## 📝 20. TypeScript Types

```typescript
// أنواع البيانات للمكون
interface ItemImageProps {
  src?: string | null;
  alt: string;
  size?: number;
  onScanComplete?: () => void;  // callback اختياري
}

// استخدام مع callback
const ItemImage: React.FC<ItemImageProps> = ({ 
  src, 
  alt, 
  size = 120,
  onScanComplete 
}) => {
  // ... الكود
  
  useEffect(() => {
    if (resolvedSrc && resolvedSrc !== datasetFallbackImage && !hasScanned) {
      setIsScanning(true);
      setHasScanned(true);

      const hideTimer = setTimeout(() => {
        setIsScanning(false);
        setIsHidden(true);
      }, 3000);

      const showTimer = setTimeout(() => {
        setIsHidden(false);
        onScanComplete?.();  // استدعاء callback
      }, 10000);

      return () => {
        clearTimeout(hideTimer);
        clearTimeout(showTimer);
      };
    }
  }, [resolvedSrc, hasScanned, onScanComplete]);
  
  // ... باقي الكود
};
```

---

## 🎯 الخلاصة

هذا الملف يحتوي على **20 مثال كود** قابل للنسخ واللصق مباشرة:

1. ✅ State Variables
2. ✅ useEffect للصورة
3. ✅ useEffect للتوقيت
4. ✅ Container الرئيسي
5. ✅ رسالة المسح
6. ✅ Container الصورة
7. ✅ Glow Overlay
8. ✅ الشعاع الرئيسي
9. ✅ الخطوط الإضافية
10. ✅ CSS Keyframes
11. ✅ تخصيص الألوان
12. ✅ تخصيص التوقيت
13. ✅ السماح بالتكرار
14. ✅ تخصيص الحجم
15. ✅ إضافة خط ثالث
16. ✅ إضافة صوت
17. ✅ Progress Bar
18. ✅ تأثير Particles
19. ✅ الاختبار في Console
20. ✅ TypeScript Types

**جاهز للاستخدام مباشرة! 💪**

---

**تاريخ الإنشاء**: 7 أكتوبر 2025  
**الإصدار**: 1.0.0  
**الحالة**: ✅ جاهز للنسخ
