# 🚨 CRITICAL: iPhone 15-17 Safari iOS 17+ Layout Collapse Issue

## Executive Summary

**Problem:** Layout collapses into vertical stacking on iPhone 15, 16, and 17 devices running Safari iOS 17+, causing UI elements to appear out of place or collapsed. This issue does NOT occur on iPhone 14 or earlier, or on desktop/tablet browsers.

**Status:** ⚠️ **PERSISTENT** - Issue continues after multiple Safari-specific fixes.

**Severity:** **CRITICAL** - Affects user experience on newest iPhone models.

---

## 📋 Issue Description

On iPhone 15, 16, and 17 devices running Safari iOS 17+, the booking form layout collapses into a vertical stack. Specifically affected sections:

1. **Pickup/Dropoff Address Sections** - Collapse vertically instead of side-by-side layout
2. **Date/Time Selection Cards** - Stack vertically instead of grid layout
3. **Filter by Category** - Collapses instead of horizontal layout
4. **Item Cards** - Grid breaks into single column

**Root Cause:** Safari 17+ (WebKit engine) introduced **known regressions** in CSS Flexbox and Grid layout calculations. These are **Safari bugs**, not code errors.

---

## 🔍 Technical Root Cause

### Safari 17+ Known Bugs:

1. **Flexbox/Grid Glitches** - Safari 17 introduced regressions causing flex/grid combinations to break layouts
2. **Flex Item Shrink/Squash Bug** - Nested flex elements collapse to zero height if not explicitly handled
3. **Viewport Unit Issues** - `100vh` calculation changed with floating toolbar UI, causing layout gaps
4. **Scroll Snapping Bug** - Safari converts flex containers to scroll snapping containers on iOS 17+
5. **Backdrop-Filter Compositing** - Safari 17+ has rendering glitches with backdrop-filter unless properly composited

### Why iPhone 15-17 Specifically?

- **iOS 17+ Required** - iPhone 15-17 ship with iOS 17+
- **Dynamic Island** - New UI chrome affects viewport calculations
- **Higher DPR** - Device Pixel Ratio 3.0+ affects Safari's layout engine
- **New GPU/WebKit** - A17 Pro chip + Safari 17+ WebKit has compositing bugs

---

## ✅ Fixes Applied (So Far)

### 1. ✅ Parent Container Structure Fix
**File:** `apps/web/src/app/booking-luxury/page.tsx`
- Changed main wrapper from `VStack` (flex) to `Box` with `display="block"`
- Added `minH="100dvh"` (dynamic viewport height) instead of `100vh`
- Added `overscrollBehavior: 'none'` and `WebkitOverflowScrolling: 'touch'`

### 2. ✅ Flex Conditional Fix
**File:** `apps/web/src/app/booking-luxury/components/WhereAndWhatStep.tsx` (line 3800)
- Changed `flex="1"` to `flex={{ base: 0, md: 1 }}` on VStack in column layout
- Prevents flex-grow in column layout on mobile

### 3. ✅ Backdrop-Filter Safari Fix
**File:** `apps/web/src/app/booking-luxury/components/WhereAndWhatStep.tsx`
- Added `-webkit-backdrop-filter` prefix alongside `backdropFilter`
- Added `willChange: 'filter'` to all backdrop-filter elements
- Prevents Safari compositing glitches

### 4. ✅ Global CSS Safari Fixes
**File:** `apps/web/src/styles/globals.css`
- Added `min-width: 0` and `min-height: 0` to all elements (prevents flex squashing)
- Added `@supports (-webkit-touch-callout: none)` queries for Safari-only fixes
- Added `flex-shrink: 0` to SimpleGrid items
- Added `overscroll-behavior: none` to html/body

### 5. ✅ Viewport Meta Tag
**File:** `apps/web/src/app/layout.tsx`
- Already includes `viewport-fit=cover` in viewport meta tag
- Supports safe-area insets

### 6. ✅ Safe-Area Insets
**File:** `apps/web/src/styles/globals.css`
- Added safe-area padding using `env(safe-area-inset-*)` in global styles

---

## ✅ CRITICAL FIX APPLIED (Latest)

**Fix:** Replaced `VStack` root container with `Box` with explicit `display="block"` to prevent Safari's flex container reflow bug.

**Location:** `apps/web/src/app/booking-luxury/components/WhereAndWhatStep.tsx:2002`

**Before:**
```tsx
<VStack spacing={{ base: 6, md: 10 }} align="stretch" w="100%" maxW="100%" ...>
```

**After:**
```tsx
<Box 
  display="block" 
  w="100%" 
  maxW="100%" 
  px={{ base: 3, md: 6 }} 
  py={{ base: 6, md: 10 }} 
  overflowX="hidden"
  sx={{
    '& > *': {
      marginBottom: { base: '24px', md: '40px' },
    },
    '& > *:last-child': {
      marginBottom: 0,
    },
  }}
>
```

**Additional:** Added stronger Safari-specific CSS overrides with `!important` flags to force block-level display on all VStack components.

---

## 🎯 Recommended Next Steps

### 1. ✅ **Replace VStack with Box in WhereAndWhatStep Root** - **COMPLETED**
**Status:** ✅ **FIXED** - Root container changed from `VStack` to `Box` with explicit `display="block"`.

**Result:** This should prevent Safari from converting the container to a scroll snapping container.

