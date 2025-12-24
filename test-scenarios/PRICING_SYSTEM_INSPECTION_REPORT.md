# BOOKING-LUXURY PRICE SYSTEM - COMPREHENSIVE INSPECTION REPORT

**Repository**: `https://github.com/speedy-van/sv` [1]  
**Latest Commit**: `f3951d6d` (Dec 24, 2025) [2]  
**Commit Message**: Fix: Update price calculation when crew size changes in Step 2 and when items quantity decreases in Step 3  
**Inspection Date**: Dec 24, 2025

---

## EXECUTIVE SUMMARY

The booking-luxury application implements a multi-layered pricing system with three distinct pricing engines. The latest commit (`f3951d6d`) addresses critical bugs in price recalculation when crew size changes and item quantities are modified. However, several architectural and implementation issues have been identified that require attention.

**Key Findings:**
- ✅ Crew size multiplier logic is correctly implemented (3-men: +25%, 4-men: +50%)
- ⚠️ Three separate pricing engines create maintenance burden and inconsistency risks
- ⚠️ Price update timing relies on 150ms delays, indicating state management issues
- ❌ Multi-leg booking item allocation may cause double-counting
- ❌ Incomplete price breakdown storage prevents auditing

---

## 1. SYSTEM ARCHITECTURE

### 1.1 Pricing Engines

Three separate pricing calculation engines are implemented:

| Engine | Location | Lines | Status | Used By |
|--------|----------|-------|--------|---------|
| **Unified Pricing Engine** | `src/lib/pricing/unified-engine.ts` [3] | 693 | PRODUCTION | `/api/pricing/quote` |
| **Comprehensive Pricing Engine** | `apps/web/src/lib/pricing/comprehensive-engine.ts` [4] | 1610 | PRODUCTION | `/api/pricing/comprehensive` |
| **Dynamic Pricing Engine** | `apps/web/src/lib/services/dynamic-pricing-engine.ts` [5] | N/A | PRODUCTION | Booking creation |

### 1.2 API Endpoints

| Endpoint | Engine | Purpose |
|----------|--------|---------|
| `/api/pricing/quote` | Unified | Initial price quote |
| `/api/pricing/comprehensive` | Comprehensive | Detailed pricing with capacity |
| `/api/booking-luxury` | Dynamic | Booking creation with pricing |

---

## 2. CRITICAL ISSUES

### ISSUE #1: MULTIPLE PRICING ENGINES

**Severity**: 🔴 HIGH  
**Category**: Architecture

**Description**:  
Three separate pricing calculation engines create maintenance burden and potential inconsistencies. Different endpoints may produce different prices for identical inputs.

**Evidence**:
- `/api/pricing/quote` uses `UnifiedPricingEngine` [6]
- `/api/pricing/comprehensive` uses `ComprehensivePricingEngine` [7]
- `/api/booking-luxury` uses `DynamicPricingEngine` [8]
- No unified interface or parity validation between engines

**Impact**:
- Customer confusion if prices differ between quote and booking
- Difficult to debug pricing issues
- Maintenance nightmare with three code paths
- Inconsistent business logic

**Recommendation**:
```
1. Consolidate to single pricing engine
2. Create adapter pattern if multiple engines are needed
3. Implement comprehensive parity tests
4. Add integration tests comparing all endpoints
```

---

### ISSUE #2: MULTI-LEG BOOKING ITEM ALLOCATION

**Severity**: 🔴 HIGH  
**Category**: Business Logic

**Location**: `apps/web/src/app/api/booking-luxury/route.ts` (lines 517-533) [8]

**Description**:  
Items may not be correctly allocated to segments in multi-leg bookings, causing double-counting.

**Evidence**:
```typescript
// If segment has no items, use items from first segment or global items
let segmentItems = segment.items || [];
if (!segmentItems || segmentItems.length === 0) {
  // Fallback to first segment items
  if (rawSegments[0]?.items && Array.isArray(rawSegments[0].items)) {
    segmentItems = rawSegments[0].items;
    console.log(`⚠️ Segment ${i + 1} has no items, using items from first segment`);
  } else if (pricingItems && pricingItems.length > 0) {
    // Fallback to global items
    segmentItems = pricingItems;
  }
}
```

**Problem**:
- If segment has no items, it uses ALL items from first segment
- This means items may be counted multiple times
- Pricing will be incorrect for multi-leg bookings

**Example**:
```
Booking with 2 segments:
- Segment 1: Sofa (£100)
- Segment 2: No items specified

Current behavior: Segment 2 gets Sofa too (£100)
Total price: £200 (should be £100)
```

