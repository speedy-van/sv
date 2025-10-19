# Database Migration Instructions for Multi-Drop Routes Enhancement

## Overview
This document provides step-by-step instructions for manually updating the database schema to support the enhanced multi-drop routes system.

**IMPORTANT**: These migrations are designed to be **non-destructive** and will not reset or delete existing data.

## Prerequisites
- PostgreSQL database access
- Admin/superuser privileges
- Backup of current database (recommended)

## Migration Steps

### Step 1: Add New Columns to Route Table

These columns enhance route tracking and admin control capabilities.

```sql
-- Add template and optimization tracking
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN DEFAULT false;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "parentRouteId" TEXT;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "splitReason" TEXT;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "mergedFromRoutes" JSONB;

-- Add optimization metadata
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "optimizationAlgorithm" TEXT;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "lastOptimizedAt" TIMESTAMP;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "adminOverrides" JSONB;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "validationErrors" JSONB;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "warningFlags" JSONB;

-- Add acceptance tracking
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "acceptanceStatus" TEXT DEFAULT 'pending';
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "delayStatus" TEXT DEFAULT 'on_time';

-- Add time tracking
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "breakTimeAllocated" INTEGER DEFAULT 0;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;

-- Add performance metrics
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "customerSatisfactionTarget" DECIMAL;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "carbonFootprintKg" DECIMAL;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "totalEstimatedTime" INTEGER;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "totalDistanceMiles" DOUBLE PRECISION;
ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "totalDurationMinutes" INTEGER;
```

### Step 2: Add New Columns to Drop Table

These columns improve drop tracking and management.

```sql
-- Add transfer tracking
ALTER TABLE "Drop" ADD COLUMN IF NOT EXISTS "originalRouteId" TEXT;
ALTER TABLE "Drop" ADD COLUMN IF NOT EXISTS "transferredAt" TIMESTAMP;
ALTER TABLE "Drop" ADD COLUMN IF NOT EXISTS "transferReason" TEXT;

-- Add sequence and timing
ALTER TABLE "Drop" ADD COLUMN IF NOT EXISTS "sequenceInRoute" INTEGER;
ALTER TABLE "Drop" ADD COLUMN IF NOT EXISTS "estimatedArrival" TIMESTAMP;
ALTER TABLE "Drop" ADD COLUMN IF NOT EXISTS "actualArrival" TIMESTAMP;
ALTER TABLE "Drop" ADD COLUMN IF NOT EXISTS "delayMinutes" INTEGER;

-- Add failure handling
ALTER TABLE "Drop" ADD COLUMN IF NOT EXISTS "skipReason" TEXT;
ALTER TABLE "Drop" ADD COLUMN IF NOT EXISTS "proofOfDeliveryUrl" TEXT;
```

### Step 3: Create New Tables

#### Route Template Table
```sql
CREATE TABLE IF NOT EXISTS "RouteTemplate" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "serviceTier" TEXT,
  "maxDrops" INTEGER,
  "maxDistance" DOUBLE PRECISION,
  "timeWindowDuration" INTEGER,
  "constraints" JSONB,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

#### Route History Table
```sql
CREATE TABLE IF NOT EXISTS "RouteHistory" (
  "id" TEXT PRIMARY KEY,
  "routeId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "changedBy" TEXT NOT NULL,
  "changedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "before" JSONB,
  "after" JSONB,
  "reason" TEXT
);
```

#### Route Metrics Table
```sql
CREATE TABLE IF NOT EXISTS "RouteMetrics" (
  "id" TEXT PRIMARY KEY,
  "routeId" TEXT UNIQUE NOT NULL,
  "completionRate" DOUBLE PRECISION,
  "onTimeRate" DOUBLE PRECISION,
  "averageDelay" INTEGER,
  "totalCost" DECIMAL,
  "profitMargin" DECIMAL,
  "driverRating" DOUBLE PRECISION,
  "customerSatisfaction" DOUBLE PRECISION,
  "calculatedAt" TIMESTAMP DEFAULT NOW()
);
```

### Step 4: Add Indexes for Performance

```sql
-- Route indexes
CREATE INDEX IF NOT EXISTS "idx_route_template" ON "Route"("templateId");
CREATE INDEX IF NOT EXISTS "idx_route_parent" ON "Route"("parentRouteId");
CREATE INDEX IF NOT EXISTS "idx_route_status_date" ON "Route"("status", "startTime");
CREATE INDEX IF NOT EXISTS "idx_route_driver_status" ON "Route"("driverId", "status");
CREATE INDEX IF NOT EXISTS "idx_route_service_tier" ON "Route"("serviceTier");
CREATE INDEX IF NOT EXISTS "idx_route_acceptance" ON "Route"("acceptanceStatus");