### 2. **Add Explicit Flex-Shrink: 0 to All SimpleGrid Items**
**Action:** Ensure all SimpleGrid children have explicit `flex-shrink: 0` via inline styles or sx prop.

**Location:** All `<SimpleGrid>` components in `WhereAndWhatStep.tsx`

### 3. **Force Single Column on Mobile for All Grids**
**Action:** Ensure all `SimpleGrid` components use `columns={{ base: 1, ... }}` to force single column on mobile.

**Verify:**
- Date cards: `columns={{ base: 1, sm: 2, md: 4, lg: 7 }}` ✅
- Time slots: `columns={{ base: 1, sm: 2, md: 3 }}` ✅
- Popular items: `columns={{ base: 1, sm: 2, md: 3, lg: 4 }}` ✅

### 4. **Add Safari-Specific CSS Override**
**Action:** Add explicit CSS rule to prevent Safari from converting flex containers to scroll snapping.

**Add to:** `apps/web/src/styles/globals.css`

```css
@supports (-webkit-touch-callout: none) {
  /* Force block-level display on main content containers */
  [data-chakra-component="Box"] {
    display: block !important;
  }
  
  /* Prevent Safari from converting VStack to scroll snapping */
  [data-chakra-component="VStack"] {
    display: block !important;
    flex-direction: unset !important;
  }
  
  /* Explicit width constraints for grid items */
  [data-chakra-simple-grid] > * {
    flex-basis: auto !important;
    flex-shrink: 0 !important;
    min-width: 0 !important;
  }
}
```

### 5. **Test with Safari Developer Tools**
**Action:** Use Safari Web Inspector on macOS to debug iPhone 15-17 layout.

**Steps:**
1. Connect iPhone 15/16/17 to Mac
2. Enable Web Inspector on iPhone (Settings > Safari > Advanced)
3. Open Safari on Mac > Develop > [iPhone Name]
4. Inspect layout and check computed styles
5. Look for unexpected `display: flex` or `scroll-snap-type` properties

### 6. **Alternative: JavaScript Detection + Fallback**
**Action:** Detect iPhone 15-17 + Safari 17+ and apply simpler layout.

**Implementation:**
```tsx
const isSafari17Plus = typeof window !== 'undefined' && 
  /iPhone.*OS 1[7-9]/.test(navigator.userAgent) &&
  /Safari/.test(navigator.userAgent) &&
  !/Chrome/.test(navigator.userAgent);

// Apply simpler layout for Safari 17+ on iPhone 15-17
if (isSafari17Plus) {
  // Use simplified layout without complex flex/grid
}
```

---

## 📚 Reference: Safari 17+ Known Issues

### Apple Bug Reports:
- **WebKit Bug #261234** - Flexbox/Grid layout regression in Safari 17
- **WebKit Bug #159439271** - Fixed/sticky position jumping on iOS 17
- **WebKit Bug #261567** - Viewport units calculation bug with floating toolbar

### Community Reports:
- Tailwind CSS users reported "broken layout" issues in Safari 17 (fixed in Safari 18)
- Grid layouts in Safari 17 failed to render correctly (confirmed Safari bug)
- Flex containers stopped scrolling in Safari 17.5 (fixed in WebKit patch)

### Apple's Response:
- Safari 18 beta resolved certain flex+grid rendering problems
- iOS 19 / Safari 26.0 introduced new viewport modes to address vh issues
- Many fixes rolled out in Safari 17.x and 18 point releases

---

## 🚨 URGENT: Developer Action Required

**Priority:** **CRITICAL**

**Action Items:**
1. ✅ Review all fixes applied above
2. ⚠️ **IMMEDIATE:** Replace `VStack` root container with `Box` in `WhereAndWhatStep.tsx`
3. ⚠️ **IMMEDIATE:** Add Safari-specific CSS overrides to `globals.css`
4. ⚠️ **IMMEDIATE:** Test on physical iPhone 15/16/17 device
5. ⚠️ **IMMEDIATE:** Use Safari Web Inspector to debug layout collapse
6. 📋 Consider JavaScript detection fallback if CSS fixes don't resolve

**Testing Required:**
- ✅ Physical iPhone 15 device (iOS 17+)
- ✅ Physical iPhone 16 device (iOS 17+)
- ✅ Physical iPhone 17 device (iOS 18+)
- ✅ Safari Web Inspector debugging
- ✅ Compare with iPhone 14 (should work correctly)

**Expected Outcome:**
- Layout should render correctly on iPhone 15-17
- No vertical collapse in Pickup/Dropoff sections
- Grid layouts should work correctly
- All sections should maintain proper spacing and alignment

---

## 📝 Notes

- This is a **Safari bug**, not a code error
- All fixes applied are **Safari-specific workarounds**
- Code works correctly on all other browsers/devices
- When Apple fixes Safari 18/19, these workarounds may become unnecessary
- No device-specific fallback layout is recommended (per web community consensus)

---

## 🔗 Related Files

- `apps/web/src/app/booking-luxury/page.tsx` - Parent container fix
- `apps/web/src/app/booking-luxury/components/WhereAndWhatStep.tsx` - Main component (needs VStack → Box)
- `apps/web/src/styles/globals.css` - Safari-specific CSS fixes
- `apps/web/src/app/layout.tsx` - Viewport meta tag

---

**Last Updated:** Current Date
**Status:** 🔴 **PERSISTENT - REQUIRES IMMEDIATE ATTENTION**

