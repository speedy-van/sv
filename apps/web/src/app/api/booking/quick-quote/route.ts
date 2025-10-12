/**
 * Quick Quote API
 * 
 * Provides instant quotes to reduce booking friction
 * No authentication required for maximum conversion
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface QuickQuoteRequest {
  pickupPostcode: string;
  deliveryPostcode: string;
  serviceType: string;
  urgency: string;
}

/**
 * POST /api/booking/quick-quote
 * Get instant quote without authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body: QuickQuoteRequest = await request.json();

    // Validate input
    if (!body.pickupPostcode || !body.deliveryPostcode) {
      return NextResponse.json(
        { error: 'Pickup and delivery postcodes are required' },
        { status: 400 }
      );
    }

    // Calculate distance (simplified - use Google Maps API in production)
    const estimatedDistance = await estimateDistance(
      body.pickupPostcode,
      body.deliveryPostcode
    );

    // Calculate price based on service type and urgency
    const basePrice = calculateBasePrice(estimatedDistance, body.serviceType);
    const urgencyMultiplier = getUrgencyMultiplier(body.urgency);
    const totalPrice = Math.round(basePrice * urgencyMultiplier);

    // Generate quote ID
    const quoteId = generateQuoteId();

    // Estimated time
    const estimatedTime = calculateEstimatedTime(estimatedDistance, body.urgency);

    const quote = {
      quoteId,
      pickupPostcode: body.pickupPostcode,
      deliveryPostcode: body.deliveryPostcode,
      serviceType: body.serviceType,
      urgency: body.urgency,
      estimatedDistance,
      estimatedTime,
      pricing: {
        basePrice,
        urgencyMultiplier,
        totalPrice,
        currency: 'GBP',
        formattedPrice: `£${(totalPrice / 100).toFixed(2)}`,
      },
      validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      createdAt: new Date().toISOString(),
    };

    // Log for analytics
    logger.info('Quick quote generated', {
      quoteId,
      pickupPostcode: body.pickupPostcode,
      deliveryPostcode: body.deliveryPostcode,
      totalPrice,
    });

    return NextResponse.json(quote);

  } catch (error) {
    logger.error('Failed to generate quick quote', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to generate quote',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Estimate distance between postcodes
 * TODO: Replace with Google Maps Distance Matrix API
 */
async function estimateDistance(
  pickupPostcode: string,
  deliveryPostcode: string
): Promise<number> {
  // Simplified estimation - in production, use Google Maps API
  // For now, return a random distance between 5-50 miles
  return Math.floor(Math.random() * 45) + 5;
}

/**
 * Calculate base price based on distance and service type
 */
function calculateBasePrice(distance: number, serviceType: string): number {
  let baseRate = 250; // £2.50 per mile

  // Service type adjustments
  switch (serviceType) {
    case 'parcel':
      baseRate = 200; // £2.00 per mile
      break;
    case 'furniture':
      baseRate = 300; // £3.00 per mile
      break;
    case 'multi-drop':
      baseRate = 280; // £2.80 per mile
      break;
    default:
      baseRate = 250;
  }

  // Base fare + distance
  const baseFare = 2500; // £25 minimum
  const distanceFee = Math.round(distance * baseRate);

  return baseFare + distanceFee;
}

/**
 * Get urgency multiplier
 */
function getUrgencyMultiplier(urgency: string): number {
  switch (urgency) {
    case 'express':
      return 1.5; // +50%
    case 'same-day':
      return 1.2; // +20%
    case 'next-day':
      return 1.0; // Standard
    case 'scheduled':
      return 0.9; // -10% discount
    default:
      return 1.0;
  }
}

/**
 * Calculate estimated delivery time
 */
function calculateEstimatedTime(distance: number, urgency: string): string {
  switch (urgency) {
    case 'express':
      return '1-2 hours';
    case 'same-day':
      return '2-4 hours';
    case 'next-day':
      return 'Next day';
    case 'scheduled':
      return 'As scheduled';
    default:
      return '2-4 hours';
  }
}

/**
 * Generate unique quote ID
 */
function generateQuoteId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `QT-${timestamp}-${random}`.toUpperCase();
}

