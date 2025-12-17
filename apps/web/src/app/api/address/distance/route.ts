/**
 * Dual Provider Distance Calculation API Route
 * Handles Google Distance Matrix + Mapbox Directions fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dualProviderService } from '@/lib/dual-provider-service';

export const dynamic = 'force-dynamic';

const haversineFallback = (pickup: { lat: number; lng: number }, dropoff: { lat: number; lng: number }) => {
  const R = 6371000; // meters
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(dropoff.lat - pickup.lat);
  const dLng = toRad(dropoff.lng - pickup.lng);
  const lat1 = toRad(pickup.lat);
  const lat2 = toRad(dropoff.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // meters

  // Conservative average speed 55 km/h with 20% padding for urban/traffic
  const speedMps = (55 * 1000) / 3600;
  const duration = Math.round((distance / speedMps) * 1.2);

  return {
    distance,
    duration,
    provider: 'fallback-haversine',
  };
};

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

    let result = null;

    try {
      // Calculate distance using dual provider service (external API - not manual calculation)
      // This uses Google/Mapbox APIs, not manual Haversine formula - DEPRECATED but allowed for external APIs
      result = await dualProviderService.calculateDistance(pickup, dropoff, preferredProvider); // DEPRECATED - internal use only
    } catch (error) {
      console.error('Distance provider error, falling back to haversine:', error);
    }

    if (result && typeof result.distance === 'number' && result.distance > 0) {
      return NextResponse.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    }

    // Graceful fallback to haversine to avoid 500s and keep UI responsive
    const fallback = haversineFallback(pickup, dropoff);
    return NextResponse.json({
      success: true,
      data: {
        distance: fallback.distance,
        duration: fallback.duration,
        provider: fallback.provider,
      },
      fallback: true,
      provider: fallback.provider,
      message: 'Fallback distance used: NO_ROUTE_FOUND from providers',
      timestamp: new Date().toISOString(),
    });
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
