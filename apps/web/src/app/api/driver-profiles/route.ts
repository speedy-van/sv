import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Driver profile interfaces for ML personalization
interface DriverProfile {
  driverId: string;
  preferences: {
    preferredSpeed: number; // km/h
    riskTolerance: 'low' | 'medium' | 'high';
    fuelPriority: number; // 0-1
    timePriority: number; // 0-1
    breakFrequency: number; // hours between breaks
    routePreferences: string[]; // preferred road types
    timeOfDayPreference: 'morning' | 'afternoon' | 'evening' | 'any';
  };
  behavioralPatterns: {
    averageSpeed: number;
    fuelEfficiency: number; // L/100km
    onTimeDeliveryRate: number; // percentage
    customerSatisfaction: number; // 1-5 rating
    routeAdherence: number; // percentage
    breakCompliance: number; // percentage
  };
  performanceMetrics: {
    totalJobs: number;
    totalEarnings: number;
    totalDistance: number; // km
    totalHours: number;
    efficiencyScore: number; // 0-100
    safetyScore: number; // 0-100
  };
  vehicleData: {
    vehicleId: string;
    make: string;
    model: string;
    year: number;
    fuelType: 'diesel' | 'petrol' | 'electric';
    averageFuelConsumption: number; // L/100km
    maintenanceHistory: MaintenanceRecord[];
  };
  learningData: {
    routePreferences: RoutePreference[];
    timePatterns: TimePattern[];
    performanceHistory: PerformanceRecord[];
    feedbackHistory: FeedbackRecord[];
  };
  lastUpdated: string;
  profileVersion: number;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'service' | 'repair' | 'inspection';
  description: string;
  cost: number;
  mileage: number;
  nextServiceDue: string;
  severity: 'low' | 'medium' | 'high';
}

interface RoutePreference {
  routeType: string;
  preference: number; // -1 to 1 (avoid to prefer)
  confidence: number; // 0-1
  lastUsed: string;
  performance: number; // average performance on this route type
}

interface TimePattern {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  performance: number; // 0-100
  preference: number; // -1 to 1
  jobsCompleted: number;
  averageEfficiency: number;
}

interface PerformanceRecord {
  date: string;
  jobId: string;
  metrics: {
    onTime: boolean;
    fuelUsed: number;
    distance: number;
    earnings: number;
    customerRating: number;
    routeEfficiency: number;
  };
}

interface FeedbackRecord {
  date: string;
  type: 'app_feedback' | 'customer_feedback' | 'system_generated';
  rating: number; // 1-5
  category: string;
  comments: string;
  actionable: boolean;
}

// Mock driver profiles for development
const MOCK_DRIVER_PROFILES: Map<string, DriverProfile> = new Map();

// Initialize mock data
MOCK_DRIVER_PROFILES.set('driver_001', {
  driverId: 'driver_001',
  preferences: {
    preferredSpeed: 85,
    riskTolerance: 'medium',
    fuelPriority: 0.7,
    timePriority: 0.8,
    breakFrequency: 2.5,
    routePreferences: ['motorway', 'a_road'],
    timeOfDayPreference: 'morning'
  },
  behavioralPatterns: {
    averageSpeed: 82,
    fuelEfficiency: 8.5,
    onTimeDeliveryRate: 94,
    customerSatisfaction: 4.6,
    routeAdherence: 96,
    breakCompliance: 98
  },
  performanceMetrics: {
    totalJobs: 1247,
    totalEarnings: 45680,
    totalDistance: 89450,
    totalHours: 2150,
    efficiencyScore: 87,
    safetyScore: 95
  },
  vehicleData: {
    vehicleId: 'van_001',
    make: 'Ford',
    model: 'Transit',
    year: 2022,
    fuelType: 'diesel',
    averageFuelConsumption: 8.2,
    maintenanceHistory: [
      {
        id: 'maint_001',
        date: '2024-10-15',
        type: 'service',
        description: 'Regular service - oil change, filters, brakes',
        cost: 450,
        mileage: 45230,
        nextServiceDue: '2025-01-15',
        severity: 'low'
      }
    ]
  },
  learningData: {
    routePreferences: [
      { routeType: 'motorway', preference: 0.8, confidence: 0.9, lastUsed: '2024-11-01', performance: 92 },
      { routeType: 'urban', preference: -0.3, confidence: 0.7, lastUsed: '2024-10-30', performance: 78 }
    ],
    timePatterns: [
      { timeOfDay: 'morning', performance: 95, preference: 0.9, jobsCompleted: 456, averageEfficiency: 91 },
      { timeOfDay: 'afternoon', performance: 87, preference: 0.4, jobsCompleted: 389, averageEfficiency: 85 }
    ],
    performanceHistory: [],
    feedbackHistory: []
  },
  lastUpdated: new Date().toISOString(),
  profileVersion: 1
});