**Recommendation**:
```
1. Require explicit item allocation for each segment
2. Validate that items don't exceed total quantity
3. Implement item tracking across segments
4. Add unit tests for multi-leg pricing
```

---

### ISSUE #3: RACE CONDITIONS IN PRICE CALCULATION

**Severity**: 🟠 MEDIUM  
**Category**: State Management

**Location**: `apps/web/src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx` (multiple locations) [9]

**Description**:  
Multiple locations use `setTimeout(150ms)` to ensure state updates before price recalculation, indicating race conditions.

**Evidence**:
```typescript
// Multiple instances of:
setTimeout(() => {
  if (calculateComprehensivePricing) {
    await calculateComprehensivePricing();
  }
}, 150);
```

**Root Cause**:
- React state updates are asynchronous
- Price calculation depends on updated state
- 150ms delay is arbitrary and unreliable

**Impact**:
- Slow devices may not have enough time
- Fast devices waste 150ms
- Potential for stale state calculations
- Unreliable price updates

**Recommendation**:
```
1. Use useEffect with proper dependency tracking
2. Implement state synchronization mechanism
3. Consider using a state management library (Redux, Zustand)
4. Use useCallback and useMemo to prevent unnecessary recalculations
```

---

## 3. CREW SIZE MULTIPLIER LOGIC

### 3.1 Multiplier Rates

| Crew Size | Multiplier | Surcharge |
|-----------|-----------|-----------|
| 1 man | 0% | None |
| 2 men | 0% | None (baseline) |
| 3 men | +25% | Base × 0.25 |
| 4 men | +50% | Base × 0.50 |

### 3.2 Implementation Locations

**Primary**: `apps/web/src/lib/pricing/comprehensive-engine.ts` (lines 1126-1131) [4]

```typescript
const crewMultipliers: Record<string, number> = {
  '1': 0,
  '2': 0,
  '3': 0.25,
  '4': 0.50
};
const crewMultiplier = crewMultipliers[crewSize] || 0;
const crewSurcharge = adjustedSubtotal * crewMultiplier;
adjustedSubtotal = adjustedSubtotal + crewSurcharge;
```

**Secondary**: `apps/web/src/app/api/booking-luxury/route.ts` (lines 696-701) [8]

```typescript
const crewMultipliers: Record<string, number> = {
  'ONE': 0,
  'TWO': 0,
  'THREE': 25,
  'FOUR': 50,
};
const crewMultiplierPercent = crewMultipliers[mappedCrewSize] || 0;
const crewSurcharge = baseTotal * (crewMultiplierPercent / 100);
const calculatedTotal = baseTotal + crewSurcharge;
```

### 3.3 Calculation Example

```
Base price: £100
Crew size: 3 men
Multiplier: 0.25 (25%)
Surcharge: £100 × 0.25 = £25
Final price: £100 + £25 = £125
```

### 3.4 Recent Bug Fix (Commit f3951d6d)

**Issue**: Price didn't update when changing crew size in Step 2

**Root Cause**:
- React state updates were not synchronized with pricing calculations
- 150ms delay was needed to ensure state propagation

**Fix Applied**:
- Added `calculateComprehensivePricing` call after crew size change
- Added 150ms delay before price recalculation
- Applied same fixes to `incrementItem`, `decrementItem`, `removeItem`

**Status**: ✅ FIXED (but with workaround, not proper solution)

---

## 4. PRICE CALCULATION FLOW

### 4.1 Step-by-Step Breakdown

```
1. Item Enrichment
   ├─ Validate items against catalog
   ├─ Use fallback values for missing items
   └─ Calculate weight and volume

2. Route Calculation
   ├─ Calculate distance between pickup and dropoffs
   ├─ Estimate duration (2 minutes per km)
   └─ Calculate multi-drop legs

3. Base Fees
   ├─ Base fee: £25.00
   ├─ Items fee: weight + volume based
   ├─ Distance fee: distance × £1.50/km
   ├─ Service fee: based on service level
   └─ Vehicle fee: based on vehicle type

4. Surcharges
   ├─ Stairs: £5.00 per flight
   ├─ Parking: variable
   ├─ Congestion zone: variable
   ├─ Time window: variable
   └─ Access: variable

5. Discounts
   ├─ Multi-drop: applied for multiple stops
   ├─ Loyalty: for returning customers
   └─ Promo code: variable

6. Service Level Multipliers
   ├─ Standard: 1.0x
   ├─ Express: 1.5x
   ├─ Scheduled: 0.9x
   ├─ Premium: 1.4x
   └─ White-glove: 1.8x

7. Crew Size Multiplier
   ├─ 1-man: 0%
   ├─ 2-men: 0%
   ├─ 3-men: +25%
   └─ 4-men: +50%

8. VAT
   └─ 20% VAT added to final amount
```

