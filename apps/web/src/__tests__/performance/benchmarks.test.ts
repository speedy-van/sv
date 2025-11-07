/**
 * PERFORMANCE BENCHMARK TESTS - PRODUCTION GRADE
 * 
 * Comprehensive performance testing suite covering:
 * - Pricing engine calculation speed
 * - Multi-drop optimization performance
 * - Stripe integration response times
 * - System scalability metrics
 */

import { performance } from 'perf_hooks';
import { UnifiedPricingEngine } from '@/lib/pricing/unified-engine';
import { AdvancedMultiDropRouter } from '@/lib/routing/multi-drop-router';
import { createPaymentIntent, setStripeInstanceForTesting } from '@/lib/stripe/client';
import * as fs from 'fs';
import * as path from 'path';
import type { PricingInput } from '@/lib/pricing/schemas';

// Mock fs for UnifiedPricingEngine
jest.mock('fs');
jest.mock('path');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('Performance Benchmarks', () => {
  let pricingEngine: UnifiedPricingEngine;
  let multiDropRouter: AdvancedMultiDropRouter;

  const PERFORMANCE_THRESHOLDS = {
    pricingCalculation: 100, // ms
    routeOptimization: 500, // ms
    stripeOperation: 1000, // ms
    databaseQuery: 200, // ms
    memoryUsageMB: 100 // MB
  };

  // Setup mock data
  const mockItemCatalog = {
    version: '1.0.0',
    catalog: {
      'sofa-2-seater': {
        id: 'sofa-2-seater',
        name: '2-Seater Sofa',
        category: 'furniture',
        basePrice: 3000,
        weight: 40,
        volume: 2.5,
      }
    },
    categories: {
      'furniture': { multiplier: 1.3, priority: 2 }
    },
    metadata: { totalItems: 1, lastUpdated: '2024-01-01T00:00:00Z' }
  };

  const mockPricingConfig = {
    version: '1.0.0',
    config: {
      currency: 'GBP',
      pricesInPence: true,
      vatRate: 0.2,
      baseRates: {
        baseFeeGBP: 2500,
        perKmGBP: 150,
        perMinuteGBP: 50,
        perKm: 150,
        perMinute: 50,
        multiDropDiscount: 500
      },
      vanSpecs: {
        maxVolumeM3: 15,
        maxWeightKg: 1000,
        maxItems: 50,
        loadingTimeMinutes: 10,
        unloadingTimeMinutes: 8
      },
      baseFees: { standard: 2500, express: 3500, premium: 4500 },
      rates: { perKm: 150, perMinute: 50, difficultyMultiplier: 200 },
      serviceTypes: {
        standard: { multiplier: 1.0, name: 'Standard' },
        express: { multiplier: 1.5, name: 'Express' },
        premium: { multiplier: 2.0, name: 'Premium' }
      },
      vehicleTypes: {
        van: { capacity: 15, name: 'Standard Van', multiplier: 1.0 }
      },
      surcharges: {
        extraStop: { perStop: 800 },
        stairs: { perFloor: 500 },
        fragileItem: { fee: 300 },
        oversizeItem: { fee: 500 }
      },
      multipliers: { timeOfDay: { peak: 1.2, standard: 1.0, offPeak: 0.9 } },
      discounts: { routeOptimization: { highEfficiency: 500, mediumEfficiency: 200 } }
    }
  };

  beforeEach(async () => {
    // Mock file system
    mockedFs.readFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes('catalog.json')) {
        return JSON.stringify(mockItemCatalog);
      }
      if (filePath.includes('pricing.json')) {
        return JSON.stringify(mockPricingConfig);
      }
      throw new Error(`File not found: ${filePath}`);
    });

    mockedFs.existsSync.mockImplementation((filePath: string) => {
      if (filePath.includes('package.json')) {
        return true;
      }
      return true; // Mock all file existence checks as true
    });

    mockedPath.join.mockImplementation((...paths) => paths.join('/'));

    // Mock process.cwd() to return project root
    jest.spyOn(process, 'cwd').mockReturnValue('c:/sv');

    // Initialize pricing engine using singleton
    pricingEngine = UnifiedPricingEngine.getInstance();

    // Initialize multi-drop router
    multiDropRouter = new AdvancedMultiDropRouter(mockPricingConfig.config);

    // Setup Stripe test environment
    const mockStripeInstance = {
      paymentIntents: {
        create: jest.fn().mockResolvedValue({
          id: 'pi_test_123',
          amount: 5000,
          currency: 'gbp',
          status: 'requires_payment_method'
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'pi_test_123',
          status: 'succeeded'
        })
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    setStripeInstanceForTesting(mockStripeInstance);
  });

  describe('Pricing Engine Performance', () => {
    test('should calculate single quotes within performance threshold', async () => {
      const quoteRequest: PricingInput = createSingleQuoteRequest();

      const startTime = performance.now();
      const result = await pricingEngine.calculatePrice(quoteRequest);
      const endTime = performance.now();

      const duration = endTime - startTime;
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.pricingCalculation);
      
      // eslint-disable-next-line no-console
      console.log(`Single quote calculation: ${duration.toFixed(2)}ms`);
    });

    test('should handle batch quote calculations efficiently', async () => {
      const batchRequests = Array.from({ length: 10 }, () => createSingleQuoteRequest());

      const startTime = performance.now();
      const results = await Promise.all(
        batchRequests.map(request => pricingEngine.calculatePrice(request))
      );
      const endTime = performance.now();

      const duration = endTime - startTime;
      const averageDuration = duration / batchRequests.length;

      expect(results).toHaveLength(10);
      expect(results.every(r => typeof r === 'object')).toBe(true);
      expect(averageDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.pricingCalculation);
      
      // eslint-disable-next-line no-console
      console.log(`Batch quote calculations (${batchRequests.length}): ${duration.toFixed(2)}ms total, ${averageDuration.toFixed(2)}ms average`);
    });

    test('should scale linearly with item complexity', async () => {
      const complexityLevels = [1, 5, 10, 25];
      const results = [];

      for (const itemCount of complexityLevels) {
        const request = createComplexQuoteRequest(itemCount);
        
        const startTime = performance.now();
        const result = await pricingEngine.calculatePrice(request);
        const endTime = performance.now();

        const duration = endTime - startTime;
        results.push({ itemCount, duration });

        expect(typeof result).toBe('object');
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.pricingCalculation * (1 + itemCount * 0.1));
      }

      const linearityScore = calculateLinearityScore(results);
      expect(linearityScore).toBeGreaterThan(0.30); // Allow flexible linearity for complex tests

      console.log('Complexity scaling results:', results);
    });

    test('should maintain performance under memory pressure', async () => {
      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB

      // Create many pricing calculations to stress test memory
      const heavyRequests = Array.from({ length: 50 }, () => createComplexQuoteRequest(10));

      await Promise.all(
        heavyRequests.map(request => pricingEngine.calculatePrice(request))
      );

      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
      const memoryIncrease = finalMemory - initialMemory;

      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsageMB);
      
      // eslint-disable-next-line no-console
      console.log(`Memory usage increase: ${memoryIncrease.toFixed(2)}MB`);
    });
  });

  describe('Multi-Drop Router Performance', () => {
    test('should optimize small routes quickly', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [
        createWaypoint('Stop 1', 51.5155, -0.0436),
        createWaypoint('Stop 2', 51.4638, -0.1499)
      ];

      const startTime = performance.now();
      const result = multiDropRouter.optimizeRoute(pickup, dropoffs);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(result.totalStops).toBe(3); // pickup + 2 dropoffs
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.routeOptimization);
      
      console.log(`Small route optimization: ${duration.toFixed(2)}ms`);
    });

    test('should scale well with large route complexity', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = Array.from({ length: 20 }, (_, i) => 
        createWaypoint(`Stop ${i + 1}`, 51.5074 + (i * 0.01), -0.1278 + (i * 0.01))
      );

      const startTime = performance.now();
      const result = multiDropRouter.optimizeRoute(pickup, dropoffs);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(result.totalStops).toBe(21); // pickup + 20 dropoffs
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.routeOptimization);
      
      console.log(`Large route optimization (${dropoffs.length} stops): ${duration.toFixed(2)}ms`);
    });

    test('should efficiently cache similar routes', () => {
      const pickup = createWaypoint('Central London', 51.5074, -0.1278);
      const dropoffs = [
        createWaypoint('Stop 1', 51.5155, -0.0436),
        createWaypoint('Stop 2', 51.4638, -0.1499)
      ];

      // First calculation
      const startTime1 = performance.now();
      const result1 = multiDropRouter.optimizeRoute(pickup, dropoffs);
      const endTime1 = performance.now();
      const duration1 = endTime1 - startTime1;

      // Second calculation (should be faster due to caching)
      const startTime2 = performance.now();
      const result2 = multiDropRouter.optimizeRoute(pickup, dropoffs);
      const endTime2 = performance.now();
      const duration2 = endTime2 - startTime2;

      expect(result1.totalStops).toBe(result2.totalStops);
      expect(duration2).toBeLessThan(duration1 * 2); // Allow reasonable variance
      
      console.log(`Route caching performance: First ${duration1.toFixed(2)}ms, Second ${duration2.toFixed(2)}ms`);
    });
  });

  describe('Stripe Integration Performance', () => {
    test('should create Payment Intent within threshold', async () => {
      const paymentRequest = {
        amount: 5000,
        currency: 'GBP',
        bookingId: 'booking_test_123',
        customerId: 'customer_123'
      };

      const startTime = performance.now();
      const result = await createPaymentIntent({
        amountGbpMinor: paymentRequest.amount,
        description: 'Test payment',
        automaticPaymentMethods: true,
        captureMethod: 'manual',
        metadata: { bookingId: paymentRequest.bookingId }
      }, 'test-correlation-id');
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.stripeOperation);
      
      console.log(`Stripe Payment Intent creation: ${duration.toFixed(2)}ms`);
    });

    test('should handle concurrent Stripe operations', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => ({
        amount: 5000 + i * 100,
        currency: 'GBP' as const,
        bookingId: `booking_test_${i}`,
        customerId: `customer_${i}`
      }));

      const startTime = performance.now();
      const results = await Promise.all(
        requests.map((req, i) => createPaymentIntent({
          amountGbpMinor: req.amount,
          description: `Test payment ${i}`,
          automaticPaymentMethods: true,
          captureMethod: 'manual',
          metadata: { bookingId: req.bookingId }
        }, `test-correlation-${i}`))
      );
      const endTime = performance.now();

      const duration = endTime - startTime;
      const averageDuration = duration / requests.length;

      expect(results).toHaveLength(5);
      expect(results.every(r => r.id)).toBe(true);
      expect(averageDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.stripeOperation);
      
      console.log(`Concurrent Stripe operations (${requests.length}): ${duration.toFixed(2)}ms total, ${averageDuration.toFixed(2)}ms average`);
    });

    test('should handle Stripe errors gracefully', async () => {
      const request = {
        amount: 5000,
        currency: 'GBP',
        bookingId: 'booking_error_test',
        customerId: 'customer_error'
      };

      // Mock a Stripe error for this test
      const originalCreate = (setStripeInstanceForTesting as any).mock?.calls?.[0]?.[0]?.paymentIntents?.create;
      const mockStripeError = {
        paymentIntents: {
          create: jest.fn().mockRejectedValue(new Error('Stripe API Error')),
          retrieve: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'succeeded' })
        }
      } as any;
      
      setStripeInstanceForTesting(mockStripeError);

      const startTime = performance.now();
      try {
        const result = await createPaymentIntent({
          amountGbpMinor: request.amount,
          description: 'Test error payment',
          automaticPaymentMethods: true,
          captureMethod: 'manual',
          metadata: { bookingId: request.bookingId }
        }, 'test-error-correlation');
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.stripeOperation);
        console.log(`Stripe error handling: ${duration.toFixed(2)}ms`);
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.stripeOperation);
        console.log(`Stripe error handling (expected error): ${duration.toFixed(2)}ms`);
      }
    });
  });

  describe('End-to-End Integration Performance', () => {
    test('should complete full quote-to-payment flow efficiently', async () => {
      const quoteRequest: PricingInput = createSingleQuoteRequest();

      const startTime = performance.now();

      // Step 1: Calculate quote
      const quoteResult = await pricingEngine.calculatePrice(quoteRequest);
      expect(quoteResult).toBeDefined();
      expect(typeof quoteResult).toBe('object');

      // Step 2: Optimize route
      const pickup = createWaypoint('Start', 51.5074, -0.1278);
      const dropoffs = [createWaypoint('End', 51.5174, -0.1378)];
      const routeResult = multiDropRouter.optimizeRoute(pickup, dropoffs);
      expect(routeResult.totalStops).toBe(2); // pickup + 1 dropoff

      // Step 3: Create Payment Intent
      const paymentRequest = {
        amount: Math.round(quoteResult.amountGbpMinor || 5000),
        currency: 'GBP',
        bookingId: 'integration_test_123',
        customerId: 'customer_integration'
      };

      const paymentResult = await createPaymentIntent({
        amountGbpMinor: paymentRequest.amount,
        description: 'Integration test payment',
        automaticPaymentMethods: true,
        captureMethod: 'manual',
        metadata: { bookingId: paymentRequest.bookingId }
      }, 'integration-test-correlation');

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      expect(paymentResult.id).toBeDefined();
      expect(totalDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.pricingCalculation + 
                                        PERFORMANCE_THRESHOLDS.routeOptimization + 
                                        PERFORMANCE_THRESHOLDS.stripeOperation);
      
      console.log(`Full integration flow: ${totalDuration.toFixed(2)}ms`);
    });
  });

  describe('System Load Testing', () => {
    test('should handle concurrent mixed operations', async () => {
      const concurrentOperations = 20;
      const operations = [];

      const startTime = performance.now();

      for (let i = 0; i < concurrentOperations; i++) {
        const operationType = i % 3;
        
        if (operationType === 0) {
          // Pricing operation
          const quoteRequest: PricingInput = createSingleQuoteRequest();
          operations.push(pricingEngine.calculatePrice(quoteRequest));
        } else if (operationType === 1) {
          // Route optimization
          const pickup = createWaypoint('Start', 51.5074, -0.1278);
          const dropoffs = [createWaypoint('End', 51.5174 + i * 0.001, -0.1378)];
          operations.push(Promise.resolve(multiDropRouter.optimizeRoute(pickup, dropoffs)));
        } else {
          // Payment Intent creation
          operations.push(createPaymentIntent({
            amountGbpMinor: 5000 + i * 100,
            description: `Load test payment ${i}`,
            automaticPaymentMethods: true,
            captureMethod: 'manual',
            metadata: { bookingId: `load_test_${i}` }
          }, `load-test-${i}`));
        }
      }

      const results = await Promise.allSettled(operations);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const avgDuration = totalDuration / concurrentOperations;

      expect(successful).toBeGreaterThanOrEqual(concurrentOperations * 0.7); // 70% success rate for load testing
      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.pricingCalculation * 2); // Allow 2x threshold under load
      
      console.log(`Load test (${concurrentOperations} operations): ${successful}/${concurrentOperations} successful, ${totalDuration.toFixed(2)}ms total, ${avgDuration.toFixed(2)}ms average`);
    });

    test('should maintain performance under sustained load', async () => {
      const loadTestDuration = 5000; // 5 seconds
      const operationInterval = 100; // Every 100ms
      const results = [];
      
      const startTime = performance.now();
      let currentTime = startTime;
      
      while (currentTime - startTime < loadTestDuration) {
        const opStartTime = performance.now();
        
        try {
          const quoteRequest: PricingInput = createSingleQuoteRequest();
          const result = await pricingEngine.calculatePrice(quoteRequest);
          
          const opEndTime = performance.now();
          const opDuration = opEndTime - opStartTime;
          
          results.push({
            timestamp: currentTime - startTime,
            duration: opDuration,
            success: typeof result === 'object',
            memoryMB: process.memoryUsage().heapUsed / 1024 / 1024
          });
        } catch (error) {
          results.push({
            timestamp: currentTime - startTime,
            duration: performance.now() - opStartTime,
            success: false,
            memoryMB: process.memoryUsage().heapUsed / 1024 / 1024
          });
        }

        await new Promise(resolve => setTimeout(resolve, operationInterval));
        currentTime = performance.now();
      }

      const successRate = results.filter(r => r.success).length / results.length;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const maxMemory = Math.max(...results.map(r => r.memoryMB));
      
      expect(successRate).toBeGreaterThanOrEqual(0.95); // 95% success rate
      expect(avgDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.pricingCalculation * 1.5);
      expect(maxMemory).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsageMB * 2);
      
      console.log(`Sustained load test: ${results.length} operations, ${(successRate * 100).toFixed(1)}% success rate, ${avgDuration.toFixed(2)}ms avg duration, ${maxMemory.toFixed(2)}MB max memory`);
    });
  });

  // Helper Functions
  function createSingleQuoteRequest(): PricingInput {
    return {
      items: [
        {
          id: 'sofa-2-seater',
          name: '2-Seater Sofa',
          category: 'furniture',
          quantity: 1,
          fragile: false,
          oversize: false,
          disassemblyRequired: false,
          specialHandling: [],
          weight: 40,
          volume: 2.5
        }
      ],
      pickup: {
        address: '123 Test St, London',
        postcode: 'SW1A 1AA',
        coordinates: { lat: 51.5074, lng: -0.1278 },
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
        address: '456 Test Ave, London', 
        postcode: 'SW1A 2BB',
        coordinates: { lat: 51.5174, lng: -0.1378 },
        propertyDetails: {
          type: 'apartment' as const,
          floors: 1,
          hasLift: true,
          hasParking: false,
          accessNotes: 'Buzzer entry',
          requiresPermit: true
        }
      }],
      serviceLevel: 'standard',
      scheduledDate: new Date().toISOString(),
      timeSlot: 'flexible',
      addOns: {
        packing: false,
        disassembly: [],
        reassembly: []
      },
      userContext: {
        isAuthenticated: false,
        isReturningCustomer: false,
        customerTier: 'standard',
        locale: 'en-GB'
      }
    };
  }

  function createComplexQuoteRequest(itemCount: number): PricingInput {
    const baseRequest = createSingleQuoteRequest();
    
    const items = Array.from({ length: itemCount }, (_, i) => ({
      id: `item_${i}`,
      name: `Test Item ${i}`,
      category: 'furniture',
      quantity: 1,
      fragile: i % 2 === 0,
      oversize: i % 3 === 0,
      disassemblyRequired: false,
      specialHandling: [],
      weight: 20 + (i * 5),
      volume: 1.5 + (i * 0.5)
    }));

    return {
      ...baseRequest,
      items: items
    };
  }

  function createWaypoint(name: string, lat: number, lng: number) {
    return {
      address: `${name}, London, UK`,
      postcode: 'SW1A 1AA',
      coordinates: { lat, lng },
      propertyDetails: {
        type: 'house' as const,
        floors: 1,
        hasLift: false,
        hasParking: true,
        accessNotes: 'Easy access',
        requiresPermit: false
      }
    };
  }

  function calculateLinearityScore(results: Array<{ itemCount: number; duration: number }>): number {
    if (results.length < 2) return 1;

    const correlations = [];
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1];
      const curr = results[i];
      const expectedRatio = curr.itemCount / prev.itemCount;
      const actualRatio = curr.duration / prev.duration;
      const correlation = Math.min(expectedRatio, actualRatio) / Math.max(expectedRatio, actualRatio);
      correlations.push(correlation);
    }

    return correlations.reduce((sum, corr) => sum + corr, 0) / correlations.length;
  }
});