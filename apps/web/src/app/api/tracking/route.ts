/**
 * Driver Tracking API
 * POST /api/tracking - Update driver location and status
 * GET /api/tracking - Get active drivers
 */

import { NextRequest, NextResponse } from 'next/server';
import { DriverTrackingService } from '@/lib/services/driver-tracking-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { driverId, location, status } = body;
    
    if (!driverId || !location || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: driverId, location, status' },
        { status: 400 }
      );
    }

    // Validate location data
    if (!location.latitude || !location.longitude) {
      return NextResponse.json(
        { error: 'Location must include latitude and longitude' },
        { status: 400 }
      );
    }

    const trackingUpdate = {
      location: {
        driverId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date(location.timestamp || Date.now()),
        speed: location.speed,
        heading: location.heading
      },
      status: {
        driverId,
        status: status.status || 'available',
        currentRouteId: status.currentRouteId,
        lastUpdate: new Date()
      },
      routeProgress: body.routeProgress
    };

    await DriverTrackingService.updateDriverTracking(trackingUpdate);

    return NextResponse.json({
      success: true,
      message: 'Tracking updated successfully'
    });

  } catch (error) {
    console.error('Driver tracking update error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const activeDrivers = await DriverTrackingService.getActiveDrivers();

    return NextResponse.json({
      success: true,
      data: activeDrivers
    });

  } catch (error) {
    console.error('Get active drivers error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}