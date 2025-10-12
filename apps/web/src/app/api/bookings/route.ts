/**
 * Booking API Routes
 * POST /api/bookings - Create new booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/services/booking-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { quoteId, serviceTier } = body;
    
    if (!quoteId || !serviceTier) {
      return NextResponse.json(
        { error: 'Missing required fields: quoteId and serviceTier' },
        { status: 400 }
      );
    }

    if (!['economy', 'standard', 'premium'].includes(serviceTier)) {
      return NextResponse.json(
        { error: 'Invalid service tier. Must be economy, standard, or premium' },
        { status: 400 }
      );
    }

    // Create booking request
    const bookingRequest = {
      quoteId,
      serviceTier,
      requestedPickupTime: body.requestedPickupTime ? new Date(body.requestedPickupTime) : undefined,
      specialInstructions: body.specialInstructions
    };

    const booking = await BookingService.createBooking(bookingRequest);

    return NextResponse.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}