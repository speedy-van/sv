const { UnifiedPricingEngine } = require('./dist/lib/pricing/unified-engine.js');

async function testPricing() {
  try {
    const engine = UnifiedPricingEngine.getInstance();
    
    const input = {
      pickupAddress: {
        street: "123 Main St",
        city: "London",
        postcode: "SW1A 1AA",
        coordinates: {
          lat: 51.5074,
          lng: -0.1278
        }
      },
      dropoffAddress: {
        street: "456 Oak Ave", 
        city: "London",
        postcode: "EC1A 1BB",
        coordinates: {
          lat: 51.5155,
          lng: -0.0922
        }
      },
      items: [
        {
          id: "sofa",
          name: "3-Seater Sofa",
          quantity: 1,
          category: "furniture"
        }
      ],
      serviceType: "standard",
      urgency: "standard",
      scheduledDate: "2025-10-04T09:00:00.000Z"
    };

    const result = await engine.calculatePrice(input);
    console.log('Pricing calculation successful:', result);
    
    return result;
  } catch (error) {
    console.error('Pricing calculation failed:', error.message);
    return null;
  }
}

testPricing();