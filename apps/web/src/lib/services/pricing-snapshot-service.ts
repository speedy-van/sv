/**
 * Pricing Snapshot Service - Zero-Tolerance Stripe Integrity
 *
 * Handles saving and retrieving pricing snapshots for bookings
 * Ensures pricing data is immutable and matches Stripe exactly with pence precision
 */

import { prisma } from '../prisma';
import { PricingResult, StripePaymentIntent } from '../pricing/schemas';

export interface PricingSnapshotData {
  bookingId: string;
  pricingVersion: number;
  zoneKey: string;
  inputs: any;
  breakdown: any;
  subtotalExVat: number; // In pence
  vatRate: number;
  totalIncVat: number; // In pence
  hash: string;
  estimate?: boolean;
}

export interface StripeIntegrityCheck {
  passed: boolean;
  snapshotAmount: number;
  stripeAmount: number;
  difference: number;
  tolerance: number;
  errors: string[];
  warnings: string[];
}

export class PricingSnapshotService {

  /**
   * Create a pricing snapshot for a booking with Stripe integrity
   */
  public static async createPricingSnapshot(
    bookingId: string,
    pricingResult: PricingResult,
    inputs: any,
    zoneKey: string = 'default'
  ): Promise<string> {

    // Generate unique hash for this pricing calculation
    const hash = this.generatePricingHash(pricingResult, inputs);

    // Create snapshot record with pence precision
    const snapshot = await prisma.quoteSnapshot.create({
      data: {
        id: `qs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bookingId,
        pricingVersion: 1, // Current pricing version
        zoneKey,
        inputs: JSON.stringify(inputs),
        breakdown: JSON.stringify(pricingResult.breakdown),
        subtotalExVat: pricingResult.subtotalBeforeVat, // Keep in pence
        vatRate: pricingResult.vatRate,
        totalIncVat: pricingResult.amountGbpMinor, // Keep in pence
        hash,
        estimate: false, // This is a confirmed pricing for a booking
      }
    });

    return snapshot.id;
  }


  /**
   * Get pricing snapshot for a booking
   */
  public static async getPricingSnapshot(bookingId: string) {
    return await prisma.quoteSnapshot.findFirst({
      where: { bookingId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Comprehensive Stripe integrity verification with zero-tolerance
   */
  public static async verifyPricingMatchesStripe(
    bookingId: string,
    stripeAmountPence: number,
    paymentIntentId?: string
  ): Promise<StripeIntegrityCheck> {

    const snapshot = await this.getPricingSnapshot(bookingId);

    if (!snapshot) {
      return {
        passed: false,
        snapshotAmount: 0,
        stripeAmount: stripeAmountPence,
        difference: -stripeAmountPence,
        tolerance: 0,
        errors: ['No pricing snapshot found for booking'],
        warnings: []
      };
    }

    // Convert Decimal types to numbers for comparison
    const snapshotAmountPence = Number(snapshot.totalIncVat);
    const snapshotSubtotal = Number(snapshot.subtotalExVat);
    const snapshotVatRate = Number(snapshot.vatRate);

    const difference = stripeAmountPence - snapshotAmountPence;
    const tolerance = 0; // Zero tolerance for exact matching

    const errors: string[] = [];
    const warnings: string[] = [];

    // Exact amount match required
    if (difference !== 0) {
      errors.push(`Amount mismatch: snapshot=${snapshotAmountPence}p, stripe=${stripeAmountPence}p, difference=${difference}p`);
    }

    // Verify currency is GBP
    if (snapshot.inputs) {
      const inputs = typeof snapshot.inputs === 'string' ? JSON.parse(snapshot.inputs) : snapshot.inputs;
      if (inputs.currency && inputs.currency !== 'GBP') {
        errors.push(`Currency mismatch: expected GBP, got ${inputs.currency}`);
      }
    }

    // Verify VAT calculation
    const expectedVatAmount = Math.round(snapshotSubtotal * snapshotVatRate);
    const expectedTotalIncVat = snapshotSubtotal + expectedVatAmount;

    if (expectedTotalIncVat !== snapshotAmountPence) {
      errors.push(`VAT calculation error: expected ${expectedTotalIncVat}p, got ${snapshotAmountPence}p`);
    }

    // Log detailed comparison for audit
    console.log(`[STRIPE INTEGRITY] Booking ${bookingId}:`, {
      snapshotAmount: snapshotAmountPence,
      stripeAmount: stripeAmountPence,
      difference,
      hash: snapshot.hash,
      zoneKey: snapshot.zoneKey
    });

    const passed = errors.length === 0 && difference === 0;

    if (!passed) {
      console.error(`[STRIPE INTEGRITY FAILED] Booking ${bookingId}:`, {
        errors,
        warnings,
        snapshot: {
          id: snapshot.id,
          totalIncVat: snapshotAmountPence,
          subtotalExVat: snapshotSubtotal,
          vatRate: snapshotVatRate,
          hash: snapshot.hash
        },
        stripeAmount: stripeAmountPence
      });
    }

    return {
      passed,
      snapshotAmount: snapshotAmountPence,
      stripeAmount: stripeAmountPence,
      difference,
      tolerance,
      errors,
      warnings
    };
  }

  /**
   * Create Stripe Payment Intent with integrity verification
   */
  public static async createStripePaymentIntent(
    bookingId: string,
    amountPence: number,
    currency: string = 'gbp',
    metadata: Record<string, string> = {}
  ): Promise<{ paymentIntentId: string; clientSecret: string; integrityCheck: StripeIntegrityCheck }> {

    // First verify integrity before creating payment intent
    const integrityCheck = await this.verifyPricingMatchesStripe(bookingId, amountPence);

    if (!integrityCheck.passed) {
      throw new Error(`Stripe integrity check failed: ${integrityCheck.errors.join(', ')}`);
    }

    // In production, this would integrate with actual Stripe SDK
    // For now, simulate Stripe payment intent creation
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `pi_${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 16)}`;

    return {
      paymentIntentId,
      clientSecret,
      integrityCheck
    };
  }

  /**
   * Generate unique hash for pricing calculation
   */
  private static generatePricingHash(
    pricingResult: PricingResult,
    inputs: any
  ): string {
    const hashInput = {
      amountGbpMinor: pricingResult.amountGbpMinor,
      subtotalBeforeVat: pricingResult.subtotalBeforeVat,
      vatAmount: pricingResult.vatAmount,
      breakdown: pricingResult.breakdown,
      inputs: JSON.stringify(inputs),
      timestamp: Date.now()
    };

    // Use crypto for production-grade hashing
    const crypto = require('crypto');
    return crypto.createHash('sha256')
      .update(JSON.stringify(hashInput))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Validate pricing snapshot integrity
   */
  public static async validateSnapshotIntegrity(snapshotId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const snapshot = await prisma.quoteSnapshot.findUnique({
      where: { id: snapshotId }
    });

    if (!snapshot) {
      errors.push('Snapshot not found');
      return { valid: false, errors, warnings };
    }

    // Convert Decimal types to numbers for validation
    const totalIncVat = Number(snapshot.totalIncVat);
    const subtotalExVat = Number(snapshot.subtotalExVat);
    const vatRate = Number(snapshot.vatRate);

    // Validate required fields
    if (!totalIncVat || totalIncVat <= 0) {
      errors.push('Invalid total amount in snapshot');
    }

    if (!subtotalExVat || subtotalExVat < 0) {
      errors.push('Invalid subtotal in snapshot');
    }

    if (vatRate <= 0 || vatRate > 1) {
      errors.push('Invalid VAT rate in snapshot');
    }

    // Validate VAT calculation
    const expectedVatAmount = Math.round(subtotalExVat * vatRate);
    const expectedTotalIncVat = subtotalExVat + expectedVatAmount;

    if (expectedTotalIncVat !== totalIncVat) {
      errors.push(`VAT calculation mismatch: expected ${expectedTotalIncVat}p, got ${totalIncVat}p`);
    }

    // Validate hash integrity
    if (snapshot.inputs && snapshot.breakdown) {
      const inputs = typeof snapshot.inputs === 'string' ? JSON.parse(snapshot.inputs) : snapshot.inputs;
      const breakdown = typeof snapshot.breakdown === 'string' ? JSON.parse(snapshot.breakdown) : snapshot.breakdown;

      const recalculatedHash = this.generatePricingHash(
        {
          amountGbpMinor: totalIncVat,
          subtotalBeforeVat: subtotalExVat,
          vatAmount: expectedVatAmount,
          vatRate: vatRate,
          breakdown: breakdown as any,
          route: inputs.route || { totalDistance: 0, totalDuration: 0, legs: [] as any[] },
          recommendedVehicle: inputs.recommendedVehicle || { type: 'van', name: 'Van', capacity: 10, totalWeight: 100, totalVolume: 5 },
          multiDrop: inputs.multiDrop || undefined,
          surcharges: [],
          discounts: []
        },
        inputs
      );

      if (recalculatedHash !== snapshot.hash) {
        errors.push('Hash integrity check failed');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Export singleton instance
export const pricingSnapshotService = PricingSnapshotService;
