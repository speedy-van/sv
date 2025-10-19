# Unified Operations Management Design

## Overview

This document outlines the design for combining Orders and Routes management into a single, unified admin interface with full control capabilities.

## Current State Analysis

### Existing Structure

1. **Orders Section** (`/admin/orders`)
   - Manages individual bookings (single orders)
   - Features: View, assign driver, cancel, update status
   - Component: `table.tsx` (1641 lines)
   - API: `/api/admin/orders/[reference]/assign-driver`

2. **Routes Section** (`/admin/routes`)
   - Manages multi-drop routes
   - Features: Create routes, assign drivers, track progress
   - Component: `EnhancedAdminRoutesDashboard.tsx`
   - APIs: Multiple route creation endpoints

### Key Differences

- **Orders**: Individual deliveries, can be assigned to a driver directly
- **Routes**: Collection of multiple drops, optimized delivery sequence
- **Assignment**: Orders use `Booking.driverId`, Routes use `Route.driverId`
- **Reference System**: Both now use unified SV-NNNNNN format

## Unified Design Architecture

### 1. Single Entry Point: Operations Dashboard

**Location**: `/admin/operations` (new unified page)

**Features**:
- Tabbed interface with two main sections:
  - **Single Orders Tab**: Manage individual orders
  - **Multi-Drop Routes Tab**: Manage routes
- Unified driver assignment modal (works for both)
- Consistent UI/UX across both sections
- Shared components and utilities

### 2. Component Structure

```
/components/admin/operations/
├── UnifiedOperationsDashboard.tsx    (Main container)
├── SingleOrdersSection.tsx           (Orders management)
├── MultiDropRoutesSection.tsx        (Routes management)
├── DriverAssignmentModal.tsx         (Shared assignment modal)
├── OperationsFilters.tsx             (Shared filters)
└── OperationsStats.tsx               (Shared statistics)
```

### 3. Unified Features

#### A. Driver Assignment
- **Single Modal** for assigning/reassigning drivers
- Works for both individual orders and routes
- Shows driver availability, capacity, and current load
- Real-time validation

#### B. Status Management
- Unified status tracking
- Consistent status badges and colors
- Real-time updates via Pusher

#### C. Filtering & Search
- Search by reference number (SV-NNNNNN)
- Filter by status, driver, date range
- Sort by priority, date, value

#### D. Bulk Operations
- Select multiple orders to create a route
- Bulk assign/reassign drivers
- Bulk status updates

### 4. Admin Control Features

#### For Single Orders:
1. **View Order Details**: Full order information
2. **Assign Driver**: Direct driver assignment
3. **Update Status**: Change order status
4. **Cancel Order**: Cancel with reason
5. **Add to Route**: Convert to multi-drop
6. **Edit Order**: Modify order details

#### For Routes:
1. **Create Route**: Manual or automatic creation
2. **Assign Driver**: Assign to available driver
3. **Reassign Driver**: Change driver assignment
4. **Add/Remove Drops**: Modify route composition
5. **Optimize Route**: AI-powered optimization
6. **Cancel Route**: Cancel entire route
7. **Split Route**: Break into smaller routes
8. **Track Progress**: Real-time tracking

### 5. Database Schema (No Changes Required)

Current schema already supports unified operations:

```prisma
model Booking {
  id         String   @id @default(cuid())
  reference  String   @unique  // SV-NNNNNN
  driverId   String?  // For single order assignment
  routeId    String?  // For multi-drop route assignment
  status     String
  // ... other fields
}

model Route {
  id         String   @id @default(cuid())
  reference  String?  @unique  // SV-NNNNNN
  driverId   String?  // Driver assignment
  status     String
  // ... other fields
}
```

**No database changes needed!** ✅

### 6. API Structure

#### Existing APIs (Keep as is):
- `/api/admin/orders/[reference]/assign-driver` - Single order assignment
- `/api/admin/routes/route` - Route creation
- `/api/admin/routes/create` - Manual route creation
- `/api/admin/routes/smart-generate` - AI route generation
- `/api/driver/routes` - Driver routes API