### 4.2 Pricing Formula

```
final_price = (base_fee + items_fee + distance_fee + service_fee + 
               vehicle_fee + access_fee + addons_fee + surcharges - 
               discounts) * service_multiplier * (1 + crew_multiplier) * 1.20
```

---

## 5. DATABASE SCHEMA ISSUES

### 5.1 Booking Model Price Fields

| Field | Type | Status | Notes |
|-------|------|--------|-------|
| `totalGBP` | Int | ✅ Active | Total price in pence |
| `distanceCostGBP` | Int | ⚠️ Deprecated | "No longer calculated" |
| `itemsSurchargeGBP` | Int | ✅ Active | Items surcharge |
| `accessSurchargeGBP` | Int | ✅ Active | Access surcharge |
| `weatherSurchargeGBP` | Int | ⚠️ Deprecated | "Not implemented" |
| `availabilityMultiplierPercent` | Int | ✅ Active | Availability multiplier |
| `crewMultiplierPercent` | Int | ✅ Active | Crew size multiplier |
| `crewSize` | Enum | ✅ Active | ONE, TWO, THREE, FOUR |

### ISSUE #4: DEPRECATED FIELDS

**Severity**: 🟡 LOW  
**Category**: Data Quality

**Description**:  
Several price fields are marked as deprecated but still stored in database.

**Evidence**:
- `distanceCostGBP`: "No longer calculated" (`booking-luxury/route.ts`:739) [8]
- `weatherSurchargeGBP`: "Not implemented in new pricing engine"

**Impact**:
- Database bloat
- Confusion about which fields are used
- Potential for incorrect calculations using old fields

**Recommendation**:
```
1. Create migration to remove deprecated fields
2. Update schema documentation
3. Implement field deprecation warnings
4. Archive historical data before removal
```

---

### ISSUE #5: INCOMPLETE PRICE BREAKDOWN STORAGE

**Severity**: 🟠 MEDIUM  
**Category**: Auditing

**Description**:  
Not all pricing components are stored in the database for future reference or auditing.

**Missing Fields**:
- Service level multiplier applied
- Promo code discount details
- Seasonal multiplier applied
- Urgency fee details
- Loyalty tier applied
- Calculation engine version
- Calculation timestamp

**Impact**:
- Cannot audit pricing decisions
- Cannot recalculate prices for refunds/adjustments
- Difficult to debug customer complaints
- No pricing history for analytics

**Recommendation**:
```
1. Add pricingBreakdown JSON field to store complete breakdown
2. Include all multipliers and surcharges
3. Store calculation timestamp and engine version
4. Implement price audit trail
5. Create pricing history table
```

---

## 6. VALIDATION AND ERROR HANDLING

### ISSUE #6: INCOMPLETE INPUT VALIDATION

**Severity**: 🟠 MEDIUM  
**Category**: Data Validation

**Location**: `apps/web/src/app/api/pricing/comprehensive/route.ts` (lines 77-87) [7]

**Description**:  
If no items provided, uses default item with arbitrary values.

**Evidence**:
```typescript
const itemsToTransform = validatedRequest.items && validatedRequest.items.length > 0 
  ? validatedRequest.items 
  : [{
      id: 'default-item',
      name: 'Standard Item',
      quantity: 1
    }];

if (!validatedRequest.items || validatedRequest.items.length === 0) {
  console.warn('⚠️ No items provided in request - using default item for pricing calculation');
}
```

**Problem**:
- Default item has arbitrary weight/volume
- May not represent actual booking
- Pricing will be inaccurate

**Recommendation**:
```
1. Require at least one item
2. Validate item details before calculation
3. Provide clear error messages
4. Return error instead of using default
```

---

### ISSUE #7: MISSING ERROR HANDLING

**Severity**: 🟠 MEDIUM  
**Category**: Error Handling

**Description**:  
Some error conditions are logged but not properly handled.

**Evidence**:
- Segment validation errors are logged but booking continues
- Geocoding failures are caught but silently ignored
- Dataset loading failures use fallback without warning

**Impact**:
- Silent failures may cause incorrect pricing
- Difficult to debug issues
- Poor user experience

**Recommendation**:
```
1. Implement proper error recovery
2. Provide user-facing error messages
3. Log all errors for debugging
4. Implement error tracking (Sentry, etc.)
```

