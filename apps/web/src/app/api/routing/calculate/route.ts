import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pickup, dropoff } = await request.json();

    if (!pickup || !dropoff) {
      return NextResponse.json(
        { error: 'Pickup and dropoff coordinates are required' },
        { status: 400 }
      );
    }

    // This would integrate with Mapbox Directions API or similar
    // For demo purposes, we'll calculate a simple distance and estimated time

    const distance = calculateDistance(pickup, dropoff); // DEPRECATED - internal use only
    const duration = calculateDuration(distance);

    // Generate mock route coordinates (straight line for demo)
    const routeCoordinates = generateRouteCoordinates(pickup, dropoff);

    return NextResponse.json({
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
      duration: Math.round(duration),
      coordinates: routeCoordinates,
    });
  } catch (error) {
    console.error('Error calculating route:', error);
    return NextResponse.json(
      { error: 'Failed to calculate route' },
      { status: 500 }
    );
  }
}

// Calculate distance between two points using Haversine formula
function calculateDistance( // DEPRECATED - internal use only
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(dropoff.lat - pickup.lat);
  const dLng = toRadians(dropoff.lng - pickup.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(pickup.lat)) *
      Math.cos(toRadians(dropoff.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Calculate estimated duration based on distance
function calculateDuration(distance: number): number {
  // Assume average speed of 30 mph in urban areas
  const averageSpeed = 30;
  const baseTime = 0.5; // 30 minutes base time for loading/unloading

  return (distance / averageSpeed) * 60 + baseTime * 60; // Convert to minutes
}

// Generate mock route coordinates
function generateRouteCoordinates(
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number }
): [number, number][] {
  // Create a simple straight line with a few intermediate points
  const steps = 5;
  const coordinates: [number, number][] = [];

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = pickup.lat + (dropoff.lat - pickup.lat) * ratio;
    const lng = pickup.lng + (dropoff.lng - pickup.lng) * ratio;
    coordinates.push([lng, lat]); // Mapbox expects [lng, lat] order
  }

  return coordinates;
}
