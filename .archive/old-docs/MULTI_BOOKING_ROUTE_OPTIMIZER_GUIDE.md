# Multi-Booking Route Optimizer - Complete Guide

## 🎯 Overview

The **Multi-Booking Route Optimizer** intelligently combines **2-10 bookings** into a single optimized route. Unlike simple pickup-all → drop-all logic, this system makes **smart decisions** about:

1. **Which bookings to combine** in one route
2. **Optimal pickup/dropoff sequence** (flexible interleaving)
3. **When to unload vs keep items loaded** (dynamic capacity reuse)
4. **Balancing distance, time, and capacity constraints**

---

## 🚀 Key Features

### 1. Flexible Route Patterns

The driver can execute routes in **any order** that makes sense:

#### Pattern A: Interleaved (Efficient for nearby locations)
```
Pickup A → Drop A → Pickup B → Drop B → Pickup C → Drop C
Van Load: [====] → [] → [====] → [] → [====] → []
          50%     0%   50%     0%   50%     0%
Peak: 50% ✅
```

#### Pattern B: Batched (When pickups are clustered)
```
Pickup A → Pickup B → Pickup C → Drop A → Drop B → Drop C
Van Load: [====] → [========] → [============] → [========] → [====] → []
          25%      50%           75%              50%           25%      0%
Peak: 75% ✅
```

#### Pattern C: Mixed (Optimized based on locations)
```
Pickup A → Pickup B → Drop A → Pickup C → Drop B → Drop C
Van Load: [====] → [========] → [====] → [========] → [====] → []
          25%      50%           25%      50%           25%      0%
Peak: 50% ✅ (Best!)
```

---

## 📊 How It Works

### Step 1: Calculate Metrics for All Bookings

```typescript
const bookings = [
  { id: 'b1', items: ['sofa_100kg', 'table_50kg'] },      // 3m³, 150kg
  { id: 'b2', items: ['box_10kg', 'chair_20kg'] },        // 0.5m³, 30kg
  { id: 'b3', items: ['wardrobe_200kg', 'bed_150kg'] },   // 5m³, 350kg
  { id: 'b4', items: ['desk_40kg', 'lamp_5kg'] },         // 1m³, 45kg
  { id: 'b5', items: ['bookshelf_60kg'] },                // 1.5m³, 60kg
];
```

**Total:** 11m³, 635kg across 5 bookings

### Step 2: Try Different Grouping Strategies

#### Strategy 1: Capacity-First (Pack maximum per route)
```
Route 1: [b1, b2, b4, b5] = 6m³, 285kg → ✅ Fits in economy
Route 2: [b3]             = 5m³, 350kg → ✅ Fits in economy
Result: 2 vans, 86% avg utilization
```

#### Strategy 2: Balanced (Equal distribution)
```
Route 1: [b1, b2]    = 3.5m³, 180kg → ✅ Fits
Route 2: [b3]        = 5m³, 350kg   → ✅ Fits
Route 3: [b4, b5]    = 2.5m³, 105kg → ✅ Fits
Result: 3 vans, 52% avg utilization
```

#### Strategy 3: Geographic Clustering (if locations provided)
```
Route 1: [b1, b4] (North area)  = 4m³, 195kg → ✅
Route 2: [b2, b5] (East area)   = 2m³, 90kg  → ✅
Route 3: [b3] (South area)      = 5m³, 350kg → ✅
Result: 3 vans, minimal backtracking
```

### Step 3: Select Best Strategy

The system **automatically picks** the best grouping based on:
- **Capacity efficiency** (if `prioritizeCapacityEfficiency: true`)
- **Total cost** (if prioritizing cost savings)
- **Route efficiency** (minimizing backtracking)

---

## 🔧 API Usage

### Basic Example

```typescript
import { planMultiBookingRoutes } from '@/lib/capacity/multi-booking-route-optimizer';

const bookings = [
  {
    id: 'booking1',
    pickupAddress: '123 High St, London',
    deliveryAddress: '456 Park Ave, Manchester',
    itemIds: ['sofa_3seater', 'coffee_table', 'rug_large'],
  },
  {
    id: 'booking2',
    pickupAddress: '789 Queen Rd, London',
    deliveryAddress: '321 King St, Manchester',
    itemIds: ['desk_office', 'chair_ergonomic'],
  },
  {
    id: 'booking3',
    pickupAddress: '555 Oxford St, London',
    deliveryAddress: '888 Duke Rd, Manchester',
    itemIds: ['bed_kingsize', 'mattress', 'bedside_table'],
  },
];

const result = await planMultiBookingRoutes(bookings, {
  tier: 'economy',
  maxBookingsPerRoute: 10,
  minBookingsPerRoute: 2,
  prioritizeCapacityEfficiency: true,
});

console.log(result);
```

