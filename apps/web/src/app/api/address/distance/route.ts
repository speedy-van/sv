/**
 * Dual Provider Distance Calculation API Route
 * Handles Google Distance Matrix + Mapbox Directions fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dualProviderService } from '@/lib/dual-provider-service';

export const dynamic = 'force-dynamic';

const distanceSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  preferredProvider: z.enum(['google', 'mapbox']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = distanceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'invalid',
            message: 'Invalid coordinates',
            provider: 'google',
            details: validation.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { pickupLat, pickupLng, dropoffLat, dropoffLng, preferredProvider } = validation.data;

    const pickup: { lat: number; lng: number } = { lat: pickupLat, lng: pickupLng };
    const dropoff: { lat: number; lng: number } = { lat: dropoffLat, lng: dropoffLng };

    // Calculate distance using dual provider service
    const result = await dualProviderService.calculateDistance(pickup, dropoff, preferredProvider);

    if (result) {
      return NextResponse.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            type: 'network',
            message: 'Distance calculation failed',
            provider: preferredProvider || 'google',
            timestamp: Date.now(),
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Distance calculation API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'network',
          message: 'Internal server error',
          provider: 'google',
          originalError: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        },
      },
      { status: 500 }
    );
  }
}
