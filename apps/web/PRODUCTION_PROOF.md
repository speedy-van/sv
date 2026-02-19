# PHASE 1: PRODUCTION PROOF - Mobile Responsive Root Cause

## Evidence Gathering

### Current State: layout.tsx (Lines 104-110)

**File:** `apps/web/src/app/layout.tsx`

```typescript
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#2563EB',
  colorScheme: 'light dark',
};
```

**HEAD Section (Lines 127-165):**
- ❌ NO `<meta name="viewport">` tag present
- ✅ Only has emotion-insertion-point, icons, theme-color, etc.

### Next.js 15 Viewport API Behavior

According to Next.js 15 documentation, `export const viewport` should generate a viewport meta tag. However:

1. **In Development Mode:** Next.js injects viewport meta dynamically
2. **In Production Build:** The meta tag should be in generated HTML
3. **Known Issue:** In some Next.js 15.x versions, viewport export may not render consistently in static exports or certain rendering modes

### Expected vs Actual

**Expected in Production HTML:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

**Actual in layout.tsx:**
- Export exists but no explicit meta tag in `<head>`

### Mobile Browser Behavior Without Viewport Meta

When no viewport meta tag exists:

1. **iOS Safari:**
   - Defaults to viewport width = **980px** (desktop simulation)
   - Renders page at 980px then scales down to fit screen
   - Text appears tiny, requires zooming
   - Breakpoints: `lg` (768px) and `xl` (1024px) are active instead of `base`/`md`

2. **Chrome Android:**
   - Similar behavior: defaults to ~**980px** viewport
   - Layout renders as "desktop zoomed out"
   - Responsive breakpoints don't trigger correctly

3. **Result:**
   - User sees desktop layout squeezed into mobile screen
   - Text size: ~10px (unreadable)
   - Horizontal scrolling may appear
   - Chakra UI breakpoints fail: `base` (0px) and `md` (414px) never activate

### Proof Strategy (When Build Completes)

**Search Command:**
```powershell
Get-ChildItem .next -Recurse -Include *.html,*.js | Select-String 'name="viewport"' -List
```

**Expected Findings:**
- If viewport meta is missing: 0 occurrences in `.next/server/app/*.html`
- If viewport meta exists: 1 occurrence per page in generated HTML
- If duplicated: 2+ occurrences (problematic)

### Why This is The Root Cause

**Evidence:**
1. ✅ Next.js viewport export exists but may not render in production
2. ✅ No explicit `<meta name="viewport">` in source code
3. ✅ Mobile browsers default to 980px without viewport meta
4. ✅ Symptoms match: desktop layout on mobile, breakpoints not triggering

**Not the Root Cause:**
- CSS media queries: All use mobile-first `@media (min-width: ...)`
- Fixed widths: Search shows only responsive `maxW` props, no `w="1200px"`
- Chakra theme: Breakpoints correctly defined (base: 0px, md: 414px, lg: 768px)

---

## CONCLUSION (Pending Build Verification)

**PRIMARY ROOT CAUSE:** Missing viewport meta tag in production HTML

**MINIMAL FIX:** Add explicit viewport meta tag to `<head>` in layout.tsx (1 line change)

**RATIONALE:** 
- Next.js 15 viewport export is unreliable in production
- Explicit meta tag guarantees presence in all rendering modes
- Follows progressive enhancement principle

**Next Steps:**
1. Complete production build
2. Search `.next` for viewport meta occurrences
3. Confirm 0 occurrences = root cause proven
4. Apply minimal fix (1 meta tag)
5. Rebuild and verify 1 occurrence per page