-- Drop indexes
CREATE INDEX IF NOT EXISTS "idx_drop_route_sequence" ON "Drop"("routeId", "sequenceInRoute");
CREATE INDEX IF NOT EXISTS "idx_drop_status_time" ON "Drop"("status", "timeWindowStart");
CREATE INDEX IF NOT EXISTS "idx_drop_original_route" ON "Drop"("originalRouteId");

-- History indexes
CREATE INDEX IF NOT EXISTS "idx_route_history_route" ON "RouteHistory"("routeId", "changedAt");
CREATE INDEX IF NOT EXISTS "idx_route_history_action" ON "RouteHistory"("action");

-- Metrics indexes
CREATE INDEX IF NOT EXISTS "idx_route_metrics_route" ON "RouteMetrics"("routeId");
```

### Step 5: Add Foreign Key Constraints (Optional)

**Note**: Only add these if your database supports deferred constraints or if you're sure there are no orphaned records.

```sql
-- Route foreign keys
ALTER TABLE "Route" 
  ADD CONSTRAINT "fk_route_template" 
  FOREIGN KEY ("templateId") 
  REFERENCES "RouteTemplate"("id") 
  ON DELETE SET NULL;

ALTER TABLE "Route" 
  ADD CONSTRAINT "fk_route_parent" 
  FOREIGN KEY ("parentRouteId") 
  REFERENCES "Route"("id") 
  ON DELETE SET NULL;

-- Drop foreign keys
ALTER TABLE "Drop" 
  ADD CONSTRAINT "fk_drop_original_route" 
  FOREIGN KEY ("originalRouteId") 
  REFERENCES "Route"("id") 
  ON DELETE SET NULL;

-- History foreign keys
ALTER TABLE "RouteHistory" 
  ADD CONSTRAINT "fk_route_history_route" 
  FOREIGN KEY ("routeId") 
  REFERENCES "Route"("id") 
  ON DELETE CASCADE;

-- Metrics foreign keys
ALTER TABLE "RouteMetrics" 
  ADD CONSTRAINT "fk_route_metrics_route" 
  FOREIGN KEY ("routeId") 
  REFERENCES "Route"("id") 
  ON DELETE CASCADE;
```

### Step 6: Update Existing Data (Optional)

These queries set default values for existing records.

```sql
-- Set default acceptance status for existing routes
UPDATE "Route" 
SET "acceptanceStatus" = 'accepted' 
WHERE "status" IN ('active', 'completed') 
  AND "acceptanceStatus" IS NULL;

-- Set sequence numbers for existing drops
WITH numbered_drops AS (
  SELECT 
    "id",
    "routeId",
    ROW_NUMBER() OVER (PARTITION BY "routeId" ORDER BY "timeWindowStart") as seq
  FROM "Drop"
  WHERE "routeId" IS NOT NULL
)
UPDATE "Drop" d
SET "sequenceInRoute" = nd.seq
FROM numbered_drops nd
WHERE d."id" = nd."id"
  AND d."sequenceInRoute" IS NULL;

-- Calculate estimated arrival times for existing drops
UPDATE "Drop"
SET "estimatedArrival" = "timeWindowStart"
WHERE "estimatedArrival" IS NULL;
```

### Step 7: Verify Migration

Run these queries to verify the migration was successful:

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Route'
  AND column_name IN ('templateId', 'optimizationAlgorithm', 'acceptanceStatus');

-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('RouteTemplate', 'RouteHistory', 'RouteMetrics');

-- Check indexes exist
SELECT indexname
FROM pg_indexes
WHERE tablename = 'Route'
  AND indexname LIKE 'idx_route_%';

-- Count records to ensure no data loss
SELECT 
  (SELECT COUNT(*) FROM "Route") as route_count,
  (SELECT COUNT(*) FROM "Drop") as drop_count;
```