### Response Structure

```typescript
{
  success: true,
  
  // Recommended routes (best option)
  recommendedRoutes: [
    {
      routeId: 'route_12345',
      bookingIds: ['booking1', 'booking2', 'booking3'],
      tier: 'economy',
      
      stops: [
        { id: 'booking1_pickup', type: 'pickup', sequenceNumber: 1, ... },
        { id: 'booking2_pickup', type: 'pickup', sequenceNumber: 2, ... },
        { id: 'booking1_dropoff', type: 'dropoff', sequenceNumber: 3, ... },
        { id: 'booking3_pickup', type: 'pickup', sequenceNumber: 4, ... },
        { id: 'booking2_dropoff', type: 'dropoff', sequenceNumber: 5, ... },
        { id: 'booking3_dropoff', type: 'dropoff', sequenceNumber: 6, ... },
      ],
      
      capacityAnalysis: {
        isFeasible: true,
        peakVolume_m3: 8.5,
        peakVolumeUtilization: 0.59,  // 59%
        violations: [],
        legStates: [ /* detailed per-leg breakdown */ ],
      },
      
      estimatedTotalDistance_km: 45,
      estimatedTotalDuration_hours: 4.5,
      estimatedCostPerBooking: 67.50,
      
      capacityEfficiency: 0.59,  // 59% avg utilization
      routeEfficiency: 0.85,     // 85% (minimal backtracking)
    }
  ],
  
  // Alternative options (for comparison)
  alternativeGroupings: [
    {
      routes: [ /* 2 separate routes */ ],
      totalVans: 2,
      totalCost: 320,
      efficiency: 0.45,
    }
  ],
  
  allBookingsFit: true,
  requiresMultipleVans: false,
  totalBookings: 3,
  bookingsPerRoute: [3],
  averageCapacityUtilization: 59,
  
  suggestions: [
    'Route optimized using dynamic capacity reuse strategy',
    'Peak utilization: 59% - good balance'
  ],
  warnings: []
}
```

---

## 🎯 Use Cases

### Use Case 1: Daily Route Planning

```typescript
// Admin schedules 8 bookings for today
const todaysBookings = await fetchTodaysBookings();

// System creates optimal routes
const plan = await planMultiBookingRoutes(todaysBookings, {
  tier: 'economy',
  maxBookingsPerRoute: 5,  // Max 5 stops per driver
});

// Assign routes to drivers
plan.recommendedRoutes.forEach((route, index) => {
  assignToDriver(`driver_${index + 1}`, route);
});
```

### Use Case 2: Real-Time Booking Addition

```typescript
// New booking arrives during the day
const newBooking = { id: 'urgent_booking', ... };

// Check if it fits in existing routes
const existingBookings = getCurrentRouteBookings('route_abc');
const updatedPlan = await planMultiBookingRoutes(
  [...existingBookings, newBooking],
  { tier: 'economy', maxBookingsPerRoute: 6 }
);

if (updatedPlan.recommendedRoutes[0].capacityAnalysis.isFeasible) {
  // Add to existing route ✅
  updateRoute('route_abc', updatedPlan.recommendedRoutes[0]);
} else {
  // Create new route ❌
  createNewRoute(newBooking);
}
```

### Use Case 3: Cost Optimization

```typescript
// Weekly booking batch - optimize for lowest cost
const weeklyBookings = await fetchWeeklyBookings();

const plan = await planMultiBookingRoutes(weeklyBookings, {
  tier: 'economy',
  prioritizeCapacityEfficiency: false,  // Prioritize cost
  allowMultipleVans: true,
});

console.log(`Total vans needed: ${plan.recommendedRoutes.length}`);
console.log(`Avg cost per booking: £${plan.recommendedRoutes[0].estimatedCostPerBooking}`);
```

---

## 📈 Performance Metrics

### Efficiency Indicators

```typescript
const route = result.recommendedRoutes[0];

// Capacity Efficiency (0-1, higher is better)
// Measures how well van space is utilized
route.capacityEfficiency = 0.75  // 75% - Excellent!

// Route Efficiency (0-1, higher is better)
// Measures route optimization (less backtracking)
route.routeEfficiency = 0.90  // 90% - Very efficient!

// Peak Utilization (0-1)
// Maximum load at any point in route
route.capacityAnalysis.peakVolumeUtilization = 0.68  // 68% - Safe margin
```

### Cost Breakdown

