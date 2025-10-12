import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { DynamicAvailabilityEngine, type FullStructuredAddress, type BookingCapacity } from '@/lib/availability/dynamic-availability-engine';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { assertFullStructuredAddresses, sanitizeAddressForLog } from '@/lib/validation/address-validation';
import { createMetricsMiddleware } from '@/lib/observability/availability-metrics';



/**
 * Booking capacity schema
 */
const BookingCapacitySchema = z.object({
  totalWeightKg: z.number().min(0),
  totalVolumeM3: z.number().min(0),
  estimatedDurationMinutes: z.number().min(0),
  crewRequired: z.number().min(1).max(4)
});

/**
 * GET /api/availability/next
 * 
 * Query parameters (URL encoded JSON):
 * - pickup: FullStructuredAddress
 * - drops: FullStructuredAddress[]
 * - capacity: BookingCapacity
 * 
 * STRICT REQUIREMENT: All addresses must be full structured addresses
 * from autocomplete - NO postcode-only shortcuts allowed
 */
export async function GET(request: NextRequest) {
  const requestId = uuidv4();
  const startTime = Date.now();
  const recordMetrics = createMetricsMiddleware();
  
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse and validate pickup address
    const pickupParam = searchParams.get('pickup');
    if (!pickupParam) {
      return NextResponse.json(
        { 
          error: 'Missing pickup address', 
          code: 'MISSING_PICKUP',
          requestId 
        },
        { status: 400 }
      );
    }

    let pickup: FullStructuredAddress;
    try {
      const pickupData = JSON.parse(pickupParam);
      [pickup] = assertFullStructuredAddresses([pickupData], 'pickup');
    } catch (error) {
      logger.error('Invalid pickup address structure', error instanceof Error ? error : new Error('Parse error'), { requestId });
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Pickup address must include street, number, city, postcode, and coordinates', 
          code: 'INVALID_PICKUP_STRUCTURE',
          requestId 
        },
        { status: 400 }
      );
    }

    // Parse and validate drop addresses
    const dropsParam = searchParams.get('drops');
    if (!dropsParam) {
      return NextResponse.json(
        { 
          error: 'Missing drop addresses', 
          code: 'MISSING_DROPS',
          requestId 
        },
        { status: 400 }
      );
    }

    let drops: FullStructuredAddress[];
    try {
      const dropsData = JSON.parse(dropsParam);
      if (!Array.isArray(dropsData) || dropsData.length === 0) {
        throw new Error('Drops must be a non-empty array');
      }
      drops = assertFullStructuredAddresses(dropsData, 'drops');
    } catch (error) {
      logger.error('Invalid drops address structure', error instanceof Error ? error : new Error('Parse error'), { requestId });
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'All drop addresses must include street, number, city, postcode, and coordinates', 
          code: 'INVALID_DROPS_STRUCTURE',
          requestId 
        },
        { status: 400 }
      );
    }

    // Parse and validate capacity
    const capacityParam = searchParams.get('capacity');
    if (!capacityParam) {
      return NextResponse.json(
        { 
          error: 'Missing capacity information', 
          code: 'MISSING_CAPACITY',
          requestId 
        },
        { status: 400 }
      );
    }

    let capacity: BookingCapacity;
    try {
      capacity = BookingCapacitySchema.parse(JSON.parse(capacityParam));
    } catch (error) {
      logger.error('Invalid capacity structure', error instanceof Error ? error : new Error('Parse error'), { requestId });
      return NextResponse.json(
        { 
          error: 'Capacity must include totalWeightKg, totalVolumeM3, estimatedDurationMinutes, and crewRequired', 
          code: 'INVALID_CAPACITY_STRUCTURE',
          requestId 
        },
        { status: 400 }
      );
    }

    logger.info('Availability request received', {
      pickup: sanitizeAddressForLog(pickup),
      dropsCount: drops.length,
      capacity
    }, { requestId });

    // Initialize availability engine
    const availabilityEngine = new DynamicAvailabilityEngine(prisma);
    
    // Calculate availability
    const result = await availabilityEngine.calculateAvailability(
      pickup,
      drops,
      capacity,
      requestId
    );

    // Store pricing snapshot for analytics
    await prisma.pricingSnapshot.create({
      data: {
        requestId,
        pickupAddress: JSON.parse(JSON.stringify(pickup)),
        dropAddresses: JSON.parse(JSON.stringify(drops)),
        capacity: JSON.parse(JSON.stringify(capacity)),
        economyAvailable: result.route_type === 'economy',
        economyDate: result.route_type === 'economy' ? new Date(result.next_available_date) : null,
        standardPrice: 0, // Will be filled by pricing API
        expressPrice: 0,  // Will be filled by pricing API
        corridor: result.route_id ? `${pickup.city}_${drops[0]?.city}` : undefined
      }
    });

    const response = {
      ...result,
      requestId,
      processingTimeMs: Date.now() - startTime
    };

    logger.info('Availability request completed', {
      result: response,
      processingTimeMs: Date.now() - startTime
    }, { requestId });

    // Record API metrics
    recordMetrics(
      '/api/availability/next',
      'GET',
      requestId,
      startTime,
      200,
      1 + drops.length, // pickup + drops
      capacity.totalWeightKg + capacity.totalVolumeM3 // rough items proxy
    );

    return NextResponse.json(response);

  } catch (error) {
    logger.error('Availability API error', error instanceof Error ? error : new Error('Unknown error'), { requestId });
    
    // Record error metrics
    recordMetrics(
      '/api/availability/next',
      'GET',
      requestId,
      startTime,
      500,
      0,
      0,
      error instanceof Error ? error : new Error('Unknown error')
    );
    
    return NextResponse.json(
      { 
        error: 'Internal server error calculating availability', 
        code: 'AVAILABILITY_CALCULATION_ERROR',
        requestId 
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}