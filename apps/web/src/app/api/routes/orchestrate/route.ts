/**
 * Route Orchestration API Endpoint
 * 
 * POST /api/routes/orchestrate
 * 
 * Creates optimized Multi-Drop Routes from drops using business rules and constraints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RouteOrchestrationEngine, type Drop } from '@/lib/route-orchestration';

// Validation schemas
const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1)
});

const TimeWindowSchema = z.object({
  earliest: z.string().datetime(),
  latest: z.string().datetime()
});

const DropSchema = z.object({
  id: z.string(),
  bookingId: z.string().optional(),
  pickupLocation: LocationSchema,
  deliveryLocation: LocationSchema,
  timeWindow: TimeWindowSchema,
  weight: z.number().positive(),
  volume: z.number().positive(),
  serviceTier: z.enum(['economy', 'standard', 'premium']),
  priority: z.number().min(1).max(10),
  estimatedDuration: z.number().positive(),
  value: z.number().positive(),
  status: z.enum(['pending', 'assigned_to_route', 'picked_up', 'in_transit', 'delivered']).default('pending')
});

const OrchestrationRequestSchema = z.object({
  drops: z.array(DropSchema).min(1).max(100),
  options: z.object({
    emergencyMode: z.boolean().default(false),
    preferredStartTime: z.string().datetime().optional(),
    availableDrivers: z.number().positive().optional(),
    geofenceConstraints: z.array(z.object({
      lat: z.number(),
      lng: z.number(),
      radius: z.number().positive()
    })).optional(),
    customConfig: z.object({
      maxClusterRadius: z.number().positive().optional(),
      maxDropsPerRoute: z.number().positive().optional(),
      allowMixedTiers: z.boolean().optional()
    }).optional()
  }).default({ emergencyMode: false })
});

/**
 * POST /api/routes/orchestrate
 * Create optimized routes from drops
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { drops: rawDrops, options } = OrchestrationRequestSchema.parse(body);

    console.log(`🎯 Orchestrating routes for ${rawDrops.length} drops...`);

    // Transform data to internal format
    const drops: Drop[] = rawDrops.map(drop => ({
      id: drop.id,
      bookingId: drop.bookingId,
      pickupLocation: {
        latitude: drop.pickupLocation.latitude || 0,
        longitude: drop.pickupLocation.longitude || 0,
        address: drop.pickupLocation.address || 'Address not provided'
      },
      deliveryLocation: {
        latitude: drop.deliveryLocation.latitude || 0,
        longitude: drop.deliveryLocation.longitude || 0,
        address: drop.deliveryLocation.address || 'Address not provided'
      },
      timeWindow: {
        earliest: new Date(drop.timeWindow.earliest),
        latest: new Date(drop.timeWindow.latest)
      },
      weight: drop.weight,
      volume: drop.volume,
      serviceTier: drop.serviceTier,
      priority: drop.priority,
      estimatedDuration: drop.estimatedDuration,
      value: drop.value,
      status: drop.status
    }));

    // Initialize orchestration engine with custom config
    const engine = new RouteOrchestrationEngine(options.customConfig);

    // Transform options
  const orchestrationOptions: {
      emergencyMode?: boolean;
      preferredStartTime?: Date;
      availableDrivers?: number;
      geofenceConstraints?: { lat: number; lng: number; radius: number }[];
    } = {
      emergencyMode: options.emergencyMode,
      preferredStartTime: options.preferredStartTime ? new Date(options.preferredStartTime) : undefined,
      availableDrivers: options.availableDrivers,
      geofenceConstraints: options.geofenceConstraints?.map(g => ({ lat: g.lat, lng: g.lng, radius: g.radius }))
    };

    // Execute orchestration
    const startTime = Date.now();
    const result = await engine.orchestrateRoutes(drops, orchestrationOptions);
    const processingTime = Date.now() - startTime;

    console.log(`✅ Route orchestration complete in ${processingTime}ms`);
    console.log(`📊 Results: ${result.routes.length} routes, ${result.unassigned.length} unassigned, efficiency: ${result.metrics.efficiencyScore.toFixed(1)}`);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        processingTime,
        // Transform dates back to strings for JSON
        routes: result.routes.map(route => ({
          ...route,
          createdAt: route.createdAt.toISOString(),
          proposedStartTime: route.proposedStartTime.toISOString(),
          drops: route.drops.map(drop => ({
            ...drop,
            timeWindow: {
              earliest: drop.timeWindow.earliest.toISOString(),
              latest: drop.timeWindow.latest.toISOString()
            }
          }))
        })),
        unassigned: result.unassigned.map(drop => ({
          ...drop,
          timeWindow: {
            earliest: drop.timeWindow.earliest.toISOString(),
            latest: drop.timeWindow.latest.toISOString()
          }
        }))
      }
    });

  } catch (error) {
    console.error('Route orchestration failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Route orchestration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/routes/orchestration-config
 * Get current orchestration configuration
 */
