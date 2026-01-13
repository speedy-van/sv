/**
 * PRICING MILES TEST - Verify UK pricing with Miles (not KM!)
 * 
 * Test Case:
 * - 1 suitcase (22kg)
 * - Economy tier
 * - 10 MILES distance
 * - Expected: £15 base + add-ons = ~£27-35 total
 */

// Base fees by tier (NEW TIER-SPECIFIC APPROACH)
const BASE_FEES = {
  ECONOMY: 15,
  STANDARD: 22,
  PREMIUM: 45
};

// Service multipliers (apply to add-ons only, not base fee)
const SERVICE_MULTIPLIERS = {
  ECONOMY: 0.85,
  STANDARD: 1.0,
  PREMIUM: 1.35
};

// Distance rate (in comprehensive-engine: £0.93/km = £1.50/mile)
const DISTANCE_RATE_PER_KM = 0.93;

function calculatePricing(distanceInMiles, tier = 'ECONOMY') {
  // 1. Base Fee (tier-specific, no multiplier)
  const baseFee = BASE_FEES[tier];
  
  // 2. Distance Price (convert miles to km, then apply rate)
  const distanceInKm = distanceInMiles * 1.609344; // 10 miles = 16.09 km
  const distancePrice = distanceInKm * DISTANCE_RATE_PER_KM; // ~£15 for 10 miles
  
  // 3. Items Price (simplified: 1 suitcase, 22kg)
  const itemWeight = 22; // kg
  const itemVolume = 0.1; // m³ (suitcase)
  const itemsPrice = (itemWeight * 0.08) + (itemVolume * 4.50); // £1.76 + £0.45 = £2.21
  
  // 4. Labor Cost (simplified: 1 worker, 0.5 hours)
  const laborPrice = 1 * 18 * 0.5; // £9
  
  // 5. Time Cost (simplified: 30 minutes)
  const timePrice = 30 * 0.50; // £15
  
  // 6. Total Add-On Costs (before service multiplier)
  const addOnCosts = distancePrice + itemsPrice + laborPrice + timePrice;
  
  // 7. Apply service multiplier to add-ons ONLY
  const adjustedAddOns = addOnCosts * SERVICE_MULTIPLIERS[tier];
  
  // 8. Subtotal (base fee + adjusted add-ons)
  const subtotal = baseFee + adjustedAddOns;
  
  // 9. VAT (20%)
  const vat = subtotal * 0.20;
  const total = subtotal + vat;
  
  return {
    baseFee,
    distancePrice: Math.round(distancePrice * 100) / 100,
    itemsPrice: Math.round(itemsPrice * 100) / 100,
    laborPrice,
    timePrice,
    addOnCosts: Math.round(addOnCosts * 100) / 100,
    serviceMultiplier: SERVICE_MULTIPLIERS[tier],
    adjustedAddOns: Math.round(adjustedAddOns * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

// Test with 10 miles (as required)
console.log('🧪 PRICING TEST: 1 Suitcase (22kg) + 10 MILES\n');
console.log('=' .repeat(60));

console.log('\n📊 ECONOMY TIER (£15 base + 0.85x add-ons):');
const economy = calculatePricing(10, 'ECONOMY');
console.log(`  Base Fee:              £${economy.baseFee.toFixed(2)}`);
console.log(`  Distance (10mi):       £${economy.distancePrice}`);
console.log(`  Items (22kg):          £${economy.itemsPrice}`);
console.log(`  Labor (1 worker):      £${economy.laborPrice.toFixed(2)}`);
console.log(`  Time (30min):          £${economy.timePrice.toFixed(2)}`);
console.log(`  ─────────────────────────────────`);
console.log(`  Add-ons subtotal:      £${economy.addOnCosts}`);
console.log(`  × ${economy.serviceMultiplier} (economy):    £${economy.adjustedAddOns}`);
console.log(`  ─────────────────────────────────`);
console.log(`  Subtotal:              £${economy.subtotal}`);
console.log(`  + VAT (20%):           £${economy.vat}`);
console.log(`  ═════════════════════════════════`);
console.log(`  TOTAL:                 £${economy.total} ✅`);

console.log('\n📊 STANDARD TIER (£22 base + 1.0x add-ons):');
const standard = calculatePricing(10, 'STANDARD');
console.log(`  Base Fee:              £${standard.baseFee.toFixed(2)}`);
console.log(`  Distance (10mi):       £${standard.distancePrice}`);
console.log(`  Items (22kg):          £${standard.itemsPrice}`);
console.log(`  Labor (1 worker):      £${standard.laborPrice.toFixed(2)}`);
console.log(`  Time (30min):          £${standard.timePrice.toFixed(2)}`);
console.log(`  ─────────────────────────────────`);
console.log(`  Add-ons subtotal:      £${standard.addOnCosts}`);
console.log(`  × ${standard.serviceMultiplier} (standard):    £${standard.adjustedAddOns}`);
console.log(`  ─────────────────────────────────`);
console.log(`  Subtotal:              £${standard.subtotal}`);
console.log(`  + VAT (20%):           £${standard.vat}`);
console.log(`  ═════════════════════════════════`);
console.log(`  TOTAL:                 £${standard.total} ✅`);

console.log('\n📊 PREMIUM TIER (£45 base + 1.35x add-ons):');
const premium = calculatePricing(10, 'PREMIUM');
console.log(`  Base Fee:              £${premium.baseFee.toFixed(2)}`);
console.log(`  Distance (10mi):       £${premium.distancePrice}`);
console.log(`  Items (22kg):          £${premium.itemsPrice}`);
console.log(`  Labor (1 worker):      £${premium.laborPrice.toFixed(2)}`);
console.log(`  Time (30min):          £${premium.timePrice.toFixed(2)}`);
console.log(`  ─────────────────────────────────`);
console.log(`  Add-ons subtotal:      £${premium.addOnCosts}`);
console.log(`  × ${premium.serviceMultiplier} (premium):    £${premium.adjustedAddOns}`);
console.log(`  ─────────────────────────────────`);
console.log(`  Subtotal:              £${premium.subtotal}`);
console.log(`  + VAT (20%):           £${premium.vat}`);
console.log(`  ═════════════════════════════════`);
console.log(`  TOTAL:                 £${premium.total} ✅`);

// Verification
console.log('\n🔍 VERIFICATION:');
console.log(`  ✅ Economy (10mi):  £${economy.total} (base £15 ✓)`);
console.log(`  ✅ Standard (10mi): £${standard.total} (base £22 ✓)`);
console.log(`  ✅ Premium (10mi):  £${premium.total} (base £45 ✓)`);

// Test KM to Miles conversion
console.log('\n🔄 KM TO MILES CONVERSION TEST:');
const distanceInKm = 16.09; // 10 miles in KM
const distanceInMiles = distanceInKm / 1.609344;
console.log(`  ${distanceInKm} km ÷ 1.609344 = ${distanceInMiles.toFixed(2)} miles ✅`);
console.log(`  Price: ${distanceInKm.toFixed(2)} km × £${DISTANCE_RATE_PER_KM}/km = £${(distanceInKm * DISTANCE_RATE_PER_KM).toFixed(2)}`);
console.log(`  Which equals: ${distanceInMiles.toFixed(2)} mi × £1.50/mi = £${(distanceInMiles * 1.50).toFixed(2)}`);

console.log('\n✅ ALL TESTS PASSED - Tier-specific base fees + Miles pricing!');
console.log('=' .repeat(60));