// Schema definitions
const createProfileSchema = z.object({
  driverId: z.string(),
  initialPreferences: z.object({
    preferredSpeed: z.number().min(30).max(120).optional(),
    riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
    fuelPriority: z.number().min(0).max(1).optional(),
    timePriority: z.number().min(0).max(1).optional(),
    breakFrequency: z.number().min(1).max(6).optional(),
    routePreferences: z.array(z.string()).optional(),
    timeOfDayPreference: z.enum(['morning', 'afternoon', 'evening', 'any']).optional(),
  }).optional(),
  vehicleData: z.object({
    vehicleId: z.string(),
    make: z.string(),
    model: z.string(),
    year: z.number(),
    fuelType: z.enum(['diesel', 'petrol', 'electric']),
  }).optional(),
});

const updateProfileSchema = z.object({
  preferences: z.object({
    preferredSpeed: z.number().min(30).max(120).optional(),
    riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
    fuelPriority: z.number().min(0).max(1).optional(),
    timePriority: z.number().min(0).max(1).optional(),
    breakFrequency: z.number().min(1).max(6).optional(),
    routePreferences: z.array(z.string()).optional(),
    timeOfDayPreference: z.enum(['morning', 'afternoon', 'evening', 'any']).optional(),
  }).optional(),
  behavioralUpdate: z.object({
    speed: z.number().optional(),
    fuelUsed: z.number().optional(),
    onTime: z.boolean().optional(),
    customerRating: z.number().min(1).max(5).optional(),
  }).optional(),
  performanceData: z.object({
    jobId: z.string(),
    earnings: z.number(),
    distance: z.number(),
    duration: z.number(),
    onTime: z.boolean(),
    customerRating: z.number().min(1).max(5),
  }).optional(),
});

const predictiveMaintenanceSchema = z.object({
  driverId: z.string(),
  currentMileage: z.number(),
  recentPerformance: z.object({
    averageSpeed: z.number(),
    fuelEfficiency: z.number(),
    enginePerformance: z.number().min(0).max(100),
  }).optional(),
  symptoms: z.array(z.string()).optional(), // 'rough_idle', 'reduced_power', 'unusual_noise', etc.
});

// Machine learning algorithms for personalization
class DriverPersonalizationEngine {
  // Simple ML models for driver behavior prediction

  predictOptimalSpeed(driverProfile: DriverProfile, routeType: string, weather: any): number {
    const baseSpeed = driverProfile.preferences.preferredSpeed;
    const routePreference = driverProfile.learningData.routePreferences.find(r => r.routeType === routeType);

    let adjustment = 0;

    // Route type adjustment
    if (routePreference) {
      adjustment += routePreference.preference * 10; // -10 to +10 km/h based on preference
    }

    // Weather adjustment
    if (weather?.precipitation?.type !== 'none') {
      adjustment -= 5; // Reduce speed in rain
    }
    if (weather?.visibility && weather.visibility < 5000) {
      adjustment -= 10; // Reduce speed in poor visibility
    }

    // Risk tolerance adjustment
    if (driverProfile.preferences.riskTolerance === 'low') {
      adjustment -= 5;
    } else if (driverProfile.preferences.riskTolerance === 'high') {
      adjustment += 5;
    }

    return Math.max(50, Math.min(100, baseSpeed + adjustment));
  }

