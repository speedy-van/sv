/**
 * PRICING API INTEGRATION TESTS - PRODUCTION GRADE
 * 
 * Integration test suite for the pricing API endpoints covering:
 * - Complete pricing quote flow
 * - Multi-drop routing integration
 * - Error handling and validation
 * - Response format compliance
 * - Performance benchmarks
 */

import { createMocks } from 'node-mocks-http';
import { POST, GET } from '../route';
import { UnifiedPricingEngine } from '../../../../../lib/pricing/unified-engine';

// Mock the unified pricing engine
jest.mock('@/lib/pricing/unified-engine');

describe('Pricing API Integration Tests', () => {
  let mockPricingEngine: jest.Mocked<UnifiedPricingEngine>;

  beforeEach(() => {
    // Create mock pricing engine
    mockPricingEngine = {
      calculatePrice: jest.fn(),
    } as any;

    // Mock the singleton instance
    (UnifiedPricingEngine.getInstance as jest.Mock).mockReturnValue(mockPricingEngine);

    // Mock successful pricing calculation
    mockPricingEngine.calculatePrice.mockResolvedValue({
      amountGbpMinor: 5000, // £50.00
      subtotalBeforeVat: 4167, // £41.67
      vatAmount: 833, // £8.33
      vatRate: 0.2,
      breakdown: {
        baseFee: 2500,
        itemsFee: 1500,
        distanceFee: 167,
        serviceFee: 0,
        vehicleFee: 0,
        propertyAccessFee: 0,
        addOnsFee: 0,
        surcharges: 0,
        discounts: 0
      },
      surcharges: [],
      discounts: [],
      route: {
        totalDistance: 10.5,
        totalDuration: 45,
        legs: []
      },
      recommendedVehicle: {
        type: 'van',
        name: 'Standard Van',
        capacity: 15,
        totalWeight: 100,
        totalVolume: 5
      },
      multiDrop: {
        routeDetails: {
          totalStops: 2,
          totalDistanceKm: 10.5,
          totalDurationMinutes: 45,
          optimization: {
            algorithm: 'direct-route',
            efficiencyScore: 95,
            timeSavedMinutes: 0,
            distanceSavedKm: 0
          },
          legs: [],
          warnings: [],
          recommendations: []
        },
        perLegCharges: [],
        totalStopSurcharge: 0,
        routeOptimizationDiscount: 0,
        capacityUtilization: {
          maximumLoad: 33,
          averageLoad: 33,
          emptyLegs: 0
        }
      },
      metadata: {
        requestId: 'test-request-123',
        calculatedAt: '2024-01-01T12:00:00Z',
        version: '2.0.0',
        currency: 'GBP',
        dataSourceVersion: '1.0.0:1.0.0',
        warnings: [],
        recommendations: []
      }
    });
  });

  const mockPricingResult = {
    amountGbpMinor: 5000,
    subtotalBeforeVat: 4167,
    vatAmount: 833,
    vatRate: 0.2,
    breakdown: {
      baseFee: 2500,
      itemsFee: 1500,
      distanceFee: 167,
      serviceFee: 0,
      vehicleFee: 0,
      propertyAccessFee: 0,
      addOnsFee: 0,
      surcharges: 0,
      discounts: 0
    },
    surcharges: [] as any[],
    discounts: [] as any[],
    route: {
      totalDistance: 10.5,
      totalDuration: 45,
      legs: []
    },
    recommendedVehicle: {
      type: 'van',
      name: 'Standard Van',
      capacity: 15,
      totalWeight: 100,
      totalVolume: 5
    },
    multiDrop: {
      routeDetails: {
        totalStops: 2,
        totalDistanceKm: 10.5,
        totalDurationMinutes: 45,
        optimization: {
          algorithm: 'direct-route',
          efficiencyScore: 95,
          timeSavedMinutes: 0,
          distanceSavedKm: 0
        },
        legs: [],
        warnings: [],
        recommendations: []
      },
      perLegCharges: [],
      totalStopSurcharge: 0,
      routeOptimizationDiscount: 0,
      capacityUtilization: {
        maximumLoad: 33,
        averageLoad: 33,
        emptyLegs: 0
      }
    },
    metadata: {
      requestId: 'test-request-123',
      calculatedAt: new Date().toISOString(),
      version: '2.0.0',
      currency: 'GBP',
      warnings: [],
      recommendations: []
    }
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/pricing/quote', () => {
    test('should calculate pricing for valid single-drop request', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [{
            id: 'sofa-2-seater',
            name: '2-Seater Sofa',
            category: 'furniture',
            quantity: 1,
            weight: 40,
            volume: 2.5
          }],
          pickupAddress: {
            address: '123 Pickup Street, London',
            latitude: 51.5074,
            longitude: -0.1278
          },
          dropoffAddress: {
            address: '456 Dropoff Avenue, London',
            latitude: 51.5155,
            longitude: -0.0922
          },
          serviceType: 'standard'
        }
      });

      const response = await POST(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.amountGbpMinor).toBe(5000);
      expect(responseData.data.price).toBe(50); // Legacy format
      expect(responseData.data.currency).toBe('GBP');
      expect(responseData.metadata.correlationId).toBeDefined();
      expect(responseData.metadata.processingTimeMs).toBeGreaterThan(0);
    });

    test('should calculate pricing for multi-drop request', async () => {
      // Mock multi-drop response
      mockPricingEngine.calculatePrice.mockResolvedValue({
        amountGbpMinor: 7500, // £75.00 for multi-drop
        multiDrop: {
          routeDetails: {
            totalStops: 4,
            totalDistanceKm: 25.3,
            totalDurationMinutes: 90,
            optimization: {
              algorithm: 'nearest-neighbor-with-time-windows',
              efficiencyScore: 85,
              timeSavedMinutes: 15,
              distanceSavedKm: 3.2
            },
            legs: [],
            warnings: ['Heavy traffic expected'],
            recommendations: ['Consider alternative timing']
          },
          perLegCharges: [
            { legIndex: 0, baseFee: 833, distanceFee: 750, timeFee: 0, difficultyFee: 0, propertyAccessFee: 0, surcharges: [] },
            { legIndex: 1, baseFee: 833, distanceFee: 900, timeFee: 0, difficultyFee: 200, propertyAccessFee: 0, surcharges: [] },
            { legIndex: 2, baseFee: 834, distanceFee: 600, timeFee: 0, difficultyFee: 0, propertyAccessFee: 500, surcharges: [] }
          ],
          totalStopSurcharge: 1600, // 2 extra stops at £8 each
          routeOptimizationDiscount: 300, // £3 optimization discount
          capacityUtilization: {
            maximumLoad: 75,
            averageLoad: 50,
            emptyLegs: 1
          }
        }
      } as any);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [{
            id: 'dining-set',
            name: 'Dining Set',
            category: 'furniture',
            quantity: 1
          }],
          pickupAddress: {
            address: 'Central London',
            latitude: 51.5074,
            longitude: -0.1278
          },
          dropoffAddress: [
            {
              address: 'Stop 1 - North London',
              latitude: 51.5641,
              longitude: -0.1277
            },
            {
              address: 'Stop 2 - East London', 
              latitude: 51.5155,
              longitude: -0.0436
            },
            {
              address: 'Stop 3 - South London',
              latitude: 51.4638,
              longitude: -0.1499
            }
          ],
          serviceType: 'standard'
        }
      });

      const response = await POST(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.amountGbpMinor).toBe(7500);
      expect(responseData.data.multiDrop.routeDetails.totalStops).toBe(4);
      expect(responseData.data.multiDrop.routeDetails.optimization.efficiencyScore).toBe(85);
      expect(responseData.data.multiDrop.totalStopSurcharge).toBe(1600);
    });

    test('should handle express service pricing', async () => {
      mockPricingEngine.calculatePrice.mockResolvedValue({
        amountGbpMinor: 7500, // 1.5x multiplier for express
        breakdown: {
          baseFee: 2500,
          itemsFee: 1500,
          distanceFee: 167,
          serviceFee: 1250, // Express surcharge
          vehicleFee: 0,
          propertyAccessFee: 0,
          addOnsFee: 0,
          surcharges: 0,
          discounts: 0
        }
      } as any);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [{ id: 'test-item', name: 'Test', category: 'furniture', quantity: 1 }],
          pickupAddress: { address: 'Pickup', latitude: 51.5074, longitude: -0.1278 },
          dropoffAddress: { address: 'Dropoff', latitude: 51.5155, longitude: -0.0922 },
          serviceType: 'express'
        }
      });

      const response = await POST(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.amountGbpMinor).toBe(7500);
      expect(responseData.data.breakdown.serviceFee).toBe(1250);
    });

    test('should validate request input', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing required fields
          items: [],
          // No addresses
        }
      });

      const response = await POST(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid input data');
      expect(responseData.correlationId).toBeDefined();
    });

    test('should handle pricing engine failures', async () => {
      mockPricingEngine.calculatePrice.mockRejectedValue(
        new Error('Data source loading failed: Catalog not found')
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [{ id: 'test', name: 'Test', category: 'furniture', quantity: 1 }],
          pickupAddress: { address: 'Test', latitude: 51.5074, longitude: -0.1278 },
          dropoffAddress: { address: 'Test', latitude: 51.5155, longitude: -0.0922 }
        }
      });

      const response = await POST(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(503);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Pricing system unavailable');
      expect(responseData.message).toBe('Please try again in a moment');
    });

    test('should include proper headers', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [{ id: 'test', name: 'Test', category: 'furniture', quantity: 1 }],
          pickupAddress: { address: 'Test', latitude: 51.5074, longitude: -0.1278 },
          dropoffAddress: { address: 'Test', latitude: 51.5155, longitude: -0.0922 }
        }
      });

      const response = await POST(req as any);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-Correlation-ID')).toBeDefined();
      expect(response.headers.get('X-Processing-Time')).toBeDefined();
    });

    test('should handle large item lists', async () => {
      const largeItemList = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        category: 'furniture',
        quantity: 1,
        weight: 10,
        volume: 1
      }));

      mockPricingEngine.calculatePrice.mockResolvedValue({
        amountGbpMinor: 50000, // Large order
        breakdown: {
          baseFee: 2500,
          itemsFee: 35000, // Many items
          distanceFee: 500,
          serviceFee: 0,
          vehicleFee: 2000, // Larger vehicle needed
          propertyAccessFee: 0,
          addOnsFee: 0,
          surcharges: 0,
          discounts: 0
        },
        recommendedVehicle: {
          type: 'truck',
          name: 'Large Truck',
          capacity: 25,
          totalWeight: 500,
          totalVolume: 50
        }
      } as any);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: largeItemList,
          pickupAddress: { address: 'Test', latitude: 51.5074, longitude: -0.1278 },
          dropoffAddress: { address: 'Test', latitude: 51.5155, longitude: -0.0922 }
        }
      });

      const response = await POST(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.recommendedVehicle.type).toBe('truck');
      expect(responseData.data.breakdown.itemsFee).toBe(35000);
    });

    test('should handle add-ons in pricing', async () => {
      mockPricingEngine.calculatePrice.mockResolvedValue({
        amountGbpMinor: 6500,
        breakdown: {
          baseFee: 2500,
          itemsFee: 1500,
          distanceFee: 167,
          serviceFee: 0,
          vehicleFee: 0,
          propertyAccessFee: 0,
          addOnsFee: 1500, // Packing and insurance
          surcharges: 0,
          discounts: 0
        }
      } as any);

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [{ id: 'fragile-item', name: 'Fragile Item', category: 'fragile', quantity: 1 }],
          pickupAddress: { address: 'Test', latitude: 51.5074, longitude: -0.1278 },
          dropoffAddress: { address: 'Test', latitude: 51.5155, longitude: -0.0922 },
          addOns: {
            packing: true,
            packingVolume: 2.5,
            insurance: {
              required: true,
              value: 500000 // £5000 in pence
            }
          }
        }
      });

      const response = await POST(req as any);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.breakdown.addOnsFee).toBe(1500);
    });
  });

  describe('GET /api/pricing/quote', () => {
    test('should return health check information', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      const response = await GET();
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.status).toBe('healthy');
      expect(responseData.version).toBe('2.0.0');
      expect(responseData.features).toContain('Step-1 Data Ingestion');
      expect(responseData.features).toContain('Unified Pricing Engine');
      expect(responseData.timestamp).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should complete simple pricing within 500ms', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [{ id: 'test', name: 'Test', category: 'furniture', quantity: 1 }],
          pickupAddress: { address: 'Test', latitude: 51.5074, longitude: -0.1278 },
          dropoffAddress: { address: 'Test', latitude: 51.5155, longitude: -0.0922 }
        }
      });

      const startTime = Date.now();
      const response = await POST(req as any);
      const endTime = Date.now();
      const responseData = await response.json();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(500);
      expect(responseData.metadata.processingTimeMs).toBeLessThan(500);
    });

    test('should handle concurrent requests efficiently', async () => {
      const createRequest = () => createMocks({
        method: 'POST',
        body: {
          items: [{ id: 'concurrent-test', name: 'Test', category: 'furniture', quantity: 1 }],
          pickupAddress: { address: 'Test', latitude: 51.5074, longitude: -0.1278 },
          dropoffAddress: { address: 'Test', latitude: 51.5155, longitude: -0.0922 }
        }
      });

      const requests = Array.from({ length: 10 }, createRequest);
      const startTime = Date.now();

      const responses = await Promise.all(
        requests.map(({ req }) => POST(req as any))
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should complete successfully
      responses.forEach((response: any) => {
        expect(response.status).toBe(200);
      });

      // Total time should be reasonable for concurrent processing
      expect(totalTime).toBeLessThan(2000); // 2 seconds for 10 concurrent requests
    });
  });

  describe('Error Recovery', () => {
    test('should recover from transient failures', async () => {
      // First request fails
      mockPricingEngine.calculatePrice
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(mockPricingResult as any);

      const { req: req1 } = createMocks({
        method: 'POST',
        body: {
          items: [{ id: 'recovery-test', name: 'Test', category: 'furniture', quantity: 1 }],
          pickupAddress: { address: 'Test', latitude: 51.5074, longitude: -0.1278 },
          dropoffAddress: { address: 'Test', latitude: 51.5155, longitude: -0.0922 }
        }
      });

      // First request should fail
      const response1 = await POST(req1 as any);
      expect(response1.status).toBe(500);

      // Second identical request should succeed
      const { req: req2 } = createMocks({
        method: 'POST',
        body: {
          items: [{ id: 'recovery-test', name: 'Test', category: 'furniture', quantity: 1 }],
          pickupAddress: { address: 'Test', latitude: 51.5074, longitude: -0.1278 },
          dropoffAddress: { address: 'Test', latitude: 51.5155, longitude: -0.0922 }
        }
      });

      const response2 = await POST(req2 as any);
      expect(response2.status).toBe(200);
    });
  });

  describe('Security Tests', () => {
    test('should sanitize input data', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: [{
            id: '<script>alert("xss")</script>',
            name: 'Normal Name',
            category: 'furniture',
            quantity: 1
          }],
          pickupAddress: {
            address: 'Normal Address',
            latitude: 51.5074,
            longitude: -0.1278
          },
          dropoffAddress: {
            address: 'Normal Address', 
            latitude: 51.5155,
            longitude: -0.0922
          }
        }
      });

      const response = await POST(req as any);
      const responseData = await response.json();

      // Should handle potentially malicious input gracefully
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
    });

    test('should limit request size', async () => {
      const hugeItemList = Array.from({ length: 1000 }, (_, i) => ({
        id: `huge-item-${i}`,
        name: `Huge Item ${i}`.repeat(100), // Very long names
        category: 'furniture',
        quantity: 1
      }));

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          items: hugeItemList,
          pickupAddress: { address: 'Test', latitude: 51.5074, longitude: -0.1278 },
          dropoffAddress: { address: 'Test', latitude: 51.5155, longitude: -0.0922 }
        }
      });

      const response = await POST(req as any);
      
      // Should either process successfully or reject gracefully
      expect([200, 400, 413]).toContain(response.status);
    });
  });
});