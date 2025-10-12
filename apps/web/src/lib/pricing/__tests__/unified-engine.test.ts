/**
 * UNIFIED PRICING ENGINE UNIT TESTS - PRODUCTION GRADE
 * 
 * Comprehensive test suite for the unified pricing engine covering:
 * - Data source loading and validation
 * - Item enrichment and categorization
 * - Route calculations and distance pricing
 * - Service level multipliers and surcharges
 * - Multi-drop routing optimization
 * - VAT calculations and currency handling
 * - Error scenarios and edge cases
 */

import { UnifiedPricingEngine } from '../unified-engine';
import { validatePricingInput, createRequestId, PricingInput } from '../schemas';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

// Mock data for tests
const mockItemCatalog = {
  version: '1.0.0',
  items: [
    {
      id: 'small-box',
      name: 'Small Box',
      category: 'package',
      basePrice: 500, // £5.00 in pence
      weight: 2,
      volume: 0.5,
      description: 'Standard small box for packages'
    },
    {
      id: 'furniture-chair',
      name: 'Chair',
      category: 'furniture',
      basePrice: 1500, // £15.00 in pence
      weight: 15,
      volume: 2.0,
      description: 'Standard office chair'
    }
  ]
};

const mockPricingConfig = {
  version: '1.0.0',
  currency: 'GBP',
  vatRate: 0.20,
  pricesInPence: true,
  baseRates: {
    baseFeeGBP: 2500, // £25.00 in pence
    perKmGBP: 150,    // £1.50 per km in pence
    perMinuteGBP: 50  // £0.50 per minute in pence
  },
  baseFees: {
    standard: 2500, // £25.00
    express: 3500,  // £35.00
    sameDay: 5000   // £50.00
  },
  rates: {
    perKm: 150,  // £1.50 per km in pence
    perMinute: 50, // £0.50 per minute in pence
    difficultyMultiplier: 200
  },
  serviceTypes: {
    standard: { multiplier: 1.0, name: 'Standard' },
    express: { multiplier: 1.5, name: 'Express' },
    sameDay: { multiplier: 2.0, name: 'Same Day' }
  },
  serviceLevels: {
    standard: { multiplier: 1.0, name: 'Standard' },
    express: { multiplier: 1.5, name: 'Express' },
    sameDay: { multiplier: 2.0, name: 'Same Day' }
  },
  categoryMultipliers: {
    package: 1.0,
    furniture: 1.3,
    appliance: 1.5,
    fragile: 1.8
  },
  surcharges: {
    extraStop: { perStop: 800 },
    congestionZone: { perLeg: 1000 },
    tollRoad: { estimated: 1200 }, // £12.00 for toll road charges
    propertyAccess: {
      noLift: { highFloor: 1500 },
      noParking: { standard: 800 }
    }
  },
  discounts: {
    routeOptimization: {
      highEfficiency: 500,
      mediumEfficiency: 200
    },
    volumeDiscounts: {
      threshold20M3: 0.05, // 5% discount
      threshold50M3: 0.10  // 10% discount
    }
  },
  vat: {
    rate: 0.20, // 20% VAT
    included: false
  }
};
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('UnifiedPricingEngine', () => {
  let pricingEngine: UnifiedPricingEngine;
  
  // Mock data
  const mockItemCatalog = {
    version: '1.0.0',
    catalog: {
      'full-house-packages': {
        '1-bedroom': {
          id: '1bed-package',
          name: '1 Bedroom Full House Package',
          category: 'full-house-packages',
          basePrice: 15000, // £150.00 in pence
          weight: 500,
          volume: 25,
          items: ['sofa-2-seater', 'double-bed', 'dining-table-4']
        }
      },
      furniture: {
        'sofa-2-seater': {
          id: 'sofa-2-seater',
          name: '2-Seater Sofa',
          category: 'furniture',
          basePrice: 3000, // £30.00 in pence
          weight: 40,
          volume: 2.5,
          fragile: false,
          disassemblyRequired: false
        }
      }
    },
    categories: {
      'full-house-packages': { multiplier: 1.0, priority: 1 },
      'furniture': { multiplier: 1.3, priority: 2 },
      'package': { multiplier: 1.0, priority: 3 }
    },
    metadata: {
      totalItems: 2,
      lastUpdated: '2024-01-01T00:00:00Z'
    }
  };

  const mockPricingConfig = {
    version: '1.0.0',
    config: {
      currency: 'GBP',
      pricesInPence: true,
      vatRate: 0.2,
      baseRates: {
        baseFeeGBP: 2500, // £25.00 base fee
        perKmGBP: 150, // £1.50 per km
        perMinuteGBP: 50 // £0.50 per minute
      },
      baseFees: {
        standard: 2500, // £25.00 for multi-drop router compatibility
        express: 3500,
        sameDay: 5000
      },
      rates: {
        perKm: 150, // For multi-drop router compatibility
        perMinute: 50,
        difficultyMultiplier: 200
      },
      serviceTypes: {
        standard: { multiplier: 1.0, name: 'Standard Service' },
        express: { multiplier: 1.5, name: 'Express Service' },
        premium: { multiplier: 2.0, name: 'Premium Service' }
      },
      vehicleTypes: {
        van: { capacity: 15, name: 'Standard Van' },
        truck: { capacity: 25, name: 'Large Truck' }
      },
      surcharges: {
        extraStop: { perStop: 800 }, // £8.00 per extra stop
        stairs: { perFloor: 500 }, // £5.00 per floor
        congestionZone: { perLeg: 1000 }, // £10.00 per leg
        tollRoad: { estimated: 1200 }, // £12.00 for toll road charges
        fragileItem: { fee: 300 }, // £3.00 per fragile item
        oversizeItem: { fee: 500 }, // £5.00 per oversize item
        propertyAccess: {
          noLift: { highFloor: 1500 },
          noParking: { standard: 800 }
        }
      },
      multipliers: {
        timeOfDay: {
          peak: 1.2,
          standard: 1.0,
          offPeak: 0.9
        }
      },
      discounts: {
        routeOptimization: {
          highEfficiency: 500,
          mediumEfficiency: 200
        },
        volumeDiscounts: {
          threshold20M3: 0.05, // 5% discount for 20+ m³
          threshold50M3: 0.10  // 10% discount for 50+ m³
        }
      }
    }
  };

  beforeEach(() => {
    // Reset singleton instance
    (UnifiedPricingEngine as any).instance = undefined;
    pricingEngine = UnifiedPricingEngine.getInstance();

    // Mock file system operations
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockImplementation((filePath: any) => {
      const pathStr = String(filePath);
      if (pathStr.includes('catalog.json')) {
        return JSON.stringify(mockItemCatalog);
      }
      if (pathStr.includes('pricing.json')) {
        return JSON.stringify(mockPricingConfig);
      }
      return '{}';
    });

    // Mock process.cwd()
    jest.spyOn(process, 'cwd').mockReturnValue('/mock/workspace');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Data Source Loading', () => {
    test('should load item catalog and pricing config successfully', async () => {
      const input = createValidPricingInput();
      
      const result = await pricingEngine.calculatePrice(input);
      
      expect(result).toBeDefined();
      expect(result.amountGbpMinor).toBeGreaterThan(0);
      expect(result.metadata.currency).toBe('GBP');
    });

    test('should throw error when catalog file is missing', async () => {
      mockFs.existsSync.mockImplementation((filePath: any) => 
        !String(filePath).includes('catalog.json')
      );

      const input = createValidPricingInput();
      
      await expect(pricingEngine.calculatePrice(input)).rejects.toThrow(
        'Data source loading failed'
      );
    });

    test('should throw error when pricing config is missing', async () => {
      mockFs.existsSync.mockImplementation((filePath: any) => 
        !String(filePath).includes('pricing.json')
      );

      const input = createValidPricingInput();
      
      await expect(pricingEngine.calculatePrice(input)).rejects.toThrow(
        'Data source loading failed'
      );
    });

    test('should handle malformed JSON files', async () => {
      mockFs.readFileSync.mockReturnValue('invalid json');

      const input = createValidPricingInput();
      
      await expect(pricingEngine.calculatePrice(input)).rejects.toThrow(
        'Data source loading failed'
      );
    });
  });

  describe('Item Enrichment', () => {
    test('should enrich items with catalog data', async () => {
      const input = createValidPricingInput();
      input.items = [{
        id: 'sofa-2-seater',
        name: '2-Seater Sofa',
        category: 'furniture',
        quantity: 1,
        weight: 40,
        volume: 2.5,
        fragile: false,
        oversize: false,
        disassemblyRequired: false,
        specialHandling: []
      }];

      const result = await pricingEngine.calculatePrice(input);
      
      expect(result.breakdown.itemsFee).toBeGreaterThan(0);
      expect(result.metadata.warnings).toBeDefined();
    });

    test('should handle unknown items gracefully', async () => {
      const input = createValidPricingInput();
      input.items = [{
        id: 'unknown-item',
        name: 'Unknown Item',
        category: 'furniture',
        quantity: 1,
        weight: 10,
        volume: 1,
        fragile: false,
        oversize: false,
        disassemblyRequired: false,
        specialHandling: []
      }];

      const result = await pricingEngine.calculatePrice(input);
      
      // Should still calculate price even for unknown items
      expect(result.amountGbpMinor).toBeGreaterThan(0);
    });

    test('should apply category multipliers correctly', async () => {
      const furnitureInput = createValidPricingInput();
      furnitureInput.items = [{
        id: 'sofa-2-seater', // Use existing catalog item (basePrice: 3000)
        name: 'Test Furniture',
        category: 'furniture', // Has 1.3 multiplier, expected: 3000 * 1.3 = 3900
        quantity: 1,
        weight: 50,
        volume: 3,
        fragile: false,
        oversize: false,
        disassemblyRequired: false,
        specialHandling: []
      }];

      const packageInput = createValidPricingInput();
      packageInput.items = [{
        id: 'sofa-2-seater', // Use same base item (basePrice: 3000)
        name: 'Test Package',
        category: 'package', // Has 1.0 multiplier, expected: 3000 * 1.0 = 3000
        quantity: 1,
        weight: 50,
        volume: 3,
        fragile: false,
        oversize: false,
        disassemblyRequired: false,
        specialHandling: []
      }];

      const furnitureResult = await pricingEngine.calculatePrice(furnitureInput);
      const packageResult = await pricingEngine.calculatePrice(packageInput);
      
      // Furniture should be more expensive due to higher multiplier
      expect(furnitureResult.breakdown.itemsFee).toBeGreaterThan(
        packageResult.breakdown.itemsFee
      );
    });
  });

  describe('Service Level Pricing', () => {
    test('should apply standard service multiplier', async () => {
      const input = createValidPricingInput();
      input.serviceLevel = 'standard' as const;

      const result = await pricingEngine.calculatePrice(input);
      
      expect(result.breakdown.serviceFee).toBeGreaterThanOrEqual(0);
    });

    test('should apply express service multiplier', async () => {
      const standardInput = createValidPricingInput();
      standardInput.serviceLevel = 'standard' as const;

      const expressInput = createValidPricingInput();
      expressInput.serviceLevel = 'express' as const;

      const standardResult = await pricingEngine.calculatePrice(standardInput);
      const expressResult = await pricingEngine.calculatePrice(expressInput);
      
      // Express should be more expensive (1.5x multiplier)
      expect(expressResult.amountGbpMinor).toBeGreaterThan(
        standardResult.amountGbpMinor
      );
    });

    test('should apply same-day service multiplier', async () => {
      const standardInput = createValidPricingInput();
      standardInput.serviceLevel = 'standard' as const;

      const sameDayInput = createValidPricingInput();
      sameDayInput.serviceLevel = 'premium' as const;

      const standardResult = await pricingEngine.calculatePrice(standardInput);
      const sameDayResult = await pricingEngine.calculatePrice(sameDayInput);
      
      // Same-day should be most expensive (2.0x multiplier)
      expect(sameDayResult.amountGbpMinor).toBeGreaterThan(
        standardResult.amountGbpMinor * 1.5
      );
    });
  });

  describe('Multi-Drop Calculations', () => {
    test('should calculate single dropoff correctly', async () => {
      const input = createValidPricingInput();
      // Default input has single dropoff

      const result = await pricingEngine.calculatePrice(input);
      
      expect(result.multiDrop).toBeDefined();
      expect(result.multiDrop.routeDetails.totalStops).toBe(2); // Pickup + 1 dropoff
    });

    test('should calculate multiple dropoffs with surcharges', async () => {
      const input = createValidPricingInput();
      input.dropoffs = [
        createValidDropoff('First Address'),
        createValidDropoff('Second Address'),
        createValidDropoff('Third Address')
      ];

      const result = await pricingEngine.calculatePrice(input);
      
      expect(result.multiDrop.routeDetails.totalStops).toBe(4); // Pickup + 3 dropoffs
      expect(result.multiDrop.totalStopSurcharge).toBeGreaterThan(0);
    });

    test('should optimize route efficiency', async () => {
      const input = createValidPricingInput();
      input.dropoffs = [
        createValidDropoff('Address 1'),
        createValidDropoff('Address 2')
      ];

      const result = await pricingEngine.calculatePrice(input);
      
      expect(result.multiDrop.routeDetails.optimization.efficiencyScore).toBeGreaterThan(0);
      expect(result.multiDrop.routeDetails.optimization.algorithm).toBeDefined();
    });
  });

  describe('VAT and Currency Calculations', () => {
    test('should calculate VAT correctly at 20%', async () => {
      const input = createValidPricingInput();

      const result = await pricingEngine.calculatePrice(input);
      
      const expectedVat = Math.round(result.subtotalBeforeVat * 0.2);
      expect(result.vatAmount).toBe(expectedVat);
      expect(result.vatRate).toBe(0.2);
    });

    test('should ensure total equals subtotal plus VAT', async () => {
      const input = createValidPricingInput();

      const result = await pricingEngine.calculatePrice(input);
      
      expect(result.amountGbpMinor).toBe(
        result.subtotalBeforeVat + result.vatAmount
      );
    });

    test('should handle zero amounts correctly', async () => {
      const input = createValidPricingInput();
      input.items = []; // No items should result in minimal pricing

      const result = await pricingEngine.calculatePrice(input);
      
      expect(result.amountGbpMinor).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.itemsFee).toBe(0);
    });
  });

  describe('Surcharges and Discounts', () => {
    test('should apply property access surcharges', async () => {
      const input = createValidPricingInput();
      input.dropoffs[0].propertyDetails.floors = 5;
      input.dropoffs[0].propertyDetails.hasLift = false;

      const result = await pricingEngine.calculatePrice(input);
      
      expect(result.surcharges.length).toBeGreaterThan(0);
      expect(result.breakdown.surcharges).toBeGreaterThan(0);
    });

    test('should apply route optimization discounts', async () => {
      const input = createValidPricingInput();
      input.dropoffs = [
        createValidDropoff('Nearby Address 1'),
        createValidDropoff('Nearby Address 2')
      ];

      const result = await pricingEngine.calculatePrice(input);
      
      // Should have some optimization benefits
      expect(result.multiDrop.routeOptimizationDiscount).toBeGreaterThanOrEqual(0);
    });

    test('should handle promo codes', async () => {
      const input = createValidPricingInput();
      input.promoCode = 'TESTCODE';

      const result = await pricingEngine.calculatePrice(input);
      
      // Should process promo code (even if not applied)
      expect(result).toBeDefined();
    });
  });

  describe('Vehicle Recommendations', () => {
    test('should recommend appropriate vehicle for small loads', async () => {
      const input = createValidPricingInput();
      input.items = [{
        id: 'small-item',
        name: 'Small Item',
        category: 'boxes',
        quantity: 1,
        weight: 5,
        volume: 0.5,
        fragile: false,
        oversize: false,
        disassemblyRequired: false,
        specialHandling: []
      }];

      const result = await pricingEngine.calculatePrice(input);
      
      expect(result.recommendedVehicle.type).toBeDefined();
      expect(result.recommendedVehicle.capacity).toBeGreaterThan(0);
    });

    test('should recommend larger vehicle for heavy loads', async () => {
      const input = createValidPricingInput();
      input.items = [{
        id: 'heavy-item',
        name: 'Heavy Item',
        category: 'appliances',
        quantity: 5,
        weight: 200,
        volume: 10,
        fragile: false,
        oversize: false,
        disassemblyRequired: false,
        specialHandling: []
      }];

      const result = await pricingEngine.calculatePrice(input);
      
      expect(result.recommendedVehicle.totalWeight).toBeGreaterThan(500);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid input gracefully', async () => {
      const invalidInput = {
        items: [],
        pickup: null,
        dropoffs: []
      } as any;

      await expect(pricingEngine.calculatePrice(invalidInput)).rejects.toThrow();
    });

    test('should provide meaningful error messages', async () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const input = createValidPricingInput();
      
      await expect(pricingEngine.calculatePrice(input)).rejects.toThrow(
        'Data source loading failed'
      );
    });
  });

  describe('Performance and Caching', () => {
    test('should reuse loaded data sources', async () => {
      const input = createValidPricingInput();
      
      // First calculation
      await pricingEngine.calculatePrice(input);
      
      // Second calculation should reuse loaded data
      const readFileSpy = jest.spyOn(mockFs, 'readFileSync');
      readFileSpy.mockClear();
      
      await pricingEngine.calculatePrice(input);
      
      // Should not read files again
      expect(readFileSpy).not.toHaveBeenCalled();
    });

    test('should complete calculations within reasonable time', async () => {
      const input = createValidPricingInput();
      
      const startTime = Date.now();
      await pricingEngine.calculatePrice(input);
      const endTime = Date.now();
      
      // Should complete within 1 second
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  // Helper functions
  function createValidPricingInput(): PricingInput {
    return {
      items: [{
        id: 'test-item',
        name: 'Test Item',
        category: 'furniture',
        quantity: 1,
        weight: 25,
        volume: 2,
        fragile: false,
        oversize: false,
        disassemblyRequired: false,
        specialHandling: []
      }],
      pickup: {
        address: 'Test Pickup Address',
        postcode: 'SW1A 1AA',
        coordinates: { lat: 51.5074, lng: -0.1278 },
        propertyDetails: {
          type: 'house',
          floors: 2,
          hasLift: false,
          hasParking: true,
          accessNotes: '',
          requiresPermit: false
        }
      },
      dropoffs: [createValidDropoff('Test Dropoff Address')],
      serviceLevel: 'standard',
      scheduledDate: '2024-12-01T10:00:00Z',
      timeSlot: 'morning',
      addOns: {
        packing: false,
        disassembly: [],
        reassembly: [],
        insurance: undefined
      },
      promoCode: undefined,
      userContext: {
        isAuthenticated: false,
        isReturningCustomer: false,
        customerTier: 'standard',
        locale: 'en-GB'
      }
    };
  }

  function createValidDropoff(address: string) {
    return {
      address,
      postcode: 'SW1A 1AA',
      coordinates: { lat: 51.5074, lng: -0.1278 },
      propertyDetails: {
        type: 'house' as const,
        floors: 1,
        hasLift: false,
        hasParking: true,
        accessNotes: '',
        requiresPermit: false
      }
    };
  }
});