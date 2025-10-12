/**
 * Unit Tests for Dynamic Availability Engine
 * Tests capacity checks, fill-rate calculations, availability logic
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DynamicAvailabilityEngine, type FullStructuredAddress, type BookingCapacity } from '../dynamic-availability-engine';

// Mock Prisma client
const mockPrisma = {
  pricingSnapshot: {
    create: jest.fn()
  }
} as any;

describe('DynamicAvailabilityEngine', () => {
  let engine: DynamicAvailabilityEngine;
  
  const mockPickup: FullStructuredAddress = {
    street: 'High Street',
    number: '123',
    city: 'London',
    postcode: 'SW1A 1AA',
    coordinates: { lat: 51.5074, lng: -0.1278 }
  };

  const mockDrops: FullStructuredAddress[] = [
    {
      street: 'King\'s Road',
      number: '456',
      city: 'London',
      postcode: 'SW3 4TY',
      coordinates: { lat: 51.4922, lng: -0.1631 }
    }
  ];

  const mockCapacity: BookingCapacity = {
    totalWeightKg: 100,
    totalVolumeM3: 5,
    estimatedDurationMinutes: 120,
    crewRequired: 2
  };

  beforeEach(() => {
    engine = new DynamicAvailabilityEngine(mockPrisma);
    jest.clearAllMocks();
  });

  describe('Address Validation', () => {
    it('should validate full structured addresses', async () => {
      const result = await engine.calculateAvailability(
        mockPickup,
        mockDrops,
        mockCapacity,
        'test-request-1'
      );

      expect(result).toHaveProperty('next_available_date');
      expect(result).toHaveProperty('route_type');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should reject incomplete addresses', async () => {
      const incompletePickup = { ...mockPickup, street: '' };
      
      await expect(
        engine.calculateAvailability(
          incompletePickup,
          mockDrops,
          mockCapacity,
          'test-request-2'
        )
      ).rejects.toThrow('pickup address missing required fields');
    });

    it('should reject addresses without coordinates', async () => {
      const noCoordinatesPickup = { 
        ...mockPickup, 
        coordinates: null as any 
      };
      
      await expect(
        engine.calculateAvailability(
          noCoordinatesPickup,
          mockDrops,
          mockCapacity,
          'test-request-3'
        )
      ).rejects.toThrow('pickup address missing coordinates');
    });
  });

  describe('Capacity Calculations', () => {
    it('should calculate capacity fit correctly', () => {
      const route = {
        id: 'route1',
        corridor: 'test-corridor',
        date: new Date(),
        window: 'AM' as const,
        currentCapacityKg: 300,
        currentVolumeM3: 5,
        maxCapacityKg: 1000,
        maxVolumeM3: 15,
        fillRate: 40,
        estimatedStops: 3,
        status: 'planning' as const,
        vehicleId: 'vehicle1'
      };

      const canFit = (engine as any).checkCapacityFit(route, mockCapacity);
      expect(canFit).toBe(true);
    });

    it('should reject bookings that exceed capacity', () => {
      const route = {
        id: 'route1',
        corridor: 'test-corridor',
        date: new Date(),
        window: 'AM' as const,
        currentCapacityKg: 950, // Almost full
        currentVolumeM3: 14,
        maxCapacityKg: 1000,
        maxVolumeM3: 15,
        fillRate: 90,
        estimatedStops: 8,
        status: 'planning' as const,
        vehicleId: 'vehicle1'
      };

      const canFit = (engine as any).checkCapacityFit(route, mockCapacity);
      expect(canFit).toBe(false);
    });

    it('should calculate projected fill rate correctly', () => {
      const route = {
        id: 'route1',
        corridor: 'test-corridor',
        date: new Date(),
        window: 'AM' as const,
        currentCapacityKg: 200,
        currentVolumeM3: 3,
        maxCapacityKg: 1000,
        maxVolumeM3: 15,
        fillRate: 20,
        estimatedStops: 2,
        status: 'planning' as const,
        vehicleId: 'vehicle1'
      };

      const fillRate = (engine as any).calculateProjectedFillRate(route, mockCapacity);
      expect(fillRate).toBeGreaterThan(20); // Should increase
      expect(fillRate).toBeLessThanOrEqual(100);
    });
  });

  describe('Route Type Logic', () => {
    it('should return Economy for multi-drop with sufficient fill rate', async () => {
      // Mock route candidates to return ready economy route
      const mockGetRouteCandidates = jest.fn().mockResolvedValue([
        {
          id: 'route1',
          corridor: 'test-corridor',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          window: 'AM' as const,
          currentCapacityKg: 400,
          currentVolumeM3: 6,
          maxCapacityKg: 1000,
          maxVolumeM3: 15,
          fillRate: 60, // Above minimum threshold
          estimatedStops: 4,
          status: 'planning' as const,
          vehicleId: 'vehicle1'
        }
      ]);

      (engine as any).getRouteCandidates = mockGetRouteCandidates;

      const result = await engine.calculateAvailability(
        mockPickup,
        mockDrops,
        mockCapacity,
        'test-request-4'
      );

      expect(result.route_type).toBe('economy');
      expect(result.fill_rate).toBeGreaterThanOrEqual(50);
    });

    it('should return Express for immediate availability', async () => {
      // Mock available drivers and vehicles
      const mockGetAvailableDrivers = jest.fn().mockResolvedValue([
        { driverId: 'driver1', vehicleId: 'vehicle1' },
        { driverId: 'driver2', vehicleId: 'vehicle2' }
      ]);
      const mockGetSuitableVehicles = jest.fn().mockResolvedValue([
        { id: 'vehicle1', type: 'large_van', maxWeightKg: 1000, maxVolumeM3: 15, crewSize: 2 }
      ]);

      (engine as any).getAvailableDrivers = mockGetAvailableDrivers;
      (engine as any).getSuitableVehicles = mockGetSuitableVehicles;

      const result = await engine.calculateAvailability(
        mockPickup,
        mockDrops,
        mockCapacity,
        'test-request-5'
      );

      // Should prefer Express when multiple drivers available
      expect(result.route_type).toBe('express');
      expect(result.confidence).toBeGreaterThanOrEqual(95);
    });
  });

  describe('Distance Calculations', () => {
    it('should calculate Haversine distance correctly', () => {
      const distance = (engine as any).haversineDistance(
        51.5074, -0.1278, // London
        51.4922, -0.1631  // Nearby location
      );
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10); // Should be a few miles
    });

    it('should estimate job duration based on stops and distance', () => {
      const duration = (engine as any).estimateJobDuration(
        mockPickup,
        mockDrops,
        mockCapacity
      );
      
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(8 * 60); // Less than 8 hours for simple job
    });
  });

  describe('Corridor Management', () => {
    it('should generate consistent corridor identifiers', () => {
      const corridor1 = (engine as any).calculateCorridor(mockPickup, mockDrops);
      const corridor2 = (engine as any).calculateCorridor(mockPickup, mockDrops);
      
      expect(corridor1).toBe(corridor2);
      expect(corridor1).toMatch(/^[\d_]+$/); // Should be numeric format
    });

    it('should generate different corridors for different regions', () => {
      const manchesterDrops: FullStructuredAddress[] = [
        {
          street: 'Market Street',
          number: '100',
          city: 'Manchester',
          postcode: 'M1 1AA',
          coordinates: { lat: 53.4808, lng: -2.2426 }
        }
      ];

      const londonCorridor = (engine as any).calculateCorridor(mockPickup, mockDrops);
      const manchesterCorridor = (engine as any).calculateCorridor(mockPickup, manchesterDrops);
      
      expect(londonCorridor).not.toBe(manchesterCorridor);
    });
  });

  describe('Error Handling', () => {
    it('should return fallback availability on calculation failure', async () => {
      // Force an error in route calculation
      (engine as any).getAvailableDrivers = jest.fn().mockRejectedValue(new Error('Database error'));
      
      const result = await engine.calculateAvailability(
        mockPickup,
        mockDrops,
        mockCapacity,
        'test-request-6'
      );

      expect(result).toHaveProperty('next_available_date');
      expect(result.confidence).toBeLessThan(90); // Fallback should have lower confidence
    });

    it('should handle empty route candidates gracefully', async () => {
      (engine as any).getRouteCandidates = jest.fn().mockResolvedValue([]);
      (engine as any).getAvailableDrivers = jest.fn().mockResolvedValue([]);
      
      const result = await engine.calculateAvailability(
        mockPickup,
        mockDrops,
        mockCapacity,
        'test-request-7'
      );

      expect(result.route_type).toBe('economy'); // Should predict future economy route
      expect(result.explanation).toContain('projected');
    });
  });

  describe('SLA Requirements', () => {
    it('should respect maximum route duration limits', async () => {
      const largeCapacity: BookingCapacity = {
        totalWeightKg: 2000, // Exceeds single van capacity
        totalVolumeM3: 20,
        estimatedDurationMinutes: 720, // 12 hours - exceeds limit
        crewRequired: 4
      };

      // Mock drivers to be available to test duration limit
      (engine as any).getAvailableDrivers = jest.fn().mockResolvedValue([
        { driverId: 'driver1', vehicleId: 'vehicle1' }
      ]);
      (engine as any).getSuitableVehicles = jest.fn().mockResolvedValue([
        { id: 'vehicle1', type: 'large_van', maxWeightKg: 1000, maxVolumeM3: 15, crewSize: 2 }
      ]);

      const result = await engine.calculateAvailability(
        mockPickup,
        mockDrops,
        largeCapacity,
        'test-request-8'
      );

      // Should not offer immediate availability for oversized jobs
      expect(result.route_type).not.toBe('express');
    });

    it('should enforce minimum fill rate for Economy routes', () => {
      const route = {
        id: 'route1',
        corridor: 'test-corridor',
        date: new Date(),
        window: 'AM' as const,
        currentCapacityKg: 100, // Low current load
        currentVolumeM3: 2,
        maxCapacityKg: 1000,
        maxVolumeM3: 15,
        fillRate: 30, // Below 50% threshold
        estimatedStops: 2,
        status: 'planning' as const,
        vehicleId: 'vehicle1'
      };

      const smallCapacity: BookingCapacity = {
        totalWeightKg: 50,
        totalVolumeM3: 1,
        estimatedDurationMinutes: 60,
        crewRequired: 2
      };

      const canFit = (engine as any).checkCapacityFit(route, smallCapacity);
      const fillRate = (engine as any).calculateProjectedFillRate(route, smallCapacity);

      expect(canFit).toBe(true);
      expect(fillRate).toBeLessThan(50); // Should not meet minimum threshold
    });
  });
});

export default DynamicAvailabilityEngine;