# Booking Luxury – QA Runbook

**Owner:** Lead developer  
**Purpose:** Manual QA checklist for the 3-step booking flow (Addresses → Items & Time → Checkout).

---

## Pre-run

- [ ] App running: `pnpm -C apps/web dev`
- [ ] `.env.local` has valid `DATABASE_URL`, Stripe test keys if testing payment
- [ ] Browser: Chrome or Safari; DevTools open for mobile emulation

---

## Desktop

| # | Check | Pass |
|---|--------|------|
| 1 | All 3 steps render (Addresses, Items & Time, Checkout) | |
| 2 | Step navigation: Next / Back works between steps | |
| 3 | Step 1: Pickup + drop-off addresses required; validation shows errors | |
| 4 | Step 2: Date/time and at least one item required; quote updates | |
| 5 | Step 3: Customer form + payment; booking reference shown when created | |
| 6 | No horizontal scroll; cards within max width (ResponsiveSection) | |

---

## Mobile (e.g. iPhone 15 Pro – 393px)

| # | Check | Pass |
|---|--------|------|
| 1 | Step 1: Address inputs and property toggles usable; safe areas respected | |
| 2 | Step 2: Item grid does not collapse to single column; categories/items tappable | |
| 3 | Step 3: Form fields and price cards readable; CTA tappable | |
| 4 | Touch targets feel ≥ 44px; no accidental double-tap | |
| 5 | No horizontal overflow; content not hidden by notch/Dynamic Island | |
| 6 | Keyboard does not permanently cover inputs when focused | |
| 7 | Draft/auto-save: refresh or reopen – data restored where expected | |

---

## Edge cases

| # | Check | Pass |
|---|--------|------|
| 1 | Multi-drop: add extra drop-off; all segments show; pricing consistent | |
| 2 | Close tab and return: draft restores (if within retention) | |
| 3 | Promotion code: valid code applies; invalid shows error | |
| 4 | Step 3 → Back goes to Step 2 (Items & Time) | |
| 5 | Progress indicator shows current step and completed steps correctly | |
| 6 | Error messages (validation, API errors) visible and clear | |

---

## Sign-off

- **Date:** _______________
- **Tester:** _______________
- **Notes:** _______________

---

## Pre-PR validation (lead developer)

- **TypeScript:** `pnpm -C apps/web exec tsc --noEmit` — must pass.
- **ESLint:** Project uses `--max-warnings 0`; many pre-existing warnings (unused vars, no-explicit-any, unescaped entities). Fix in a dedicated pass or relax for now.
- **Build:** `pnpm -C apps/web build` — requires `DATABASE_URL` in env and no file lock on `node_modules/.prisma`. If EPERM on `prisma generate`, close other processes using Prisma and retry.
- **Prisma:** `pnpm exec prisma validate` — requires `.env` or `.env.local` with `DATABASE_URL`.
