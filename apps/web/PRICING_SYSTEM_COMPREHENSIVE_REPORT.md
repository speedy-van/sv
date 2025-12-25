# 📊 COMPREHENSIVE PRICING SYSTEM REPORT
## Enterprise Engine Price Calculation & Customer Final Price

**Generated:** 2025-01-27  
**System:** Speedy Van Professional Moving - Booking Luxury Platform  
**Version:** Enterprise Pricing Engine v2.0

---

## 🎯 EXECUTIVE SUMMARY

The Speedy Van pricing system uses a **multi-layered, comprehensive pricing engine** that calculates customer prices through multiple stages:

1. **Base Calculation** → Core pricing components
2. **Service Level Multipliers** → Economy/Standard/Express tiers
3. **Adjustments** → Customer adjustments, crew size, discounts
4. **Finalization** → VAT (20%) and rounding
5. **Promotions** → Optional discount codes

**Final Customer Price Formula:**
```
Final Price = ((Base + Items + Labor + Distance + Time + Access + Urgency) 
               × Service Multiplier 
               × Seasonal Multiplier 
               - Multi-Drop Discount 
               - Customer Discount 
               + Customer Adjustment 
               + Crew Surcharge) 
               × 1.20 (VAT)
```

---

## 🏗️ SYSTEM ARCHITECTURE

### **Primary Pricing Engines**

#### 1. **Comprehensive Pricing Engine** (`comprehensive-engine.ts`)
- **Status:** ✅ PRIMARY ENGINE (Active)
- **Purpose:** Main pricing calculation for all bookings
- **Location:** `src/lib/pricing/comprehensive-engine.ts`
- **Features:**
  - 22-field UK dataset compliance
  - Multi-drop route optimization
  - Operational insights integration
  - Crew size adjustments
  - Seasonal/time multipliers

#### 2. **Unified Pricing Engine** (`unified-engine.ts`)
- **Status:** ⚠️ LEGACY (Still referenced)
- **Purpose:** Alternative pricing calculation
- **Location:** `src/lib/pricing/unified-engine.ts`
- **Note:** May be used for fallback scenarios

#### 3. **Dynamic Pricing Engine** (`dynamic-pricing-engine.ts`)
- **Status:** ✅ ACTIVE (Market-based pricing)
- **Purpose:** Real-time market condition adjustments
- **Location:** `src/lib/services/dynamic-pricing-engine.ts`
- **Features:**
  - Market condition analysis
  - Customer segment adjustments
  - Capacity-based pricing

---

## 💰 PRICING CALCULATION FLOW

### **STEP 1: Base Components Calculation**

The system calculates the following base components:

#### **1.1 Base Fee**
```typescript
baseFee = config.baseRates.baseFee  // Default: £45
```
- **Source:** Operational configuration
- **Fixed:** Per booking (regardless of items/distance)

#### **1.2 Items Cost**
```typescript
itemsCost = items.reduce((sum, item) => sum + item.item_base_cost, 0)
```
- **Calculation:** Sum of `item_base_cost` for all items
- **Factors:**
  - Weight (kg)
  - Volume (m³)
  - Fragility level
  - Handling complexity
- **Source:** UK Dataset enrichment (22 fields per item)

#### **1.3 Labor Cost**
```typescript
laborCost = items.reduce((sum, item) => sum + item.labor_cost, 0)
```
- **Calculation:** Sum of `labor_cost` for all items
- **Factors:**
  - Worker allocation (1-man vs 2-man)
  - Dismantling requirements
  - Handling complexity
  - Stairs/floors

#### **1.4 Distance Cost**
```typescript
distanceCost = route.totalDistanceKm * config.baseRates.perKm
```
- **Rate:** Per kilometer (from operational config)
- **Calculation:** Total route distance × per-km rate
- **Note:** Includes multi-drop route optimization

#### **1.5 Time Cost**
```typescript
timeCost = route.totalDurationMinutes * config.baseRates.perMinute
```
- **Rate:** Per minute (from operational config)
- **Calculation:** Total estimated duration × per-minute rate
- **Factors:**
  - Loading time
  - Travel time
  - Unloading time
  - Access difficulties

#### **1.6 Access Surcharges**
```typescript
accessSurcharges = calculateAccessSurcharges(route.stops, input, config)
```
- **Components:**
  - **Stairs:** £15 per flight
  - **Parking Difficulty:** Configurable surcharge
  - **Congestion Zone:** London congestion charge
  - **Time Windows:** Specific time slot surcharge