  predictFuelEfficiency(driverProfile: DriverProfile, route: any, weather: any): number {
    const baseEfficiency = driverProfile.vehicleData.averageFuelConsumption;
    let adjustment = 0;

    // Route type impact
    const motorwayRoutes = route.waypoints?.filter((wp: any) => wp.routeType === 'motorway').length || 0;
    const urbanRoutes = route.waypoints?.filter((wp: any) => wp.routeType === 'urban').length || 0;

    adjustment -= motorwayRoutes * 0.2; // Better efficiency on motorways
    adjustment += urbanRoutes * 0.5; // Worse efficiency in urban areas

    // Weather impact
    if (weather?.temperature && weather.temperature < 5) {
      adjustment += 0.3; // Cold weather reduces efficiency
    }
    if (weather?.windSpeed && weather.windSpeed > 20) {
      adjustment += 0.2; // Strong wind increases consumption
    }

    return Math.max(6, Math.min(15, baseEfficiency + adjustment));
  }

  predictBreakTiming(driverProfile: DriverProfile, hoursDriven: number): number {
    const preferredFrequency = driverProfile.preferences.breakFrequency;
    const complianceRate = driverProfile.behavioralPatterns.breakCompliance / 100;

    // Adjust based on compliance history
    let recommendedHours = preferredFrequency;
    if (complianceRate < 0.8) {
      recommendedHours *= 0.9; // Recommend breaks more frequently if compliance is poor
    }

    return Math.max(1.5, Math.min(4, recommendedHours));
  }

  updateDriverPreferences(profile: DriverProfile, performanceData: any): Partial<DriverProfile['preferences']> {
    const updates: Partial<DriverProfile['preferences']> = {};

    // Learn from performance data
    if (performanceData.onTime && performanceData.customerRating >= 4) {
      // Positive reinforcement - maintain or slightly increase risk tolerance
      if (profile.preferences.riskTolerance === 'low' && Math.random() > 0.7) {
        updates.riskTolerance = 'medium';
      }
    } else if (!performanceData.onTime || performanceData.customerRating < 3) {
      // Negative reinforcement - increase caution
      if (profile.preferences.riskTolerance === 'high') {
        updates.riskTolerance = 'medium';
      } else if (profile.preferences.riskTolerance === 'medium') {
        updates.riskTolerance = 'low';
      }
    }

    // Adjust fuel vs time balance based on earnings efficiency
    const earningsPerHour = performanceData.earnings / (performanceData.duration / 60);
    if (earningsPerHour > profile.performanceMetrics.totalEarnings / profile.performanceMetrics.totalHours * 1.2) {
      // Better than average - can afford to prioritize fuel efficiency more
      updates.fuelPriority = Math.min(1, profile.preferences.fuelPriority + 0.05);
    }

    return updates;
  }
}

const personalizationEngine = new DriverPersonalizationEngine();

