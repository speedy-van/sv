// Quick test for pricing engine
import { unifiedPricingEngine } from './src/lib/pricing/unified-engine.js';

async function testPricing() {
  try {
    const testInput = {
      items: [
        { id: 'full-house-1bed', name: '1 Bedroom House Package', category: 'full-house', quantity: 1, weight: 1500, volume: 15.0 }
      ],
      pickup: {
        address: '123 Test Street, London, SW1A 1AA',
        postcode: 'SW1A 1AA',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        propertyDetails: { type: 'house', floors: 0, hasLift: false, hasParking: true }
      },
      dropoffs: [{
        address: '456 Test Avenue, Manchester, M1 1AA',
        postcode: 'M1 1AA',
        coordinates: { lat: 53.483959, lng: -2.244644 },
        propertyDetails: { type: 'house', floors: 0, hasLift: false, hasParking: true }
      }],
      serviceLevel: 'standard',
      scheduledDate: new Date().toISOString(),
      timeSlot: 'flexible',
      addOns: {},
      promoCode: null,
      userContext: { isAuthenticated: false, isReturningCustomer: false, customerTier: 'standard', locale: 'en-GB' }
    };

    console.log('🚀 Testing pricing engine...');
    const result = await unifiedPricingEngine.calculatePrice(testInput);
    console.log('✅ Pricing calculated successfully!');
    console.log('💰 Total price:', result.amountGbpMinor / 100, 'GBP');
    console.log('📋 Breakdown:', result.breakdown);
  } catch (error) {
    console.error('❌ Pricing calculation failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPricing();
