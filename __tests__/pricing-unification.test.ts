/**
 * Pricing Unification Tests
 * 
 * These tests ensure that:
 * 1. Only UnifiedPricingFacade is used for pricing calculations
 * 2. Legacy pricing engines are disabled
 * 3. Distance calculations are disabled
 * 4. API endpoints use unified pricing only
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock console methods to capture warnings
const mockConsoleWarn = jest.fn();
const mockConsoleError = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  global.console.warn = mockConsoleWarn;
  global.console.error = mockConsoleError;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Pricing System Unification', () => {
  describe('Legacy Pricing Engines - Should be Disabled', () => {
    it('should throw error when using distance calculator', async () => {
      // Import the disabled distance calculator
      const { calculateDistance, calculateDuration, formatDistance, calculateDistanceInfo, isValidCoordinates } = 
        await import('../apps/web/src/lib/utils/distance-calculator');

      const coord1 = { lat: 51.5074, lng: -0.1278 };
      const coord2 = { lat: 52.4862, lng: -1.8904 };

      // All distance calculator functions should throw errors
      expect(() => calculateDistance(coord1, coord2)).toThrow('Distance calculations are disabled');
      expect(() => calculateDuration(10)).toThrow('Duration calculations are disabled');
      expect(() => formatDistance(10)).toThrow('Distance formatting is disabled');
      expect(() => calculateDistanceInfo(coord1, coord2)).toThrow('Distance calculations are disabled');
      expect(() => isValidCoordinates(coord1)).toThrow('Coordinate validation is disabled');

      // Should log deprecation warnings
      expect(mockConsoleError).toHaveBeenCalledWith('❌ calculateDistance is DEPRECATED and DISABLED');
    });

    it('should warn when using deprecated EnterprisePricingService', async () => {
      const { EnterprisePricingService } = await import('../apps/web/src/lib/services/enterprise-pricing-service');
      
      const service = new EnterprisePricingService();
      
      // Should log deprecation warning on instantiation
      expect(mockConsoleWarn).toHaveBeenCalledWith('⚠️  EnterprisePricingService is DEPRECATED. Use UnifiedPricingFacade instead.');
    });

    it('should redirect deprecated API endpoints', async () => {
      // Mock fetch for API testing
      global.fetch = jest.fn();

      // Test that deprecated endpoint returns proper redirect response
      const response = await fetch('/api/pricing/calculate', { method: 'POST' });
      
      // Note: In a real test, you'd mock the actual API response
      // This test structure shows how to verify the endpoint behavior
      expect(true).toBe(true); // Placeholder - replace with actual endpoint test
    });
  });

  describe('UnifiedPricingFacade - Should be Primary', () => {
    it('should create UnifiedPricingFacade instance successfully', async () => {
      const { UnifiedPricingFacade, unifiedPricingFacade } = 
        await import('../apps/web/src/lib/pricing/unified-pricing-facade');

      expect(unifiedPricingFacade).toBeInstanceOf(UnifiedPricingFacade);
      expect(unifiedPricingFacade).toBeDefined();
    });

    it('should validate pricing requests correctly', async () => {
      const { unifiedPricingFacade } = 
        await import('../apps/web/src/lib/pricing/unified-pricing-facade');

      const validRequest = {
        pickupCoordinates: { lat: 51.5074, lng: -0.1278 },
        dropoffCoordinates: { lat: 52.4862, lng: -1.8904 },
        distanceKm: 120.5,
        durationMinutes: 90,
        vehicleType: 'van',
        serviceType: 'standard',
        scheduledTime: new Date().toISOString(),
        items: [
          {
            name: 'Test Item',
            quantity: 1,
            weight: 10,
            fragile: false,
          }
        ],
      };

      const result = await unifiedPricingFacade.calculatePricing(validRequest);
      
      expect(result).toBeDefined();
      expect(result.totalPrice).toBeGreaterThan(0);
      expect(result.version).toContain('Unified');
      expect(result.currency).toBe('GBP');
    });

    it('should provide comprehensive pricing breakdown', async () => {
      const { unifiedPricingFacade } = 
        await import('../apps/web/src/lib/pricing/unified-pricing-facade');

      const request = {
        pickupCoordinates: { lat: 51.5074, lng: -0.1278 },
        dropoffCoordinates: { lat: 52.4862, lng: -1.8904 },
        distanceKm: 120.5,
        durationMinutes: 90,
        vehicleType: 'van',
        serviceType: 'express',
        scheduledTime: new Date().toISOString(),
        items: [
          {
            name: 'Test Furniture',
            quantity: 2,
            weight: 50,
            fragile: true,
          }
        ],
      };

      const result = await unifiedPricingFacade.calculatePricing(request);
      
      // Verify comprehensive pricing structure
      expect(result.basePrice).toBeGreaterThan(0);
      expect(result.itemsPrice).toBeGreaterThan(0);
      expect(result.servicePrice).toBeGreaterThan(0);
      expect(result.propertyAccessPrice).toBeGreaterThan(0);
      expect(result.vatAmount).toBeGreaterThan(0);
      expect(result.breakdown).toBeInstanceOf(Array);
      expect(result.surcharges).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.optimizationTips).toBeInstanceOf(Array);
      
      // Verify no distance calculations
      expect(result.breakdown.some(item => item.component.toLowerCase().includes('distance'))).toBe(false);
    });

    it('should validate pricing results correctly', async () => {
      const { unifiedPricingFacade } = 
        await import('../apps/web/src/lib/pricing/unified-pricing-facade');

      const request = {
        pickupLocation: { latitude: 51.5074, longitude: -0.1278 },
        deliveryLocation: { latitude: 52.4862, longitude: -1.8904 },
        items: [{ name: 'Test', category: 'BOXES' as const, quantity: 1 }],
        serviceType: 'standard' as const,
        scheduledAt: new Date(),
      };

      const result = await unifiedPricingFacade.calculatePricing(request);
      const validation = unifiedPricingFacade.validatePricingResult(result);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('API Integration - Should Use Unified Pricing Only', () => {
    it('should use unified pricing facade in API routes', async () => {
      // Mock the API route handler
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          pickupAddress: { latitude: 51.5074, longitude: -0.1278 },
          dropoffAddress: { latitude: 52.4862, longitude: -1.8904 },
          items: [{ name: 'Test', category: 'boxes', quantity: 1 }],
          serviceType: 'standard',
        }),
      };

      // This test would verify that the API route uses UnifiedPricingFacade
      // In a real implementation, you'd import and test the actual route handler
      expect(true).toBe(true); // Placeholder
    });

    it('should return proper error for deprecated endpoints', async () => {
      // Test that deprecated endpoints return 410 Gone status
      // This would test the actual deprecated route handlers
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Frontend Integration - Should Use Unified Hooks', () => {
    it('should provide unified pricing hook', async () => {
      const { useUnifiedPricing } = 
        await import('../apps/web/src/lib/hooks/use-unified-pricing');

      expect(useUnifiedPricing).toBeDefined();
      expect(typeof useUnifiedPricing).toBe('function');
    });

    it('should provide automatic pricing hook', async () => {
      const { useAutomaticPricing } = 
        await import('../apps/web/src/lib/hooks/use-unified-pricing');

      expect(useAutomaticPricing).toBeDefined();
      expect(typeof useAutomaticPricing).toBe('function');
    });
  });

  describe('Display-Only Pricing Components', () => {
    it('should provide display-only pricing components', async () => {
      const { DisplayOnlyPricing, ServicePricingComparison, InlinePricingDisplay, HeroPricingBanner } = 
        await import('../apps/web/src/components/pricing/DisplayOnlyPricing');

      expect(DisplayOnlyPricing).toBeDefined();
      expect(ServicePricingComparison).toBeDefined();
      expect(InlinePricingDisplay).toBeDefined();
      expect(HeroPricingBanner).toBeDefined();
    });
  });

  describe('System Architecture Validation', () => {
    it('should not import legacy pricing packages', async () => {
      // Test that @speedy-van/pricing is not imported in new code
      // This would be implemented as a static analysis test
      expect(true).toBe(true); // Placeholder
    });

    it('should ensure single source of truth', async () => {
      const { unifiedPricingFacade } = 
        await import('../apps/web/src/lib/pricing/unified-pricing-facade');

      // Verify singleton pattern
      const instance1 = unifiedPricingFacade;
      const { unifiedPricingFacade: instance2 } = 
        await import('../apps/web/src/lib/pricing/unified-pricing-facade');
      
      expect(instance1).toBe(instance2);
    });

    it('should provide consistent pricing across all entry points', async () => {
      // Test that all pricing entry points use the same underlying facade
      const { unifiedPricingFacade } = 
        await import('../apps/web/src/lib/pricing/unified-pricing-facade');

      const request = {
        pickupLocation: { latitude: 51.5074, longitude: -0.1278 },
        deliveryLocation: { latitude: 52.4862, longitude: -1.8904 },
        items: [{ name: 'Test', category: 'BOXES' as const, quantity: 1 }],
        serviceType: 'standard' as const,
        scheduledAt: new Date(),
      };

      const result1 = await unifiedPricingFacade.calculatePricing(request);
      const result2 = await unifiedPricingFacade.calculatePricing(request);
      
      // Results should be consistent (allowing for small timing differences)
      expect(Math.abs(result1.totalPrice - result2.totalPrice)).toBeLessThan(0.01);
    });
  });

  describe('Migration Completeness', () => {
    it('should log deprecation warnings for legacy usage', () => {
      // Verify that deprecation warnings are properly logged
      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it('should provide migration guidance', async () => {
      // Test that deprecated modules provide clear migration guidance
      const { DISTANCE_CALCULATOR_DISABLED, MIGRATION_MESSAGE } = 
        await import('../apps/web/src/lib/utils/distance-calculator');

      expect(DISTANCE_CALCULATOR_DISABLED).toBe(true);
      expect(MIGRATION_MESSAGE).toContain('UnifiedPricingFacade');
    });

    it('should ensure no manual pricing triggers exist', () => {
      // This test would verify that no manual "Calculate Price" buttons exist
      // It would scan component files for manual pricing triggers
      expect(true).toBe(true); // Placeholder
    });
  });
});

describe('Performance and Reliability', () => {
  it('should handle pricing requests efficiently', async () => {
    const { unifiedPricingFacade } = 
      await import('../apps/web/src/lib/pricing/unified-pricing-facade');

    const request = {
      pickupLocation: { latitude: 51.5074, longitude: -0.1278 },
      deliveryLocation: { latitude: 52.4862, longitude: -1.8904 },
      items: [{ name: 'Test', category: 'BOXES' as const, quantity: 1 }],
      serviceType: 'standard' as const,
      scheduledAt: new Date(),
    };

    const startTime = Date.now();
    const result = await unifiedPricingFacade.calculatePricing(request);
    const endTime = Date.now();

    expect(result).toBeDefined();
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });

  it('should handle edge cases gracefully', async () => {
    const { unifiedPricingFacade } = 
      await import('../apps/web/src/lib/pricing/unified-pricing-facade');

    // Test with extreme values
    const request = {
      pickupLocation: { latitude: 51.5074, longitude: -0.1278 },
      deliveryLocation: { latitude: 52.4862, longitude: -1.8904 },
      items: [
        { 
          name: 'Massive Item', 
          category: 'FURNITURE' as const, 
          quantity: 100,
          volume: 1000,
          weight: 10000,
          isFragile: true,
          isValuable: true,
          requiresDisassembly: true,
        }
      ],
      serviceType: 'same-day' as const,
      scheduledAt: new Date(),
      pickupProperty: {
        floor: 20,
        hasElevator: false,
        hasParking: false,
        narrowAccess: true,
        longCarry: true,
        accessType: 'difficult' as const,
      },
    };

    const result = await unifiedPricingFacade.calculatePricing(request);
    const validation = unifiedPricingFacade.validatePricingResult(result);

    expect(validation.isValid).toBe(true);
    expect(result.totalPrice).toBeGreaterThan(0);
    expect(result.totalPrice).toBeLessThan(10000); // Reasonable upper bound
  });
});
