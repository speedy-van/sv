// Test pricing engine with real booking form data
import { unifiedPricingEngine } from './src/lib/pricing/unified-engine.js';

async function testPricingEngine() {
  try {
    console.log('🚀 Testing pricing engine with booking form data...');

    // Simulate data that would come from the booking form after Step 1 completion
    const testInput = {
      items: [
        {
          id: 'full-house-1bed',
          name: '1 Bedroom House Package',
          category: 'full-house',
          quantity: 1,
          weight: 1500,
          volume: 15.0,
          fragile: false,
          oversize: true,
          disassemblyRequired: false,
          specialHandling: []
        }
      ],
      pickup: {
        address: '123 Test Street, London, SW1A 1AA',
        postcode: 'SW1A 1AA',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        propertyDetails: {
          type: 'house',
          floors: 0,
          hasLift: false,
          hasParking: true,
          accessNotes: null,
          requiresPermit: false
        }
      },
      dropoffs: [
        {
          address: '456 Test Avenue, Manchester, M1 1AA',
          postcode: 'M1 1AA',
          coordinates: { lat: 53.483959, lng: -2.244644 },
          propertyDetails: {
            type: 'house',
            floors: 0,
            hasLift: false,
            hasParking: true,
            accessNotes: null,
            requiresPermit: false
          },
          itemIds: ['full-house-1bed']
        }
      ],
      serviceLevel: 'standard',
      scheduledDate: new Date().toISOString(),
      timeSlot: 'flexible',
      addOns: {
        packing: false,
        packingVolume: null,
        disassembly: [],
        reassembly: [],
        insurance: null
      },
      promoCode: null,
      userContext: {
        isAuthenticated: false,
        isReturningCustomer: false,
        customerTier: 'standard',
        locale: 'en-GB'
      }
    };

    console.log('📋 Test input:', {
      itemsCount: testInput.items.length,
      pickup: testInput.pickup.postcode,
      dropoff: testInput.dropoffs[0].postcode,
      serviceLevel: testInput.serviceLevel
    });

    const result = await unifiedPricingEngine.calculatePrice(testInput);

    console.log('✅ Pricing calculated successfully!');
    console.log('💰 Total price:', '£' + (result.amountGbpMinor / 100).toFixed(2));
    console.log('📋 Breakdown:', {
      baseFee: '£' + (result.breakdown.baseFee / 100).toFixed(2),
      distanceFee: '£' + (result.breakdown.distanceFee / 100).toFixed(2),
      itemsFee: '£' + (result.breakdown.itemsFee / 100).toFixed(2),
      serviceFee: '£' + (result.breakdown.serviceFee / 100).toFixed(2),
      vat: '£' + (result.vatAmount / 100).toFixed(2)
    });
    console.log('🚗 Recommended vehicle:', result.recommendedVehicle.name);
    console.log('📏 Distance:', result.route.totalDistance.toFixed(1) + ' km');

  } catch (error) {
    console.error('❌ Pricing calculation failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPricingEngine();
