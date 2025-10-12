/**
 * Quote API Routes
 * POST /api/quotes - Create new quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { QuoteService } from '@/lib/services/quote-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { customerId, pickupAddress, deliveryAddress, pickupPostcode, deliveryPostcode } = body;
    
    if (!customerId || !pickupAddress || !deliveryAddress || !pickupPostcode || !deliveryPostcode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create quote request
    const quoteRequest = {
      customerId,
      pickupAddress,
      deliveryAddress,
      pickupPostcode,
      deliveryPostcode,
      weight: body.weight,
      volume: body.volume,
      fragility: body.fragility,
      specialHandling: body.specialHandling,
      requestedPickupTime: body.requestedPickupTime ? new Date(body.requestedPickupTime) : undefined
    };

    const quote = await QuoteService.createQuote(quoteRequest);

    return NextResponse.json({
      success: true,
      data: quote
    });

  } catch (error) {
    console.error('Quote creation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}