---

## 7. PERFORMANCE ISSUES

### ISSUE #8: INEFFICIENT PRICE RECALCULATION

**Severity**: 🟡 LOW  
**Category**: Performance

**Description**:  
Prices are recalculated multiple times during booking flow without caching.

**Evidence**:
- `calculateComprehensivePricing` is called after every item change
- No caching or memoization of results
- Network requests made for every change

**Impact**:
- Slow UI on slow connections
- High server load
- Poor user experience
- Unnecessary API calls

**Recommendation**:
```
1. Implement client-side caching
2. Debounce price calculation requests
3. Use memoization for expensive calculations
4. Implement request coalescing
```

---

## 8. TESTING COVERAGE

### 8.1 Test Files Identified

| File | Lines | Coverage |
|------|-------|----------|
| `pricing-availability.test.ts` | 385 | Integration tests |
| `capacity-integration.test.ts` | 354 | Capacity validation |
| `quantity-validation.test.ts` | 372 | Quantity validation |
| `route.test.ts` | 626 | Pricing API tests |
| `unified-engine.test.ts` | 680 | Engine unit tests |

### 8.2 Coverage Assessment

**Strengths**:
- ✅ Unit tests for unified engine (680 lines)
- ✅ Integration tests for capacity and quantity
- ✅ API endpoint tests

**Gaps**:
- ❌ No tests for crew size multiplier
- ❌ No tests for multi-leg booking pricing
- ❌ No tests for price update timing
- ❌ No regression tests for recent fixes
- ❌ No E2E tests

### 8.3 Recommendation

```
1. Add crew size multiplier tests
2. Add multi-leg booking tests
3. Add regression tests for f3951d6d fix
4. Implement E2E tests
5. Add performance benchmarks
6. Add parity tests between engines
```

---

## 9. PRICING CONFIGURATION

### 9.1 Base Rates (from `src/config/pricing.json`)

| Rate | Value | Unit |
|------|-------|------|
| Base Fee | £25.00 | Fixed |
| Per KM | £1.50 | Variable |
| Per Minute | £0.50 | Variable |
| Per M³ | £5.00 | Variable |
| Per KG | £0.10 | Variable |

### 9.2 Service Level Multipliers

| Service | Multiplier | Description |
|---------|-----------|-------------|
| Standard | 1.0x | Next day delivery |
| Express | 1.5x | Same day delivery |
| Scheduled | 0.9x | Booked in advance |
| Signature | 1.2x | Premium service |
| Premium | 1.4x | White glove service |
| White-Glove | 1.8x | Full-service luxury |

### 9.3 Surcharges

| Surcharge | Amount | Notes |
|-----------|--------|-------|
| Stairs | £5.00 per flight | Up to 10 flights |
| Parking | Variable | Difficult parking areas |
| Congestion Zone | Variable | London congestion charge |
| Time Window | Variable | Specific time slot |
| Oversized Item | £15.00 | Special handling |
| Fragile Item | £10.00 | Extra care |
| Disassembly | £15.00 per item | Furniture disassembly |
| Reassembly | £20.00 per item | Furniture reassembly |
| Packing | £10.00 per M³ | Professional packing |

---

## 10. DOCUMENTATION ISSUES

### ISSUE #9: INCOMPLETE DOCUMENTATION

**Severity**: 🟡 LOW  
**Category**: Documentation

**Description**:  
Pricing system lacks comprehensive documentation.

**Missing**:
- Pricing algorithm specification
- Service level multiplier documentation
- Crew size calculation documentation
- Multi-leg booking pricing rules
- Error handling procedures
- Pricing configuration guide

**Recommendation**:
```
1. Create comprehensive pricing documentation
2. Document all multipliers and surcharges
3. Create pricing calculation examples
4. Document error handling procedures
5. Create troubleshooting guide
```

---

## 11. SUMMARY OF ISSUES

### Critical Issues (Must Fix)

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | Multiple pricing engines | 🔴 HIGH | Inconsistent pricing |
| 2 | Multi-leg booking item allocation | 🔴 HIGH | Double-counting items |
| 3 | Race conditions in price calculation | 🟠 MEDIUM | Unreliable updates |

### High Priority Issues (Should Fix)

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 4 | Deprecated fields in database | 🟡 LOW | Data quality |
| 5 | Incomplete price breakdown storage | 🟠 MEDIUM | Auditing issues |
| 6 | Incomplete input validation | 🟠 MEDIUM | Invalid pricing |
| 7 | Missing error handling | 🟠 MEDIUM | Silent failures |

