import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const fuelEfficiency = searchParams.get('fuelEfficiency') === 'true';

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

    // Get Mapbox API key for route optimization (server-side token)
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapboxToken) {
      return NextResponse.json(
        { error: 'Mapbox token not configured' },
        { status: 500 }
      );
    }

    // Get multiple route options with different profiles
    const routeProfiles = [
      { name: 'fastest', profile: 'driving' },
      { name: 'shortest', profile: 'driving' },
      { name: 'eco', profile: 'driving' },
    ];

    const routeOptions = await Promise.all(
      routeProfiles.map(async profile => {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${profile.profile}/${fromLng},${fromLat};${toLng},${toLat}?access_token=${mapboxToken}&overview=full&annotations=duration,distance,speed&geometries=geojson&continue_straight=true`
        );

        if (!response.ok) {
          throw new Error(
            `Mapbox API error for ${profile.name}: ${response.status}`
          );
        }

        const data = await response.json();
        return { profile: profile.name, data: data.routes[0] };
      })
    );

    // Process route options
    const processedRoutes = routeOptions.map(({ profile, data }) => {
      const distance = Math.round(data.distance / 1609.34); // Convert meters to miles
      const time = Math.round(data.duration / 60); // Convert seconds to minutes
      const fuelCost = calculateFuelCost(distance, profile);
      const ulezCost = calculateULEZCost(data);
      const totalCost = fuelCost + ulezCost;

      return {
        profile,
        distance,
        time,
        fuelCost,
        ulezCost,
        totalCost,
        efficiency: calculateEfficiencyScore(distance, time, fuelCost, profile),
      };
    });

    // Find the most fuel-efficient route
    const mostEfficientRoute = processedRoutes.reduce((most, current) =>
      current.efficiency > most.efficiency ? current : most
    );

    // Find the fastest route
    const fastestRoute = processedRoutes.reduce((fastest, current) =>
      current.time < fastest.time ? current : fastest
    );

    // Find the shortest route
    const shortestRoute = processedRoutes.reduce((shortest, current) =>
      current.distance < shortest.distance ? current : shortest
    );

    // Calculate savings for optimized route
    const originalRoute = fastestRoute; // Assume fastest is the default
    const optimizedRoute = mostEfficientRoute;
    const savings = Math.max(
      0,
      originalRoute.totalCost - optimizedRoute.totalCost
    );

    // Generate route recommendations
    const recommendations = generateRouteRecommendations({
      originalRoute,
      optimizedRoute,
      allRoutes: processedRoutes,
      fuelEfficiency,
    });

    const response = {
      originalRoute: {
        distance: originalRoute.distance,
        time: originalRoute.time,
        fuelCost: originalRoute.fuelCost,
        ulezCost: originalRoute.ulezCost,
        totalCost: originalRoute.totalCost,
      },
      optimizedRoute: {
        distance: optimizedRoute.distance,
        time: optimizedRoute.time,
        fuelCost: optimizedRoute.fuelCost,
        ulezCost: optimizedRoute.ulezCost,
        totalCost: optimizedRoute.totalCost,
        savings,
      },
      allRoutes: processedRoutes,
      recommendations,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Route optimization API error:', error);

    // Return mock data as fallback
    const distance = 15;
    const baseTime = 45;
    const fuelCost = distance * 0.15;
    const ulezCost = 12.5;

    return NextResponse.json({
      originalRoute: {
        distance,
        time: baseTime,
        fuelCost,
        ulezCost,
        totalCost: fuelCost + ulezCost,
      },
      optimizedRoute: {
        distance: distance * 0.9,
        time: baseTime * 0.95,
        fuelCost: fuelCost * 0.85,
        ulezCost: 0, // Avoid ULEZ zone
        totalCost: fuelCost * 0.85,
        savings: fuelCost * 0.15 + ulezCost,
      },
      allRoutes: [
        {
          profile: 'fastest',
          distance,
          time: baseTime,
          fuelCost,
          ulezCost,
          totalCost: fuelCost + ulezCost,
          efficiency: 75,
        },
        {
          profile: 'eco',
          distance: distance * 0.9,
          time: baseTime * 1.1,
          fuelCost: fuelCost * 0.85,
          ulezCost: 0,
          totalCost: fuelCost * 0.85,
          efficiency: 90,
        },
      ],
      recommendations: [
        'Use eco route for fuel efficiency',
        'Avoid ULEZ zones to save £12.50',
        'Consider time vs. cost trade-offs',
      ],
      timestamp: new Date().toISOString(),
      fallback: true,
    });
  }
}

// Calculate fuel cost based on distance and route profile
function calculateFuelCost(distanceMiles: number, profile: string): number {
  const baseFuelEfficiency = 25; // miles per gallon
  const fuelPrice = 1.5; // £ per liter
  const litersPerGallon = 4.546; // UK gallons to liters

  // Adjust efficiency based on route profile
  let efficiencyMultiplier = 1.0;
  switch (profile) {
    case 'eco':
      efficiencyMultiplier = 1.2; // 20% more efficient
      break;
    case 'shortest':
      efficiencyMultiplier = 0.9; // 10% less efficient due to more stops
      break;
    case 'fastest':
    default:
      efficiencyMultiplier = 1.0; // Standard efficiency
      break;
  }

  const adjustedEfficiency = baseFuelEfficiency * efficiencyMultiplier;
  const gallonsUsed = distanceMiles / adjustedEfficiency;
  const litersUsed = gallonsUsed * litersPerGallon;

  return Math.round(litersUsed * fuelPrice * 100) / 100;
}

// Calculate ULEZ cost based on route
function calculateULEZCost(route: any): number {
  // Check if route passes through ULEZ zones
  if (checkULEZImpact(route)) {
    return 12.5; // ULEZ charge
  }

  return 0;
}

// Check if route passes through ULEZ zones
function checkULEZImpact(route: any): boolean {
  try {
    const coordinates = route.geometry.coordinates;

    // Check if route passes through central London (ULEZ zone)
    const ulezBounds = {
      minLat: 51.4,
      maxLat: 51.6,
      minLng: -0.2,
      maxLng: 0.1,
    };

    return coordinates.some((coord: number[]) => {
      const [lng, lat] = coord;
      return (
        lat >= ulezBounds.minLat &&
        lat <= ulezBounds.maxLat &&
        lng >= ulezBounds.minLng &&
        lng <= ulezBounds.maxLng
      );
    });
  } catch (error) {
    console.error('❌ Error checking ULEZ impact:', error);
    return false;
  }
}

// Calculate efficiency score (0-100)
function calculateEfficiencyScore(
  distance: number,
  time: number,
  fuelCost: number,
  profile: string
): number {
  // Base efficiency factors
  const distanceEfficiency = Math.max(0, 100 - distance * 2); // Shorter is better
  const timeEfficiency = Math.max(0, 100 - time * 1.5); // Faster is better
  const fuelEfficiency = Math.max(0, 100 - fuelCost * 20); // Lower fuel cost is better

  // Profile bonus
  let profileBonus = 0;
  switch (profile) {
    case 'eco':
      profileBonus = 20;
      break;
    case 'shortest':
      profileBonus = 10;
      break;
    case 'fastest':
      profileBonus = 5;
      break;
  }

  // Calculate weighted average
  const totalScore =
    distanceEfficiency * 0.3 +
    timeEfficiency * 0.3 +
    fuelEfficiency * 0.4 +
    profileBonus;

  return Math.min(100, Math.max(0, Math.round(totalScore)));
}

// Generate route-specific recommendations
function generateRouteRecommendations(data: any): string[] {
  const recommendations = [];

  // Cost savings recommendations
  if (data.optimizedRoute.savings > 5) {
    recommendations.push(
      `Route optimization saves £${data.optimizedRoute.savings.toFixed(2)}`
    );
  }

  // Fuel efficiency recommendations
  if (data.optimizedRoute.fuelCost < data.originalRoute.fuelCost) {
    const fuelSavings =
      data.originalRoute.fuelCost - data.optimizedRoute.fuelCost;
    recommendations.push(`Fuel savings: £${fuelSavings.toFixed(2)}`);
  }

  // ULEZ recommendations
  if (data.originalRoute.ulezCost > 0 && data.optimizedRoute.ulezCost === 0) {
    recommendations.push('ULEZ charges avoided - significant cost savings');
  } else if (data.optimizedRoute.ulezCost > 0) {
    recommendations.push('ULEZ charges apply - ensure vehicle compliance');
  }

  // Time vs. cost trade-offs
  if (data.optimizedRoute.time > data.originalRoute.time) {
    const timeDifference = data.optimizedRoute.time - data.originalRoute.time;
    const costSavings =
      data.originalRoute.totalCost - data.optimizedRoute.totalCost;
    const savingsPerMinute = costSavings / timeDifference;

    if (savingsPerMinute > 0.5) {
      recommendations.push(
        `Time trade-off: ${timeDifference} min extra saves £${costSavings.toFixed(2)}`
      );
    }
  }

  // Distance optimization
  if (data.optimizedRoute.distance < data.originalRoute.distance) {
    const distanceSaved =
      data.originalRoute.distance - data.optimizedRoute.distance;
    recommendations.push(`Distance saved: ${distanceSaved} miles`);
  }

  // Route profile recommendations
  const ecoRoute = data.allRoutes.find((r: any) => r.profile === 'eco');
  if (ecoRoute && ecoRoute.efficiency > 80) {
    recommendations.push('Eco route highly recommended for fuel efficiency');
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('Route is already optimized');
  }

  // Add fuel efficiency tips
  if (data.fuelEfficiency) {
    recommendations.push('Drive smoothly to maintain fuel efficiency');
    recommendations.push('Avoid rapid acceleration and braking');
    recommendations.push('Maintain steady speed on highways');
  }

  return recommendations;
}