```typescript
// Per-booking cost calculation
baseCost = 50  // Economy tier base
distanceCost = totalDistance * 1.5  // £1.50 per km
totalCost = baseCost + distanceCost

// Example: 3 bookings, 45km route
totalCost = 50 + (45 * 1.5) = £117.50
costPerBooking = 117.50 / 3 = £39.17  // Excellent savings!

// vs individual bookings
individualCost = 3 * (50 + 15*1.5) = £217.50
savings = 217.50 - 117.50 = £100  // 46% savings! 🎉
```

---

## ⚠️ Capacity Constraints

### Automatic Violation Detection

The system **automatically prevents** overloading:

```typescript
const result = await planMultiBookingRoutes(bookings, { tier: 'economy' });

// If any route violates capacity:
if (!route.capacityAnalysis.isFeasible) {
  console.log('Violations:', route.capacityAnalysis.violations);
  // [
  //   {
  //     stopSequence: 3,
  //     violationType: 'volume',
  //     volumeExcess_m3: 2.5,
  //     message: 'Exceeds volume capacity by 2.5m³'
  //   }
  // ]
  
  // System provides suggestions:
  console.log(result.suggestions);
  // ['Split into 2 routes', 'Use Standard tier', 'Remove heavy items']
}
```

### Dynamic Capacity Tracking

```typescript
// View load at each stop
route.capacityAnalysis.legStates.forEach(leg => {
  console.log(`Stop ${leg.stopSequence} (${leg.stopType}):`);
  console.log(`  Volume: ${leg.cumulativeVolume_m3}m³ (${leg.volumeUtilization * 100}%)`);
  console.log(`  Weight: ${leg.cumulativeWeight_kg}kg (${leg.weightUtilization * 100}%)`);
  console.log(`  Items: ${leg.activeItemCount}`);
});

// Output:
// Stop 1 (pickup): 3.0m³ (21%), 150kg (15%), 3 items
// Stop 2 (pickup): 5.5m³ (38%), 230kg (24%), 6 items
// Stop 3 (dropoff): 2.5m³ (17%), 80kg (8%), 3 items ← Freed 3m³!
// Stop 4 (pickup): 5.0m³ (35%), 230kg (24%), 5 items ← Reused space!
```

---

## 🔄 Integration with Existing Systems

### With Pricing API

```typescript
// Get route plan
const plan = await planMultiBookingRoutes(bookings, { tier: 'economy' });

// Calculate pricing based on route
const pricing = await fetch('/api/pricing/comprehensive', {
  method: 'POST',
  body: JSON.stringify({
    bookingIds: plan.recommendedRoutes[0].bookingIds,
    routeDistance_km: plan.recommendedRoutes[0].estimatedTotalDistance_km,
    routeDuration_hours: plan.recommendedRoutes[0].estimatedTotalDuration_hours,
    tier: 'economy',
  }),
});
```

### With Route Analysis API

```typescript
// Analyze route efficiency
const analysis = await fetch('/api/routes/analyze', {
  method: 'POST',
  body: JSON.stringify({
    bookings: bookings,
    tier: 'economy',
  }),
});

const data = await analysis.json();

// Display to driver
console.log('Per-leg breakdown:', data.legByLegData);
console.log('Efficiency:', data.efficiencyMetrics);
```

---

## 🎯 Testing

All 14 tests passing ✅:

```bash
npm run test multi-booking-route-optimizer

✓ should combine 2 small bookings into single route
✓ should handle 5 bookings with mixed sizes
✓ should split large bookings into multiple routes
✓ should respect max bookings per route limit
✓ should calculate capacity efficiency
✓ should track average capacity utilization
✓ should try multiple grouping strategies
✓ should prioritize capacity efficiency
✓ should provide suggestions
✓ should warn when capacity high
✓ should calculate distance between locations
✓ should handle missing coordinates
✓ should handle single booking
✓ should handle 10 bookings (maximum)
```

---

## 📚 Summary

The **Multi-Booking Route Optimizer** transforms simple pickup/dropoff logic into an **intelligent routing system** that:

✅ **Combines 2-10 bookings** efficiently  
✅ **Flexible pickup/drop sequences** (not just pickup-all → drop-all)  
✅ **Dynamic capacity reuse** (unload → reload in same route)  
✅ **Automatic capacity validation** (prevents overloading)  
✅ **Multiple optimization strategies** (capacity-first, geographic, balanced)  
✅ **Cost savings** (up to 46% vs individual bookings)  
✅ **Real-time feasibility checks**  
✅ **Comprehensive testing** (14/14 tests passing)  

**Result:** Drivers can handle **more bookings per route** without exceeding van capacity, leading to **higher efficiency** and **lower costs per customer**! 🚀
