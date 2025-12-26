# iPhone Vertical Text Issue - Technical Report

## Problem Description
On iPhone browsers (Safari/Chrome), the text in the "Most Common Items to Move" category cards is displaying **vertically** (one character per line) instead of horizontally. This issue persists despite multiple attempted fixes.

## What We've Tried So Far

### Attempt 1: Chakra UI Component-Based Fixes
- Replaced `VStack` with pure flexbox (`display="flex"`, `flexDirection="column"`)
- Added inline CSS styles:
  ```css
  wordWrap: 'break-word'
  overflowWrap: 'break-word'
  hyphens: 'auto'
  ```
- **Result**: Failed - Text still vertical

### Attempt 2: Box Component with Inline Styles
- Changed from `Text` to `Box as="span"` 
- Added writing-mode CSS properties:
  ```css
  writingMode: 'horizontal-tb'
  textOrientation: 'mixed'
  ```
- **Result**: Failed - Text still vertical

### Attempt 3: Native HTML span with Full Inline Styles
- Replaced Chakra components with native `<span>` element
- Added comprehensive inline styles including all vendor prefixes
- **Result**: Failed - Text still vertical

### Attempt 4: Global CSS with !important
- Added CSS rules in `globals.css`:
  ```css
  .category-text-horizontal-fix * {
    writing-mode: horizontal-tb !important;
    -webkit-writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
    direction: ltr !important;
  }
  ```
- Added Safari-specific `@supports (-webkit-touch-callout: none)` block
- **Result**: Failed - Text still vertical

### Attempt 5: Pure HTML/CSS Grid (No Chakra)
- Completely replaced `SimpleGrid` with native CSS Grid
- Used pure `<div>` elements instead of `Box` components
- Added multiple CSS classes targeting all elements
- **Result**: Failed - Text still vertical

## Root Cause Analysis
The issue persists despite:
- ✅ Correct CSS properties being applied
- ✅ Multiple !important rules in global CSS
- ✅ No Chakra UI components interfering
- ✅ Inline styles with all vendor prefixes

**Possible causes:**
1. **Parent Container Interference**: The `VStack` component in `WhereAndWhatStepHierarchical.tsx` (line 997) wrapping the entire section may be forcing vertical layout on all children
2. **Chakra Theme Override**: The mobile theme in `mobile-theme.ts` might have global flex settings
3. **Emotion Cache**: The Emotion CSS-in-JS cache might be generating conflicting styles
4. **iPhone-Specific Bug**: Safari on iOS might have a specific rendering bug with flexbox + text

## Current File State
- **File**: `apps/web/src/components/booking/CommonItemsGrid.tsx`
- **Implementation**: Pure HTML/CSS Grid with native div elements
- **Grid**: 3 columns on mobile (currently)
- **Icons**: Using emoji icons (🛋️, 👔, 📦, etc.)

## Recommended Next Steps

### Solution 1: Replace Text with Images ✅ (Requested by Client)
- Use actual furniture images instead of emoji icons
- Images are inherently horizontal and won't be affected by text rendering bugs
- Need to create/source images for: Sofas, Wardrobes, Boxes, Beds, Tables, TVs, Clothing, Chairs, Power Chairs, Kitchen Appliances, Decorations, Books & Shelves
- Images location: `public/images/items/` (currently empty)

### Solution 2: Change Grid to 2 Rows on iPhone ✅ (Requested by Client)
- Reduce cognitive load on mobile
- Change from 3 columns to 2 columns: `grid-template-columns: repeat(2, 1fr)`
- This will create more space for text/images

### Solution 3: Debug Parent VStack
- Replace VStack in `WhereAndWhatStepHierarchical.tsx` with native div
- Test if Chakra's VStack is causing the issue

### Solution 4: Use SVG Text Instead of HTML Text
- Render category names as SVG text elements
- SVG text has different rendering rules and might bypass the bug

## Files Modified
1. `apps/web/src/components/booking/CommonItemsGrid.tsx` - Multiple refactors
2. `apps/web/src/styles/globals.css` - Added category card CSS rules
3. `apps/web/src/lib/popular-items-data.ts` - Created (data structure)

## Browser Testing Needed
- ✅ Desktop Chrome - Working
- ✅ Desktop Safari - Working
- ✅ Desktop Edge - Working
- ❌ iPhone Safari - TEXT VERTICAL (BUG)
- ❌ iPhone Chrome - TEXT VERTICAL (BUG)
- ⚠️ Android Chrome - Unknown (needs testing)

## Client's Requirements
1. ✅ **Replace emoji icons with actual furniture images** - IMPLEMENTED
   - Added `imagePath` property to all 13 categories
   - Created fallback mechanism: if image fails, displays emoji
   - Images should be placed in: `public/images/items/`
   - See `public/images/items/README.md` for image specifications

2. ✅ **Change grid from 3 columns to 2 columns on iPhone** - IMPLEMENTED
   - Changed CSS Grid from `repeat(3, 1fr)` to `repeat(2, 1fr)`
   - Provides better spacing and larger tap targets on mobile
   - Desktop maintains 9 columns (media query at 768px)

3. ⚠️ **Fix vertical text issue** - STILL INVESTIGATING
   - Text may appear horizontal with images instead of emoji
   - Emoji rendering might be causing the vertical layout bug
   - Needs testing with actual images on iPhone

## Files Modified (Latest Changes)
1. ✅ `apps/web/src/lib/popular-items-data.ts` - Added `imagePath` to all categories
2. ✅ `apps/web/src/components/booking/CommonItemsGrid.tsx` - Changed to 2-column grid, added image support
3. ✅ `apps/web/src/styles/globals.css` - Updated grid CSS to 2 columns
4. ✅ `apps/web/public/images/items/README.md` - Created image specification guide

## Next Steps for Developer

### 1. Add Category Images (HIGH PRIORITY)
- Place 13 PNG images in `public/images/items/`
- Required files: `sofa.png`, `wardrobe.png`, `boxes.png`, `bed.png`, `table.png`, `tv.png`, `clothing.png`, `chair.png`, `power-chair.png`, `appliances.png`, `decorations.png`, `books.png`, `custom.png`
- Recommended size: 96x96px PNG with transparent background
- See `public/images/items/README.md` for full specifications

### 2. Test on iPhone After Adding Images
- The vertical text bug might be caused by emoji rendering on iOS
- Using actual images may resolve the issue automatically
- Test on both Safari and Chrome on iPhone

### 3. If Text Issue Persists After Images
- Try replacing parent VStack in `WhereAndWhatStepHierarchical.tsx` (line 997) with native div
- Add explicit CSS: `flex-direction: row; flex-wrap: wrap;`
- Consider using SVG text instead of HTML text

### 4. Verify Grid Layout
- Confirm 2-column layout looks good on iPhone
- Check spacing and tap target sizes (should be minimum 44px for iOS)

---

**Priority**: CRITICAL  
**Impact**: User Experience on Mobile (Primary platform)  
**Status**: IN PROGRESS - Requires image assets and grid adjustment
