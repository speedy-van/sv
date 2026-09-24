# Phase 0 deployment — server-side price quotes

Branch: `feat/booking-v2-phase-0`

## What changes

### Schema (additive only)

**New model: `PriceQuote`**

```sql
CREATE TABLE "PriceQuote" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "inputHash"  TEXT NOT NULL,
  "input"      JSONB NOT NULL,
  "result"     JSONB NOT NULL,
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  "consumedAt" TIMESTAMPTZ,
  "bookingId"  TEXT,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "PriceQuote_inputHash_idx" ON "PriceQuote"("inputHash");
CREATE INDEX "PriceQuote_expiresAt_idx" ON "PriceQuote"("expiresAt");
CREATE INDEX "PriceQuote_bookingId_idx" ON "PriceQuote"("bookingId");
```

**New columns on `Booking`** (all nullable — no backfill needed):

```sql
ALTER TABLE "Booking" ADD COLUMN "quoteId"       TEXT;
ALTER TABLE "Booking" ADD COLUMN "extras"        JSONB;
ALTER TABLE "Booking" ADD COLUMN "promotionCode" TEXT;
```

No renames, no drops, no type changes.

## Pre-deploy checklist

- [ ] Snapshot the database (or note the current migration head)
- [ ] Run `prisma migrate diff` against the prod DB to confirm exactly the 4 statements above and nothing else
- [ ] Ensure `DATABASE_URL` in the deployment environment points to the correct prod database

## Migration command

```bash
# from apps/web/
pnpm prisma migrate deploy
# or for environments that use db push:
pnpm prisma db push   # no --accept-data-loss needed (additive only)
```

If `prisma migrate deploy` reports a pending migration, review it carefully before proceeding. The diff must contain only `CREATE TABLE PriceQuote` and 3 `ADD COLUMN` statements.

## Deploy sequence

1. Run schema migration (above)
2. Deploy the Next.js build (`pnpm build --filter @speedy-van/app`)
3. Verify the new `/api/quote` endpoint responds 200 (smoke test below)

## Smoke test

```bash
# 1. Fetch a quote (replace with real postcode pair)
curl -s -X POST https://speedyvan.uk/api/quote \
  -H 'Content-Type: application/json' \
  -d '{
    "pickup":  { "postcode": "SW1A 1AA" },
    "dropoff": { "postcode": "EC1A 1BB" },
    "items":   [{ "id":"sofa","name":"Sofa","quantity":1,"category":"furniture","volumeFactor":1 }],
    "crewSize": "2"
  }' | jq '.datePrices | length'
# Expect: 21

# 2. Confirm the PriceQuote row was written
# (in psql or admin DB tool)
SELECT count(*) FROM "PriceQuote" WHERE "createdAt" > now() - interval '5 minutes';
# Expect: 1

# 3. Try to submit a booking with the returned quoteId + dateKey
# (manual flow via the booking UI, verify booking.promotionCode is persisted when a promo is applied)
```

## Rollback

The migration is fully additive. To roll back the application code, redeploy the previous build — the database schema is backwards compatible. To drop the new column/table:

```sql
-- Only run if you also roll back the application code
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "promotionCode";
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "extras";
ALTER TABLE "Booking" DROP COLUMN IF EXISTS "quoteId";
DROP TABLE IF EXISTS "PriceQuote";
```

## Hard rule reminder

> **The charged amount is always computed on the server. No path may charge a client-supplied number, including promo 'final amounts'.**

Phase 0 enforces this at:
- `/api/booking-luxury`: `totalGBP = resolvedQuoteAmountPence ?? poundsToPence(engineTotal)`
- `/api/payment/create-checkout-session`: uses `booking.totalGBP` for `unit_amount`; returns 422 if booking not pre-created
- Webhook: compares `session.amount_total` with `booking.totalGBP`; halts confirmation on mismatch
