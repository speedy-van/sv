/**
 * Payout API Routes
 * POST /api/payouts - Process route payout
 */

import { NextRequest, NextResponse } from 'next/server';
import { PayoutProcessingService } from '@/lib/services/payout-processing-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { routeId } = body;
    
    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    // Build payout request
    const payoutRequest = {
      routeId,
      helperHours: body.helperHours,
      helperSkillLevel: body.helperSkillLevel,
      fuelEfficiencyData: body.fuelEfficiencyData,
      penalties: body.penalties || []
    };

    const result = await PayoutProcessingService.processRoutePayout(payoutRequest);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Payout processing error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}