## Rollback Instructions

If you need to rollback these changes:

```sql
-- Remove new columns from Route
ALTER TABLE "Route" DROP COLUMN IF EXISTS "templateId";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "isTemplate";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "parentRouteId";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "splitReason";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "mergedFromRoutes";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "optimizationAlgorithm";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "lastOptimizedAt";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "adminOverrides";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "validationErrors";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "warningFlags";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "acceptanceStatus";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "delayStatus";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "breakTimeAllocated";
ALTER TABLE "Route" DROP COLUMN IF EXISTS "emergencyContact";

-- Remove new columns from Drop
ALTER TABLE "Drop" DROP COLUMN IF EXISTS "originalRouteId";
ALTER TABLE "Drop" DROP COLUMN IF EXISTS "transferredAt";
ALTER TABLE "Drop" DROP COLUMN IF EXISTS "transferReason";
ALTER TABLE "Drop" DROP COLUMN IF EXISTS "sequenceInRoute";
ALTER TABLE "Drop" DROP COLUMN IF EXISTS "estimatedArrival";
ALTER TABLE "Drop" DROP COLUMN IF EXISTS "actualArrival";
ALTER TABLE "Drop" DROP COLUMN IF EXISTS "delayMinutes";
ALTER TABLE "Drop" DROP COLUMN IF EXISTS "skipReason";
ALTER TABLE "Drop" DROP COLUMN IF EXISTS "proofOfDeliveryUrl";

-- Drop new tables
DROP TABLE IF EXISTS "RouteTemplate" CASCADE;
DROP TABLE IF EXISTS "RouteHistory" CASCADE;
DROP TABLE IF EXISTS "RouteMetrics" CASCADE;

-- Drop new indexes
DROP INDEX IF EXISTS "idx_route_template";
DROP INDEX IF EXISTS "idx_route_parent";
DROP INDEX IF EXISTS "idx_route_status_date";
DROP INDEX IF EXISTS "idx_route_driver_status";
DROP INDEX IF EXISTS "idx_drop_route_sequence";
DROP INDEX IF EXISTS "idx_drop_status_time";
DROP INDEX IF EXISTS "idx_route_history_route";
```

## Prisma Schema Updates

After running the SQL migrations, update your `schema.prisma` file to reflect these changes. The enhanced fields are already included in the codebase, but ensure your Prisma schema matches the database structure.

Run Prisma introspection to sync:

```bash
npx prisma db pull
npx prisma generate
```

## Testing

After migration, test the following:

1. **Create a new route** via admin panel
2. **Update an existing route** with new fields
3. **Force change route status** using admin controls
4. **Fetch route analytics** to verify metrics calculation
5. **Perform bulk operations** on multiple routes
6. **Test iOS app** route fetching and updates

## Support

If you encounter any issues during migration:

1. Check PostgreSQL logs for detailed error messages
2. Verify database user has sufficient privileges
3. Ensure no active connections are blocking schema changes
4. Review the verification queries to identify specific issues

## Notes

- All migrations are designed to be **idempotent** (can be run multiple times safely)
- Existing data will **not be deleted or modified** unless explicitly stated
- New columns have default values to ensure compatibility
- Indexes are created with `IF NOT EXISTS` to prevent errors on re-run
- Foreign key constraints are optional and can be skipped if needed

## Estimated Time

- **Small database** (< 1000 routes): 2-5 minutes
- **Medium database** (1000-10000 routes): 5-15 minutes
- **Large database** (> 10000 routes): 15-30 minutes

## Completion Checklist

- [ ] Backup database created
- [ ] Step 1: Route columns added
- [ ] Step 2: Drop columns added
- [ ] Step 3: New tables created
- [ ] Step 4: Indexes created
- [ ] Step 5: Foreign keys added (optional)
- [ ] Step 6: Existing data updated (optional)
- [ ] Step 7: Migration verified
- [ ] Prisma schema updated
- [ ] Application tested
- [ ] iOS app tested

---

**Last Updated**: $(date)
**Version**: 2.0
**Author**: Multi-Drop Routes Enhancement Team

