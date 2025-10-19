# Admin Routes and Orders Analysis

## Current Structure

### Database Models

#### 1. Booking (Orders)
- **Primary Key**: `id` (cuid)
- **Reference Number**: `reference` field (currently uses "SV" prefix)
- **Route Relationship**: `routeId` (nullable, references Route.id)
- **Status**: BookingStatus enum (DRAFT, PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED)
- **Purpose**: Single customer orders

#### 2. Route (Multi-drop Routes)
- **Primary Key**: `id` (cuid)
- **Reference Number**: Currently NOT stored in database (generated on-the-fly as "RT" prefix)
- **Driver Relationship**: `driverId` (references User.id, not Driver.id)
- **Status**: RouteStatus enum (planned, assigned, in_progress, completed, cancelled)
- **Purpose**: Grouping multiple drops for efficient delivery

#### 3. Drop (Individual Delivery Points)
- **Primary Key**: `id` (cuid)
- **Booking Relationship**: `bookingId` (nullable)
- **Route Relationship**: `routeId` (nullable)
- **Status**: DropStatus enum (pending, assigned, in_progress, completed, failed)
- **Purpose**: Individual delivery points that can be part of routes

### Current Issues Identified

#### 1. **Inconsistent Numbering System**
- **Problem**: Bookings use "SV" prefix, Routes use "RT" prefix (not stored in DB)
- **Impact**: No unified numbering system starting with "SV" as required
- **Required Fix**: All entities (orders and routes) should use "SV" prefix with sequential numbering

#### 2. **Missing Route Reference Field**
- **Problem**: Route model doesn't have a `reference` field in the database
- **Impact**: Route numbers are generated on-the-fly and not persistent
- **Required Fix**: Add `reference` field to Route model

#### 3. **Dual System Confusion**
- **Problem**: Orders and Routes are managed separately with unclear relationships
- **Impact**: 
  - Admin sees orders in one place, routes in another
  - No clear workflow from order → route
  - Driver app only sees routes, not individual orders
- **Required Fix**: Integrate the two systems with clear admin controls

#### 4. **Driver Assignment Inconsistency**
- **Problem**: 
  - Booking.driverId references Driver.id
  - Route.driverId references User.id (not Driver.id)
- **Impact**: Confusing driver assignment logic
- **Required Fix**: Standardize to use User.id consistently

#### 5. **iOS App Integration Issues**
- **Current State**: 
  - iOS app fetches routes via `/api/driver/routes`
  - Only shows multi-drop routes, not individual orders
  - Uses Route.id as identifier
- **Required Fix**: Ensure iOS app can handle unified numbering system

## Proposed Solution

### Phase 1: Database Schema Changes

#### Add Reference Field to Route Model
```prisma
model Route {
  // ... existing fields
  reference String @unique  // NEW: SV-prefixed reference number
  // ... rest of fields
}
```

#### Standardize Driver References
- Keep Route.driverId as User.id (current)
- Update Booking.driverId to reference User.id instead of Driver.id

### Phase 2: Unified Numbering System

#### Implementation Strategy
1. **Sequential Counter**: Add a global counter for SV numbers
2. **Format**: SV-NNNNNN (e.g., SV-000001, SV-000002)
3. **Scope**: Both orders and routes use the same sequence
4. **Type Indicator**: Add metadata field to distinguish order vs route

#### Database Changes Needed
```sql
-- Add reference column to Route table
ALTER TABLE "Route" ADD COLUMN "reference" TEXT;

-- Create unique index
CREATE UNIQUE INDEX "Route_reference_key" ON "Route"("reference");

-- Create sequence table for unified numbering
CREATE TABLE "ReferenceSequence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 0,
  "prefix" TEXT NOT NULL DEFAULT 'SV',
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Insert initial sequence
INSERT INTO "ReferenceSequence" ("id", "type", "lastNumber", "prefix", "updatedAt")
VALUES ('sv-sequence', 'unified', 0, 'SV', NOW());
```

### Phase 3: Admin Interface Integration

#### Unified Dashboard Approach
1. **Single View**: Combine orders and routes in one interface
2. **Filters**: 
   - Type (Order / Route)
   - Status
   - Driver Assignment
   - Date Range
3. **Actions**:
   - Create Order → Generates SV-NNNNNN
   - Create Route from Orders → Generates SV-NNNNNN
   - Assign Driver to Order/Route
   - Track Progress

#### Admin Controls Required
- View all orders (with/without routes)
- View all routes (with assigned orders)
- Create route from multiple orders
- Assign/Reassign drivers
- Cancel orders/routes
- Track real-time progress

### Phase 4: iOS Driver App Updates

#### API Changes
1. **Unified Endpoint**: `/api/driver/assignments`
   - Returns both individual orders and routes
   - Uses SV reference numbers
   - Includes type indicator

2. **Response Format**:
```typescript
{
  success: true,
  assignments: [
    {
      reference: "SV-000001",  // Unified reference
      type: "order",           // or "route"
      status: "assigned",
      // ... rest of data
    }
  ]
}
```

#### Mobile App Changes
- Update UI to show SV reference numbers
- Handle both order and route types
- Maintain backward compatibility during transition

## Files to Modify

### Database
1. `/packages/shared/prisma/schema.prisma` - Add Route.reference field

### Backend APIs
1. `/apps/web/src/lib/ref.ts` - Update reference generation logic
2. `/apps/web/src/app/api/admin/orders/route.ts` - Update orders API
3. `/apps/web/src/app/api/admin/routes/route.ts` - Update routes API
4. `/apps/web/src/app/api/driver/routes/route.ts` - Update driver routes API

### Admin Frontend
1. `/apps/web/src/app/admin/orders/page.tsx` - Update orders page
2. `/apps/web/src/app/admin/orders/table.tsx` - Update orders table
3. `/apps/web/src/app/admin/routes/page.tsx` - Update routes page
4. `/apps/web/src/components/admin/EnhancedAdminRoutesDashboard.tsx` - Update routes dashboard

### iOS Driver App
1. `/mobile/expo-driver-app/src/screens/RoutesScreen.tsx` - Update to handle unified references
2. `/mobile/expo-driver-app/src/services/api.service.ts` - Update API calls

## Testing Strategy

1. **Database Migration**: Test schema changes on dev database
2. **Reference Generation**: Verify sequential numbering works
3. **Admin Interface**: Test CRUD operations for orders and routes
4. **Driver Assignment**: Verify drivers can be assigned to both orders and routes
5. **iOS Integration**: Test driver app with new reference system
6. **End-to-End**: Complete workflow from order creation → route assignment → driver completion

## Rollout Plan

1. **Phase 1**: Database schema changes (requires migration)
2. **Phase 2**: Update reference generation system
3. **Phase 3**: Update admin APIs and interfaces
4. **Phase 4**: Update iOS driver app
5. **Phase 5**: Testing and validation
6. **Phase 6**: Deploy to production