#### **1.7 Urgency Fee**
```typescript
urgencyFee = calculateUrgencyFee(input, config)
```
- **Standard:** 0% (no surcharge)
- **Express:** +25% of base fee
- **Urgent:** +50% of base fee

---

### **STEP 2: Subtotal Calculation**

```typescript
subtotalBeforeService = baseFee + itemsCost + laborCost + 
                        distanceCost + timeCost + accessSurcharges + urgencyFee
```

---

### **STEP 3: Discounts & Multipliers**

#### **3.1 Multi-Drop Discount**
```typescript
multiDropDiscount = route.stops.length > 1
  ? baseFee * config.baseRates.multiDropDiscount * (route.stops.length - 1)
  : 0
```
- **Logic:** More drop-offs = efficiency discount
- **Formula:** Base fee × discount rate × (number of additional stops)

#### **3.2 Seasonal Multiplier**
```typescript
seasonalMultiplier = calculateSeasonalMultiplier(timeFactors, config)
```
- **Summer Peak (July-August):** +X% surcharge
- **Student Moves (September):** +X% surcharge
- **Rush Hour:** +X% surcharge
- **Weekend:** +X% surcharge

#### **3.3 Service Level Multiplier**
```typescript
serviceMultiplier = getServiceMultiplier(serviceLevel)
```
- **Economy:** 0.85 (15% discount)
- **Standard:** 1.0 (base price)
- **Express:** 1.5 (50% premium)

**Applied to subtotal:**
```typescript
subtotalWithDiscounts = subtotalBeforeService - multiDropDiscount
subtotalWithSeasonal = subtotalWithDiscounts * seasonalMultiplier
subtotalWithService = subtotalWithSeasonal * serviceMultiplier
```

---

### **STEP 4: Customer Adjustments**

#### **4.1 Admin Price Adjustment**
```typescript
if (customerAdjustment !== undefined && customerAdjustment !== 0) {
  adjustedSubtotal = subtotalBeforeVat * (1 + customerAdjustment)
}
```
- **Source:** Admin settings (`PricingSettings` table)
- **Purpose:** Global price increase/decrease
- **Example:** +5% adjustment = all prices × 1.05

#### **4.2 Crew Size Surcharge**
```typescript
const crewMultipliers = {
  '1': 0,    // No surcharge
  '2': 0,    // No surcharge (standard)
  '3': 0.25, // +25% surcharge
  '4': 0.50  // +50% surcharge
}
const crewSurcharge = adjustedSubtotal * crewMultiplier
adjustedSubtotal = adjustedSubtotal + crewSurcharge
```
- **Logic:** 3+ crew members = additional labor cost
- **Applied:** After customer adjustment, before VAT

---

### **STEP 5: VAT Calculation**

```typescript
const vatRate = 0.20  // 20% UK VAT
const vatAmount = adjustedSubtotal * vatRate
const totalAmount = Math.round((adjustedSubtotal + vatAmount) * 100) / 100
```

**Final Customer Price = Subtotal + VAT**

---

### **STEP 6: Promotion Code Application** (Optional)

#### **6.1 Promotion Validation**
- **API:** `/api/promotions/validate`
- **Checks:**
  - Code exists and is active
  - Valid date range
  - Minimum spend requirement
  - Usage limit
  - Customer eligibility (first-time only, etc.)

#### **6.2 Discount Application**
```typescript
if (promotion.type === 'percentage') {
  discountAmount = (subtotal * promotion.value) / 100
  if (promotion.maxDiscount) {
    discountAmount = Math.min(discountAmount, promotion.maxDiscount)
  }
} else if (promotion.type === 'fixed') {
  discountAmount = promotion.value
}

finalPrice = totalAmount - discountAmount
```

**Promotion is applied AFTER VAT calculation** (in Step 3 UI component)

---

## 📋 PRICING COMPONENTS BREAKDOWN

### **Base Rates (Operational Config)**
```typescript
{
  baseFee: 45,           // £45 base fee per booking
  perKm: 1.50,           // £1.50 per kilometer
  perMinute: 0.25,       // £0.25 per minute
  multiDropDiscount: 0.10 // 10% discount per additional stop
}
```

### **Surcharges**
```typescript
{
  stairs: 15,            // £15 per flight of stairs
  parking: 10,           // £10 for difficult parking
  congestion: 15,        // £15 for congestion zone
  timeWindows: 20,       // £20 for specific time slots
  rushHour: 0.15,        // 15% surcharge
  weekend: 0.10          // 10% surcharge
}
```

### **Service Tier Multipliers**
- **Economy:** 0.85 (15% discount)
- **Standard:** 1.0 (base)
- **Express:** 1.5 (50% premium)

