# Project Status 2025 | Speedy Van

**Last updated:** 2025  
**Purpose:** Single source of truth for product health, SEO, and technical state.

---

## Product overview

- **Stack:** Next.js (App Router), TypeScript, Chakra UI, Prisma, Stripe, Neon PostgreSQL.
- **Main flows:** Public site (home, services, booking-luxury 3-step), admin, driver portal, customer portal, B2B.

---

## SEO & traffic

- **Canonical & metadata:** Homepage, key service pages, how-it-works, services, contact, pricing, about, FAQ, moving-tips use canonical and Open Graph; all use `APP_BASE_URL` from `lib/seo/constants` (no hardcoded speedy-van.co.uk in metadata/structured data).
- **Structured data:** Homepage (MovingCompany), FAQ (FAQPage + Organization + BreadcrumbList), LocalBusiness/ContactPoint where used. Base URLs use `APP_BASE_URL` from `lib/seo/constants`. FAQSchema default pageUrl uses APP_BASE_URL.
- **Sitemap:** `/sitemap.xml` built from `APP_BASE_URL`; includes home, man-and-van/london, how-it-works, contact, pricing, about, faq, services, booking-luxury, /track, /van-hire-near-me, service pages, UK regions, blog and actual blog post slugs (no 404 category URLs).
- **Robots:** `public/robots.txt` allows public routes, disallows admin/api/auth/driver/customer/portal; references sitemap.

---

## UX & compliance

- **Booking luxury:** 3 steps (Addresses → Items & Time → Checkout). ResponsiveSection and responsive card padding; Step 3 uses Chakra Card/CardBody for price options and Alert for booking reference.
- **Homepage:** Single header (from layout); no duplicate main or header in HomePageContent.
- **Admin:** Alerts use Chakra `colorScheme` and `variant="subtle"` (no custom bg/border overrides).
- **Contact:** Phone `01202 129746` and email `support@speedy-van.co.uk` used consistently (blog, footer, schema, support flows).

---

## Code quality

- **TypeScript:** `tsc --noEmit` passes.
- **ESLint:** Project uses `--max-warnings 0`; many pre-existing warnings (unused vars, no-explicit-any). FAQ page hooks violation fixed (useColorModeValue at top level).
- **Build:** Requires `DATABASE_URL` and successful `prisma generate`; avoid file locks when running build.

---

## Key paths

| Area        | Path / note |
|------------|-------------|
| SEO config | `lib/seo/constants.ts`, `lib/seo.ts` (buildMetadata) |
| Sitemap    | `app/sitemap.xml/route.ts` |
| Booking QA | `apps/web/src/app/booking-luxury/QA_RUNBOOK.md` |
| Public layout | `app/(public)/layout.tsx` (Header + main padding) |

---

## Runbooks

- **Booking QA:** See `apps/web/src/app/booking-luxury/QA_RUNBOOK.md`.
- **Pre-PR:** `tsc --noEmit`; optional eslint/build when env allows.
- **DB/env:** See `START_HERE_DATABASE_SETUP.md` for `.env.local` and migrations.

---

*This file is maintained by the lead/owner. Update when major SEO, product, or tooling changes ship.*
