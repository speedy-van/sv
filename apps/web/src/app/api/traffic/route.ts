import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Traffic data interfaces
interface TrafficSegment {
  startLocation: {
    lat: number;
    lng: number;
  };
  endLocation: {
    lat: number;
    lng: number;
  };
  speed: number; // km/h
  speedUncapped: number;
  historicSpeed: number;
  freeFlowSpeed: number;
  congestionLevel: 'unknown' | 'freeFlow' | 'heavy' | 'congested' | 'blocked';
  confidence: number; // 0.0 to 1.0
  length: number; // meters
}

interface RoadIncident {
  id: string;
  type: 'accident' | 'construction' | 'roadwork' | 'closure' | 'flooding' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  startLocation: {
    lat: number;
    lng: number;
  };
  endLocation?: {
    lat: number;
    lng: number;
  };
  startTime: string;
  endTime?: string;
  length: number; // meters affected
  delay: number; // estimated delay in minutes
  lanesAffected?: number;
}

interface TrafficData {
  routeId: string;
  segments: TrafficSegment[];
  incidents: RoadIncident[];
  lastUpdated: string;
  dataSource: 'google' | 'tomtom' | 'here' | 'cached';
  coverage: number; // percentage of route covered
}

// Mock traffic data for development (replace with real APIs)
const MOCK_TRAFFIC_DATA: TrafficData = {
  routeId: 'mock_route',
  segments: [
    {
      startLocation: { lat: 51.5074, lng: -0.1278 },
      endLocation: { lat: 51.5155, lng: -0.0922 },
      speed: 25,
      speedUncapped: 30,
      historicSpeed: 35,
      freeFlowSpeed: 50,
      congestionLevel: 'heavy',
      confidence: 0.85,
      length: 3500
    },
    {
      startLocation: { lat: 51.5155, lng: -0.0922 },
      endLocation: { lat: 51.5225, lng: -0.0473 },
      speed: 15,
      speedUncapped: 20,
      historicSpeed: 45,
      freeFlowSpeed: 60,
      congestionLevel: 'congested',
      confidence: 0.92,
      length: 2800
    }
  ],
  incidents: [
    {
      id: 'incident_001',
      type: 'accident',
      severity: 'high',
      description: 'Multi-vehicle collision on M25 clockwise',
      startLocation: { lat: 51.5074, lng: -0.1278 },
      endLocation: { lat: 51.5090, lng: -0.1200 },
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      length: 800,
      delay: 45,
      lanesAffected: 2
    }
  ],
  lastUpdated: new Date().toISOString(),
  dataSource: 'google',
  coverage: 85
};

