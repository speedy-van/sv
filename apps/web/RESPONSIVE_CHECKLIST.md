# Mobile Responsive Checklist

Copy this checklist to your PR description:

---

## 📱 Mobile Responsive Requirements

### ✅ Viewport Meta Tag
- [ ] Confirmed viewport meta exists **exactly once** in production build
- [ ] Ran: `pnpm -C apps/web build` successfully
- [ ] Searched `.next/server` for `name="viewport"` - found exactly 1 per page
- [ ] No duplicate viewport meta tags

### ✅ Mobile Testing (REQUIRED for UI changes)
- [ ] Tested on **iPhone Safari** (or iOS Simulator)
  - Screen: iPhone 15 Pro (393px width)
  - No horizontal scrolling
  - Layout fits screen width
  - Text readable without zooming
- [ ] Tested on **Chrome Android** (or DevTools emulation)
  - Screen: Pixel 5 (393px width)
  - Breakpoints trigger correctly (base/md active, not lg/xl)
  - Touch targets ≥ 44px

### ✅ Code Quality
- [ ] **No fixed widths** above mobile range in new code
  - ❌ Avoided: `w="1200px"`, `minW="1024px"`, `width: 1440px`
  - ✅ Used: `maxW={{ base: "100%", lg: "1200px" }}`
- [ ] **No direct `useBreakpointValue` imports**
  - ❌ Avoided: `import { useBreakpointValue } from '@chakra-ui/react'`
  - ✅ Used: Chakra responsive props (`p={{ base: 4, md: 6 }}`)
- [ ] **Used ResponsiveSection wrapper** for new sections/cards
  - ✅ Imported: `import { ResponsiveSection } from '@/components/layout/ResponsiveSection'`
- [ ] **Responsive props preferred** over JavaScript hooks
  - ✅ Used: `<Box display={{ base: 'block', lg: 'flex' }}>`
  - ❌ Avoided: `const isMobile = useBreakpointValue(...); if (isMobile) ...`

### ✅ Accessibility
- [ ] All touch targets ≥ 44px height (iOS guideline)
- [ ] Input font size ≥ 16px (prevents iOS auto-zoom)
- [ ] No `user-scalable=no` added (accessibility risk)
- [ ] Color contrast passes WCAG AA (use Chakra color tokens)

### ✅ Build Verification
- [ ] `pnpm -C apps/web build` completes without errors
- [ ] No ESLint warnings about restricted imports
- [ ] No TypeScript errors in responsive code
- [ ] Production build tested locally: `pnpm -C apps/web start`

---

## 🧪 Testing Evidence

Attach screenshots or confirm:

**iPhone Safari (393px):**
- [ ] Screenshot attached OR confirmed no issues

**Chrome Android (393px):**
- [ ] Screenshot attached OR confirmed no issues

**DevTools Viewport Check:**
- [ ] Inspected `<head>` element - viewport meta exists

---

## 📝 Files Changed

List the main files modified and briefly describe changes:

- `apps/web/src/...` - [Description]

---

## ⚠️ Breaking Changes

- [ ] None
- [ ] Yes (describe below):

---

## 🔗 Related Issues

- Fixes #[issue-number]
- Related to #[issue-number]

---

_By checking these boxes, I confirm that I have tested mobile responsiveness and followed the guidelines._
