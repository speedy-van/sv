# 🧾 Post-Payment Adjustment Playbook

## Overview

This guide explains how Speedy Van handles price changes **after** a customer has already paid for a booking. The flow guarantees:

- Accurate tracking of amounts collected vs. outstanding
- Full synchronization with Stripe (additional charges & refunds)
- Automatic customer notifications and audit trails
- No more silent `totalGBP` updates on paid jobs

---

## New Booking Fields

| Field | Description |
| --- | --- |
| `amountPaidGBP` | Total amount collected to date (pence) |
| `additionalPaymentStatus` | `NONE`, `PENDING`, `PAID`, `REFUNDED`, `FAILED` |
| `additionalPaymentAmountGBP` | Amount of the most recent additional payment (pence) |
| `additionalPaymentRequestedAt` | Timestamp of the latest additional charge request |
| `additionalPaymentPaidAt` | Timestamp when the additional charge was collected |
| `additionalPaymentStripeIntent` | Stripe Payment Intent ID for the latest adjustment |
| `lastPaymentDate` | Timestamp of the last successful payment |
| `lastRefundDate` | Timestamp of the most recent refund |

---

## Admin Drawer Enhancements

### Payment Adjustments Card

- Always visible once a payment exists (`amountPaidGBP > 0` or `paidAt` set).
- Shows live stats for collected amount, current total, and outstanding balance.
- Provides an input to set the **adjusted total** (in pounds) and describe the reason.
- Buttons:
  - **Request Additional Payment** (difference > 0) → triggers new Stripe Checkout and customer email.
  - **Issue Refund** (difference < 0) → creates partial/full refunds via Stripe API.
  - **Reset** → revert inputs to current stored values.

### Guard Rails

- Admins can no longer save `totalGBP` changes on paid orders via the regular “Save” button.
- Attempts to do so show a toast directing them to the adjustment controls.

---

## API Endpoints

### `POST /api/admin/orders/{reference}/create-additional-payment`

1. Validates admin session and booking state.
2. Calculates `difference = targetTotal - amountPaid`.
3. Creates a Stripe Checkout Session with metadata:
   - `paymentPurpose: additional_charge`
   - `additionalAmount`, `targetTotalGBP`, `bookingReference`
4. Updates booking:
   - Sets new `totalGBP`
   - Marks `additionalPaymentStatus = PENDING`
   - Stores `additionalPaymentAmountGBP = difference`
   - Captures request timestamp
5. Sends **Additional Payment Request** email to the customer (link included).
6. Logs an audit event (`request_additional_payment`).
7. Returns checkout URL so the admin can open/copy it.

### `POST /api/admin/orders/{reference}/refund`

1. Validates admin session and booking state.
2. Calculates `refundAmount = amountPaid - targetTotal`.
3. Iterates through Stripe Payment Intents (latest additional charge first) and issues refunds until the amount is satisfied.
4. Updates booking totals & statuses, logs audit event (`issue_refund`).
5. Sends **Refund Confirmation** email to the customer.

---

## Stripe Webhook Updates

- `payment_intent.succeeded`
  - If `paymentPurpose === 'additional_charge'`, we increment `amountPaidGBP`, mark the additional payment as `PAID`, and store timestamps.
  - Otherwise (initial payment), we reset status fields and set `amountPaidGBP = amount`.
- All adjustments are audited (`additional_payment_succeeded`).

---

## Email Templates

- **Additional Payment Request**: includes amount due, reason, and secure checkout button.
- **Refund Notification**: confirms the amount refunded, new order total, and reason.

All templates use the correct support contact: `support@speedy-van.co.uk` and `01202129764`.

---

## Admin Workflow Summary

1. **Calculate new price** (if needed) using the existing “Recalculate Price” flow.
2. **Set Adjusted Total** in the Payment Adjustments card.
3. Choose one of:
   - **Request Additional Payment** for positive difference.
   - **Issue Refund** for negative difference.
4. The system handles Stripe, email notifications, and audit logs automatically.
5. Refreshing the drawer (or the auto-refresh) updates stats, statuses, and timestamps.

---

## Testing Checklist

- [ ] Increase price after initial payment → additional payment flow triggers, Stripe Checkout link works, webhook updates booking.
- [ ] Reduce price after payment → refund flow issues Stripe refund and updates booking totals.
- [ ] Attempt to save paid booking with new total via normal save → blocked with clear warning.
- [ ] Verify customer emails (payment request & refund) contain correct details.
- [ ] `amountPaidGBP` reflects cumulative payments; outstanding balance is accurate.

---

## Required Migrations

Update `packages/shared/prisma/schema.prisma` (already applied in source) and run:

```bash
prisma migrate dev --name add_post_payment_fields
```

Follow with:

```bash
tsc --noEmit
eslint . --max-warnings=0
prisma validate
next build
```

---

**Status:** ✅ Implemented and ready for QA.