export async function GET(): Promise<NextResponse> {
  try {
    const engine = new RouteOrchestrationEngine();
    
    // Get default configuration using miles for UK standards
    const mockConfig = {
      maxClusterRadius: 125, // 125 miles maximum coverage
      minDropsPerCluster: 2,
      maxDropsPerCluster: 8,
      maxRouteWeight: 500,
      maxRouteVolume: 10,
      maxRouteDuration: 480,
      maxDropsPerRoute: 12,
      maxTimeWindowSpread: 240,
      bufferTimePerDrop: 15,
      allowMixedTiers: false,
      maxDrivingDistance: 200,
      maxWorkingHours: 10,
      minRouteValue: 100,
      emergencyOverrideAllowed: true
    };

    return NextResponse.json({
      success: true,
      data: {
        config: mockConfig,
        description: 'Current route orchestration configuration',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Failed to get orchestration config:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get configuration'
    }, { status: 500 });
  }
}

/**
 * POST /api/routes/validate-drops
 * Validate drops before orchestration
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { drops: rawDrops } = z.object({
      drops: z.array(DropSchema)
    }).parse(body);

    const drops: Drop[] = rawDrops.map(drop => ({
      id: drop.id || `temp_${Date.now()}_${Math.random()}`,
      bookingId: drop.bookingId,
      pickupLocation: {
        latitude: drop.pickupLocation.latitude || 0,
        longitude: drop.pickupLocation.longitude || 0,
        address: drop.pickupLocation.address || 'Address not provided'
      },
      deliveryLocation: {
        latitude: drop.deliveryLocation.latitude || 0,
        longitude: drop.deliveryLocation.longitude || 0,
        address: drop.deliveryLocation.address || 'Address not provided'
      },
      timeWindow: {
        earliest: new Date(drop.timeWindow.earliest),
        latest: new Date(drop.timeWindow.latest)
      },
      weight: drop.weight,
      volume: drop.volume,
      serviceTier: drop.serviceTier,
      priority: drop.priority,
      estimatedDuration: drop.estimatedDuration,
      value: drop.value,
      status: drop.status
    }));

    const validationResults = {
      total: drops.length,
      valid: 0,
      invalid: 0,
      issues: [] as Array<{
        dropId: string;
        issues: string[];
      }>
    };

    for (const drop of drops) {
      const issues: string[] = [];

      // Basic validation
      if (!drop.pickupLocation || !drop.deliveryLocation) {
        issues.push('Missing pickup or delivery location');
      }

      if (!drop.timeWindow.earliest || !drop.timeWindow.latest) {
        issues.push('Invalid time window');
      }

      if (drop.timeWindow.latest <= drop.timeWindow.earliest) {
        issues.push('Time window end must be after start');
      }

      if (drop.weight <= 0 || drop.volume <= 0) {
        issues.push('Weight and volume must be positive');
      }

      if (drop.estimatedDuration <= 0) {
        issues.push('Estimated duration must be positive');
      }

      if (drop.value <= 0) {
        issues.push('Value must be positive');
      }

      // Time window validation
      const windowDuration = drop.timeWindow.latest.getTime() - drop.timeWindow.earliest.getTime();
      const maxWindowMs = 240 * 60 * 1000; // 4 hours
      if (windowDuration > maxWindowMs) {
        issues.push('Time window exceeds maximum duration (4 hours)');
      }

      if (issues.length > 0) {
        validationResults.invalid++;
        validationResults.issues.push({
          dropId: drop.id,
          issues
        });
      } else {
        validationResults.valid++;
      }
    }

    return NextResponse.json({
      success: true,
      data: validationResults
    });

  } catch (error) {
    console.error('Drop validation failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Validation failed'
    }, { status: 500 });
  }
}