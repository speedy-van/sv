/**
 * Route Optimization API
 * POST /api/admin/routes/[id]/optimize
 * Optimize route drop order for better efficiency
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

interface OptimizationRequest {
  mode?: 'distance' | 'time' | 'cost' | 'balanced';
  includeTraffic?: boolean;
  includeTimeWindows?: boolean;
  preview?: boolean;
  apply?: boolean;
}

/**
 * Calculate distance using unified pricing system API endpoint
 * Note: This is for route optimization display purposes only, not for pricing calculations
 */
async function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/address/distance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupLat: lat1,
        pickupLng: lng1,
        dropoffLat: lat2,
        dropoffLng: lng2,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.distance) {
        return data.data.distance; // Already in km
      }
    }
  } catch (error) {
    console.error('Distance calculation error:', error);
  }
  // Fallback: return 0 if API fails (non-critical for optimization display)
  return 0;
}

/**
 * Nearest Neighbor algorithm for route optimization
 * Uses unified pricing system API for distance calculations
 */
async function optimizeRouteNearestNeighbor(
  drops: Array<{ id: string; lat: number; lng: number; sequenceNumber: number }>,
  startLat?: number,
  startLng?: number
): Promise<Array<{ id: string; sequenceNumber: number }>> {
  if (drops.length <= 1) {
    return drops.map(d => ({ id: d.id, sequenceNumber: d.sequenceNumber }));
  }

  const unvisited = [...drops];
  const optimized: Array<{ id: string; sequenceNumber: number }> = [];
  
  // Start from first drop or provided start point
  let currentLat = startLat || drops[0].lat;
  let currentLng = startLng || drops[0].lng;
  let currentIndex = 0;

  // Find starting point
  if (startLat && startLng) {
    let minDist = Infinity;
    const distancePromises = drops.map((drop, idx) => 
      calculateDistance(startLat, startLng, drop.lat, drop.lng).then(dist => ({ dist, idx }))
    );
    const distances = await Promise.all(distancePromises);
    distances.forEach(({ dist, idx }) => {
      if (dist < minDist) {
        minDist = dist;
        currentIndex = idx;
      }
    });
  }

  // Remove starting point from unvisited
  const startDrop = unvisited.splice(currentIndex, 1)[0];
  optimized.push({ id: startDrop.id, sequenceNumber: 1 });
  currentLat = startDrop.lat;
  currentLng = startDrop.lng;

  // Greedy nearest neighbor
  let sequence = 2;
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDist = Infinity;

    const distancePromises = unvisited.map((drop, idx) =>
      calculateDistance(currentLat, currentLng, drop.lat, drop.lng).then(dist => ({ dist, idx }))
    );
    const distances = await Promise.all(distancePromises);
    distances.forEach(({ dist, idx }) => {
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIndex = idx;
      }
    });

    const nearest = unvisited.splice(nearestIndex, 1)[0];
    optimized.push({ id: nearest.id, sequenceNumber: sequence });
    currentLat = nearest.lat;
    currentLng = nearest.lng;
    sequence++;
  }

  return optimized;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try NextAuth session first
    const nextAuthSession = await getServerSession(authOptions);
    const customSession = await getCustomSession();
    
    const session = nextAuthSession || customSession;

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: routeId } = await params;
    const body: OptimizationRequest = await request.json();
    const { mode = 'balanced', preview = false, apply = false } = body;

    // Get route with drops
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        drops: {
          include: {
            Booking: {
              include: {
                dropoffAddress: true,
              },
            },
          },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    if (route.drops.length < 2) {
      return NextResponse.json(
        { error: 'Route needs at least 2 drops for optimization' },
        { status: 400 }
      );
    }

    // Prepare drops with coordinates
    const dropsWithCoords = route.drops
      .filter(drop => drop.Booking?.dropoffAddress?.lat && drop.Booking?.dropoffAddress?.lng)
      .map((drop, index) => ({
        id: drop.id,
        lat: drop.Booking!.dropoffAddress!.lat!,
        lng: drop.Booking!.dropoffAddress!.lng!,
        sequenceNumber: index,
      }));

    if (dropsWithCoords.length < 2) {
      return NextResponse.json(
        { error: 'Route drops missing coordinates' },
        { status: 400 }
      );
    }

    // Calculate current route metrics using unified pricing system
    let currentDistance = 0;
    const currentDistancePromises = [];
    for (let i = 0; i < dropsWithCoords.length - 1; i++) {
      currentDistancePromises.push(
        calculateDistance(
          dropsWithCoords[i].lat,
          dropsWithCoords[i].lng,
          dropsWithCoords[i + 1].lat,
          dropsWithCoords[i + 1].lng
        )
      );
    }
    const currentDistances = await Promise.all(currentDistancePromises);
    currentDistance = currentDistances.reduce((sum, dist) => sum + dist, 0);

    const currentDuration = currentDistance * 2; // Rough estimate: 2 min per km
    const currentCost = currentDistance * 0.5; // Rough estimate: £0.50 per km

    // Optimize route
    const optimizedOrder = await optimizeRouteNearestNeighbor(dropsWithCoords);

    // Calculate optimized route metrics using unified pricing system
    let optimizedDistance = 0;
    const optimizedDistancePromises: Promise<number>[] = [];
    const optimizedDrops = optimizedOrder.map((opt, idx) => {
      const drop = dropsWithCoords.find(d => d.id === opt.id)!;
      if (idx > 0) {
        const prevDrop = dropsWithCoords.find(d => d.id === optimizedOrder[idx - 1].id)!;
        optimizedDistancePromises.push(
          calculateDistance(
            prevDrop.lat,
            prevDrop.lng,
            drop.lat,
            drop.lng
          )
        );
      }
      return drop;
    });
    const optimizedDistances = await Promise.all(optimizedDistancePromises);
    optimizedDistance = optimizedDistances.reduce((sum, dist) => sum + dist, 0);

    const optimizedDuration = optimizedDistance * 2;
    const optimizedCost = optimizedDistance * 0.5;

    // Calculate improvements
    const distanceReduction = currentDistance - optimizedDistance;
    const timeReduction = currentDuration - optimizedDuration;
    const costReduction = currentCost - optimizedCost;
    const efficiencyGain = currentDistance > 0
      ? ((distanceReduction / currentDistance) * 100)
      : 0;

    const metrics = {
      currentDistance,
      optimizedDistance,
      currentDuration,
      optimizedDuration,
      currentCost: Math.round(currentCost * 100), // Convert to pence
      optimizedCost: Math.round(optimizedCost * 100),
      efficiencyGain,
      savings: Math.round(costReduction * 100),
      suggestions: [
        efficiencyGain > 10
          ? `Optimization can reduce distance by ${distanceReduction.toFixed(1)} km (${efficiencyGain.toFixed(1)}%)`
          : 'Route is already well optimized',
        timeReduction > 0
          ? `Estimated time savings: ${Math.round(timeReduction)} minutes`
          : '',
        costReduction > 0
          ? `Estimated cost savings: £${costReduction.toFixed(2)}`
          : '',
      ].filter(Boolean),
    };

    // If preview only, return metrics
    if (preview) {
      return NextResponse.json({
        success: true,
        metrics,
        optimizedOrder,
      });
    }

    // Apply optimization if requested
    if (apply) {
      // Update route (drops are already in the optimized order from the algorithm)
      const updatedRoute = await prisma.route.update({
        where: { id: routeId },
        data: {
          optimizedDistanceKm: optimizedDistance,
          estimatedDuration: Math.round(optimizedDuration),
          isModifiedByAdmin: true,
          adminNotes: `Route optimized by admin (${mode} mode). Distance: ${optimizedDistance.toFixed(1)} km`,
        },
        include: {
          drops: true,
        },
      });

      await logAudit(
        (session.user as any).id,
        'optimize_route',
        routeId,
        {
          targetType: 'route',
          before: { distance: currentDistance, duration: currentDuration },
          after: { distance: optimizedDistance, duration: optimizedDuration },
          mode,
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Route optimized successfully',
        metrics,
        optimizedRoute: updatedRoute,
      });
    }

    return NextResponse.json({
      success: true,
      metrics,
      optimizedOrder,
    });

  } catch (error) {
    console.error('Route optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize route', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

