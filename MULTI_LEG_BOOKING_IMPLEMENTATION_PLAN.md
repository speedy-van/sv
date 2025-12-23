# Multi-Leg Booking System - Implementation Plan

## Overview
Support multi-leg bookings with return journeys and additional journey segments in the booking-luxury flow.

## Phase 1: Data Model & Types (Foundation)
**Duration:** 1-2 hours
**Files to Create/Modify:**
- `apps/web/src/app/booking-luxury/types/segment.ts` (NEW)
- `apps/web/src/app/booking-luxury/hooks/useBookingForm.ts` (MODIFY)

### 1.1 Create Segment Type
```typescript
// apps/web/src/app/booking-luxury/types/segment.ts
export interface BookingSegment {
  id: string;
  type: 'outbound' | 'return' | 'new-journey';
  pickupAddress: CompleteAddress;
  dropoffAddress: CompleteAddress;
  pickupProperty: PropertyDetails;
  dropoffProperty: PropertyDetails;
  datetime: string;
  items: Item[];
  vehicleId?: string;
  vehicleSelection?: VehicleType;
  price: number;
  notes?: string;
  estimatedArrival?: string;
}

export interface MultiLegBookingData {
  segments: BookingSegment[];
  totalPrice: number;
  discounts?: {
    type: string;
    amount: number;
    description: string;
  }[];
}
```

### 1.2 Update useBookingForm Hook
- Add `segments: BookingSegment[]` to FormData
- Add helper functions:
  - `addReturnSegment()` - Mirror outbound
  - `addNewJourneySegment()` - Create empty segment
  - `updateSegment(index, data)` - Update specific segment
  - `removeSegment(index)` - Remove segment
  - `validateSegmentChronology()` - Check time ordering

## Phase 2: Step 1 UI - Segments Management
**Duration:** 3-4 hours
**Files to Create/Modify:**
- `apps/web/src/app/booking-luxury/components/SegmentTabs.tsx` (NEW)
- `apps/web/src/app/booking-luxury/components/SegmentAccordion.tsx` (NEW)
- `apps/web/src/app/booking-luxury/components/AddressesStep.tsx` (MODIFY)

### 2.1 Create SegmentTabs Component
```typescript
// Tabs/Accordion for managing multiple segments
<Tabs>
  <Tab>Outbound (Required)</Tab>
  <Tab>Return (Optional)</Tab>
  <Tab>New Journey 1</Tab>
  // ...
</Tabs>
```

### 2.2 Add CTAs
- **Button 1:** "Use drop-off as return pickup"
  - Mirror addresses
  - Copy items
  - Calculate return datetime (arrival + buffer)
  - Show toast confirmation

- **Button 2:** "Add new journey"
  - Create empty segment
  - Require all fields

### 2.3 Validation Logic
- Chronology check: `segment[n].datetime > segment[n-1].estimatedArrival`
- Required fields per segment
- Real-time validation with inline errors

## Phase 3: Step 2 UI - Per-Segment Services
**Duration:** 2-3 hours
**Files to Modify:**
- `apps/web/src/app/booking-luxury/components/WhereAndWhatStepHierarchical.tsx`

### 3.1 Per-Segment Summary
- Display each segment with:
  - Pickup → Dropoff addresses
  - Date & Time
  - Items summary

### 3.2 Vehicle Selection
- Default: Same vehicle for all segments
- Option: Override per segment
- Availability check per segment

### 3.3 Pricing Calculation
- Calculate price per segment
- Sum all segment prices
- Show per-segment pricing breakdown
- Placeholder for future return discount

## Phase 4: Step 3 UI - Review & Payment
**Duration:** 2-3 hours
**Files to Modify:**
- `apps/web/src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx`

### 4.1 Review Table
```tsx
<Table>
  <Tr>
    <Th>Segment</Th>
    <Th>Route</Th>
    <Th>Date/Time</Th>
    <Th>Items</Th>
    <Th>Vehicle</Th>
    <Th>Price</Th>
  </Tr>
  {segments.map(segment => (
    <Tr>
      <Td>{segment.type}</Td>
      <Td>{segment.pickupAddress} → {segment.dropoffAddress}</Td>
      <Td>{segment.datetime}</Td>
      <Td>{segment.items.length} items</Td>
      <Td>{segment.vehicleSelection}</Td>
      <Td>£{segment.price}</Td>
    </Tr>
  ))}
  <Tr>
    <Td colSpan="5">Total</Td>
    <Td>£{totalPrice}</Td>
  </Tr>
</Table>
```