### Medium Priority Issues (Nice to Have)

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 8 | Inefficient price recalculation | 🟡 LOW | Performance |
| 9 | Incomplete documentation | 🟡 LOW | Maintenance burden |

---

## 12. RECOMMENDATIONS

### Short Term (1-2 weeks)

```
1. Add crew size multiplier tests
   - Test all crew size combinations
   - Test with different service levels
   - Test edge cases

2. Fix multi-leg booking item allocation
   - Require explicit item allocation
   - Validate item totals
   - Add unit tests

3. Document pricing algorithm
   - Create specification document
   - Add code comments
   - Create examples

4. Add regression tests for f3951d6d fix
   - Test crew size changes
   - Test item quantity changes
   - Test price updates
```

### Medium Term (1-2 months)

```
1. Consolidate pricing engines
   - Choose single engine
   - Create adapter pattern
   - Implement parity tests

2. Implement proper state management
   - Use Redux or Zustand
   - Remove setTimeout delays
   - Add proper dependency tracking

3. Remove deprecated fields
   - Create migration
   - Archive historical data
   - Update schema

4. Add comprehensive error handling
   - Implement error recovery
   - Add user-facing messages
   - Implement error tracking
```

### Long Term (3-6 months)

```
1. Implement price audit trail
   - Store all pricing decisions
   - Create pricing history table
   - Add audit dashboard

2. Add price versioning
   - Version pricing rules
   - Support historical pricing
   - Enable A/B testing

3. Create pricing analytics dashboard
   - Track pricing trends
   - Analyze customer segments
   - Monitor profitability

4. Implement A/B testing framework
   - Test pricing strategies
   - Measure impact
   - Optimize pricing
```

---

## 13. CONCLUSION

The booking-luxury pricing system is functional but has several architectural and implementation issues that should be addressed. The most critical issues are:

1. **Multiple pricing engines** creating inconsistency risks
2. **Multi-leg booking item allocation** potentially causing double-counting
3. **Race conditions** in price calculation timing

The crew size multiplier logic is correctly implemented, and the recent fix (`f3951d6d`) addresses the immediate issue of price updates not reflecting crew size changes. However, the fix uses a workaround (150ms delay) rather than addressing the root cause of state management issues.

Implementing the recommended short-term fixes will improve reliability and maintainability of the pricing system. Medium and long-term recommendations will enable better auditing, analytics, and optimization of pricing strategies.

---

## References

[1] Speedy Van. (2025). *booking-luxury* [Source code]. GitHub. Retrieved from https://github.com/speedy-van/sv
[2] Speedy Van. (2025, December 24). *Fix: Update price calculation when crew size changes in Step 2 and when items quantity decreases in Step 3* [Commit]. GitHub. Retrieved from https://github.com/speedy-van/sv/commit/f3951d6d8c4e04559a7bcbcd76fc402b98443b79
[3] Speedy Van. (2025). *src/lib/pricing/unified-engine.ts*. GitHub. Retrieved from https://github.com/speedy-van/sv/blob/main/src/lib/pricing/unified-engine.ts
[4] Speedy Van. (2025). *apps/web/src/lib/pricing/comprehensive-engine.ts*. GitHub. Retrieved from https://github.com/speedy-van/sv/blob/main/apps/web/src/lib/pricing/comprehensive-engine.ts
[5] Speedy Van. (2025). *apps/web/src/lib/services/dynamic-pricing-engine.ts*. GitHub. Retrieved from https://github.com/speedy-van/sv/blob/main/apps/web/src/lib/services/dynamic-pricing-engine.ts
[6] Speedy Van. (2025). *apps/web/src/app/api/pricing/quote/route.ts*. GitHub. Retrieved from https://github.com/speedy-van/sv/blob/main/apps/web/src/app/api/pricing/quote/route.ts
[7] Speedy Van. (2025). *apps/web/src/app/api/pricing/comprehensive/route.ts*. GitHub. Retrieved from https://github.com/speedy-van/sv/blob/main/apps/web/src/app/api/pricing/comprehensive/route.ts
[8] Speedy Van. (2025). *apps/web/src/app/api/booking-luxury/route.ts*. GitHub. Retrieved from https://github.com/speedy-van/sv/blob/main/apps/web/src/app/api/booking-luxury/route.ts
[9] Speedy Van. (2025). *apps/web/src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx*. GitHub. Retrieved from https://github.com/speedy-van/sv/blob/main/apps/web/src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx

---

**Report Generated**: Dec 24, 2025  
**Repository**: `https://github.com/speedy-van/sv`  
**Latest Commit**: `f3951d6d`
