import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json(
        { error: 'From and to coordinates are required' },
        { status: 400 }
      );
    }

    const [fromLat, fromLng] = from.split(',').map(Number);
    const [toLat, toLng] = to.split(',').map(Number);

    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates format' },
        { status: 400 }
      );
    }

    // Get Mapbox API key for traffic data (server-side token)
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
      return NextResponse.json(
        { error: 'Mapbox token not configured' },
        { status: 500 }
      );
    }

    // Get current traffic conditions using Mapbox Directions API
    const directionsResponse = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${fromLng},${fromLat};${toLng},${toLat}?access_token=${mapboxToken}&overview=full&annotations=duration,distance,speed&geometries=geojson`
    );

    if (!directionsResponse.ok) {
      throw new Error(`Mapbox API error: ${directionsResponse.status}`);
    }

    const directionsData = await directionsResponse.json();

    // Get alternative routes
    const alternativeRoutesResponse = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${fromLng},${fromLat};${toLng},${toLat}?access_token=${mapboxToken}&overview=full&annotations=duration,distance,speed&geometries=geojson&alternatives=true&continue_straight=true`
    );

    if (!alternativeRoutesResponse.ok) {
      throw new Error(
        `Mapbox alternatives API error: ${alternativeRoutesResponse.status}`
      );
    }

    const alternativesData = await alternativeRoutesResponse.json();

    // Process main route
    const mainRoute = directionsData.routes[0];
    const mainRouteData = {
      distance: Math.round(mainRoute.distance / 1609.34), // Convert meters to miles
      time: Math.round(mainRoute.duration / 60), // Convert seconds to minutes
      trafficLevel: determineTrafficLevel(mainRoute),
      congestionLevel: determineCongestionLevel(mainRoute),
    };

    // Process alternative routes
    const alternativeRoutes = alternativesData.routes
      .slice(1)
      .map((route: any, index: number) => {
        const distance = Math.round(route.distance / 1609.34);
        const time = Math.round(route.duration / 60);
        const fuelCost = calculateFuelCost(distance);
        const savings = Math.max(0, mainRouteData.time - time) * 0.5; // £0.50 per minute saved

        return {
          route: `Alternative ${index + 1}`,
          distance,
          time,
          fuelCost,
          savings,
          trafficLevel: determineTrafficLevel(route),
          ulezImpact: checkULEZImpact(route),
        };
      });

    // Check for road closures and incidents
    const roadClosures = await checkRoadClosures(
      fromLat,
      fromLng,
      toLat,
      toLng
    );

    // Calculate estimated delay based on traffic conditions
    const estimatedDelay = calculateEstimatedDelay(
      mainRouteData,
      alternativeRoutes
    );

    // Generate traffic recommendations
    const recommendations = generateTrafficRecommendations({
      congestionLevel: mainRouteData.congestionLevel,
      estimatedDelay,
      roadClosures,
      alternativeRoutes,
    });

    const response = {
      mainRoute: mainRouteData,
      alternativeRoutes,
      roadClosures,
      estimatedDelay,
      congestionLevel: mainRouteData.congestionLevel,
      recommendations,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Traffic route API error:', error);

    // Return mock data as fallback
    return NextResponse.json({
      mainRoute: {
        distance: 15,
        time: 45,
        trafficLevel: 'medium',
        congestionLevel: 'medium',
      },
      alternativeRoutes: [
        {
          route: 'Alternative 1',
          distance: 18,
          time: 42,
          fuelCost: 2.7,
          savings: 1.5,
          trafficLevel: 'low',
          ulezImpact: false,
        },
      ],
      roadClosures: [],
      estimatedDelay: 15,
      congestionLevel: 'medium',
      recommendations: [
        'Check route before departure',
        'Allow extra travel time',
      ],
      timestamp: new Date().toISOString(),
      fallback: true,
    });
  }
}

// Determine traffic level based on route data
function determineTrafficLevel(route: any): 'low' | 'medium' | 'high' {
  // This is a simplified calculation - in production, use actual traffic data
  const speed = route.distance / (route.duration / 3600); // mph

  if (speed < 15) return 'high';
  if (speed < 25) return 'medium';
  return 'low';
}

// Determine congestion level based on traffic conditions
function determineCongestionLevel(
  route: any
): 'low' | 'medium' | 'high' | 'severe' {
  const trafficLevel = determineTrafficLevel(route);

  switch (trafficLevel) {
    case 'high':
      return 'severe';
    case 'medium':
      return 'high';
    default:
      return 'low';
  }
}

// Calculate fuel cost based on distance
function calculateFuelCost(distanceMiles: number): number {
  const fuelEfficiency = 25; // miles per gallon
  const fuelPrice = 1.5; // £ per liter
  const litersPerGallon = 4.546; // UK gallons to liters

  const gallonsUsed = distanceMiles / fuelEfficiency;
  const litersUsed = gallonsUsed * litersPerGallon;

  return Math.round(litersUsed * fuelPrice * 100) / 100;
}

