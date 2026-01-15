# 🚨 CRITICAL: Booking Reference Card Protection System

## What Happened?

The **Booking Reference Alert Card** was accidentally deleted from `WhoAndPaymentStep_Simple.tsx` around January 3-13, 2026.

This card displays the booking reference number (e.g., `SV-ABC123`) to customers before payment.

**Without it:** Customers and admins cannot track incomplete bookings.

---

## Protection Systems Now In Place

### ✅ 1. Runtime Warning
Browser console will show **🚨 CRITICAL BUG** if reference exists but card is missing.

### ✅ 2. Code Attributes
```html
data-testid="booking-reference-alert"
data-critical="true"
```

### ✅ 3. Large Warning Comments
Top of file (lines 1-35) has huge warning block.

### ✅ 4. Automated Check
```bash
pnpm check:critical
```
Runs script that verifies all critical components exist.

### ✅ 5. Git Pre-commit Hook
```bash
pnpm hooks:install
```
Installs git hook that checks before every commit.

### ✅ 6. Documentation
- `CRITICAL_COMPONENTS.md` - Full component list
- `PROTECTION_GUIDE.md` - Complete guide
- This file (QUICK_REFERENCE.md)

---

## Quick Commands

```bash
# Check if critical components exist
pnpm check:critical

# Install git protection hook
pnpm hooks:install

# Manual browser test (open DevTools console)
window.verifyCriticalComponents()

# Find when component was deleted
git log -p -S "booking-reference-alert" -- "WhoAndPaymentStep_Simple.tsx"

# View specific commit
git show <commit-hash>
```

---

## For Developers: DO NOT DELETE

Search for these in code before deleting anything:

- `data-critical="true"`
- `data-testid="booking-reference-alert"`
- `⚠️ CRITICAL` comments

If you see these, **STOP and read the comment block**.

---

## Emergency Recovery

If accidentally deleted:

1. Check git: `git log -p -S "bookingReference"`
2. Find last good commit
3. Restore the code
4. Run: `pnpm check:critical`
5. Test in browser: `window.verifyCriticalComponents()`

---

## Files Created

Protection system files:
- `apps/web/src/app/booking-luxury/CRITICAL_COMPONENTS.md`
- `apps/web/src/app/booking-luxury/PROTECTION_GUIDE.md`
- `apps/web/src/app/booking-luxury/QUICK_REFERENCE.md` (this file)
- `apps/web/src/app/booking-luxury/__tests__/critical-components.test.tsx`
- `.githooks/pre-commit`
- `scripts/check-critical-components.ts`

Modified files:
- `WhoAndPaymentStep_Simple.tsx` - Added warnings, attributes, useEffect check
- `package.json` - Added scripts

---

## Setup (One-time)

```bash
# Install git hook
pnpm hooks:install

# Test it works
pnpm check:critical

# Should output: ✅ All critical components verified!
```

---

**Questions?** See `PROTECTION_GUIDE.md` for full documentation.

