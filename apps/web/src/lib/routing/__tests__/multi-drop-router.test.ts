/**
 * MULTI-DROP ROUTER UNIT TESTS - PRODUCTION GRADE
 * 
 * Comprehensive test suite for the advanced multi-drop routing system covering:
 * - Route optimization algorithms
 * - Per-leg calculations and pricing
 * - Traffic and congestion analysis
 * - Property access difficulty assessment
 * - Time window optimization
 * - Capacity utilization calculations
 * - Performance and efficiency metrics
 */

import { AdvancedMultiDropRouter, type RouteWaypoint, type OptimizedRoute } from '../multi-drop-router';

describe('AdvancedMultiDropRouter', () => {
  let router: AdvancedMultiDropRouter;
  let mockPricingConfig: any;

  beforeEach(() => {
    mockPricingConfig = {
      baseFees: { standard: 2500 },
      rates: {
        perKm: 150,
        perMinute: 50,
        difficultyMultiplier: 200
      },
      surcharges: {
        extraStop: { perStop: 800 },
        congestionZone: { perLeg: 1000 },
        tollRoad: { estimated: 500 },
        heavyTraffic: { perLeg: 300 },
        multipleStops: { perExtraStop: 200 },
        propertyAccess: {
          noLift: { highFloor: 1500 },
          noParking: { standard: 800 },
          permit: { required: 1200 }
        }
      },
      discounts: {
        routeOptimization: {
          highEfficiency: 500,
          mediumEfficiency: 200,
          distanceSaving: 300,
          timeSaving: 400
        }
      }
    };

    router = new AdvancedMultiDropRouter(mockPricingConfig);
  });

  describe('Route Optimization', () => {
    test('should optimize single dropoff route', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [createWaypoint('East London', 51.5155, -0.0436)];

      const result = router.optimizeRoute(pickup, dropoffs);

      expect(result.totalStops).toBe(2);
      expect(result.legs).toHaveLength(1);
      expect(result.optimization.algorithm).toBe('direct-route');
      expect(result.optimization.efficiencyScore).toBe(95);
      expect(result.totalDistanceKm).toBeGreaterThan(0);
      expect(result.totalDurationMinutes).toBeGreaterThan(0);
    });

    test('should optimize multiple dropoffs with nearest neighbor algorithm', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [
        createWaypoint('North London', 51.5641, -0.1277),
        createWaypoint('East London', 51.5155, -0.0436),
        createWaypoint('South London', 51.4638, -0.1499)
      ];

      const result = router.optimizeRoute(pickup, dropoffs);

      expect(result.totalStops).toBe(4);
      expect(result.legs).toHaveLength(3);
      expect(result.optimization.algorithm).toBe('nearest-neighbor-with-time-windows');
      expect(result.optimization.efficiencyScore).toBeGreaterThan(0);
      expect(result.optimization.timeSavedMinutes).toBeGreaterThanOrEqual(0);
      expect(result.optimization.distanceSavedKm).toBeGreaterThanOrEqual(0);
    });

    test('should respect time windows in optimization', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [
        createWaypointWithTimeWindow('Early Morning Stop', 51.5641, -0.1277, '08:00', '09:00'),
        createWaypointWithTimeWindow('Late Morning Stop', 51.5155, -0.0436, '10:00', '11:00'),
        createWaypointWithTimeWindow('Afternoon Stop', 51.4638, -0.1499, '14:00', '15:00')
      ];

      const result = router.optimizeRoute(pickup, dropoffs);

      expect(result.totalStops).toBe(4);
      expect(result.legs).toHaveLength(3);
      
      // Check if order respects time windows (early morning should be first)
      const firstDropoff = result.legs[0].to;
      expect(firstDropoff.timeWindow?.earliest).toBe('08:00');
    });

    test('should calculate route efficiency score', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [
        createWaypoint('Nearby Stop 1', 51.5084, -0.1288), // Very close
        createWaypoint('Nearby Stop 2', 51.5094, -0.1298)  // Also close
      ];

      const result = router.optimizeRoute(pickup, dropoffs);

      // Compact route should have high efficiency
      expect(result.optimization.efficiencyScore).toBeGreaterThan(70);
    });

    test('should generate warnings for problematic routes', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = Array.from({ length: 8 }, (_, i) => 
        createWaypoint(`Stop ${i + 1}`, 51.5 + Math.random() * 0.1, -0.1 + Math.random() * 0.1)
      );

      const result = router.optimizeRoute(pickup, dropoffs);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('Many stops detected - consider splitting into multiple trips');
    });

    test('should provide route recommendations', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [
        createWaypointWithoutParking('No Parking Zone', 51.5641, -0.1277),
        createWaypoint('Normal Stop', 51.5155, -0.0436)
      ];

      const result = router.optimizeRoute(pickup, dropoffs);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations).toContain('Pre-arrange parking permits for stops without dedicated parking');
    });
  });

  describe('Multi-Drop Pricing Calculations', () => {
    test('should calculate per-leg pricing correctly', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [
        createWaypoint('East London', 51.5155, -0.0436),
        createWaypoint('South London', 51.4638, -0.1499)
      ];

      const route = router.optimizeRoute(pickup, dropoffs);
      const items = [{ name: 'Test Item', weight: 50, volume: 3, fragile: false, quantity: 1 }];
      
      const pricing = router.calculateMultiDropPricing(route, items);

      expect(pricing.perLegCharges).toHaveLength(2);
      
      // Each leg should have pricing components
      pricing.perLegCharges.forEach(leg => {
        expect(leg.baseFee).toBeGreaterThan(0);
        expect(leg.distanceFee).toBeGreaterThanOrEqual(0);
        expect(leg.timeFee).toBeGreaterThanOrEqual(0);
        expect(leg.difficultyFee).toBeGreaterThanOrEqual(0);
        expect(leg.propertyAccessFee).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(leg.surcharges)).toBe(true);
      });
    });

    test('should apply stop surcharges for extra stops', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [
        createWaypoint('Stop 1', 51.5155, -0.0436),
        createWaypoint('Stop 2', 51.4638, -0.1499),
        createWaypoint('Stop 3', 51.5641, -0.1277)
      ];

      const route = router.optimizeRoute(pickup, dropoffs);
      const pricing = router.calculateMultiDropPricing(route, []);

      // 4 total stops (pickup + 3 dropoffs), so 2 extra stops beyond baseline
      const expectedSurcharge = 2 * mockPricingConfig.surcharges.extraStop.perStop;
      expect(pricing.totalStopSurcharge).toBe(expectedSurcharge);
    });

    test('should apply congestion zone surcharges', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278); // In congestion zone
      const dropoffs = [
        createWaypoint('Also Central London', 51.5084, -0.1288) // Also in congestion zone
      ];

      const route = router.optimizeRoute(pickup, dropoffs);
      const pricing = router.calculateMultiDropPricing(route, []);

      // Should have congestion zone surcharge
      const hasCongestionSurcharge = pricing.perLegCharges.some(leg =>
        leg.surcharges.some(surcharge => surcharge.type === 'congestion_zone')
      );
      expect(hasCongestionSurcharge).toBe(true);
    });

    test('should apply property access fees', () => {
      const pickup = createWaypoint('Ground Floor', 51.5074, -0.1278);
      const dropoffs = [
        createHighFloorWaypointNoLift('5th Floor No Lift', 51.5155, -0.0436, 5)
      ];

      const route = router.optimizeRoute(pickup, dropoffs);
      const pricing = router.calculateMultiDropPricing(route, []);

      // Should have property access fee for difficult access
      expect(pricing.perLegCharges[0].propertyAccessFee).toBeGreaterThan(0);
    });

    test('should calculate route optimization discounts', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [
        createWaypoint('Nearby Stop 1', 51.5084, -0.1288),
        createWaypoint('Nearby Stop 2', 51.5094, -0.1298)
      ];

      const route = router.optimizeRoute(pickup, dropoffs);
      const pricing = router.calculateMultiDropPricing(route, []);

      // Efficient route should get optimization discount
      expect(pricing.routeOptimizationDiscount).toBeGreaterThanOrEqual(0);
    });

    test('should calculate capacity utilization', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [createWaypoint('Destination', 51.5155, -0.0436)];

      const route = router.optimizeRoute(pickup, dropoffs);
      const items = [
        { name: 'Heavy Item', weight: 200, volume: 8, fragile: false, quantity: 2 }
      ];
      
      const pricing = router.calculateMultiDropPricing(route, items);

      expect(pricing.capacityUtilization.maximumLoad).toBeGreaterThan(0);
      expect(pricing.capacityUtilization.averageLoad).toBeGreaterThan(0);
      expect(pricing.capacityUtilization.emptyLegs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Traffic and Congestion Analysis', () => {
    test('should calculate traffic multipliers during rush hour', () => {
      // Mock current time to be rush hour
      const originalDate = Date;
      global.Date = jest.fn(() => ({
        getHours: () => 8 // 8 AM rush hour
      })) as any;
      global.Date.now = originalDate.now;

      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [createWaypoint('East London', 51.5155, -0.0436)];

      const route = router.optimizeRoute(pickup, dropoffs);

      expect(route.legs[0].trafficMultiplier).toBeGreaterThan(1.0);

      global.Date = originalDate;
    });

    test('should identify congestion zones', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278); // In congestion zone
      const dropoffs = [createWaypoint('Westminster', 51.5014, -0.1419)]; // Close to center (within 5km)

      const route = router.optimizeRoute(pickup, dropoffs);

      expect(route.legs[0].congestionZone).toBe(true);
    });

    test('should calculate difficulty scores', () => {
      const pickup = createWaypoint('Easy Access', 51.5074, -0.1278);
      const dropoffs = [
        createHighFloorWaypointNoLift('Difficult Access', 51.5155, -0.0436, 6)
      ];

      const route = router.optimizeRoute(pickup, dropoffs);

      expect(route.legs[0].difficultyScore).toBeGreaterThan(5); // Above baseline
    });
  });

  describe('Performance and Efficiency', () => {
    test('should complete optimization within reasonable time', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = Array.from({ length: 5 }, (_, i) => 
        createWaypoint(`Stop ${i + 1}`, 51.5 + i * 0.01, -0.1 + i * 0.01)
      );

      const startTime = Date.now();
      const result = router.optimizeRoute(pickup, dropoffs);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Under 1 second
      expect(result.totalStops).toBe(6);
    });

    test('should handle maximum number of stops', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = Array.from({ length: 8 }, (_, i) => 
        createWaypoint(`Stop ${i + 1}`, 51.5 + i * 0.01, -0.1 + i * 0.01)
      );

      const result = router.optimizeRoute(pickup, dropoffs);

      expect(result.totalStops).toBe(9);
      expect(result.legs).toHaveLength(8);
      expect(result.warnings).toContain('Many stops detected - consider splitting into multiple trips');
    });

    test('should calculate distance accurately', () => {
      const pickup = createWaypoint('London Bridge', 51.5045, -0.0865);
      const dropoffs = [createWaypoint('Tower Bridge', 51.5055, -0.0754)]; // ~0.8km away

      const route = router.optimizeRoute(pickup, dropoffs);

      expect(route.totalDistanceKm).toBeGreaterThan(0.5);
      expect(route.totalDistanceKm).toBeLessThan(2.0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty dropoffs list', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs: RouteWaypoint[] = [];

      expect(() => router.optimizeRoute(pickup, dropoffs)).not.toThrow();
    });

    test('should handle identical coordinates', () => {
      const pickup = createWaypoint('Location A', 51.5074, -0.1278);
      const dropoffs = [createWaypoint('Same Location', 51.5074, -0.1278)]; // Identical

      const result = router.optimizeRoute(pickup, dropoffs);

      expect(result.totalDistanceKm).toBe(0);
      expect(result.totalDurationMinutes).toBeGreaterThanOrEqual(0);
    });

    test('should handle extreme coordinates', () => {
      const pickup = createWaypoint('London', 51.5074, -0.1278);
      const dropoffs = [createWaypointWithoutParking('Edinburgh', 55.9533, -3.1883)]; // Very far with no parking

      const result = router.optimizeRoute(pickup, dropoffs);
      


      expect(result.totalDistanceKm).toBeGreaterThan(400); // ~500km to Edinburgh
      expect(result.recommendations.length).toBeGreaterThan(0); // Should have parking and long route recommendations
    });

    test('should validate waypoint data', () => {
      const pickup = createWaypoint('Valid Pickup', 51.5074, -0.1278);
      const invalidDropoff = {
        ...createWaypoint('Invalid', 51.5155, -0.0436),
        coordinates: { lat: NaN, lng: -0.0436 } // Invalid latitude
      };

      expect(() => router.optimizeRoute(pickup, [invalidDropoff])).not.toThrow();
    });
  });

  describe('Integration with Pricing Config', () => {
    test('should use pricing config for calculations', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [createWaypoint('East London', 51.5155, -0.0436)];

      const route = router.optimizeRoute(pickup, dropoffs);
      const pricing = router.calculateMultiDropPricing(route, []);

      // Should use configured rates divided by total stops (pickup + dropoffs)
      const totalBaseFee = pricing.perLegCharges.reduce((sum, leg) => sum + leg.baseFee, 0);
      const expectedBaseFee = Math.round(mockPricingConfig.baseFees.standard / 2); // 2 total stops
      expect(totalBaseFee).toBe(expectedBaseFee);
    });

    test('should apply configured surcharge rates', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [
        createWaypoint('Stop 1', 51.5155, -0.0436),
        createWaypoint('Stop 2', 51.4638, -0.1499)
      ];

      const route = router.optimizeRoute(pickup, dropoffs);
      const pricing = router.calculateMultiDropPricing(route, []);

      // Should match configured extra stop surcharge
      const expectedSurcharge = mockPricingConfig.surcharges.extraStop.perStop;
      expect(pricing.totalStopSurcharge).toBe(expectedSurcharge);
    });
  });

  // Helper functions
  function createWaypoint(address: string, lat: number, lng: number): RouteWaypoint {
    return {
      address,
      postcode: 'SW1A 1AA',
      coordinates: { lat, lng },
      propertyDetails: {
        type: 'house',
        floors: 1,
        hasLift: false,
        hasParking: true,
        accessNotes: '',
        requiresPermit: false
      }
    };
  }

  function createWaypointWithTimeWindow(
    address: string, 
    lat: number, 
    lng: number, 
    earliest: string, 
    latest: string
  ): RouteWaypoint {
    return {
      ...createWaypoint(address, lat, lng),
      timeWindow: { earliest, latest }
    };
  }

  function createWaypointWithoutParking(address: string, lat: number, lng: number): RouteWaypoint {
    return {
      ...createWaypoint(address, lat, lng),
      propertyDetails: {
        type: 'office',
        floors: 1,
        hasLift: false,
        hasParking: false, // No parking
        accessNotes: 'Street parking only',
        requiresPermit: true
      }
    };
  }

  function createHighFloorWaypointNoLift(address: string, lat: number, lng: number, floors: number): RouteWaypoint {
    return {
      ...createWaypoint(address, lat, lng),
      propertyDetails: {
        type: 'apartment',
        floors,
        hasLift: false, // No lift
        hasParking: true,
        accessNotes: `${floors}th floor, stairs only`,
        requiresPermit: false
      }
    };
  }
});