// Check if route passes through ULEZ zones
function checkULEZImpact(route: any): boolean {
  // This is a simplified check - in production, use proper zone mapping
  // For now, assume routes through central London have ULEZ impact
  const coordinates = route.geometry.coordinates;

  // Check if route passes through central London (simplified)
  const centralLondonBounds = {
    minLat: 51.4,
    maxLat: 51.6,
    minLng: -0.2,
    maxLng: 0.1,
  };

  return coordinates.some((coord: number[]) => {
    const [lng, lat] = coord;
    return (
      lat >= centralLondonBounds.minLat &&
      lat <= centralLondonBounds.maxLat &&
      lng >= centralLondonBounds.minLng &&
      lng <= centralLondonBounds.maxLng
    );
  });
}

// Check for road closures and incidents
async function checkRoadClosures(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<any[]> {
  try {
    // In production, this would call a real-time traffic incident API
    // For now, return mock data based on location

    const closures: any[] = [];

    // Check if route passes through known construction areas
    if (isInConstructionZone(fromLat, fromLng, toLat, toLng)) {
      closures.push({
        location: 'Central London',
        reason: 'Road maintenance and construction',
        estimatedDuration: '2-3 weeks',
        impact: 'medium',
      });
    }

    // Check for planned events that might cause closures
    if (isNearEventVenue(fromLat, fromLng, toLat, toLng)) {
      closures.push({
        location: 'Event venue area',
        reason: 'Special event traffic management',
        estimatedDuration: 'Event duration',
        impact: 'low',
      });
    }

    return closures;
  } catch (error) {
    console.error('❌ Error checking road closures:', error);
    return [];
  }
}

// Check if route passes through construction zones
function isInConstructionZone(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): boolean {
  // Simplified check for central London construction zones
  const constructionZones = [
    { lat: 51.5, lng: -0.1, radius: 0.05 }, // Central London
    { lat: 51.52, lng: -0.08, radius: 0.03 }, // Canary Wharf area
  ];

  return constructionZones.some(zone => {
    const routeMidLat = (fromLat + toLat) / 2;
    const routeMidLng = (fromLng + toLng) / 2;

    const distance = Math.sqrt(
      Math.pow(routeMidLat - zone.lat, 2) + Math.pow(routeMidLng - zone.lng, 2)
    );

    return distance < zone.radius;
  });
}

// Check if route is near event venues
function isNearEventVenue(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): boolean {
  // Simplified check for major event venues
  const eventVenues = [
    { lat: 51.556, lng: -0.279, radius: 0.02 }, // Wembley Stadium
    { lat: 51.503, lng: -0.114, radius: 0.02 }, // The O2 Arena
    { lat: 51.499, lng: -0.124, radius: 0.02 }, // London Bridge area
  ];

  return eventVenues.some(venue => {
    const routeMidLat = (fromLat + toLat) / 2;
    const routeMidLng = (fromLng + toLng) / 2;

    const distance = Math.sqrt(
      Math.pow(routeMidLat - venue.lat, 2) +
        Math.pow(routeMidLng - venue.lng, 2)
    );

    return distance < venue.radius;
  });
}

// Calculate estimated delay based on traffic conditions
function calculateEstimatedDelay(
  mainRoute: any,
  alternativeRoutes: any[]
): number {
  // Base delay calculation
  let baseDelay = 0;

  switch (mainRoute.congestionLevel) {
    case 'severe':
      baseDelay = 45;
      break;
    case 'high':
      baseDelay = 30;
      break;
    case 'medium':
      baseDelay = 15;
      break;
    default:
      baseDelay = 5;
  }

  // Add delay if alternative routes are significantly faster
  if (alternativeRoutes.length > 0) {
    const fastestAlternative = alternativeRoutes.reduce((fastest, current) =>
      current.time < fastest.time ? current : fastest
    );

    if (fastestAlternative.time < mainRoute.time) {
      const timeDifference = mainRoute.time - fastestAlternative.time;
      baseDelay += Math.min(timeDifference, 20); // Cap additional delay at 20 minutes
    }
  }

  return Math.round(baseDelay);
}

// Generate traffic-specific recommendations
function generateTrafficRecommendations(data: any): string[] {
  const recommendations = [];

  if (data.congestionLevel === 'high' || data.congestionLevel === 'severe') {
    recommendations.push('Heavy traffic expected - allow extra travel time');
    recommendations.push('Consider alternative routes if available');
  }

  if (data.estimatedDelay > 30) {
    recommendations.push(
      `Significant delay expected: ${data.estimatedDelay} minutes`
    );
  }

  if (data.roadClosures && data.roadClosures.length > 0) {
    recommendations.push('Road closures detected - check alternative routes');
  }

  if (data.alternativeRoutes && data.alternativeRoutes.length > 0) {
    recommendations.push(
      'Alternative routes available - consider fuel efficiency'
    );

    const fastestRoute = data.alternativeRoutes.reduce(
      (fastest: any, current: any) =>
        current.time < fastest.time ? current : fastest
    );

    if (fastestRoute.time < data.mainRoute.time) {
      const timeSaved = data.mainRoute.time - fastestRoute.time;
      recommendations.push(`Fastest alternative saves ${timeSaved} minutes`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Normal traffic conditions expected');
  }

  return recommendations;
}
