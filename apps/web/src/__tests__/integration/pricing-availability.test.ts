/**
 * Integration Tests for Pricing & Availability API
 * Tests the complete flow from UI through APIs to availability engine
 */

import { describe, it, expect } from '@jest/globals';

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

// Sample test data with full structured addresses
const testPickupAddress = {
  street: 'High Street',
  number: '123',
  city: 'London',
  postcode: 'SW1A 1AA',
  full: '123 High Street, London SW1A 1AA',
  line1: '123 High Street',
  coordinates: {
    lat: 51.5074,
    lng: -0.1278
  }
};

const testDropAddress = {
  street: 'King\'s Road',
  number: '456', 
  city: 'London',
  postcode: 'SW3 4TY',
  full: '456 King\'s Road, London SW3 4TY',
  line1: '456 King\'s Road',
  coordinates: {
    lat: 51.4922,
    lng: -0.1631
  }
};

const testCapacity = {
  totalWeightKg: 100,
  totalVolumeM3: 5,
  estimatedDurationMinutes: 120,
  crewRequired: 2
};

const testItems = [
  {
    id: 'sofa-3-seater',
    name: '3-Seater Sofa',
    quantity: 1,
    weight_override: 50,
    volume_override: 2.5
  },
  {
    id: 'dining-table',
    name: 'Dining Table',
    quantity: 1,
    weight_override: 30,
    volume_override: 1.5
  }
];

