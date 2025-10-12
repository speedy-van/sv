# Orders Hub Implementation

## Overview

The Orders Hub is a comprehensive order management system for the Speedy Van admin dashboard. It provides real-time order tracking, driver assignment, bulk operations, and detailed order management capabilities.

## Features Implemented

### ✅ Core Features

1. **Order List with Multiple Views**
   - Table view with sortable columns
   - Card view for visual browsing
   - Kanban board view by status
   - Real-time SLA clock indicators

2. **Advanced Filtering & Search**
   - Search by order code, address, customer name/email
   - Filter by status, payment status, date range
   - Filter by driver name and service area
   - Date range filtering (today, week, month)

3. **Bulk Operations**
   - Bulk driver assignment (manual or auto-assign)
   - Bulk status changes
   - Bulk export to CSV
   - Bulk email notifications
   - Bulk order editing

4. **Order Detail Drawer**
   - Comprehensive order information
   - Tabbed interface (Overview, Timeline, Payment, Communications, Files)
   - Driver assignment with suggestions
   - Inline editing capabilities
   - Real-time updates

5. **Driver Assignment System**
   - Smart driver suggestions based on:
     - Rating and experience
     - Current workload (max 3 active jobs)
     - Availability status
   - Auto-assignment with intelligent matching
   - Manual assignment with driver selection
   - Atomic assignment to prevent conflicts

6. **SLA Monitoring**
   - Real-time SLA clock for each order
   - Visual indicators (green/yellow/red)
   - Time-based alerts and warnings
   - Overdue order highlighting

### ✅ API Endpoints

#### Orders List

```
GET /api/admin/orders
```

**Query Parameters:**

- `q` - Search query
- `status` - Filter by status
- `payment` - Filter by payment status
- `driver` - Filter by driver name
- `area` - Filter by service area
- `dateRange` - Filter by date range (today/week/month)
- `take` - Number of results (max 200)
- `cursor` - Pagination cursor

#### Order Detail

```
GET /api/admin/orders/[code]
```

Returns comprehensive order data including:

- Customer information
- Driver details
- Assignment and job events
- Messages and communications
- Tracking pings

#### Update Order

```
PUT /api/admin/orders/[code]
```

**Body:**

```json
{
  "status": "assigned",
  "driverId": "driver_id",
  "timeSlot": "am",
  "preferredDate": "2024-01-15",
  "notes": "Reason for change"
}
```

#### Driver Assignment

```
GET /api/admin/orders/[code]/assign
```

Returns driver suggestions with scoring.

```
POST /api/admin/orders/[code]/assign
```

**Body:**

```json
{
  "driverId": "driver_id",
  "autoAssign": false,
  "reason": "Manual assignment"
}
```

#### Bulk Operations

```
POST /api/admin/orders/bulk
```

**Body:**

```json
{
  "orderIds": ["id1", "id2"],
  "action": "assign|status|edit|export|email",
  "data": {
    "driverId": "driver_id",
    "status": "assigned",
    "timeSlot": "am",
    "reason": "Bulk operation"
  }
}
```

### ✅ Database Schema

The implementation uses the existing Prisma schema with the following key models:

- `Booking` - Main order entity
- `User` - Customer and driver users
- `Driver` - Driver profiles and status
- `Assignment` - Driver-job assignments
- `JobEvent` - Order timeline events
- `Message` - Order communications
- `TrackingPing` - Real-time location updates

### ✅ Components

#### OrderDetailDrawer

- Comprehensive order detail view
- Tabbed interface for different data types
- Driver assignment modal with suggestions
- Inline editing capabilities
- Real-time updates

#### Enhanced Orders Table

- Multiple view modes (table, card, kanban)
- SLA monitoring with visual indicators
- Bulk selection and operations
- Advanced filtering and search
- Real-time status updates

### ✅ Security & Audit

- All operations are RBAC-protected
- Comprehensive audit logging for all changes
- Atomic operations to prevent race conditions
- Input validation and sanitization
- Error handling with user-friendly messages

## Usage Examples

### 1. View Orders

Navigate to `/admin/orders` to see the main orders list.

### 2. Filter Orders

Use the filter panel to:

- Search for specific orders
- Filter by status or payment
- Filter by date range
- Filter by driver or area

### 3. Bulk Assign Drivers

1. Select multiple orders using checkboxes
2. Click "Assign Driver" in bulk actions
3. Choose auto-assign or select specific driver
4. Add notes for audit trail

### 4. View Order Details

Click on any order row to open the detail drawer with:

- Complete order information
- Timeline of events
- Payment details
- Communications history
- File attachments

### 5. Assign Driver to Single Order

1. Open order detail drawer
2. Click "Assign" or "Reassign" button
3. Choose from suggested drivers or auto-assign
4. Confirm assignment

## Testing

Run the test script to create sample data:

```bash
cd apps/web
npx tsx scripts/test-orders-hub.ts
```

This creates:

- Test customer and driver
- 5 orders in different states
- Job events and timeline data
- Messages and tracking data

## Performance Considerations

- Pagination with cursor-based navigation
- Efficient database queries with proper indexing
- Real-time updates via polling (can be enhanced with WebSockets)
- Optimistic UI updates for better perceived performance
- Debounced search to reduce API calls

## Future Enhancements

1. **Real-time Updates**
   - WebSocket integration for live updates
   - Push notifications for status changes

2. **Advanced Analytics**
   - Order performance metrics
   - Driver efficiency tracking
   - SLA compliance reporting

3. **Mobile Optimization**
   - Responsive design improvements
   - Touch-friendly interactions

4. **Integration Features**
   - Email/SMS notifications
   - Third-party logistics integration
   - Payment gateway integration

## Error Handling

The system includes comprehensive error handling:

- Network error recovery
- Validation error display
- User-friendly error messages
- Retry mechanisms for failed operations
- Graceful degradation for offline scenarios

## Accessibility

- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management for modals and drawers
- ARIA labels and descriptions
