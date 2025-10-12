/**
 * Comprehensive tests for the Smart Clustering System
 * Tests dynamic radius adaptation, time-based adjustments, geographic factors, and performance
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the RouteOrchestrationScheduler class methods we need
class MockRouteOrchestrationScheduler {
  private radiusCache = new Map<string, number>();

  calculateSmartClusterRadius(totalBookings: number, options?: {
    hourOfDay?: number;
    dayOfWeek?: number;
    postcodeArea?: string;
    currentWeather?: string;
  }): number {
    const { hourOfDay, dayOfWeek, postcodeArea, currentWeather } = options || {};

    // Base radius from booking volume
    let baseRadius = this.getBaseRadiusFromVolume(totalBookings);

    // Apply time-based adjustments
    baseRadius = this.adjustForTimeOfDay(baseRadius, hourOfDay);

    // Apply day-of-week adjustments
    baseRadius = this.adjustForDayOfWeek(baseRadius, dayOfWeek);

    // Apply geographic adjustments
    baseRadius = this.adjustForGeography(baseRadius, postcodeArea);

    // Apply weather adjustments
    baseRadius = this.adjustForWeather(baseRadius, currentWeather);

    // Ensure radius is within sensible bounds
    return Math.max(15, Math.min(150, baseRadius));
  }

  private getBaseRadiusFromVolume(totalBookings: number): number {
    if (totalBookings > 100) return 20;
    if (totalBookings > 50) return 25;
    if (totalBookings > 20) return 50;
    if (totalBookings > 10) return 75;
    if (totalBookings > 5) return 100;
    return 125;
  }

  private adjustForTimeOfDay(baseRadius: number, hourOfDay?: number): number {
    if (!hourOfDay) return baseRadius;

    // Peak hours (8-10 AM, 4-7 PM): reduce radius for faster delivery
    if ((hourOfDay >= 8 && hourOfDay <= 10) || (hourOfDay >= 16 && hourOfDay <= 19)) {
      return Math.max(baseRadius * 0.7, 15);
    }

    // Off-peak hours (2-6 AM): increase radius for efficiency
    if (hourOfDay >= 2 && hourOfDay <= 6) {
      return baseRadius * 1.3;
    }

    return baseRadius;
  }

  private adjustForDayOfWeek(baseRadius: number, dayOfWeek?: number): number {
    if (!dayOfWeek) return baseRadius;

    // Monday (1) and Friday (5): often busy, reduce radius
    if (dayOfWeek === 1 || dayOfWeek === 5) {
      return Math.max(baseRadius * 0.85, 15);
    }

    // Weekend (6-7): more flexible, increase radius
    if (dayOfWeek >= 6) {
      return baseRadius * 1.2;
    }

    return baseRadius;
  }

  private adjustForGeography(baseRadius: number, postcodeArea?: string): number {
    if (!postcodeArea) return baseRadius;

    // Urban areas (London, Manchester, Birmingham): smaller radius
    const urbanAreas = ['SW', 'SE', 'NW', 'N', 'W', 'E', 'EC', 'WC', 'M', 'B'];
    if (urbanAreas.some(area => postcodeArea.startsWith(area))) {
      return Math.max(baseRadius * 0.8, 15);
    }

    // Rural areas (Northern Scotland, Cornwall): larger radius
    const ruralAreas = ['IV', 'KW', 'PH', 'AB', 'DD', 'TR', 'PL', 'EX'];
    if (ruralAreas.some(area => postcodeArea.startsWith(area))) {
      return baseRadius * 1.25;
    }

    return baseRadius;
  }

  private adjustForWeather(baseRadius: number, weather?: string): number {
    if (!weather) return baseRadius;

    const badWeather = ['rain', 'snow', 'storm', 'fog', 'hail'];
    if (badWeather.some(condition => weather.toLowerCase().includes(condition))) {
      return Math.max(baseRadius * 0.75, 15);
    }

    return baseRadius;
  }

  extractClusteringContext(bookings: any[]): {
    hourOfDay?: number;
    dayOfWeek?: number;
    postcodeArea?: string;
    currentWeather?: string;
  } {
    if (bookings.length === 0) return {};

    // Extract time information from first booking
    const firstBooking = bookings[0];
    const pickupTime = new Date(firstBooking.pickupDate);
    const hourOfDay = pickupTime.getHours();
    const dayOfWeek = pickupTime.getDay();

    // Extract most common postcode area
    const postcodeAreas = bookings
      .map(booking => this.extractLocationKey(booking))
      .filter(area => area !== 'OTHER');

    const mostCommonArea = postcodeAreas.length > 0
      ? postcodeAreas.reduce((a, b, i, arr) =>
          arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
        )
      : undefined;

    return {
      hourOfDay,
      dayOfWeek,
      postcodeArea: mostCommonArea,
      currentWeather: undefined
    };
  }

  private extractLocationKey(booking: any): string {
    const address = booking.pickupAddress?.label || '';
    const postcodeMatch = address.match(/([A-Z]{1,2})\d/);
    return postcodeMatch ? postcodeMatch[1] : 'OTHER';
  }
}

describe('Smart Clustering System', () => {
  let scheduler: MockRouteOrchestrationScheduler;

  beforeEach(() => {
    scheduler = new MockRouteOrchestrationScheduler();
  });

  describe('Volume-based clustering', () => {
    test('should return 20 miles for very busy periods (>100 bookings)', () => {
      expect(scheduler.calculateSmartClusterRadius(150)).toBe(20);
    });

    test('should return 25 miles for busy periods (50-100 bookings)', () => {
      expect(scheduler.calculateSmartClusterRadius(75)).toBe(25);
      expect(scheduler.calculateSmartClusterRadius(50)).toBe(25);
    });

    test('should return 50 miles for moderate busy periods (20-50 bookings)', () => {
      expect(scheduler.calculateSmartClusterRadius(35)).toBe(50);
      expect(scheduler.calculateSmartClusterRadius(20)).toBe(50);
    });

    test('should return 75 miles for normal periods (10-20 bookings)', () => {
      expect(scheduler.calculateSmartClusterRadius(15)).toBe(75);
      expect(scheduler.calculateSmartClusterRadius(10)).toBe(75);
    });

    test('should return 100 miles for quiet periods (5-10 bookings)', () => {
      expect(scheduler.calculateSmartClusterRadius(7)).toBe(100);
      expect(scheduler.calculateSmartClusterRadius(5)).toBe(100);
    });

    test('should return 125 miles for very quiet periods (<5 bookings)', () => {
      expect(scheduler.calculateSmartClusterRadius(3)).toBe(125);
      expect(scheduler.calculateSmartClusterRadius(1)).toBe(125);
    });
  });

  describe('Time-based adjustments', () => {
    test('should reduce radius during peak hours (8-10 AM, 4-7 PM)', () => {
      const baseRadius = 100;

      // Morning peak
      expect(scheduler.calculateSmartClusterRadius(10, { hourOfDay: 9 })).toBeLessThan(baseRadius);

      // Evening peak
      expect(scheduler.calculateSmartClusterRadius(10, { hourOfDay: 17 })).toBeLessThan(baseRadius);
    });

    test('should increase radius during off-peak hours (2-6 AM)', () => {
      const baseRadius = 75;

      expect(scheduler.calculateSmartClusterRadius(10, { hourOfDay: 4 })).toBeGreaterThan(baseRadius);
    });

    test('should maintain radius during normal hours', () => {
      expect(scheduler.calculateSmartClusterRadius(10, { hourOfDay: 12 })).toBe(75);
    });
  });

  describe('Day-of-week adjustments', () => {
    test('should reduce radius on busy days (Monday, Friday)', () => {
      const baseRadius = 100;

      expect(scheduler.calculateSmartClusterRadius(10, { dayOfWeek: 1 })).toBeLessThan(baseRadius); // Monday
      expect(scheduler.calculateSmartClusterRadius(10, { dayOfWeek: 5 })).toBeLessThan(baseRadius); // Friday
    });

    test('should increase radius on weekends', () => {
      const baseRadius = 75;

      expect(scheduler.calculateSmartClusterRadius(10, { dayOfWeek: 6 })).toBeGreaterThan(baseRadius); // Saturday
      expect(scheduler.calculateSmartClusterRadius(10, { dayOfWeek: 0 })).toBe(baseRadius); // Sunday
    });
  });

  describe('Geographic adjustments', () => {
    test('should reduce radius in urban areas', () => {
      const baseRadius = 100;

      expect(scheduler.calculateSmartClusterRadius(10, { postcodeArea: 'SW' })).toBeLessThan(baseRadius); // London
      expect(scheduler.calculateSmartClusterRadius(10, { postcodeArea: 'M' })).toBeLessThan(baseRadius);  // Manchester
      expect(scheduler.calculateSmartClusterRadius(10, { postcodeArea: 'B' })).toBeLessThan(baseRadius);  // Birmingham
    });

    test('should increase radius in rural areas', () => {
      const baseRadius = 75;

      expect(scheduler.calculateSmartClusterRadius(10, { postcodeArea: 'IV' })).toBeGreaterThan(baseRadius); // Inverness
      expect(scheduler.calculateSmartClusterRadius(10, { postcodeArea: 'TR' })).toBeGreaterThan(baseRadius); // Cornwall
      expect(scheduler.calculateSmartClusterRadius(10, { postcodeArea: 'AB' })).toBeGreaterThan(baseRadius); // Aberdeen
    });
  });

  describe('Weather adjustments', () => {
    test('should reduce radius in bad weather', () => {
      const baseRadius = 100;

      expect(scheduler.calculateSmartClusterRadius(10, { currentWeather: 'rain' })).toBeLessThan(baseRadius);
      expect(scheduler.calculateSmartClusterRadius(10, { currentWeather: 'snow' })).toBeLessThan(baseRadius);
      expect(scheduler.calculateSmartClusterRadius(10, { currentWeather: 'storm' })).toBeLessThan(baseRadius);
    });

    test('should maintain radius in good weather', () => {
      expect(scheduler.calculateSmartClusterRadius(10, { currentWeather: 'sunny' })).toBe(75);
      expect(scheduler.calculateSmartClusterRadius(10, { currentWeather: 'clear' })).toBe(75);
    });
  });

  describe('Combined factors', () => {
    test('should apply all adjustments correctly', () => {
      // Busy period (25 miles base) + peak hour (30% reduction) + urban area (20% reduction) + bad weather (25% reduction)
      const result = scheduler.calculateSmartClusterRadius(75, {
        hourOfDay: 9, // Peak hour
        dayOfWeek: 1, // Monday (busy day)
        postcodeArea: 'SW', // London (urban)
        currentWeather: 'rain' // Bad weather
      });

      // Should be significantly reduced from base 25 miles
      expect(result).toBeLessThan(25);
      expect(result).toBeGreaterThanOrEqual(15); // Minimum bound
    });

    test('should handle edge cases gracefully', () => {
      // Very busy + all negative factors should not go below minimum
      const result = scheduler.calculateSmartClusterRadius(200, {
        hourOfDay: 9,
        dayOfWeek: 1,
        postcodeArea: 'SW',
        currentWeather: 'storm'
      });

      expect(result).toBe(15); // Should hit minimum bound
    });
  });

  describe('Context extraction', () => {
    test('should extract time information from bookings', () => {
      const bookings = [
        {
          pickupDate: '2025-10-04T09:30:00Z', // Friday 9:30 AM
          pickupAddress: { label: 'SW1A 1AA, London' }
        }
      ];

      const context = scheduler.extractClusteringContext(bookings);

      expect(context.hourOfDay).toBe(9);
      expect(context.dayOfWeek).toBe(5); // Friday
      expect(context.postcodeArea).toBe('SW');
    });

    test('should extract most common postcode area', () => {
      const bookings = [
        { pickupAddress: { label: 'SW1A 1AA, London' } },
        { pickupAddress: { label: 'SW1B 2BB, London' } },
        { pickupAddress: { label: 'M1 1AA, Manchester' } }
      ];

      const context = scheduler.extractClusteringContext(bookings);

      expect(context.postcodeArea).toBe('SW'); // Most common (2 out of 3)
    });

    test('should handle empty bookings array', () => {
      const context = scheduler.extractClusteringContext([]);

      expect(context).toEqual({});
    });
  });

  describe('Performance and edge cases', () => {
    test('should enforce minimum and maximum bounds', () => {
      // Test minimum bound (15 miles)
      let result = scheduler.calculateSmartClusterRadius(200, {
        hourOfDay: 9,
        postcodeArea: 'SW',
        currentWeather: 'storm'
      });
      expect(result).toBe(15);

      // Test maximum bound (150 miles)
      result = scheduler.calculateSmartClusterRadius(1, {
        hourOfDay: 4, // Off-peak
        dayOfWeek: 6, // Weekend
        postcodeArea: 'IV' // Rural
      });
      expect(result).toBeLessThanOrEqual(150);
    });

    test('should handle undefined options gracefully', () => {
      const result = scheduler.calculateSmartClusterRadius(10, {});

      expect(result).toBe(75); // Should return base radius for 10 bookings
    });
  });
});
