import { NextRequest, NextResponse } from 'next/server';
import { multiDropEligibilityEngine } from '@/lib/services/multi-drop-eligibility-engine';
import type { BookingRequest } from '@/lib/services/intelligent-route-optimizer';

/**
 * POST /api/booking/check-multi-drop-eligibility
 * 
 * Check if a booking is eligible for multi-drop route
 * This is called in Booking Luxury Step 2 to dynamically show/hide the multi-drop option
 * 
 * Request Body:
 * {
 *   pickup: { address, postcode, coordinates, city },
 *   dropoff: { address, postcode, coordinates, city },
 *   items: [{ category, name, quantity, weight?, volume? }],
 *   scheduledDate: ISO date string,
 *   timeWindow?: { earliest, latest },
 *   floorLevel?: number,
 *   hasLift?: boolean,
 *   serviceType: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE'
 * }
 * 
 * Response:
 * {
 *   showMultiDropOption: boolean,
 *   reason: string,
 *   eligibility: { ... },
 *   bestMatch?: { ... },
 *   pricing: { ... },
 *   recommendation: { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.pickup || !body.dropoff || !body.items || !body.scheduledDate || !body.serviceType) {
      return NextResponse.json(
        { error: 'Missing required fields: pickup, dropoff, items, scheduledDate, serviceType' },
        { status: 400 }
      );
    }
    
    // Convert scheduledDate string to Date object
    const bookingRequest: BookingRequest = {
      ...body,
      scheduledDate: new Date(body.scheduledDate),
    };
    
    // Check multi-drop eligibility
    const decision = await multiDropEligibilityEngine.shouldShowMultiDropOption(bookingRequest);
    
    // Log decision for analytics
    console.log('📊 Multi-drop eligibility check:', {
      pickup: bookingRequest.pickup.city,
      dropoff: bookingRequest.dropoff.city,
      showMultiDropOption: decision.showMultiDropOption,
      reason: decision.reason,
      confidence: decision.eligibility.confidence,
    });
    
    return NextResponse.json(decision);
  } catch (error) {
    console.error('❌ Error checking multi-drop eligibility:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to check multi-drop eligibility',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/booking/check-multi-drop-eligibility
 * 
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'multi-drop-eligibility-checker',
    version: '1.0.0',
  });
}

