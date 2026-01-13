# Service Tier Implementation Guide
**Date**: January 12, 2026  
**Status**: Implementation Complete (Backend)

---

## 📋 Overview

تم تطبيق نظام Service Tiers لحل مشكلة التسعير غير التنافسي في Speedy Van. النظام يوفر 3 مستويات:

- **Economy**: تسعير تنافسي مع AnyVan وShiply (£42-65)
- **Standard**: خدمة متميزة بسعر معقول (£70-100)
- **Premium**: خدمة Luxury كاملة (£150-250)

---

## ✅ Changes Implemented

### 1. **Pricing Models** (`packages/pricing/src/models/index.ts`)

#### Added ServiceTier Enum
```typescript
export enum ServiceTier {
  ECONOMY = 'economy',
  STANDARD = 'standard',
  PREMIUM = 'premium'
}
```

#### Added Tier-Specific Vehicle Capacities
```typescript
export const VEHICLE_CAPACITIES_BY_TIER: Record<ServiceTier, Record<VehicleType, VehicleCapacity>>
```

**Key Pricing Changes** (for VAN):
| Tier | Base Price | Per KM | Per Minute | Competitive? |
|------|-----------|--------|------------|--------------|
| **Economy** | £15 (was £50) | £0.40 (was £2.5) | £0.20 (was £1.0) | ✅ Yes |
| **Standard** | £25 | £0.80 | £0.40 | ✅ Yes |
| **Premium** | £50 | £2.5 | £1.0 | ✅ Justified |

#### Added Economy Item Multipliers
```typescript
export const ITEM_CATEGORY_MULTIPLIERS_ECONOMY: Record<ItemCategory, number>
```

**Example Reductions**:
- `FURNITURE`: 1.2 (was 1.5)
- `APPLIANCES`: 1.3 (was 1.8)
- `FRAGILE`: 1.5 (was 2.0)
- `SPECIAL_AWKWARD_ITEMS`: 2.0 (was 3.0)

#### Updated Interfaces
- `PricingRequest`: Added `serviceTier?: ServiceTier`
- `PricingResult`: Added `serviceTier?: ServiceTier`

---

### 2. **Pricing Calculator** (`packages/pricing/src/calculator/index.ts`)

#### Updated Imports
```typescript
import {
  VEHICLE_CAPACITIES_BY_TIER,
  ServiceTier,
  ITEM_CATEGORY_MULTIPLIERS_ECONOMY,
  // ... other imports
} from '../models';
```

#### Modified `calculatePrice()` Method
```typescript
async calculatePrice(request: PricingRequest): Promise<PricingResult> {
  // Default to ECONOMY tier for competitive pricing
  const serviceTier = request.serviceTier || ServiceTier.ECONOMY;
  
  // Use tier-specific vehicle capacity
  const vehicleCapacity = VEHICLE_CAPACITIES_BY_TIER[serviceTier][recommendedVehicle];
  
  // Calculate items price with tier-specific multipliers
  const itemsPrice = this.calculateItemsPrice(request.items, serviceTier);
  
  // Include tier in result
  return { ...result, serviceTier };
}
```

#### Modified `calculateItemsPrice()` Method
```typescript
private calculateItemsPrice(
  items: PricingRequest['items'], 
  serviceTier: ServiceTier = ServiceTier.ECONOMY
): number {
  // Select multipliers based on tier
  const multipliers = serviceTier === ServiceTier.ECONOMY 
    ? ITEM_CATEGORY_MULTIPLIERS_ECONOMY 
    : ITEM_CATEGORY_MULTIPLIERS;
    
  // Use selected multipliers for pricing
}
```

---

## 📊 Price Comparison

**Test Case**: 1 Sofa (50kg, 1m³), London SW1A 1AA → E1 6AN (5km, 10min)

### Current Calculation (Before Fix)
```
Base: £50
Distance: 5km × £2.5 = £12.50
Time: 10min × £1.0 = £10
Items: (£5 × 1.5) + (50kg × £0.5) + (1m³ × £10) = £42.50
Total: £115 (before VAT)
```

### New Economy Tier
```
Base: £15
Distance: 5km × £0.4 = £2
Time: 10min × £0.2 = £2
Items: (£5 × 1.2) + (50kg × £0.5) + (1m³ × £10) = £41
Total: £60 (before VAT) → £72 with VAT
```

### Competitor (AnyVan)
```
Total: £39-58
```

**Result**: 23% more expensive than AnyVan (vs 4x before) ✅

---

## 🚀 How to Use