### **Crew Size Multipliers**
- **1-man:** 0% (no change)
- **2-men:** 0% (standard)
- **3-men:** +25%
- **4-men:** +50%

---

## 🔄 PRICING FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                    USER INPUT                            │
│  - Items (with quantities)                               │
│  - Pickup/Dropoff addresses                              │
│  - Service level (Economy/Standard/Express)              │
│  - Crew size (1/2/3/4)                                   │
│  - Date/time                                             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         COMPREHENSIVE PRICING ENGINE                     │
│                                                           │
│  1. Enrich items with UK Dataset (22 fields)            │
│  2. Calculate route & distances                          │
│  3. Calculate base components:                           │
│     - Base fee                                           │
│     - Items cost                                         │
│     - Labor cost                                         │
│     - Distance cost                                      │
│     - Time cost                                          │
│     - Access surcharges                                  │
│     - Urgency fee                                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         APPLY MULTIPLIERS & DISCOUNTS                    │
│                                                           │
│  - Multi-drop discount                                   │
│  - Seasonal multiplier                                   │
│  - Service level multiplier                              │
│  - Customer adjustment (admin)                          │
│  - Crew size surcharge                                   │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              FINALIZE PRICING                            │
│                                                           │
│  - Add VAT (20%)                                         │
│  - Round to nearest penny                                │
│  - Return breakdown                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         STEP 3 UI COMPONENT                              │
│                                                           │
│  - Display price tiers (Economy/Standard/Express)       │
│  - Apply promotion code (if provided)                    │
│  - Show final price to customer                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              FINAL CUSTOMER PRICE                        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 USER INTERFACE INTEGRATION

### **Step 3: Who & Payment** (`WhoAndPaymentStep_Simple.tsx`)

#### **Price Display Logic:**
```typescript
// Single-leg booking
economyPrice = standardPrice * 0.85
standardPrice = basePrice (from API)
expressPrice = standardPrice * 1.5

// Multi-leg booking
economyPrice = segmentTotal * 0.85
standardPrice = segmentTotal (sum of all segments)
expressPrice = segmentTotal * 1.5
```

#### **Promotion Code Application:**
1. User enters code in input field
2. System validates via `/api/promotions/validate`
3. If valid, discount is applied to `actualPrice`
4. Final price = `actualPrice - discountAmount`

---

## 📊 PRICING DATA STRUCTURES

### **ComprehensivePricingBreakdown**
```typescript
{
  baseFee: number
  itemsCost: number
  laborCost: number
  distanceCost: number
  timeCost: number
  accessSurcharges: number
  serviceMultiplier: number
  seasonalMultiplier: number
  multiDropDiscount: number
  customerDiscount: number
  subtotalBeforeVat: number
  vatAmount: number
  totalAmount: number
}
```

### **EnhancedPricingResult**
```typescript
{
  breakdown: ComprehensivePricingBreakdown
  availability: {
    economy: { available: boolean, price: number }
    standard: { available: boolean, price: number }
    express: { available: boolean, price: number }
  }
  stripeMetadata: {
    paymentIntentId: string
    clientSecret: string
  }
}
```

---

## 🔧 ADMIN CONTROLS

### **Pricing Settings** (Database)
```typescript
PricingSettings {
  customerAdjustment: number  // Global price adjustment (-0.1 to +0.5)
  driverMultiplier: number    // Driver earnings multiplier
}
```

**Impact:**
- `customerAdjustment: 0.05` = All customer prices +5%
- `customerAdjustment: -0.1` = All customer prices -10%

### **Promotion Codes** (Database)
```typescript
Promotion {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minSpend: number
  maxDiscount: number
  usageLimit: number
  validFrom: DateTime
  validTo: DateTime
  status: 'active' | 'inactive'
}
```

---

## 🚨 CRITICAL CALCULATION POINTS

### **1. Multi-Leg Bookings**
- Each segment (Outbound/Return/Additional) is priced **independently**
- Final price = Sum of all segment prices
- Service multipliers applied to **total**, not per-segment

### **2. Crew Size Impact**
- **Applied AFTER** customer adjustment
- **Applied BEFORE** VAT
- Only affects 3+ crew bookings

### **3. Promotion Codes**
- **Applied AFTER** VAT calculation
- **Applied in UI**, not in pricing engine
- Requires minimum spend validation

### **4. Rounding**
- All intermediate calculations use full precision
- Final rounding: `Math.round((subtotal + vat) * 100) / 100`
- No intermediate rounding to prevent precision loss

---

## 📈 PRICING EXAMPLES