#### New Unified API (Optional):
- `/api/admin/operations/assign` - Unified assignment endpoint
- `/api/admin/operations/stats` - Combined statistics

### 7. Navigation Updates

Update `UnifiedNavigation.tsx`:

```typescript
// Replace separate Orders and Routes with unified Operations
{ label: 'Operations', href: '/admin/operations' }
// Or keep both but make them tabs within operations
```

### 8. iOS Driver App Compatibility

**No changes required** to iOS app because:
1. Driver routes API (`/api/driver/routes`) remains unchanged
2. Reference system already updated (SV-NNNNNN)
3. Driver sees routes regardless of how they were created
4. Single orders assigned to driver can be converted to routes seamlessly

### 9. Implementation Strategy

#### Phase 1: Create Unified Container
- Create `/admin/operations/page.tsx`
- Create `UnifiedOperationsDashboard.tsx` component
- Add tabbed interface

#### Phase 2: Integrate Existing Components
- Extract orders logic into `SingleOrdersSection.tsx`
- Extract routes logic into `MultiDropRoutesSection.tsx`
- Share common components

#### Phase 3: Unified Driver Assignment
- Create `DriverAssignmentModal.tsx`
- Support both orders and routes
- Unified validation and error handling

#### Phase 4: Enhanced Admin Controls
- Add bulk operations
- Add route creation from selected orders
- Add advanced filtering

#### Phase 5: Update Navigation
- Update menu to show Operations
- Keep backward compatibility with old URLs

### 10. Benefits

1. **Single Interface**: Admin manages all deliveries in one place
2. **Consistent UX**: Same look and feel for all operations
3. **Efficient Workflow**: Easy to convert orders to routes
4. **Full Control**: Complete visibility and control over all deliveries
5. **No Breaking Changes**: Existing functionality preserved
6. **iOS Compatible**: No driver app changes needed

### 11. File Modifications Required

#### New Files:
1. `/apps/web/src/app/admin/operations/page.tsx`
2. `/apps/web/src/components/admin/operations/UnifiedOperationsDashboard.tsx`
3. `/apps/web/src/components/admin/operations/SingleOrdersSection.tsx`
4. `/apps/web/src/components/admin/operations/MultiDropRoutesSection.tsx`
5. `/apps/web/src/components/admin/operations/DriverAssignmentModal.tsx`

#### Modified Files:
1. `/apps/web/src/components/shared/UnifiedNavigation.tsx` - Add Operations menu
2. `/apps/web/src/lib/routing.ts` - Add ADMIN_OPERATIONS route

#### Files to Keep (Backward Compatibility):
- `/apps/web/src/app/admin/orders/page.tsx` - Redirect to operations
- `/apps/web/src/app/admin/routes/page.tsx` - Redirect to operations

### 12. Testing Checklist

- [ ] Create single order and assign driver
- [ ] Create route from multiple orders
- [ ] Assign driver to route
- [ ] Reassign driver (order and route)
- [ ] Cancel order
- [ ] Cancel route
- [ ] Bulk operations
- [ ] iOS app still receives routes correctly
- [ ] Reference numbers display correctly
- [ ] Real-time updates work

### 13. Rollout Plan

1. **Development**: Build unified interface
2. **Testing**: Comprehensive testing in dev environment
3. **Soft Launch**: Enable for admin users only
4. **Monitor**: Watch for issues and gather feedback
5. **Full Launch**: Make default for all admins
6. **Deprecate**: Eventually remove old separate pages

## Conclusion

This unified design provides a comprehensive operations management interface while maintaining backward compatibility and requiring **zero database changes**. The implementation focuses on code reuse, consistent UX, and enhanced admin control.

---

**Status**: Design Complete ✅
**Database Changes**: None Required ✅
**iOS Changes**: None Required ✅
**Implementation**: Ready to Proceed ✅

