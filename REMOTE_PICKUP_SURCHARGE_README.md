# Remote Mainland Pickup Surcharge - Quick Reference

## 🎯 What is this?

قاعدة تسعير جديدة تضيف **£120** رسوم إضافية للمواقع البعيدة في البر الرئيسي عندما يكون السعر الإجمالي **أقل من £300**.

## 📋 Quick Facts

- **Surcharge Amount:** £120 (ثابت)
- **Price Threshold:** £300 (بعد VAT)
- **Applies To:** 27 remote mainland locations
- **Detection:** Automatic (postcode + city name)
- **Enforcement:** Server-side (بعد VAT، قبل UI)

## 🚀 Quick Start

### Check if Location is Remote

```typescript
import { isRemoteMainlandPickupLocation } from './apps/web/src/lib/pricing/remote-location-checker';

const address = {
  city: 'Inverness',
  postcode: 'IV1 1HT',
  // ... other fields
};

const isRemote = isRemoteMainlandPickupLocation(address);
// Returns: true
```

### Get Surcharge in Breakdown

```typescript
import { comprehensivePricingEngine } from './apps/web/src/lib/pricing/comprehensive-engine';

const result = await comprehensivePricingEngine.calculatePrice(input);

console.log(result.breakdown.remotePickupSurcharge); // £120 or 0
console.log(result.breakdown.totalAmount); // Includes surcharge if applied
```

## 📍 Remote Locations (27 total)

### England (11)
Berwick-upon-Tweed, Alnwick, Hexham, Kendal, Penrith, Whitehaven, Workington, Scarborough, Whitby

### Wales (8)
Aberystwyth, Machynlleth, Dolgellau, Pwllheli, Bala, Llandrindod Wells, Builth Wells

### Scotland (8)
Inverness, Fort William, Aviemore, Oban, Ullapool, Thurso, Wick

❌ **NO Islands** (handled separately)

## 🧪 Run Tests

```bash
npx tsx test-remote-pickup-surcharge.ts
```

Expected: ✅ 17/17 tests passing

## 📚 Documentation Files

1. **Implementation Details:** `REMOTE_PICKUP_SURCHARGE_IMPLEMENTATION.md`
2. **Code Examples:** `examples-remote-pickup-surcharge.ts`
3. **Test Script:** `test-remote-pickup-surcharge.ts`

## 🔧 Files Modified

- ✅ `apps/web/src/lib/pricing/remote-location-checker.ts` (NEW)
- ✅ `apps/web/src/lib/pricing/comprehensive-engine.ts` (MODIFIED)
- ✅ `apps/web/src/lib/pricing/comprehensive-schemas.ts` (MODIFIED)

## ✅ Verification

- [x] All tests passing
- [x] No TypeScript errors
- [x] Backwards compatible
- [x] Server-side enforcement
- [x] Clear breakdown field
- [x] Comprehensive logging

## 💡 Examples

### Example 1: Surcharge Applied
- Location: Inverness (remote)
- Price: £240 (< £300)
- **Surcharge: +£120**
- Final: **£360**

### Example 2: No Surcharge (High Price)
- Location: Fort William (remote)
- Price: £550 (≥ £300)
- Surcharge: £0
- Final: **£550**

### Example 3: No Surcharge (Non-Remote)
- Location: London (not remote)
- Price: £220
- Surcharge: £0
- Final: **£220**

## 🆘 Troubleshooting

### Surcharge not applied?
1. Check if location is actually remote: `isRemoteMainlandPickupLocation(address)`
2. Check if total ≥ £300 (no surcharge if total meets threshold)
3. Check console logs for "🏔️ REMOTE PICKUP SURCHARGE" message

### Wrong surcharge amount?
- Amount is fixed at £120 (configurable in `REMOTE_LOCATION_CONFIG.SURCHARGE_AMOUNT`)

### Need to add/remove locations?
- Edit `remote-location-checker.ts`
- Update `REMOTE_MAINLAND_LOCATIONS` and `REMOTE_POSTCODE_PREFIXES`
- Run tests to verify

## 📞 Support

For questions or issues, refer to the full implementation doc:
📄 `REMOTE_PICKUP_SURCHARGE_IMPLEMENTATION.md`

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** December 25, 2025
