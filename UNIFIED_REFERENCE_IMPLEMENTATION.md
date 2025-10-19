# Unified Reference Number System Implementation

## Overview

This document describes the implementation of a unified reference numbering system for both Orders (Bookings) and Routes in the Speedy Van platform. All entities now use the **SV-NNNNNN** format with sequential numbering.

## Changes Made

### 1. Database Schema Updates

#### Added ReferenceSequence Model
```prisma
model ReferenceSequence {
  id         String   @id
  type       String
  lastNumber Int      @default(0)
  prefix     String   @default("SV")
  updatedAt  DateTime @updatedAt

  @@index([type])
}
```

#### Updated Route Model
```prisma
model Route {
  id                       String           @id @default(cuid())
  reference                String?          @unique  // NEW: Unified SV reference
  // ... rest of fields
}
```

### 2. Reference Generation System

**File**: `/apps/web/src/lib/ref.ts`

#### Key Functions:

1. **generateReference(type)**: Generates sequential SV-NNNNNN references
   - Uses database transaction for atomicity
   - Increments counter in ReferenceSequence table
   - Format: `SV-000001`, `SV-000002`, etc.

2. **validateReference(reference)**: Checks if reference exists in Booking or Route tables

3. **getReferenceData(reference)**: Retrieves reference metadata

4. **getNextReferenceNumber()**: Preview next available reference number

#### Implementation Details:
- **Atomic Operations**: Uses Prisma transactions to prevent race conditions
- **Fallback Mechanism**: If database fails, generates timestamp-based reference
- **Shared Sequence**: Both orders and routes use the same counter
- **Zero-padded**: Numbers are padded to 6 digits (000001, 000002, etc.)

### 3. Backend API Updates

#### Route Creation APIs Updated:

1. **`/api/admin/routes/route.ts`** (Main route creation)
   - Added `createUniqueReference` import
   - Changed from `id: routeNumber` to `reference: routeNumber`

2. **`/api/admin/routes/auto-create/route.ts`** (Automatic route generation)
   - Generates SV reference for each auto-created route
   - Stores in `reference` field

3. **`/api/admin/routes/smart-generate/route.ts`** (AI-powered route generation)
   - Replaced timestamp-based ID with unified SV reference
   - Updated DeepSeek integration to use new reference system

4. **`/api/admin/routes/create/route.ts`** (Manual route creation)
   - Generates SV reference before route creation
   - Logs reference in console for debugging

5. **`/api/admin/routes/multi-drop/route.ts`** (Multi-drop route management)
   - Added reference generation for multi-drop routes

#### Driver Routes API Updated:

**File**: `/apps/web/src/app/api/driver/routes/route.ts`

- Added `reference` field to query selection
- Included `reference` in API response
- Fallback to `id` if `reference` is null (backward compatibility)

### 4. Admin Interface Updates

#### Enhanced Admin Routes Dashboard

**File**: `/apps/web/src/components/admin/EnhancedAdminRoutesDashboard.tsx`

Changes:
1. Added `reference?: string` to Route interface
2. Updated display logic:
   ```typescript
   {route.reference || route.id.substring(0, 8)}
   ```
3. Shows unified SV reference in both table and card views

### 5. iOS Driver App Updates

#### RoutesScreen Component

**File**: `/mobile/expo-driver-app/src/screens/RoutesScreen.tsx`

Changes:
1. Added `reference?: string` to Route interface
2. Updated route display:
   ```typescript
   {route.reference || '#' + route.id.slice(-8)}
   ```
3. Updated Alert dialog to show unified reference

## Migration Strategy

### For Existing Routes

Existing routes without `reference` field will:
1. Continue to work with their existing `id`
2. Display fallback to `id` in UI
3. Get assigned a new SV reference when updated

### For New Routes

All new routes will:
1. Automatically get a sequential SV reference
2. Display the SV reference in all interfaces
3. Use the same numbering sequence as orders

## Testing Checklist

### Backend Testing
- [ ] Test reference generation (sequential numbering)
- [ ] Test route creation with unified reference
- [ ] Test auto-create routes endpoint
- [ ] Test smart-generate routes endpoint
- [ ] Test driver routes API response
- [ ] Verify database constraints (unique reference)

### Admin Interface Testing
- [ ] Create new route and verify SV reference display
- [ ] Check routes table shows correct references
- [ ] Check routes card view shows correct references
- [ ] Verify filtering and sorting still work
- [ ] Test route assignment to drivers

### iOS App Testing
- [ ] Fetch routes and verify reference display
- [ ] Accept route and check reference in confirmation
- [ ] Decline route and check reference in logs
- [ ] Start route and verify reference in progress view
- [ ] Complete route and check reference in completion

### Integration Testing
- [ ] Create order → Create route → Assign to driver → Complete in iOS
- [ ] Verify reference consistency across all interfaces
- [ ] Test concurrent route creation (race condition check)
- [ ] Verify reference uniqueness

## Benefits

1. **Unified System**: Single numbering system for all entities
2. **Sequential**: Easy to track and reference
3. **Professional**: Clean SV-NNNNNN format
4. **Scalable**: Supports up to 999,999 entities
5. **Consistent**: Same format across web, mobile, and APIs
6. **Traceable**: Easy to search and identify orders/routes

## Backward Compatibility

- Existing routes without `reference` field continue to work
- UI falls back to displaying `id` if `reference` is null
- No breaking changes to existing functionality
- Gradual migration as routes are updated

## Future Enhancements

1. **Reference Prefixes**: Different prefixes for different entity types (SV-O for orders, SV-R for routes)
2. **Date-based Numbering**: Include date in reference (SV-20250119-0001)
3. **Branch Numbering**: Different sequences for different branches/regions
4. **QR Codes**: Generate QR codes from references for easy scanning
5. **Reference History**: Track reference changes and updates

## Database Initialization

To initialize the reference sequence in production:

```sql
-- Check if sequence exists
SELECT * FROM "ReferenceSequence" WHERE id = 'sv-sequence';

-- If not exists, create it
INSERT INTO "ReferenceSequence" ("id", "type", "lastNumber", "prefix", "updatedAt")
VALUES ('sv-sequence', 'unified', 0, 'SV', NOW())
ON CONFLICT (id) DO NOTHING;
```

## Monitoring

Monitor the following:
1. **Sequence Counter**: Check `lastNumber` in ReferenceSequence table
2. **Reference Uniqueness**: Verify no duplicate references
3. **Generation Performance**: Monitor transaction time
4. **Fallback Usage**: Log when fallback mechanism is used

## Support

For issues or questions:
- Check logs for reference generation errors
- Verify database connection is stable
- Ensure ReferenceSequence table exists
- Check for unique constraint violations

---

**Implementation Date**: October 19, 2025
**Version**: 1.0
**Status**: ✅ Completed

