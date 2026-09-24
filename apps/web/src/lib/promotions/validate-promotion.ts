/**
 * Server-side promotion validation.
 *
 * Both the display endpoint (/api/promotions/validate) and
 * resolveQuoteForCheckout must use this module.  The checkout result is
 * authoritative — never trust a client-supplied discount amount.
 *
 * Bug fixes vs. the original route:
 * 1. Usage count now filters by promotionCode on the booking, not ALL bookings.
 * 2. First-time check matches Booking.customerEmail (case-insensitive) OR
 *    customer.email so guests are covered.
 * 3. Discount is computed from the server-supplied amountPence, never from a
 *    client amount.
 *
 * Paid/confirmed statuses counted toward usage:
 *   CONFIRMED, COMPLETED
 * (DRAFT and PENDING_PAYMENT are not counted; CANCELLED is excluded.)
 */
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Statuses that count as a "used" booking for limit and first-time checks
const COUNTED_STATUSES = ['CONFIRMED', 'COMPLETED'] as const;

export interface ValidatePromotionInput {
  code: string;
  amountPence: number;
  customerEmail?: string;
  pickupPostcode?: string;
  serviceType?: string;
}

export interface ValidatePromotionResult {
  valid: true;
  discountPence: number;
  promotionId: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface ValidatePromotionFailure {
  valid: false;
  error: string;
}

export type ValidatePromotionOutput = ValidatePromotionResult | ValidatePromotionFailure;

export async function validatePromotion(
  input: ValidatePromotionInput
): Promise<ValidatePromotionOutput> {
  const { code, amountPence, customerEmail, pickupPostcode, serviceType } = input;

  try {
    const promotion = await prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promotion) {
      return { valid: false, error: 'Invalid promotion code.' };
    }

    if (promotion.status !== 'active') {
      return { valid: false, error: 'Promotion code is no longer active.' };
    }

    const now = new Date();
    if (now < promotion.validFrom || now > promotion.validTo) {
      return { valid: false, error: 'Promotion code has expired.' };
    }

    const minSpendPence = Math.round(Number(promotion.minSpend) * 100);
    if (minSpendPence > 0 && amountPence < minSpendPence) {
      const minPounds = (minSpendPence / 100).toFixed(2);
      return { valid: false, error: `Minimum spend of £${minPounds} required.` };
    }

    // Usage limit: count bookings that used THIS code and are paid/confirmed
    if (promotion.usageLimit && Number(promotion.usageLimit) > 0) {
      const usageCount = await prisma.booking.count({
        where: {
          promotionCode: code.toUpperCase(),
          status: { in: COUNTED_STATUSES as unknown as any[] },
        },
      });

      if (usageCount >= Number(promotion.usageLimit)) {
        return { valid: false, error: 'Promotion code has reached its usage limit.' };
      }
    }

    // First-time-only: check both guest email (customerEmail) and account (customer.email)
    if (promotion.firstTimeOnly) {
      const emailLower = customerEmail?.toLowerCase();
      if (emailLower) {
        const hasPrior = await prisma.booking.findFirst({
          where: {
            OR: [
              { customerEmail: { equals: emailLower, mode: 'insensitive' } },
              { customer: { email: { equals: emailLower, mode: 'insensitive' } } },
            ],
            status: { in: COUNTED_STATUSES as unknown as any[] },
          },
        });
        if (hasPrior) {
          return { valid: false, error: 'This promotion is only valid for first-time customers.' };
        }
      }
    }

    // Applicable areas
    if (
      promotion.applicableAreas &&
      (promotion.applicableAreas as string[]).length > 0 &&
      pickupPostcode
    ) {
      const area = pickupPostcode.split(' ')[0].toUpperCase();
      const ok = (promotion.applicableAreas as string[]).some((a) => area.startsWith(a));
      if (!ok) {
        return { valid: false, error: 'Promotion code is not valid for your pickup area.' };
      }
    }

    // Applicable service types
    if (
      promotion.applicableVans &&
      (promotion.applicableVans as string[]).length > 0 &&
      serviceType
    ) {
      if (!(promotion.applicableVans as string[]).includes(serviceType)) {
        return { valid: false, error: 'Promotion code is not valid for this service type.' };
      }
    }

    // Compute discount from the server amount — never trust a client value
    const promotionValue = Number(promotion.value);
    let discountPence = 0;
    if (promotion.type === 'percentage') {
      discountPence = Math.round((amountPence * promotionValue) / 100);
    } else if (promotion.type === 'fixed') {
      discountPence = Math.round(promotionValue * 100);
    }

    const maxDiscountPence = Number(promotion.maxDiscount) > 0
      ? Math.round(Number(promotion.maxDiscount) * 100)
      : Infinity;
    discountPence = Math.min(discountPence, maxDiscountPence, amountPence);

    return {
      valid: true,
      discountPence,
      promotionId: promotion.id,
      code: promotion.code,
      name: promotion.name,
      description: promotion.description ?? null,
    };
  } catch (err) {
    logger.error('[validate-promotion] error', err);
    return { valid: false, error: 'Could not validate promotion. Please try again.' };
  }
}
