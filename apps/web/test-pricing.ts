import { UnifiedPricingEngine } from './src/lib/pricing/unified-engine';

async function testPricing() {
  try {
    const engine = UnifiedPricingEngine.getInstance();
    
    const input = {
      pickup: {
        address: "123 Main St, London",
        postcode: "SW1A 1AA",
        coordinates: {
          lat: 51.5074,
          lng: -0.1278
        },
        propertyDetails: {
          type: 'house' as const,
          floors: 2,
          hasLift: false,
          hasParking: true,
          accessNotes: 'Easy access',
          requiresPermit: false
        }
      },
      dropoffs: [{
        address: "456 Oak Ave, London",
        postcode: "EC1A 1BB",
        coordinates: {
          lat: 51.5155,
          lng: -0.0922
        },
        propertyDetails: {
          type: 'house' as const,
          floors: 1,
          hasLift: false,
          hasParking: true,
          accessNotes: 'Easy access',
          requiresPermit: false
        }
      }],
      items: [
        {
          id: "sofa",
          name: "3-Seater Sofa",
          quantity: 1,
          category: "furniture",
          fragile: false,
          oversize: false,
          disassemblyRequired: false,
          specialHandling: []
        }
      ],
      serviceLevel: "standard" as const,
      timeSlot: 'flexible' as const,
      addOns: {
        packing: false,
        disassembly: [],
        reassembly: [],
        insurance: 'basic' as const
      },
      userContext: {
        isAuthenticated: false,
        isReturningCustomer: false,
        customerTier: 'standard' as const,
        locale: 'en-GB'
      }
    };

    const result = await engine.calculatePrice(input);
    console.log('✅ Pricing calculation successful:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Pricing calculation failed:', error);
    return null;
  }
}

testPricing();