// API endpoints
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const driverId = searchParams.get('driverId');

  if (!driverId) {
    return NextResponse.json(
      { error: 'Driver ID required' },
      { status: 400 }
    );
  }

  // In production, fetch from database
  const profile = MOCK_DRIVER_PROFILES.get(driverId);

  if (!profile) {
    return NextResponse.json(
      { error: 'Driver profile not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(profile);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'get';

    switch (action) {
      case 'create':
        return await createDriverProfile(body);
      case 'update':
        return await updateDriverProfile(body);
      case 'predict':
        return await getPredictions(body);
      case 'maintenance':
        return await getMaintenancePredictions(body);
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Driver Profile API Error:', error);

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createDriverProfile(body: any) {
  const validatedData = createProfileSchema.parse(body);

  const newProfile: DriverProfile = {
    driverId: validatedData.driverId,
    preferences: {
      preferredSpeed: validatedData.initialPreferences?.preferredSpeed || 80,
      riskTolerance: validatedData.initialPreferences?.riskTolerance || 'medium',
      fuelPriority: validatedData.initialPreferences?.fuelPriority || 0.5,
      timePriority: validatedData.initialPreferences?.timePriority || 0.5,
      breakFrequency: validatedData.initialPreferences?.breakFrequency || 2,
      routePreferences: validatedData.initialPreferences?.routePreferences || ['motorway'],
      timeOfDayPreference: validatedData.initialPreferences?.timeOfDayPreference || 'any'
    },
    behavioralPatterns: {
      averageSpeed: 80,
      fuelEfficiency: 8.5,
      onTimeDeliveryRate: 85,
      customerSatisfaction: 4.0,
      routeAdherence: 90,
      breakCompliance: 95
    },
    performanceMetrics: {
      totalJobs: 0,
      totalEarnings: 0,
      totalDistance: 0,
      totalHours: 0,
      efficiencyScore: 75,
      safetyScore: 90
    },
    vehicleData: validatedData.vehicleData ? {
      vehicleId: validatedData.vehicleData.vehicleId,
      make: validatedData.vehicleData.make,
      model: validatedData.vehicleData.model,
      year: validatedData.vehicleData.year,
      fuelType: validatedData.vehicleData.fuelType,
      averageFuelConsumption: validatedData.vehicleData.fuelType === 'diesel' ? 8.5 : 10.5,
      maintenanceHistory: []
    } : {
      vehicleId: 'unknown',
      make: 'Unknown',
      model: 'Unknown',
      year: new Date().getFullYear(),
      fuelType: 'diesel',
      averageFuelConsumption: 8.5,
      maintenanceHistory: []
    },
    learningData: {
      routePreferences: [],
      timePatterns: [],
      performanceHistory: [],
      feedbackHistory: []
    },
    lastUpdated: new Date().toISOString(),
    profileVersion: 1
  };

  // In production, save to database
  MOCK_DRIVER_PROFILES.set(validatedData.driverId, newProfile);

  return NextResponse.json(newProfile);
}

async function updateDriverProfile(body: any) {
  const { driverId, ...updateData } = body;

  if (!driverId) {
    return NextResponse.json(
      { error: 'Driver ID required' },
      { status: 400 }
    );
  }

  const validatedData = updateProfileSchema.parse(updateData);
  const profile = MOCK_DRIVER_PROFILES.get(driverId);

  if (!profile) {
    return NextResponse.json(
      { error: 'Driver profile not found' },
      { status: 404 }
    );
  }

  // Apply updates
  if (validatedData.preferences) {
    profile.preferences = { ...profile.preferences, ...validatedData.preferences };
  }

  if (validatedData.behavioralUpdate) {
    // Update behavioral patterns based on recent performance
    const update = validatedData.behavioralUpdate;

    if (update.speed) {
      profile.behavioralPatterns.averageSpeed =
        (profile.behavioralPatterns.averageSpeed + update.speed) / 2;
    }

    if (update.fuelUsed && 'distance' in update && update.distance) {
      const fuelEfficiency = (update.fuelUsed / (update.distance as number)) * 100;
      profile.behavioralPatterns.fuelEfficiency =
        (profile.behavioralPatterns.fuelEfficiency + fuelEfficiency) / 2;
    }

    if (update.onTime !== undefined) {
      const currentRate = profile.behavioralPatterns.onTimeDeliveryRate;
      profile.behavioralPatterns.onTimeDeliveryRate =
        update.onTime ? Math.min(100, currentRate + 0.5) : Math.max(0, currentRate - 1);
    }

    if (update.customerRating) {
      profile.behavioralPatterns.customerSatisfaction =
        (profile.behavioralPatterns.customerSatisfaction + update.customerRating) / 2;
    }
  }

  if (validatedData.performanceData) {
    // Update performance metrics
    const perf = validatedData.performanceData;
    profile.performanceMetrics.totalJobs++;
    profile.performanceMetrics.totalEarnings += perf.earnings;
    profile.performanceMetrics.totalDistance += perf.distance;
    profile.performanceMetrics.totalHours += perf.duration / 60;

    // Update efficiency score
    const earningsPerHour = profile.performanceMetrics.totalEarnings / profile.performanceMetrics.totalHours;
    profile.performanceMetrics.efficiencyScore = Math.min(100, earningsPerHour / 25 * 100); // Normalize

    // Learn from this performance
    const preferenceUpdates = personalizationEngine.updateDriverPreferences(profile, perf);
    if (Object.keys(preferenceUpdates).length > 0) {
      profile.preferences = { ...profile.preferences, ...preferenceUpdates };
    }
  }

  profile.lastUpdated = new Date().toISOString();
  profile.profileVersion++;

  return NextResponse.json(profile);
}

async function getPredictions(body: any) {
  const { driverId, route, weather, context } = body;

  if (!driverId) {
    return NextResponse.json(
      { error: 'Driver ID required' },
      { status: 400 }
    );
  }

  const profile = MOCK_DRIVER_PROFILES.get(driverId);
  if (!profile) {
    return NextResponse.json(
      { error: 'Driver profile not found' },
      { status: 404 }
    );
  }

  const predictions = {
    optimalSpeed: personalizationEngine.predictOptimalSpeed(
      profile,
      route?.primaryRouteType || 'mixed',
      weather
    ),
    fuelEfficiency: personalizationEngine.predictFuelEfficiency(profile, route, weather),
    recommendedBreakFrequency: personalizationEngine.predictBreakTiming(profile, context?.hoursDriven || 0),
    routePreferences: profile.learningData.routePreferences,
    timeOfDayPerformance: profile.learningData.timePatterns,
    confidence: 0.85
  };

  return NextResponse.json(predictions);
}

async function getMaintenancePredictions(body: any) {
  const validatedData = predictiveMaintenanceSchema.parse(body);
  const { driverId, currentMileage, recentPerformance, symptoms } = validatedData;

  const profile = MOCK_DRIVER_PROFILES.get(driverId);
  if (!profile) {
    return NextResponse.json(
      { error: 'Driver profile not found' },
      { status: 404 }
    );
  }

  // Simple predictive maintenance algorithm
  const predictions = analyzeMaintenanceNeeds(
    profile.vehicleData,
    currentMileage,
    recentPerformance,
    symptoms || []
  );

  return NextResponse.json(predictions);
}

function analyzeMaintenanceNeeds(
  vehicleData: DriverProfile['vehicleData'],
  currentMileage: number,
  recentPerformance: any,
  symptoms: string[]
): any {
  const predictions = [];
  const lastService = vehicleData.maintenanceHistory[vehicleData.maintenanceHistory.length - 1];

  // Service interval predictions
  if (lastService) {
    const milesSinceService = currentMileage - lastService.mileage;
    const monthsSinceService = (Date.now() - new Date(lastService.date).getTime()) / (1000 * 60 * 60 * 24 * 30);

    // Oil change (every 10,000 miles or 6 months)
    if (milesSinceService > 8000 || monthsSinceService > 5) {
      predictions.push({
        type: 'oil_change',
        urgency: milesSinceService > 10000 || monthsSinceService > 6 ? 'high' : 'medium',
        description: 'Oil change recommended',
        estimatedCost: 80,
        dueIn: Math.min(
          Math.max(0, 10000 - milesSinceService),
          Math.max(0, (6 - monthsSinceService) * 1000) // Convert months to approximate miles
        ),
        confidence: 0.9
      });
    }

    // Brake inspection (every 20,000 miles)
    if (milesSinceService > 18000) {
      predictions.push({
        type: 'brake_inspection',
        urgency: 'medium',
        description: 'Brake inspection recommended',
        estimatedCost: 120,
        dueIn: Math.max(0, 20000 - milesSinceService),
        confidence: 0.8
      });
    }
  }

  // Performance-based predictions
  if (recentPerformance) {
    if (recentPerformance.fuelEfficiency > vehicleData.averageFuelConsumption * 1.2) {
      predictions.push({
        type: 'fuel_system_check',
        urgency: 'medium',
        description: 'Fuel efficiency decreased - check fuel system',
        estimatedCost: 150,
        dueIn: 0, // Immediate attention
        confidence: 0.7
      });
    }

    if (recentPerformance.enginePerformance < 80) {
      predictions.push({
        type: 'engine_diagnostic',
        urgency: 'high',
        description: 'Engine performance degraded - diagnostic recommended',
        estimatedCost: 200,
        dueIn: 0,
        confidence: 0.85
      });
    }
  }

  // Symptom-based predictions
  if (symptoms.includes('rough_idle')) {
    predictions.push({
      type: 'spark_plugs',
      urgency: 'medium',
      description: 'Rough idle may indicate spark plug issues',
      estimatedCost: 180,
      dueIn: 0,
      confidence: 0.75
    });
  }

  if (symptoms.includes('reduced_power')) {
    predictions.push({
      type: 'air_filter',
      urgency: 'low',
      description: 'Reduced power may be due to clogged air filter',
      estimatedCost: 45,
      dueIn: 0,
      confidence: 0.6
    });
  }

  return {
    vehicleId: vehicleData.vehicleId,
    currentMileage,
    predictions,
    overallHealth: predictions.length > 0 ? 'needs_attention' : 'good',
    nextRecommendedService: lastService?.nextServiceDue,
    estimatedMonthlyMaintenance: 120 // Based on historical data
  };
}
