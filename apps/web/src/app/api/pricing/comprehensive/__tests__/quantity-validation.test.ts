/**
 * COMPREHENSIVE PRICING API TESTS
 * 
 * Tests for /api/pricing/comprehensive endpoint
 * Focus: Item quantity validation and normalization
 * 
 * @fileoverview
 * These tests verify that the comprehensive pricing endpoint:
 * 1. Handles items with quantity = 0 gracefully
 * 2. Filters out invalid items server-side
 * 3. Returns clear error messages
 * 4. Never leaks raw Zod errors to clients
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../route';

// Sample valid address for testing
const validAddress = {
  full: '123 Test Street, London SW1A 1AA',
  line1: '123 Test Street',
  city: 'London',
  postcode: 'SW1A 1AA',
  coordinates: {
    lat: 51.5074,
    lng: -0.1278,
  },
};

// Sample valid item for testing
const validItem = {
  id: 'sofa_3_seat_modern_120kg',
  name: '3 Seater Sofa',
  quantity: 1,
};

// Helper to create mock request
function createMockRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/pricing/comprehensive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('/api/pricing/comprehensive - Item Quantity Validation', () => {
  describe('Valid Requests', () => {
    it('should accept request with valid items (quantity >= 1)', async () => {
      const request = createMockRequest({
        items: [
          { ...validItem, quantity: 1 },
          { ...validItem, id: 'chair_dining_oak_15kg', name: 'Dining Chair', quantity: 4 },
        ],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.amountGbpMinor).toBeGreaterThan(0);
    });

    it('should accept items with large quantities', async () => {
      const request = createMockRequest({
        items: [
          { ...validItem, quantity: 50 },
        ],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Items with Quantity = 0', () => {
    it('should filter out items with quantity = 0 and process valid ones', async () => {
      const request = createMockRequest({
        items: [
          { ...validItem, quantity: 2 }, // Valid
          { ...validItem, id: 'table_coffee_15kg', name: 'Coffee Table', quantity: 0 }, // Invalid
          { ...validItem, id: 'chair_dining_oak_15kg', name: 'Dining Chair', quantity: 4 }, // Valid
        ],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should process successfully with 2 valid items (0-quantity item filtered out)
    });

    it('should return clear error when ALL items have quantity = 0', async () => {
      const request = createMockRequest({
        items: [
          { ...validItem, quantity: 0 },
          { ...validItem, id: 'chair_dining_oak_15kg', name: 'Dining Chair', quantity: 0 },
        ],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(data.code).toBe('NO_VALID_ITEMS');
      expect(data.error).toContain('No valid items');
      // Should NOT be a raw Zod error
      expect(data).not.toHaveProperty('issues');
    });
  });

  describe('Items with Negative Quantity', () => {
    it('should filter out items with negative quantity', async () => {
      const request = createMockRequest({
        items: [
          { ...validItem, quantity: 2 }, // Valid
          { ...validItem, id: 'table_coffee_15kg', name: 'Coffee Table', quantity: -1 }, // Invalid
        ],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Items with String Quantities', () => {
    it('should coerce valid string quantities to numbers', async () => {
      const request = createMockRequest({
        items: [
          { ...validItem, quantity: '3' }, // String "3" should become number 3
        ],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle string "0" by filtering it out', async () => {
      const request = createMockRequest({
        items: [
          { ...validItem, quantity: 2 },
          { ...validItem, id: 'table_coffee_15kg', name: 'Coffee Table', quantity: '0' }, // String "0"
        ],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Items with Undefined/Null Quantity', () => {
    it('should treat undefined quantity as 1 (default)', async () => {
      const request = createMockRequest({
        items: [
          { id: validItem.id, name: validItem.name }, // No quantity field
        ],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should treat null quantity as 1 (default)', async () => {
      const request = createMockRequest({
        items: [
          { ...validItem, quantity: null },
        ],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Mixed Valid and Invalid Items', () => {
    it('should process request with mix of valid, zero, and negative quantities', async () => {
      const request = createMockRequest({
        items: [
          { ...validItem, id: 'item1', name: 'Item 1', quantity: 5 }, // Valid
          { ...validItem, id: 'item2', name: 'Item 2', quantity: 0 }, // Invalid
          { ...validItem, id: 'item3', name: 'Item 3', quantity: -2 }, // Invalid
          { ...validItem, id: 'item4', name: 'Item 4', quantity: 1 }, // Valid
          { ...validItem, id: 'item5', name: 'Item 5', quantity: '3' }, // Valid (coerced)
        ],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should process with 3 valid items (item1, item4, item5)
    });
  });

  describe('Error Response Structure', () => {
    it('should return structured error for no valid items', async () => {
      const request = createMockRequest({
        items: [{ ...validItem, quantity: 0 }],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('code');
      expect(data).toHaveProperty('timestamp');
      expect(data.code).toBe('NO_VALID_ITEMS');
      
      // Should NOT expose raw Zod error structure
      expect(data).not.toHaveProperty('issues');
      expect(data).not.toHaveProperty('_errors');
    });

    it('should return structured error for validation failure', async () => {
      const request = createMockRequest({
        items: [validItem],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: 'invalid-date', // Invalid date
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('code');
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Real-World iOS Scenarios', () => {
    it('should handle payload from iOS with mixed quantity types', async () => {
      // Simulates real iOS/Safari behavior with form data
      const request = createMockRequest({
        items: [
          { ...validItem, quantity: '2' }, // Form input as string
          { ...validItem, id: 'item2', name: 'Item 2', quantity: 1 }, // Normal number
          { ...validItem, id: 'item3', name: 'Item 3', quantity: '' }, // Empty string -> default 1
          { ...validItem, id: 'item4', name: 'Item 4', quantity: 0 }, // Deselected -> filtered
        ],
        pickup: validAddress,
        dropoffs: [validAddress],
        scheduledDate: new Date(Date.now() + 86400000).toISOString(),
        serviceLevel: 'standard',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should process with 3 valid items (item with 0 filtered out)
    });
  });
});

describe('/api/pricing/comprehensive - Regression Prevention', () => {
  it('should never return raw Zod errors to client', async () => {
    const request = createMockRequest({
      items: [], // Empty items
      pickup: { ...validAddress, postcode: 'INVALID' }, // Invalid postcode
      dropoffs: [validAddress],
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      serviceLevel: 'standard',
    });

    const response = await POST(request);
    const data = await response.json();

    // Even with validation errors, should return structured response
    expect(data).toHaveProperty('code');
    expect(data).not.toHaveProperty('issues'); // No raw Zod issues
    expect(data).not.toHaveProperty('_errors');
  });

  it('should log filtered items for monitoring', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    const request = createMockRequest({
      items: [
        { ...validItem, quantity: 1 },
        { ...validItem, id: 'item2', name: 'Item 2', quantity: 0 },
      ],
      pickup: validAddress,
      dropoffs: [validAddress],
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      serviceLevel: 'standard',
    });

    await POST(request);

    // Should log when items are filtered
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Filtered out'),
      expect.stringContaining('invalid items')
    );

    consoleSpy.mockRestore();
  });
});
