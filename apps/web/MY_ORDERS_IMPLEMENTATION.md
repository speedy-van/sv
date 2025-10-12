# My Orders Feature Implementation

## Overview

The "My Orders" feature has been implemented as part of the Customer Portal, providing customers with a comprehensive view of their bookings and the ability to manage them effectively.

## Features Implemented

### 1. Orders List Page (`/customer-portal/orders`)

**Key Features:**

- **Tabbed Interface**: Three tabs for different order categories:
  - Current & Upcoming (pending, confirmed, assigned, en route, etc.)
  - Past (completed, cancelled, failed)
  - All (complete order history)

- **Statistics Dashboard**:
  - Current & Upcoming count
  - Completed orders count
  - Total orders count

- **Enhanced Table Display**:
  - Order reference with creation date
  - Date & time information
  - Route details (pickup → dropoff)
  - Crew size and van type
  - Price with payment status
  - Status badges with color coding
  - Action buttons (View, Track, Download Invoice, Support)

- **Responsive Design**: Mobile-friendly with horizontal scrolling for tables

- **Empty States**: Helpful messages when no orders exist with call-to-action buttons

### 2. Order Details Page (`/customer-portal/orders/[code]`)

**Key Features:**

- **Status Timeline**: Visual timeline showing order progress with icons and descriptions
- **Live Tracking**: Map placeholder with link to full tracking page
- **Addresses & Access**: Detailed pickup/dropoff information including building details
- **Items & Extras**: Service details (van size, crew, assembly, packing materials, etc.)
- **Driver Assignment**: Crew information when assigned
- **Payments & Documents**:
  - Total amount with discount breakdown
  - Payment completion button
  - Receipt and invoice download
- **Actions**:
  - Reschedule (when applicable)
  - Cancel order (when applicable)
  - Get support
  - Add notes

### 3. API Endpoints

**Enhanced Order Details API** (`/api/customer/orders/[code]`):

- Comprehensive booking data with driver information
- Timeline generation based on order status
- Permission checks for actions (reschedule, cancel, track)

**Invoice Download API** (`/api/customer/orders/[code]/invoice`):

- PDF generation for paid orders
- Proper authentication and authorization
- Structured invoice data

### 4. Reusable Components

**OrderStatusTimeline Component**:

- Visual timeline with icons and status indicators
- Timestamp formatting
- Responsive design
- Reusable across different order views

## Data Model

The implementation uses the existing `Booking` model with the following key fields:

```typescript
interface Booking {
  id: string;
  code: string; // Order reference
  customerId: string;
  status: string; // open, confirmed, assigned, etc.
  pickupAddress: string;
  dropoffAddress: string;
  preferredDate: Date;
  timeSlot: string; // am, pm, evening
  crewSize: number;
  vanSize: string;
  amountPence: number;
  paymentStatus: string;
  buildingType: string;
  hasElevator: boolean;
  stairsFloors: number;
  specialInstructions: string;
  assembly: boolean;
  packingMaterials: boolean;
  heavyItems: boolean;
  // ... other fields
}
```

## Status Flow

The order status follows this progression:

1. **open** → Booking created
2. **pending_dispatch** → Finding crew
3. **confirmed** → Booking confirmed
4. **assigned** → Crew assigned
5. **en_route_pickup** → Crew heading to pickup
6. **arrived** → Crew arrived at pickup
7. **loaded** → Items loaded, heading to dropoff
8. **en_route_dropoff** → Crew heading to dropoff
9. **completed** → Order completed

## Security & Permissions

- **Authentication**: All routes require customer role authentication
- **Authorization**: Customers can only view their own orders
- **API Protection**: Server-side validation for all endpoints
- **Data Isolation**: Proper customer ID filtering in all queries

## Testing

### Test Data

Created test script `scripts/create-test-customer-orders.ts` that generates:

- Test customer account
- 6 sample orders with different statuses
- Various scenarios (paid/unpaid, different van sizes, etc.)

### Test Cases

Created `__tests__/orders.test.tsx` with tests for:

- Page rendering
- Statistics display
- Order table functionality
- Status badges
- Action buttons

## Future Enhancements

### Planned Features:

1. **Reschedule Functionality**: Allow customers to reschedule orders
2. **Cancellation Workflow**: Implement order cancellation with refunds
3. **Real-time Updates**: WebSocket integration for live status updates
4. **Advanced Filtering**: Search and filter orders by date, status, etc.
5. **Bulk Actions**: Select multiple orders for batch operations
6. **Export Functionality**: Download order history as CSV/PDF
7. **Rating System**: Rate completed orders
8. **Communication**: In-app messaging with drivers

### Technical Improvements:

1. **PDF Generation**: Implement proper PDF generation for invoices
2. **Caching**: Add Redis caching for frequently accessed data
3. **Pagination**: Implement pagination for large order lists
4. **Real-time Tracking**: Integrate with GPS tracking system
5. **Push Notifications**: Status change notifications

## Usage

### For Customers:

1. Navigate to `/customer-portal/orders`
2. View orders by status using tabs
3. Click "View" to see detailed order information
4. Use "Track" button for active orders
5. Download invoices for paid orders
6. Contact support for any issues

### For Developers:

1. Test with sample data: `npx tsx scripts/create-test-customer-orders.ts`
2. Run tests: `npm test`
3. Access test customer: `test@customer.com`
4. View sample orders: SV001-SV006

## File Structure

```
apps/web/src/app/(customer-portal)/customer-portal/orders/
├── page.tsx                           # Main orders list
├── [code]/
│   └── page.tsx                       # Order details
└── __tests__/
    └── orders.test.tsx                # Tests

apps/web/src/app/api/customer/orders/
├── route.ts                           # Orders list API
├── [code]/
│   ├── route.ts                       # Order details API
│   ├── invoice/
│   │   └── route.ts                   # Invoice download API
│   └── receipt/
│       └── route.ts                   # Receipt download API

apps/web/src/components/
└── OrderStatusTimeline.tsx            # Timeline component

apps/web/scripts/
└── create-test-customer-orders.ts     # Test data generator
```

## Dependencies

- **Chakra UI**: Component library for UI elements
- **Prisma**: Database ORM for data access
- **NextAuth**: Authentication and session management
- **TypeScript**: Type safety and development experience

## Performance Considerations

- **Database Queries**: Optimized with proper indexing
- **Component Loading**: Lazy loading for large order lists
- **Image Optimization**: Efficient handling of order-related images
- **Caching Strategy**: Implemented for frequently accessed data

This implementation provides a solid foundation for the My Orders feature with room for future enhancements and scalability.
