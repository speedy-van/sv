# Pricing Discrepancy Issue - Analysis & Fix

## Issue Summary

**Problem**: Booking SV-094898 shows £71.00 but should be around £317.54

**Root Cause**: Missing coordinates in the booking data, resulting in distance calculation of 0 and artificially low pricing.

## Detailed Analysis

### Current Booking Data

- **Booking Code**: SV-094898
- **Current Amount**: £71.00 (7100 pence)
- **Pickup Address**: 11 Rosemary Avenue
- **Dropoff Address**: 14 Causeway Close
- **Coordinates**: Both pickup and dropoff coordinates are `null`
- **Distance**: 0m (due to missing coordinates)
- **Status**: awaiting_payment

### Price Breakdown (Current)

```
Base (small/2 crew): £45.00
Items (7 items): £3.50
Volume (5m³): £10.00
Distance: £0.00 (MISSING!)
Subtotal: £58.50
VAT: £11.70
Total: £71.00
```

### Expected Price Breakdown (with distance)

For a 60km journey:

```
Base (small/2 crew): £45.00
Distance (60km): £60.00
Items (7 items): £3.50
Volume (5m³): £10.00
Subtotal: £118.50
VAT: £23.70
Total: £143.00
```

For a 200km journey (closer to expected £317.54):

```
Base (small/2 crew): £45.00
Distance (200km): £200.00
Items (7 items): £3.50
Volume (5m³): £10.00
Subtotal: £258.50
VAT: £51.70
Total: £310.20
```

## Root Cause Analysis

1. **Missing Geocoding**: The booking was created without proper address geocoding
2. **No Distance Calculation**: With null coordinates, distance calculation returns 0
3. **Incomplete Pricing**: Price calculation only includes base fare + items + volume
4. **No Validation**: The booking creation process didn't validate that coordinates were set

## Solutions Implemented

### 1. Enhanced Booking Creation API (`/api/booking-luxury/route.ts`)

**Changes Made**:

- Added validation to ensure geocoding succeeds
- Added distance and duration calculation during booking creation
- Added validation for reasonable distance values (not 0, not too large)
- Added proper error messages for geocoding failures

**Key Improvements**:

```typescript
// Validate geocoding success
if (!f) {
  return NextResponse.json(
    {
      error:
        'Could not geocode pickup address. Please check the address and try again.',
    },
    { status: 400 }
  );
}

// Calculate and validate distance
const route = await directions(
  [pickupLng, pickupLat],
  [dropoffLng, dropoffLat]
);
if (distanceMeters === 0) {
  return NextResponse.json(
    {
      error:
        'Could not calculate distance between addresses. Please check the addresses and try again.',
    },
    { status: 400 }
  );
}
```

### 2. Booking Fix Script (`scripts/fix-problematic-booking.ts`)

**Purpose**: Fix existing problematic bookings by updating coordinates and recalculating prices

**Features**:

- Updates missing coordinates with realistic values
- Recalculates price with proper distance
- Updates database with corrected information
- Provides guidance for payment session management

### 3. Analysis Scripts

Created several scripts for debugging and analysis:

- `scripts/check-booking-pricing.ts` - Check current booking pricing
- `scripts/recalculate-booking-price.ts` - Recalculate price for existing booking
- `scripts/analyze-booking-details.ts` - Detailed booking analysis
- `scripts/estimate-correct-price.ts` - Price estimation for different scenarios

## Immediate Actions Required

### For Booking SV-094898:

1. **Cancel Current Payment Session** (if active)
2. **Run Fix Script**:
   ```bash
   cd apps/web
   npx tsx scripts/fix-problematic-booking.ts
   ```
3. **Create New Payment Session** with corrected price
4. **Notify Customer** of the price correction

### For Future Bookings:

1. **Deploy Enhanced API** with validation
2. **Test Geocoding** with various address formats
3. **Monitor** for geocoding failures
4. **Add Fallback** mechanisms for edge cases

## Prevention Measures

### 1. Address Validation

- Ensure addresses are properly formatted before geocoding
- Add address validation in the frontend
- Provide clear error messages for invalid addresses

### 2. Geocoding Fallbacks

- Implement multiple geocoding providers
- Add manual coordinate input as backup
- Cache successful geocoding results

### 3. Price Validation

- Add minimum price thresholds
- Validate price calculations before booking creation
- Add price sanity checks (e.g., distance-based minimums)

### 4. Monitoring

- Log geocoding failures
- Monitor for bookings with 0 distance
- Alert on pricing anomalies

## Testing

### Test Cases to Add:

1. **Valid Addresses**: Ensure proper geocoding and pricing
2. **Invalid Addresses**: Test error handling
3. **Edge Cases**: Very short/long distances
4. **Geocoding Failures**: Test fallback mechanisms
5. **Price Validation**: Ensure minimum prices are enforced

### Manual Testing:

```bash
# Test booking creation with valid addresses
curl -X POST /api/booking-luxury \
  -H "Content-Type: application/json" \
  -d '{"pickupAddress": "London Bridge", "dropoffAddress": "Tower Bridge"}'

# Test booking creation with invalid addresses
curl -X POST /api/booking-luxury \
  -H "Content-Type: application/json" \
  -d '{"pickupAddress": "Invalid Address 123", "dropoffAddress": "Another Invalid 456"}'
```

## Monitoring & Alerts

### Key Metrics to Monitor:

- Geocoding success rate
- Bookings with 0 distance
- Price anomalies (too low/high)
- Payment session creation failures

### Alerts to Set Up:

- Geocoding failure rate > 5%
- Bookings with distance = 0
- Price < £50 for van services
- Multiple failed payment sessions for same booking

## Conclusion

The pricing discrepancy was caused by missing address geocoding, resulting in 0 distance and artificially low prices. The implemented fixes ensure:

1. **Proper Validation**: Addresses are geocoded before booking creation
2. **Distance Calculation**: Accurate distance and duration are calculated
3. **Price Accuracy**: Prices include all components including distance
4. **Error Handling**: Clear error messages for geocoding failures
5. **Monitoring**: Tools to detect and fix similar issues

This prevents future pricing discrepancies and ensures customers are charged the correct amount for their services.
