# Booking Reference Card – Design Options

You currently have **two different designs** in two places:

1. **Page top** (`page.tsx`) – Card below the step title: "Booking reference" + value + Copy button (or spinner).  
2. **Step 3 (Payment step)** (`WhoAndPaymentStep_Simple.tsx`) – Blue `LuxurySurfaceCard`: "Booking reference (pending payment)" + admin message, no Copy.

You asked to **unify** the design, **not** have the reference at the top of the cards, and get **ideas that blend well**. Here are four options; pick one and we can implement it.

---

## Option A – Single place, compact bar (recommended)

- **Where:** Only inside **Step 3** (Your information & payment), just above or inside the "Complete Your Booking" card.
- **Design:** One horizontal bar: icon + "Booking reference" + **mono reference** + Copy button. Same style as the rest of the step (subtle border, `bg.surface`), no big card at top.
- **Page top:** Remove the booking reference block entirely from `page.tsx` so it never appears above the steps.
- **Blend:** Feels like one more line in the payment summary (like "Selected date" or "Total price") instead of a separate hero card.

---

## Option B – Inline in payment card only

- **Where:** Inside the **payment/confirmation card** in Step 3, as a row in the booking summary (next to "Pickup", "Dropoff", "Selected date").
- **Design:** Same row style: left "Booking reference", right **reference + small Copy icon**. No extra box.
- **Page top:** Remove from page top.
- **Blend:** Reference is part of the summary, not a standalone block.

---

## Option C – Sticky footer bar (all steps)

- **Where:** A slim bar fixed at **bottom** of the viewport when reference exists (or at bottom of the step content area). Shows on all steps (1, 2, 3) once reference is generated.
- **Design:** Minimal: "Ref: SV-XXXXXX" + Copy. Dark, low height, doesn’t cover content.
- **Page top:** Remove from page top.
- **Blend:** Always visible but not in the main flow; good if you want it available without scrolling.

---

## Option D – One unified card, one place only

- **Where:** Only in **Step 3**, in a **single** design used everywhere (shared component).
- **Design:** One `LuxurySurfaceCard` (or same card style): "Booking reference (pending payment)", reference in mono, short line "Share with admin if needed", **Copy** button. Same look whether we ever reuse it (e.g. success page could use same component later).
- **Page top:** Remove from page top.
- **Blend:** Single consistent "reference card" pattern across the app; no duplicate layouts.

---

## Summary

| Option | Location        | Style              | Page top |
|--------|-----------------|--------------------|----------|
| A      | Step 3 only     | Compact bar        | Removed  |
| B      | Step 3 summary | Inline row         | Removed  |
| C      | Sticky footer   | Slim bar           | Removed  |
| D      | Step 3 only     | One unified card   | Removed  |

Recommendation: **A** or **D** – one design, one place, nothing at the top. Choose A for minimal footprint, D if you prefer a clear “reference card” that we can reuse elsewhere (e.g. success page).

Once you pick (A, B, C, or D), we can implement it and remove the duplicate at the top.