### **Example 1: Single-Leg Standard Booking**
```
Items: 5 items, 200kg total
Distance: 25km
Time: 120 minutes
Crew: 2-men
Service: Standard

Base Fee:              £45.00
Items Cost:            £75.00
Labor Cost:            £50.00
Distance Cost:         £37.50 (25km × £1.50)
Time Cost:             £30.00 (120min × £0.25)
Access Surcharges:     £0.00
Urgency Fee:           £0.00
─────────────────────────────────
Subtotal:              £237.50
Service Multiplier:    ×1.0
─────────────────────────────────
After Service:         £237.50
Crew Surcharge:        £0.00 (2-men)
Customer Adjustment:   £0.00
─────────────────────────────────
Subtotal Before VAT:   £237.50
VAT (20%):             £47.50
─────────────────────────────────
FINAL PRICE:           £285.00
```

### **Example 2: Multi-Leg Express Booking with Promotion**
```
Outbound Segment:      £200.00
Return Segment:        £180.00
─────────────────────────────────
Segment Total:         £380.00
Service: Express (×1.5)
─────────────────────────────────
After Service:         £570.00
Crew: 3-men (+25%):    £142.50
─────────────────────────────────
Subtotal:              £712.50
VAT (20%):             £142.50
─────────────────────────────────
Before Promotion:      £855.00
Promotion: -10%:       -£85.50
─────────────────────────────────
FINAL PRICE:           £769.50
```

---

## 🔍 SYSTEM UPDATE RECOMMENDATIONS

### **1. Pricing Engine Consolidation**
- **Current:** Multiple engines (Comprehensive, Unified, Dynamic)
- **Recommendation:** Consolidate to single `ComprehensivePricingEngine`
- **Benefit:** Reduced complexity, easier maintenance

### **2. Promotion Code Integration**
- **Current:** Applied in UI after VAT
- **Recommendation:** Move to pricing engine for consistency
- **Benefit:** Single source of truth for pricing

### **3. Admin Price Adjustment**
- **Current:** Applied at finalization stage
- **Recommendation:** Add UI for real-time preview
- **Benefit:** Better admin control and transparency

### **4. Pricing Breakdown Display**
- **Current:** Limited breakdown visibility
- **Recommendation:** Show detailed breakdown to customers
- **Benefit:** Increased trust and transparency

### **5. Multi-Leg Pricing Logic**
- **Current:** Segments priced independently, then summed
- **Recommendation:** Consider volume discounts for multi-leg
- **Benefit:** More competitive pricing

### **6. Crew Size Pricing**
- **Current:** Fixed multipliers (25%, 50%)
- **Recommendation:** Make configurable via admin
- **Benefit:** Flexible pricing strategy

### **7. Distance Pricing**
- **Current:** Flat per-km rate
- **Recommendation:** Implement tiered distance pricing
- **Benefit:** More accurate long-distance pricing

### **8. VAT Calculation**
- **Current:** Applied at end
- **Recommendation:** Show VAT breakdown clearly
- **Benefit:** Legal compliance and transparency

---

## 📝 API ENDPOINTS

### **Primary Pricing API**
- **Endpoint:** `/api/pricing/comprehensive`
- **Method:** POST
- **Input:** `EnhancedPricingInput`
- **Output:** `EnhancedPricingResult`

### **Promotion Validation**
- **Endpoint:** `/api/promotions/validate`
- **Method:** POST
- **Input:** `{ code, amount, customerEmail, ... }`
- **Output:** `{ valid, promotion, discountAmount }`

---

## 🎯 KEY TAKEAWAYS

1. **Pricing is multi-stage:** Base → Multipliers → Adjustments → VAT → Promotions
2. **Service tiers matter:** Economy (-15%), Standard (base), Express (+50%)
3. **Crew size affects price:** 3+ crew = additional surcharge
4. **Multi-leg = sum of segments:** Each journey priced independently
5. **Promotions are optional:** Applied in UI, not in engine
6. **Admin can adjust globally:** Customer adjustment affects all prices
7. **VAT is always 20%:** Applied to subtotal before promotions

---

## 🔐 SECURITY & VALIDATION

- All pricing calculations validated with Zod schemas
- Promotion codes validated server-side
- Minimum spend enforced
- Usage limits tracked
- Customer eligibility checked

---

**END OF REPORT**

*For technical questions or system updates, refer to:*
- `src/lib/pricing/comprehensive-engine.ts`
- `src/app/api/pricing/comprehensive/route.ts`
- `src/app/booking-luxury/components/WhoAndPaymentStep_Simple.tsx`

