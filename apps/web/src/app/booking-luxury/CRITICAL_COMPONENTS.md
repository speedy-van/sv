# 🚨 Critical Components - DO NOT DELETE

## Overview
This file lists all critical UI components in the booking-luxury flow that **MUST NOT BE DELETED OR HIDDEN**.

Deleting any of these components will break core functionality and customer experience.

---

## Critical Cards & Alerts

### 1. Booking Reference Alert Card
**Location:** `WhoAndPaymentStep_Simple.tsx` (line ~995)

**Element identifier:** `data-testid="booking-reference-alert"`

**Purpose:**
- Displays the booking reference number (e.g., `SV-ABC123`) to customers
- Allows admins to track and modify bookings before payment
- Essential for customer support and booking management

**Condition:** Only shows when `formData.step2.bookingReference` exists

**Critical importance:** ⭐⭐⭐⭐⭐
- Without this card, customers and admins cannot track incomplete bookings
- Booking references are stored in localStorage and database
- Deleting this breaks the entire booking tracking system

**Safety measures:**
- Added `data-testid="booking-reference-alert"` attribute
- Added `data-critical="true"` attribute
- useEffect warning if reference exists but card is missing
- Large warning comment in code

**Code location:**
```typescript
{/* ⚠️ CRITICAL: Booking Reference Alert - DO NOT DELETE OR MOVE */}
{formData.step2.bookingReference && (
  <Alert data-testid="booking-reference-alert" data-critical="true">
    Booking reference (pending payment)
    {formData.step2.bookingReference}
  </Alert>
)}
```

---

### 2. Address Incomplete Warning
**Location:** `WhoAndPaymentStep_Simple.tsx` (line ~1790)

**Purpose:**
- Warns customers when address is missing postcode
- Prevents pricing errors

**Critical importance:** ⭐⭐⭐⭐

---

### 3. Price Calendar Cards
**Location:** `WhoAndPaymentStep_Simple.tsx` (line ~1050)

**Purpose:**
- Shows 14 days of pricing options
- Core booking selection interface

**Critical importance:** ⭐⭐⭐⭐⭐

---

## Best Practices

### Before Deleting ANY Component:

1. **Check for `data-critical` attribute**
   ```bash
   grep -r "data-critical" apps/web/src/app/booking-luxury/
   ```

2. **Check for `data-testid` starting with critical keywords:**
   - `booking-reference-*`
   - `payment-*`
   - `price-card-*`

3. **Search for console.error warnings:**
   - Look for "CRITICAL BUG" messages in browser console
   - These indicate a critical component was deleted

4. **Check git history before major refactors:**
   ```bash
   git log -p -- apps/web/src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx
   ```

### When Refactoring Code:

1. **Extract critical components to separate files**
   - Makes them harder to accidentally delete
   - Example: `BookingReferenceAlert.tsx`

2. **Add TypeScript interfaces**
   - Force props to be passed
   - TypeScript will error if component is missing

3. **Add integration tests**
   - Test that critical elements are rendered
   - Example: `expect(screen.getByTestId('booking-reference-alert')).toBeInTheDocument()`

4. **Use Git blame before deleting:**
   ```bash
   git blame apps/web/src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx | grep "bookingReference"
   ```

---

## Recovery Checklist

If a critical component is accidentally deleted:

1. Check git history:
   ```bash
   git log -p -S "bookingReference" -- "apps/web/src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx"
   ```

2. Find the last working commit:
   ```bash
   git show <commit-hash>:apps/web/src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx
   ```

3. Restore the deleted code

4. Add more safety measures (comments, tests, etc.)

---

## Contact

If you need to modify any critical component, discuss with team first.

**Questions:** support@speedy-van.co.uk
