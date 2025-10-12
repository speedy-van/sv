/**
 * Unit Tests for Luton Van Specifications
 * 
 * Tests capacity validation, pricing multipliers, and helper functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  LUTON_VAN_SPECS,
  CAPACITY_THRESHOLDS,
  MULTI_DROP_CONFIG,
  TIER_SAFETY_BUFFERS,
  isWithinCapacity,
  getCapacityPricingMultiplier,
  getCapacityStatus,
} from '../luton-van-specs';

describe('Luton Van Specifications', () => {
  describe('Constants Validation', () => {
    it('should have valid cargo dimensions', () => {
      expect(LUTON_VAN_SPECS.cargo.length_m).toBeGreaterThan(0);
      expect(LUTON_VAN_SPECS.cargo.width_m).toBeGreaterThan(0);
      expect(LUTON_VAN_SPECS.cargo.height_m).toBeGreaterThan(0);
      expect(LUTON_VAN_SPECS.cargo.usable_volume_m3).toBeGreaterThan(0);
    });

    it('should have valid weight specifications', () => {
      expect(LUTON_VAN_SPECS.weight.max_payload_kg).toBeGreaterThan(0);
      expect(LUTON_VAN_SPECS.weight.available_payload_kg).toBeLessThanOrEqual(
        LUTON_VAN_SPECS.weight.max_payload_kg
      );
    });

    it('should have valid multi-drop configuration', () => {
      expect(MULTI_DROP_CONFIG.max_stops_per_route).toBeGreaterThanOrEqual(2);
      expect(MULTI_DROP_CONFIG.max_route_duration_hours).toBeGreaterThan(0);
    });

    it('should have tier safety buffers', () => {
      expect(TIER_SAFETY_BUFFERS.economy.volume_buffer).toBeGreaterThan(0);
      expect(TIER_SAFETY_BUFFERS.standard.volume_buffer).toBeGreaterThan(0);
      expect(TIER_SAFETY_BUFFERS.express.volume_buffer).toBeGreaterThan(0);
    });
  });

  describe('isWithinCapacity', () => {
    describe('Valid Loads', () => {
      it('should accept small load (30% capacity)', () => {
        const result = isWithinCapacity(5, 400); // ~30% volume, ~30% weight

        expect(result.fits).toBe(true);
        expect(result.volumeUtilization).toBeLessThan(0.5);
        expect(result.weightUtilization).toBeLessThan(0.5);
      });

      it('should accept optimal load (70% capacity)', () => {
        const result = isWithinCapacity(10.5, 900); // Adjusted for accurate 70%

        expect(result.fits).toBe(true);
        expect(result.volumeUtilization).toBeCloseTo(0.70, 1);
        expect(result.weightUtilization).toBeCloseTo(0.70, 1);
      });

      it('should accept high utilization (85% capacity)', () => {
        const result = isWithinCapacity(13, 1100); // ~85% volume, ~85% weight

        expect(result.fits).toBe(true);
        expect(result.volumeUtilization).toBeGreaterThan(0.8);
        expect(result.reasons.some(r => r.includes('High volume utilization'))).toBe(true);
      });
    });

    describe('Invalid Loads', () => {
      it('should reject volume overflow', () => {
        const result = isWithinCapacity(20, 500); // Exceeds 16m³ usable volume

        expect(result.fits).toBe(false);
        expect(result.reasons.some(r => r.includes('Volume exceeds capacity'))).toBe(true);
      });

      it('should reject weight overflow', () => {
        const result = isWithinCapacity(10, 2000); // Exceeds 1350kg payload

        expect(result.fits).toBe(false);
        expect(result.reasons.some(r => r.includes('Weight exceeds capacity'))).toBe(true);
      });

      it('should reject both volume and weight overflow', () => {
        const result = isWithinCapacity(25, 3000); // Exceeds both

        expect(result.fits).toBe(false);
        expect(result.reasons.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('Tier Safety Buffers', () => {
      const testVolume = 15; // 15m³
      const testWeight = 1300; // 1300kg

      it('should apply economy tier buffer (5% volume, 10% weight)', () => {
        const result = isWithinCapacity(testVolume, testWeight, { tier: 'economy' });

        // Economy has 5% volume buffer: 16 * 0.95 = 15.2m³
        // Volume: 15 / 15.2 = ~98.7% (within capacity, but high)
        // Weight also high, so may show warnings but should fit
        expect(result.volumeUtilization).toBeCloseTo(0.987, 1);
      });

      it('should apply standard tier buffer (10% volume, 10% weight)', () => {
        const result = isWithinCapacity(testVolume, testWeight, { tier: 'standard' });

        // Standard has 10% volume buffer: 16 * 0.90 = 14.4m³
        // Volume: 15 / 14.4 = ~104% (exceeds capacity)
        expect(result.fits).toBe(false);
      });

      it('should apply express tier buffer (15% volume, 15% weight)', () => {
        const result = isWithinCapacity(testVolume, testWeight, { tier: 'express' });

        // Express has 15% volume buffer: 16 * 0.85 = 13.6m³
        // Volume: 15 / 13.6 = ~110% (exceeds capacity)
        expect(result.fits).toBe(false);
      });
    });

    describe('Multi-Drop Degradation', () => {
      const testVolume = 14; // 14m³
      const testWeight = 1000; // 1000kg

      it('should handle single stop (no degradation)', () => {
        const result = isWithinCapacity(testVolume, testWeight, { 
          tier: 'economy',
          stopCount: 1,
        });

        expect(result.fits).toBe(true);
      });

      it('should apply degradation for 3 stops (4% volume loss)', () => {
        const result = isWithinCapacity(testVolume, testWeight, { 
          tier: 'economy',
          stopCount: 3,
        });

        // Economy buffer: 5%, Multi-drop: 4% (2 stops × 2%)
        // Effective capacity: 16 * (1 - 0.05 - 0.04) = 14.56m³
        // Utilization: 14 / 14.56 = ~96%
        expect(result.fits).toBe(true);
        expect(result.volumeUtilization).toBeGreaterThan(0.90);
      });

      it('should reject with high stop count and degradation', () => {
        const result = isWithinCapacity(testVolume, testWeight, { 
          tier: 'standard', // 10% buffer
          stopCount: 5,     // 8% degradation (4 stops × 2%)
        });

        // Standard buffer: 10%, Multi-drop: 8%
        // Effective capacity: 16 * (1 - 0.10 - 0.08) = 13.12m³
        // Utilization: 14 / 13.12 = ~107% (exceeds)
        expect(result.fits).toBe(false);
      });
    });

    describe('Warnings', () => {
      it('should warn about low utilization (<30%)', () => {
        const result = isWithinCapacity(4, 300); // ~25% utilization

        expect(result.fits).toBe(true);
        expect(result.reasons.some(r => r.includes('Low volume utilization'))).toBe(true);
      });

      it('should warn about high weight utilization (>85%)', () => {
        const result = isWithinCapacity(8, 1200); // ~90% weight utilization

        expect(result.fits).toBe(true);
        expect(result.reasons.some(r => r.includes('High weight utilization'))).toBe(true);
      });
    });
  });

  describe('getCapacityPricingMultiplier', () => {
    it('should return base rate for optimal utilization (60-80%)', () => {
      const multiplier = getCapacityPricingMultiplier(11, 945); // ~70% utilization

      expect(multiplier).toBe(1.0);
    });

    it('should return premium for high utilization (>85%)', () => {
      const multiplier = getCapacityPricingMultiplier(14, 1200); // ~87% utilization

      expect(multiplier).toBe(1.15); // 15% premium
    });

    it('should return base rate for low utilization', () => {
      const multiplier = getCapacityPricingMultiplier(4, 300); // ~25% utilization

      expect(multiplier).toBe(1.0); // No discount
    });

    it('should use higher of volume/weight utilization', () => {
      // High volume (90%), low weight (30%)
      const multiplier1 = getCapacityPricingMultiplier(14.4, 400);
      expect(multiplier1).toBe(1.15); // Premium due to high volume

      // Low volume (30%), high weight (90%)
      const multiplier2 = getCapacityPricingMultiplier(5, 1215);
      expect(multiplier2).toBe(1.15); // Premium due to high weight
    });
  });

  describe('getCapacityStatus', () => {
    it('should return "optimal" for 70% utilization', () => {
      const status = getCapacityStatus(0.70, 0.70);

      expect(status.level).toBe('optimal');
      expect(status.color).toBe('green');
      expect(status.message).toContain('Optimal capacity');
    });

    it('should return "high" for 85% utilization', () => {
      const status = getCapacityStatus(0.85, 0.80);

      expect(status.level).toBe('high');
      expect(status.color).toBe('yellow');
      expect(status.message).toContain('High capacity');
    });

    it('should return "critical" for 95% utilization', () => {
      const status = getCapacityStatus(0.95, 0.90);

      expect(status.level).toBe('critical');
      expect(status.color).toBe('orange');
      expect(status.message).toContain('Critical capacity');
    });

    it('should return "exceeded" for >100% utilization', () => {
      const status = getCapacityStatus(1.05, 1.10);

      expect(status.level).toBe('exceeded');
      expect(status.color).toBe('red');
      expect(status.message).toContain('Capacity exceeded');
    });

    it('should use higher of volume/weight utilization', () => {
      const status = getCapacityStatus(0.50, 0.95); // High weight, low volume

      expect(status.level).toBe('critical');
      expect(status.color).toBe('orange');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero load', () => {
      const result = isWithinCapacity(0, 0);

      expect(result.fits).toBe(true);
      expect(result.volumeUtilization).toBe(0);
      expect(result.weightUtilization).toBe(0);
    });

    it('should handle negative values gracefully', () => {
      const result = isWithinCapacity(-5, -100);

      expect(result.fits).toBe(true); // Negative values treated as zero
      expect(result.volumeUtilization).toBeLessThanOrEqual(0);
    });

    it('should handle exact capacity limit', () => {
      const exactVolume = LUTON_VAN_SPECS.cargo.usable_volume_m3 * 0.95; // With 5% buffer
      const exactWeight = LUTON_VAN_SPECS.weight.available_payload_kg * 0.90; // With 10% buffer

      const result = isWithinCapacity(exactVolume, exactWeight, { tier: 'economy' });

      expect(result.fits).toBe(true);
      expect(result.volumeUtilization).toBeCloseTo(1.0, 1);
    });
  });
});