describe('Pricing & Availability Integration', () => {
  
  describe('Availability API (/api/availability/next)', () => {
    it('should return availability for valid full addresses', async () => {
      const response = await fetch(`${BASE_URL}/api/availability/next?` + new URLSearchParams({
        pickup: JSON.stringify(testPickupAddress),
        drops: JSON.stringify([testDropAddress]),
        capacity: JSON.stringify(testCapacity)
      }), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('next_available_date');
      expect(data).toHaveProperty('route_type');
      expect(data).toHaveProperty('confidence');
      expect(data).toHaveProperty('capacity_used_pct');
      expect(data).toHaveProperty('fill_rate');
      expect(data).toHaveProperty('explanation');
      
      // Validate data types
      expect(typeof data.confidence).toBe('number');
      expect(data.confidence).toBeGreaterThan(0);
      expect(data.confidence).toBeLessThanOrEqual(100);
      
      expect(['economy', 'standard', 'express']).toContain(data.route_type);
      expect(['AM', 'PM', 'ALL_DAY']).toContain(data.window);
    }, TIMEOUT);

    it('should reject incomplete address structure', async () => {
      const incompleteAddress = {
        postcode: 'SW1A 1AA' // Postcode-only - forbidden by Enterprise Engine
      };

      const response = await fetch(`${BASE_URL}/api/availability/next?` + new URLSearchParams({
        pickup: JSON.stringify(incompleteAddress),
        drops: JSON.stringify([testDropAddress]),
        capacity: JSON.stringify(testCapacity)
      }), {
        method: 'GET'
      });

      expect(response.status).toBe(400);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.code).toBe('INVALID_PICKUP_STRUCTURE');
    }, TIMEOUT);

    it('should reject addresses without coordinates', async () => {
      const noCoordinatesAddress = {
        ...testPickupAddress,
        coordinates: undefined
      };

      const response = await fetch(`${BASE_URL}/api/availability/next?` + new URLSearchParams({
        pickup: JSON.stringify(noCoordinatesAddress),
        drops: JSON.stringify([testDropAddress]),
        capacity: JSON.stringify(testCapacity)
      }), {
        method: 'GET'
      });

      expect(response.status).toBe(400);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toContain('coordinates');
    }, TIMEOUT);
  });

  describe('Comprehensive Pricing API (/api/pricing/comprehensive)', () => {
    it('should return pricing with embedded availability for all tiers', async () => {
      const pricingRequest = {
        items: testItems,
        pickup: testPickupAddress,
        dropoffs: [testDropAddress],
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        serviceLevel: 'standard'
      };

      const response = await fetch(`${BASE_URL}/api/pricing/comprehensive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricingRequest)
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('availability');
      
      const availability = result.data.availability;
      expect(availability).toHaveProperty('economy');
      expect(availability).toHaveProperty('standard');
      expect(availability).toHaveProperty('express');
      expect(availability).toHaveProperty('calculatedAt');

      // Validate availability structure for each tier
      ['economy', 'standard', 'express'].forEach(tier => {
        if (availability[tier]) {
          expect(availability[tier]).toHaveProperty('next_available_date');
          expect(availability[tier]).toHaveProperty('route_type');
          expect(availability[tier]).toHaveProperty('confidence');
        }
      });
    }, TIMEOUT);

    it('should enforce full address validation in pricing API', async () => {
      const requestWithIncompleteAddress = {
        items: testItems,
        pickup: {
          line1: 'Some Street', // Missing required Enterprise fields
          postcode: 'SW1A 1AA'
        },
        dropoffs: [testDropAddress],
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        serviceLevel: 'standard'
      };

      const response = await fetch(`${BASE_URL}/api/pricing/comprehensive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestWithIncompleteAddress)
      });

      expect(response.status).toBe(400);
      
      const error = await response.json();
      expect(error.success).toBe(false);
      expect(error.error).toBe('Validation failed');
    }, TIMEOUT);
  });

  describe('End-to-End Booking Flow', () => {
    it('should complete full booking flow with automatic pricing', async () => {
      // Step 1: Get comprehensive pricing with availability
      const pricingRequest = {
        items: testItems,
        pickup: testPickupAddress,
        dropoffs: [testDropAddress],
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        serviceLevel: 'standard'
      };

      const pricingResponse = await fetch(`${BASE_URL}/api/pricing/comprehensive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricingRequest)
      });

      expect(pricingResponse.status).toBe(200);
      
      const pricingResult = await pricingResponse.json();
      expect(pricingResult.success).toBe(true);
      expect(pricingResult.data.amountGbpMinor).toBeGreaterThan(0);
      
      // Verify three-tier availability is provided
      const availability = pricingResult.data.availability;
      expect(availability).toBeDefined();
      
      // Check that at least standard and express are available
      expect(availability.standard).toBeDefined();
      expect(availability.express).toBeDefined();
      
      // Economy might not be available (depends on route optimization)
      if (availability.economy) {
        expect(availability.economy.fill_rate).toBeGreaterThanOrEqual(50);
      }

      // eslint-disable-next-line no-console
      console.log('✅ E2E Test Results:', {
        basePrice: pricingResult.data.amountGbpMinor / 100,
        availability: {
          economy: availability.economy?.next_available_date || 'Not available',
          standard: availability.standard?.next_available_date || 'Not available', 
          express: availability.express?.next_available_date || 'Not available'
        },
        processingTime: pricingResult.metadata?.processingTimeMs || 'Unknown'
      });
      
    }, TIMEOUT);

    it('should handle multiple drops with capacity validation', async () => {
      const multiDropRequest = {
        items: [
          ...testItems,
          {
            id: 'wardrobe-large',
            name: 'Large Wardrobe', 
            quantity: 2,
            weight_override: 80,
            volume_override: 4
          }
        ],
        pickup: testPickupAddress,
        dropoffs: [
          testDropAddress,
          {
            street: 'Baker Street',
            number: '221B',
            city: 'London',
            postcode: 'NW1 6XE',
            full: '221B Baker Street, London NW1 6XE',
            line1: '221B Baker Street',
            coordinates: {
              lat: 51.5238,
              lng: -0.1585
            }
          }
        ],
        scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        serviceLevel: 'economy'
      };

      const response = await fetch(`${BASE_URL}/api/pricing/comprehensive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(multiDropRequest)
      });

      expect(response.status).toBe(200);
      
      const result = await response.json();
      expect(result.success).toBe(true);
      
      const availability = result.data.availability;
      
      // Multi-drop should favor economy routing
      if (availability.economy) {
        expect(availability.economy.route_type).toBe('economy');
        expect(availability.economy.fill_rate).toBeGreaterThan(0);
      }
      
      // eslint-disable-next-line no-console
      console.log('✅ Multi-drop Test Results:', {
        totalCapacity: multiDropRequest.items.reduce((sum, item) => 
          sum + (item.weight_override || 0) * item.quantity, 0),
        dropCount: multiDropRequest.dropoffs.length,
        economyAvailable: !!availability.economy,
        fillRate: availability.economy?.fill_rate || 'N/A'
      });
      
    }, TIMEOUT * 2); // Extended timeout for complex calculation
  });

  describe('Performance & Reliability', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await fetch(`${BASE_URL}/api/availability/next?` + new URLSearchParams({
        pickup: JSON.stringify(testPickupAddress),
        drops: JSON.stringify([testDropAddress]),
        capacity: JSON.stringify(testCapacity)
      }), {
        method: 'GET'
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      
      const data = await response.json();
      expect(data.processingTimeMs).toBeLessThan(3000); // Internal processing under 3 seconds
    }, TIMEOUT);

    it('should handle concurrent requests correctly', async () => {
      const requests = Array(5).fill(null).map((_, i) => 
        fetch(`${BASE_URL}/api/availability/next?` + new URLSearchParams({
          pickup: JSON.stringify(testPickupAddress),
          drops: JSON.stringify([testDropAddress]),
          capacity: JSON.stringify({
            ...testCapacity,
            totalWeightKg: testCapacity.totalWeightKg + i * 10 // Slight variation
          })
        }), {
          method: 'GET'
        })
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Parse all results
      const results = await Promise.all(
        responses.map(response => response.json())
      );

      // All should have valid structure
      results.forEach(result => {
        expect(result).toHaveProperty('requestId');
        expect(result).toHaveProperty('next_available_date');
        expect(result).toHaveProperty('route_type');
      });

      // Request IDs should be unique
      const requestIds = results.map(r => r.requestId);
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(requests.length);
    }, TIMEOUT);
  });
});

export {};