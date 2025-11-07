# 🔴 Booking-Luxury API Errors - Diagnosis & Fix

**Date**: November 7, 2025  
**Issue**: All pricing/booking APIs returning 400 (Bad Request)  
**Environment**: Development

---

## 🚨 ERRORS DETECTED

```
1. MIME type error: CSS file loaded as script (false positive - ignore)
2. /api/pricing/quote → 400 (CRITICAL)
3. /api/pricing/comprehensive → 400 (CRITICAL)
4. /api/booking-luxury → 400 (CRITICAL)
```

---

## 🔍 ROOT CAUSE ANALYSIS

### **Problem**: Data Structure Mismatch

The frontend `useBookingForm` hook sends data in one format, but the API expects a different structure.

**Frontend sends** (line 713 in `useBookingForm.ts`):
```typescript
{
  items: [...],
  pickupAddress: { address, coordinates, ... },
  dropoffAddress: { address, coordinates, ... },
  serviceType: 'signature',
  // ... other fields
}
```

**API expects** (from `/api/pricing/quote/route.ts`):
```typescript
{
  items: [...],
  pickup: { address, postcode, coordinates, propertyDetails },
  dropoffs: [{ address, postcode, coordinates, propertyDetails, itemIds }],
  serviceLevel: 'signature',
  // ... different field names!
}
```

### **Key Mismatches:**
1. ❌ `pickupAddress` vs. ✅ `pickup`
2. ❌ `dropoffAddress` vs. ✅ `dropoffs` (array!)
3. ❌ `serviceType` vs. ✅ `serviceLevel`
4. ❌ Missing `pickupProperty` transformation to `propertyDetails`
5. ❌ Missing `postcode` extraction from address object

---

## 🔧 IMMEDIATE FIX REQUIRED

### Option 1: Fix Frontend (Recommended)
**File**: `apps/web/src/app/booking-luxury/hooks/useBookingForm.ts`  
**Line**: 550-720

Current transformation is incorrect. Needs to be:

```typescript
const pricingData = {
  items: items.map(item => ({
    id: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    weight: item.weight,
    volume: item.volume,
    fragile: item.fragility_level === 'high',
    oversize: item.size === 'large',
    disassemblyRequired: item.dismantling_required === 'yes',
    specialHandling: []
  })),

  // FIX: Use 'pickup' not 'pickupAddress'
  pickup: {
    address: pickupAddress.formatted_address || pickupAddress.address || pickupAddress.full || '',
    postcode: pickupAddress.postcode || '',
    coordinates: {
      lat: pickupAddress.coordinates?.lat || pickupAddress.latitude || 51.5074,
      lng: pickupAddress.coordinates?.lng || pickupAddress.longitude || -0.1278
    },
    propertyDetails: {
      type: formData.step1.pickupProperty?.type || 'house',
      floors: formData.step1.pickupProperty?.floors || 0,
      hasLift: formData.step1.pickupProperty?.hasLift || false,
      hasParking: formData.step1.pickupProperty?.hasParking !== false,
      accessNotes: formData.step1.pickupProperty?.accessNotes,
      requiresPermit: formData.step1.pickupProperty?.requiresPermit || false
    }
  },

  // FIX: Use 'dropoffs' (array!) not 'dropoffAddress'
  dropoffs: [{
    address: dropoffAddress.formatted_address || dropoffAddress.address || dropoffAddress.full || '',
    postcode: dropoffAddress.postcode || '',
    coordinates: {
      lat: dropoffAddress.coordinates?.lat || dropoffAddress.latitude || 51.5074,
      lng: dropoffAddress.coordinates?.lng || dropoffAddress.longitude || -0.1278
    },
    propertyDetails: {
      type: formData.step1.dropoffProperty?.type || 'house',
      floors: formData.step1.dropoffProperty?.floors || 0,
      hasLift: formData.step1.dropoffProperty?.hasLift || false,
      hasParking: formData.step1.dropoffProperty?.hasParking !== false,
      accessNotes: formData.step1.dropoffProperty?.accessNotes,
      requiresPermit: formData.step1.dropoffProperty?.requiresPermit || false
    },
    itemIds: items.map(item => item.id)
  }],

  // FIX: Use 'serviceLevel' not 'serviceType'
  serviceLevel: formData.step1.serviceType || 'standard',
  
  scheduledDate: formData.step1.pickupDate,
  timeSlot: formData.step1.timeSlot || 'flexible',

  addOns: {
    packingService: formData.step1.packingService || false,
    insuranceCoverage: formData.step1.insuranceCoverage || false,
    storageRequired: false,
    dismantlingRequired: items.some(item => item.dismantling_required === 'yes')
  },

  preferences: {
    vehicleType: 'van',
    urgency: 'standard',
    environmentalPreference: 'standard'
  },

  metadata: {
    source: 'booking-luxury',
    version: '1.0.0'
  }
};
```

### Option 2: Fix API (Not Recommended - breaks other callers)
Modify `/api/pricing/quote/route.ts` to accept both formats. NOT recommended as it creates technical debt.

---

## 📝 STEP-BY-STEP FIX INSTRUCTIONS

### 1. Open the file
```
apps/web/src/app/booking-luxury/hooks/useBookingForm.ts
```

### 2. Find the `calculatePricing` function (around line 528)

### 3. Replace the `pricingData` object creation (lines 550-707) with the corrected version above

### 4. Test the fix
1. Start dev server: `pnpm run dev`
2. Open booking-luxury page: http://localhost:3000/booking-luxury
3. Select address & items
4. Check browser console - should see `✅ Pricing calculated successfully`
5. NO MORE 400 errors!

---

## ⚠️ RELATED ISSUES TO FIX

### Issue #2: Missing Postcode Extraction
If user selects address without explicit postcode field, the API will reject it.

**Fix**: Extract postcode from address string if not available:
```typescript
postcode: pickupAddress.postcode || 
          extractPostcodeFromAddress(pickupAddress.formatted_address) || 
          'SW1A 1AA', // Default London postcode
```

### Issue #3: Coordinates Fallback
If coordinates are missing, use geocoding API or provide UK center:
```typescript
coordinates: {
  lat: pickupAddress.coordinates?.lat || 51.5074, // London center
  lng: pickupAddress.coordinates?.lng || -0.1278
}
```

---

## 🧪 TESTING CHECKLIST

After applying the fix:

- [ ] Booking-luxury page loads without errors
- [ ] Selecting addresses works
- [ ] Adding items shows pricing
- [ ] No 400 errors in console
- [ ] Pricing displays correctly
- [ ] Can proceed to payment step
- [ ] API logs show successful validation

---

## 🎯 PRIORITY

**CRITICAL** - This blocks all booking functionality on the luxury booking flow.

**Estimated Fix Time**: 15 minutes  
**Impact**: Entire booking-luxury flow is broken

---

## 📞 VERIFICATION COMMANDS

After fix, run these checks:

```bash
# 1. Check server logs
pnpm run dev
# Watch for validation errors in terminal

# 2. Test API directly
curl -X POST http://localhost:3000/api/pricing/quote \
  -H "Content-Type: application/json" \
  -d '{ ... test payload ... }'

# 3. Check browser console
# Should see: ✅ Pricing calculated successfully
```

---

**End of Diagnosis**