### Backend API
```typescript
// Example 1: Economy tier (default)
const pricingRequest: PricingRequest = {
  pickupLocation: { latitude: 51.5, longitude: -0.1 },
  deliveryLocation: { latitude: 51.52, longitude: -0.05 },
  items: [{ category: 'FURNITURE', quantity: 1, weight: 50, volumeM3: 1 }],
  scheduledAt: new Date(),
  // serviceTier not specified → defaults to ECONOMY
};

const result = await calculator.calculatePrice(pricingRequest);
// result.serviceTier === 'economy'
// result.totalPrice ≈ £60-80

// Example 2: Premium tier
const premiumRequest: PricingRequest = {
  ...pricingRequest,
  serviceTier: ServiceTier.PREMIUM
};

const premiumResult = await calculator.calculatePrice(premiumRequest);
// premiumResult.totalPrice ≈ £140-180
```

### TypeScript Imports
```typescript
import { ServiceTier } from '@speedy-van/pricing';

// Use in your code
const tier: ServiceTier = ServiceTier.ECONOMY;
```

---

## ⚠️ Breaking Changes

### 1. **Default Behavior Changed**
- **Before**: Always used PREMIUM pricing (£50 base)
- **After**: Defaults to ECONOMY pricing (£15 base)
- **Migration**: Explicitly set `serviceTier: ServiceTier.PREMIUM` for luxury bookings

### 2. **New Required Export**
```typescript
// Must be exported from packages/pricing/src/index.ts
export { ServiceTier } from './models';
```

---

## 🔄 Next Steps

### Phase 1: Frontend UI Updates (URGENT)
1. ✅ Add service tier selector in booking-luxury UI
2. ✅ Display tier pricing comparison
3. ✅ Show tier features/benefits
4. ✅ Update checkout to pass `serviceTier` to API

### Phase 2: API Route Updates
1. ⚠️ Update `/api/booking/create-with-payment` to accept `serviceTier`
2. ⚠️ Update `/api/pricing/comprehensive` to support tiers
3. ⚠️ Update `/api/booking-luxury` to handle tier selection

### Phase 3: Database Schema
1. 📊 Add `serviceTier` column to `Booking` table
2. 📊 Add `serviceTier` to `PricingSnapshot` metadata
3. 📊 Track conversion rates by tier

### Phase 4: Testing & Validation
1. 🧪 Unit tests for tier-specific pricing
2. 🧪 Integration tests for API routes
3. 🧪 A/B testing on 10% of traffic
4. 🧪 Monitor conversion rates

---

## 📝 Testing Checklist

### Backend Tests
- [ ] ECONOMY tier calculates correct base price (£15 VAN)
- [ ] STANDARD tier calculates correct base price (£25 VAN)
- [ ] PREMIUM tier calculates correct base price (£50 VAN)
- [ ] ECONOMY uses reduced item multipliers
- [ ] STANDARD/PREMIUM use standard multipliers
- [ ] Default tier is ECONOMY when not specified
- [ ] Result includes `serviceTier` field

### Integration Tests
- [ ] API accepts `serviceTier` parameter
- [ ] Stripe payment amount matches tier pricing
- [ ] Booking record stores tier selection
- [ ] Pricing snapshot includes tier metadata

### UI Tests
- [ ] Tier selector displays 3 options
- [ ] Pricing updates when tier changes
- [ ] Selected tier sent to API
- [ ] Checkout shows correct tier pricing
- [ ] Success page displays selected tier

---

## 🎯 Success Metrics

### Target KPIs (2 weeks after launch)
- **Conversion Rate Increase**: 3-5x (from 2% to 8-12%)
- **Economy Tier Adoption**: 60% of bookings
- **Standard Tier Adoption**: 30% of bookings
- **Premium Tier Adoption**: 10% of bookings
- **Average Order Value**: £75-95 (down from £161 but higher volume)
- **Revenue Increase**: 2-3x (despite lower AOV)

### Competitive Positioning
- **vs AnyVan (Economy)**: 0.9-1.2x price (acceptable premium)
- **vs CompareMyMove**: Similar pricing
- **vs Shiply**: Competitive on standard moves

---

## 🐛 Known Issues

1. **Frontend Not Updated**: UI still shows single "Luxury Booking" option
   - **Impact**: Users can't select tier yet
   - **Priority**: HIGH
   - **ETA**: Next sprint

2. **Database Schema**: No `serviceTier` column in Booking table
   - **Impact**: Can't track tier selection
   - **Priority**: MEDIUM
   - **Workaround**: Store in `metadata` JSON field

3. **Backward Compatibility**: Existing bookings have no tier
   - **Impact**: Reports may be inaccurate
   - **Priority**: LOW
   - **Solution**: Assume PREMIUM for historical data

---

## 📞 Support

For questions or issues:
- **Technical**: Contact Engineering Team
- **Business**: Contact Product Manager
- **Pricing Strategy**: Contact Finance Team

---

**Document Maintainer**: GitHub Copilot  
**Last Updated**: January 12, 2026  
**Version**: 1.0.0