### 4.2 Payment
- Single payment covering all segments
- Stripe session for combined total
- Booking creation with all segments

## Phase 5: Backend API Updates
**Duration:** 3-4 hours
**Files to Modify:**
- `apps/web/src/app/api/booking-luxury/route.ts`
- Database schema (Prisma)

### 5.1 Database Schema
```prisma
model BookingSegment {
  id String @id @default(uuid())
  bookingId String
  booking Booking @relation(fields: [bookingId], references: [id])
  
  type String // 'outbound' | 'return' | 'new-journey'
  sequenceNumber Int
  
  pickupAddress Json
  dropoffAddress Json
  pickupProperty Json
  dropoffProperty Json
  
  datetime DateTime
  estimatedArrival DateTime?
  
  items Json
  vehicleId String?
  vehicleType String?
  
  price Decimal
  notes String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([bookingId])
  @@index([type])
}

model Booking {
  // ... existing fields
  segments BookingSegment[]
  isMultiLeg Boolean @default(false)
  totalSegments Int @default(1)
}
```

### 5.2 API Endpoint Updates
- Accept `segments[]` in booking creation
- Validate chronology server-side
- Create all segments in transaction
- Return combined booking with segments

## Phase 6: Helpers & Utilities
**Duration:** 1-2 hours
**Files to Create:**
- `apps/web/src/app/booking-luxury/utils/segmentHelpers.ts` (NEW)

### 6.1 Helper Functions
```typescript
export function mirrorSegmentForReturn(outbound: BookingSegment): BookingSegment {
  return {
    id: generateId(),
    type: 'return',
    pickupAddress: outbound.dropoffAddress,
    dropoffAddress: outbound.pickupAddress,
    pickupProperty: outbound.dropoffProperty,
    dropoffProperty: outbound.pickupProperty,
    datetime: calculateReturnTime(outbound.datetime, outbound.estimatedArrival),
    items: cloneDeep(outbound.items),
    vehicleId: outbound.vehicleId,
    vehicleSelection: outbound.vehicleSelection,
    price: 0, // Will be calculated
    notes: '',
  };
}

export function validateSegmentChronology(segments: BookingSegment[]): {
  valid: boolean;
  errors: { segmentIndex: number; message: string }[];
} {
  // Implementation
}

export function calculateReturnTime(
  outboundStart: string,
  outboundArrival: string | undefined,
  bufferMinutes: number = 30
): string {
  // Implementation
}
```

## Phase 7: Testing
**Duration:** 2-3 hours

### 7.1 Test Cases
1. ✅ Return CTA copies addresses, items, calculates time
2. ✅ Return fields remain editable after prefill
3. ✅ Outbound edits don't affect Return after prefill
4. ✅ New Journey CTA creates empty segment
5. ✅ Validation blocks progression with missing fields
6. ✅ Chronology validation works
7. ✅ Step 2: Per-segment vehicle override
8. ✅ Step 2: Pricing calculated per segment
9. ✅ Step 3: All segments shown in review
10. ✅ Step 3: Total = sum of segment prices
11. ✅ Payment: Single charge for all segments
12. ✅ Backend: All segments saved correctly

## Timeline Summary
- **Phase 1:** Data Model - 1-2 hours
- **Phase 2:** Step 1 UI - 3-4 hours
- **Phase 3:** Step 2 UI - 2-3 hours
- **Phase 4:** Step 3 UI - 2-3 hours
- **Phase 5:** Backend - 3-4 hours
- **Phase 6:** Helpers - 1-2 hours
- **Phase 7:** Testing - 2-3 hours

**Total Estimated Time:** 14-21 hours (2-3 days of focused work)

## Implementation Order
1. Start with Phase 1 (Foundation)
2. Build Phase 2 (Step 1 UI) - Most complex
3. Update Phase 3 (Step 2 UI)
4. Update Phase 4 (Step 3 UI)
5. Implement Phase 5 (Backend)
6. Create Phase 6 (Helpers)
7. Complete Phase 7 (Testing)

## Notes
- Keep backward compatibility: Single-leg bookings should work as before
- Use feature flag if needed: `ENABLE_MULTI_LEG_BOOKINGS`
- Start with UI mockups/wireframes before implementation
- Consider mobile responsiveness for all new components
- Add analytics tracking for multi-leg feature usage

## Next Steps
1. Review and approve this plan
2. Create detailed wireframes/mockups
3. Set up feature branch: `feature/multi-leg-bookings`
4. Begin Phase 1 implementation