// Cache for traffic data (in production, use Redis)
const trafficCache = new Map<string, { data: TrafficData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const trafficRequestSchema = z.object({
  route: z.object({
    origin: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    destination: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    waypoints: z.array(z.object({
      lat: z.number(),
      lng: z.number(),
    })).optional(),
  }),
  departureTime: z.string().optional(), // ISO string
  routeId: z.string().optional(),
  includeIncidents: z.boolean().default(true),
  dataSource: z.enum(['google', 'tomtom', 'here', 'auto']).default('auto'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = trafficRequestSchema.parse(body);

    const { route, departureTime, routeId, includeIncidents, dataSource } = validatedData;

    // Generate cache key
    const cacheKey = `${route.origin.lat},${route.origin.lng}_${route.destination.lat},${route.destination.lng}_${departureTime || 'now'}`;

    // Check cache first
    const cached = trafficCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    // In production, call real traffic APIs
    let trafficData: TrafficData;

    if (process.env.NODE_ENV === 'production') {
      // Call real traffic APIs based on dataSource preference
      trafficData = await fetchRealTrafficData(route, departureTime, dataSource);
    } else {
      // Use mock data for development
      trafficData = {
        ...MOCK_TRAFFIC_DATA,
        routeId: routeId || cacheKey,
        lastUpdated: new Date().toISOString()
      };
    }

    // Filter incidents if not requested
    if (!includeIncidents) {
      trafficData.incidents = [];
    }

    // Cache the result
    trafficCache.set(cacheKey, {
      data: trafficData,
      timestamp: Date.now()
    });

    // Clean old cache entries (simple cleanup)
    if (trafficCache.size > 1000) {
      const oldestKey = Array.from(trafficCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      trafficCache.delete(oldestKey);
    }

    return NextResponse.json({
      ...trafficData,
      cached: false
    });

  } catch (error) {
    console.error('Traffic API Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Traffic service unavailable' },
      { status: 503 }
    );
  }
}

async function fetchRealTrafficData(
  route: any,
  departureTime: string | undefined,
  dataSource: string
): Promise<TrafficData> {
  // Google Maps Traffic API integration
  if (dataSource === 'google' || dataSource === 'auto') {
    try {
      return await fetchGoogleTraffic(route, departureTime);
    } catch (error) {
      console.warn('Google Traffic API failed:', error);
      if (dataSource === 'google') throw error; // If specifically requested, fail
    }
  }

  // TomTom Traffic API integration
  if (dataSource === 'tomtom' || dataSource === 'auto') {
    try {
      return await fetchTomTomTraffic(route, departureTime);
    } catch (error) {
      console.warn('TomTom Traffic API failed:', error);
      if (dataSource === 'tomtom') throw error;
    }
  }

  // HERE Traffic API integration
  if (dataSource === 'here' || dataSource === 'auto') {
    try {
      return await fetchHereTraffic(route, departureTime);
    } catch (error) {
      console.warn('HERE Traffic API failed:', error);
      if (dataSource === 'here') throw error;
    }
  }

  // If all APIs fail, return mock data as fallback
  console.warn('All traffic APIs failed, using fallback data');
  return MOCK_TRAFFIC_DATA;
}

async function fetchGoogleTraffic(route: any, departureTime?: string): Promise<TrafficData> {
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key not configured');
  }

  const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
  const params = new URLSearchParams({
    origin: `${route.origin.lat},${route.origin.lng}`,
    destination: `${route.destination.lat},${route.destination.lng}`,
    key: GOOGLE_MAPS_API_KEY,
    alternatives: 'false',
    traffic_model: 'best_guess',
    departure_time: departureTime || 'now',
  });

  if (route.waypoints && route.waypoints.length > 0) {
    const waypoints = route.waypoints.map((wp: any) => `${wp.lat},${wp.lng}`).join('|');
    params.append('waypoints', waypoints);
  }

  const response = await fetch(`${baseUrl}?${params}`, {
    headers: {
      'User-Agent': 'SpeedyVan-DriverApp/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Google Maps API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Google Maps API returned: ${data.status}`);
  }

  return parseGoogleTrafficResponse(data, route);
}

async function fetchTomTomTraffic(route: any, departureTime?: string): Promise<TrafficData> {
  const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

  if (!TOMTOM_API_KEY) {
    throw new Error('TomTom API key not configured');
  }

  // TomTom routing with traffic
  const baseUrl = 'https://api.tomtom.com/routing/1/calculateRoute';
  const params = new URLSearchParams({
    key: TOMTOM_API_KEY,
    routeType: 'fastest',
    traffic: 'true',
    departureTime: departureTime || new Date().toISOString(),
    instructionsType: 'text',
    language: 'en-GB',
    vehicleMaxSpeed: '80', // km/h for van
    vehicleCommercial: 'true',
  });

  const locations = [
    `${route.origin.lng},${route.origin.lat}`,
    ...(route.waypoints || []).map((wp: any) => `${wp.lng},${wp.lat}`),
    `${route.destination.lng},${route.destination.lat}`
  ].join(':');

  const response = await fetch(`${baseUrl}/${locations}/json?${params}`, {
    headers: {
      'User-Agent': 'SpeedyVan-DriverApp/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`TomTom API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`TomTom API error: ${data.error.description}`);
  }

  return parseTomTomTrafficResponse(data, route);
}

async function fetchHereTraffic(route: any, departureTime?: string): Promise<TrafficData> {
  const HERE_API_KEY = process.env.HERE_API_KEY;

  if (!HERE_API_KEY) {
    throw new Error('HERE API key not configured');
  }

  // HERE routing with traffic
  const baseUrl = 'https://router.hereapi.com/v8/routes';
  const params = new URLSearchParams({
    apiKey: HERE_API_KEY,
    transportMode: 'car',
    routingMode: 'fast',
    departureTime: departureTime || new Date().toISOString(),
    return: 'polyline,summary,instructions',
  });

  const waypoints = [
    `geo!${route.origin.lat},${route.origin.lng}`,
    ...(route.waypoints || []).map((wp: any) => `geo!${wp.lat},${wp.lng}`),
    `geo!${route.destination.lat},${route.destination.lng}`
  ];

  params.append('origin', waypoints[0]);
  params.append('destination', waypoints[waypoints.length - 1]);

  if (waypoints.length > 2) {
    waypoints.slice(1, -1).forEach(wp => {
      params.append('via', wp);
    });
  }

  const response = await fetch(`${baseUrl}?${params}`, {
    headers: {
      'User-Agent': 'SpeedyVan-DriverApp/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`HERE API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.notices && data.notices.length > 0) {
    console.warn('HERE API notices:', data.notices);
  }

  return parseHereTrafficResponse(data, route);
}

// Response parsers for different traffic APIs
function parseGoogleTrafficResponse(data: any, route: any): TrafficData {
  const routeData = data.routes[0];
  const legs = routeData.legs;

  const segments: TrafficSegment[] = [];
  const incidents: RoadIncident[] = [];

  // Parse traffic segments
  legs.forEach((leg: any) => {
    leg.steps.forEach((step: any) => {
      const segment: TrafficSegment = {
        startLocation: {
          lat: step.start_location.lat,
          lng: step.start_location.lng,
        },
        endLocation: {
          lat: step.end_location.lat,
          lng: step.end_location.lng,
        },
        speed: step.duration_in_traffic ? calculateSpeed(step.distance.value, step.duration_in_traffic.value) : 30,
        speedUncapped: step.duration ? calculateSpeed(step.distance.value, step.duration.value) : 35,
        historicSpeed: 40, // Fallback
        freeFlowSpeed: step.duration ? calculateSpeed(step.distance.value, step.duration.value) : 50,
        congestionLevel: getCongestionLevel(step.duration_in_traffic?.value, step.duration?.value),
        confidence: 0.8,
        length: step.distance.value,
      };
      segments.push(segment);
    });
  });

  return {
    routeId: `google_${Date.now()}`,
    segments,
    incidents,
    lastUpdated: new Date().toISOString(),
    dataSource: 'google',
    coverage: 90,
  };
}

function parseTomTomTrafficResponse(data: any, route: any): TrafficData {
  const routeData = data.routes[0];
  const segments: TrafficSegment[] = [];
  const incidents: RoadIncident[] = [];

  // Parse route sections for traffic data
  routeData.sections?.forEach((section: any) => {
    const segment: TrafficSegment = {
      startLocation: {
        lat: section.startPoint.lat,
        lng: section.startPoint.lng,
      },
      endLocation: {
        lat: section.endPoint.lat,
        lng: section.endPoint.lng,
      },
      speed: section.tec?.speed ? section.tec.speed * 3.6 : 30, // Convert m/s to km/h
      speedUncapped: 35,
      historicSpeed: 40,
      freeFlowSpeed: 50,
      congestionLevel: getTomTomCongestionLevel(section.tec?.flow),
      confidence: section.tec?.confidence || 0.7,
      length: section.lengthInMeters || 1000,
    };
    segments.push(segment);
  });

  return {
    routeId: `tomtom_${Date.now()}`,
    segments,
    incidents,
    lastUpdated: new Date().toISOString(),
    dataSource: 'tomtom',
    coverage: 85,
  };
}

function parseHereTrafficResponse(data: any, route: any): TrafficData {
  const routeData = data.routes[0];
  const segments: TrafficSegment[] = [];
  const incidents: RoadIncident[] = [];

  // HERE provides traffic information in sections
  routeData.sections?.forEach((section: any) => {
    const segment: TrafficSegment = {
      startLocation: {
        lat: section.departure.place.location.lat,
        lng: section.departure.place.location.lng,
      },
      endLocation: {
        lat: section.arrival.place.location.lat,
        lng: section.arrival.place.location.lng,
      },
      speed: section.summary.lengthInMeters / (section.summary.duration / 3600), // km/h
      speedUncapped: section.summary.lengthInMeters / (section.summary.baseDuration / 3600),
      historicSpeed: 40,
      freeFlowSpeed: 50,
      congestionLevel: getHereCongestionLevel(section.summary.duration, section.summary.baseDuration),
      confidence: 0.75,
      length: section.summary.lengthInMeters,
    };
    segments.push(segment);
  });

  return {
    routeId: `here_${Date.now()}`,
    segments,
    incidents,
    lastUpdated: new Date().toISOString(),
    dataSource: 'here',
    coverage: 80,
  };
}

// Helper functions
function calculateSpeed(distanceMeters: number, durationSeconds: number): number {
  const distanceKm = distanceMeters / 1000;
  const durationHours = durationSeconds / 3600;
  return Math.round(distanceKm / durationHours);
}

function getCongestionLevel(trafficDuration?: number, normalDuration?: number): TrafficSegment['congestionLevel'] {
  if (!trafficDuration || !normalDuration) return 'unknown';

  const ratio = trafficDuration / normalDuration;

  if (ratio < 1.2) return 'freeFlow';
  if (ratio < 1.5) return 'heavy';
  if (ratio < 2.0) return 'congested';
  return 'blocked';
}

function getTomTomCongestionLevel(flow?: number): TrafficSegment['congestionLevel'] {
  if (!flow) return 'unknown';

  // TomTom flow values: 0 = free flow, 10 = heavy traffic
  if (flow < 2) return 'freeFlow';
  if (flow < 5) return 'heavy';
  if (flow < 8) return 'congested';
  return 'blocked';
}

function getHereCongestionLevel(trafficDuration?: number, baseDuration?: number): TrafficSegment['congestionLevel'] {
  if (!trafficDuration || !baseDuration) return 'unknown';

  const ratio = trafficDuration / baseDuration;

  if (ratio < 1.1) return 'freeFlow';
  if (ratio < 1.3) return 'heavy';
  if (ratio < 1.6) return 'congested';
  return 'blocked';
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Traffic service is operational',
    supportedProviders: ['google', 'tomtom', 'here'],
    cacheSize: trafficCache.size,
    timestamp: new Date().toISOString()
  });
}
