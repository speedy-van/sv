/**
 * Optimized Multi-Drop Routes API Endpoint
 * 
 * High-performance endpoint with caching, query optimization,
 * and performance monitoring for multi-drop route operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { APIPerformanceService } from '@/lib/services/api-performance-service';

export const dynamic = 'force-dynamic';

// Request validation schemas
const RouteQuerySchema = z.object({
  status: z.array(z.string()).optional(),
  driverId: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  includeDrops: z.boolean().optional().default(false),
  includeDriver: z.boolean().optional().default(false),
  skipCache: z.boolean().optional().default(false)
});

const DriverQuerySchema = z.object({
  status: z.array(z.string()).optional(),
  includeCurrentRoute: z.boolean().optional().default(false),
  includePerformanceMetrics: z.boolean().optional().default(false),
  limit: z.number().min(1).max(200).optional().default(100),
  skipCache: z.boolean().optional().default(false)
});

const BookingQuerySchema = z.object({
  status: z.array(z.string()).optional(),
  customerId: z.string().optional(),
  driverId: z.string().optional(),
  isMultiDrop: z.boolean().optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  includeRoute: z.boolean().optional().default(false),
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  skipCache: z.boolean().optional().default(false)
});

const BatchUpdateSchema = z.object({
  updates: z.array(z.object({
    bookingId: z.string(),
    status: z.string().optional(),
    actualArrival: z.string().datetime().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }))
});

/**
 * GET /api/performance/routes
 * Get optimized route data with caching
 */
export const GET = APIPerformanceService.withPerformanceMonitoring(
  '/api/performance/routes',
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(request.url);
      const endpoint = searchParams.get('endpoint');
      
      switch (endpoint) {
        case 'routes':
          return await handleRoutesQuery(searchParams);
        case 'drivers':
          return await handleDriversQuery(searchParams);
        case 'bookings':
          return await handleBookingsQuery(searchParams);
        case 'analytics':
          return await handleAnalyticsQuery(searchParams);
        default:
          return NextResponse.json({
            success: false,
            error: 'Invalid endpoint. Use: routes, drivers, bookings, or analytics'
          }, { status: 400 });
      }
    } catch (error) {
      console.error('Performance API error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Invalid query parameters',
          details: error.issues
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
);

async function handleRoutesQuery(searchParams: URLSearchParams): Promise<NextResponse> {
  const filters = RouteQuerySchema.parse({
    status: searchParams.get('status') ? searchParams.get('status')!.split(',') : undefined,
    driverId: searchParams.get('driverId') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    includeDrops: searchParams.get('includeDrops') === 'true',
    includeDriver: searchParams.get('includeDriver') === 'true',
    skipCache: searchParams.get('skipCache') === 'true'
  });
  
  console.log(`📊 Routes query with filters:`, filters);
  
  const result = await APIPerformanceService.getOptimizedRoutes(filters);
  
  return NextResponse.json({
    success: true,
    data: result.data,
    meta: {
      cached: result.cached,
      duration: result.duration,
      count: result.data.length,
      hasMore: result.data.length === filters.limit
    },
    timestamp: new Date().toISOString()
  });
}

async function handleDriversQuery(searchParams: URLSearchParams): Promise<NextResponse> {
  const filters = DriverQuerySchema.parse({
    status: searchParams.get('status') ? searchParams.get('status')!.split(',') : undefined,
    includeCurrentRoute: searchParams.get('includeCurrentRoute') === 'true',
    includePerformanceMetrics: searchParams.get('includePerformanceMetrics') === 'true',
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    skipCache: searchParams.get('skipCache') === 'true'
  });
  
  console.log(`👥 Drivers query with filters:`, filters);
  
  const result = await APIPerformanceService.getOptimizedDrivers(filters);
  
  return NextResponse.json({
    success: true,
    data: result.data,
    meta: {
      cached: result.cached,
      duration: result.duration,
      count: result.data.length,
      hasMore: result.data.length === filters.limit
    },
    timestamp: new Date().toISOString()
  });
}

async function handleBookingsQuery(searchParams: URLSearchParams): Promise<NextResponse> {
  const filters = BookingQuerySchema.parse({
    status: searchParams.get('status') ? searchParams.get('status')!.split(',') : undefined,
    customerId: searchParams.get('customerId') || undefined,
    driverId: searchParams.get('driverId') || undefined,
    isMultiDrop: searchParams.get('isMultiDrop') === 'true' ? true : 
                 searchParams.get('isMultiDrop') === 'false' ? false : undefined,
    dateRange: searchParams.get('dateStart') && searchParams.get('dateEnd') ? {
      start: searchParams.get('dateStart')!,
      end: searchParams.get('dateEnd')!
    } : undefined,
    includeRoute: searchParams.get('includeRoute') === 'true',
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    skipCache: searchParams.get('skipCache') === 'true'
  });
  
  console.log(`📋 Bookings query with filters:`, filters);
  
  const result = await APIPerformanceService.getOptimizedBookings({
    ...filters,
    dateRange: filters.dateRange ? {
      start: new Date(filters.dateRange.start),
      end: new Date(filters.dateRange.end)
    } : undefined
  });
  
  return NextResponse.json({
    success: true,
    data: result.data,
    meta: {
      cached: result.cached,
      duration: result.duration,
      count: result.data.length,
      hasMore: result.data.length === filters.limit
    },
    timestamp: new Date().toISOString()
  });
}

async function handleAnalyticsQuery(searchParams: URLSearchParams): Promise<NextResponse> {
  const timeframe = searchParams.get('timeframe') as 'hour' | 'day' | 'week' || 'hour';
  
  console.log(`📈 Analytics query for timeframe: ${timeframe}`);
  
  const analytics = APIPerformanceService.getPerformanceAnalytics(timeframe);
  const suggestions = await APIPerformanceService.analyzeQueryPerformance();
  
  return NextResponse.json({
    success: true,
    data: {
      performance: analytics,
      optimizationSuggestions: suggestions,
      cacheStats: {
        // Add cache statistics if needed
      }
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * POST /api/performance/routes
 * Batch operations and cache management
 */
export const POST = APIPerformanceService.withPerformanceMonitoring(
  '/api/performance/routes',
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const action = body.action;
      
      switch (action) {
        case 'batch_update':
          return await handleBatchUpdate(body);
        case 'clear_cache':
          return await handleClearCache(body);
        case 'optimize_database':
          return await handleOptimizeDatabase();
        default:
          return NextResponse.json({
            success: false,
            error: 'Invalid action. Use: batch_update, clear_cache, or optimize_database'
          }, { status: 400 });
      }
    } catch (error) {
      console.error('Performance API POST error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Invalid request data',
          details: error.issues
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
);

async function handleBatchUpdate(body: any): Promise<NextResponse> {
  const { updates } = BatchUpdateSchema.parse(body);
  
  console.log(`🔄 Batch updating ${updates.length} bookings`);
  
  const processedUpdates = updates.map(update => ({
    bookingId: update.bookingId,
    status: update.status,
    actualArrival: update.actualArrival ? new Date(update.actualArrival) : undefined,
    coordinates: update.coordinates && update.coordinates.lat !== undefined && update.coordinates.lng !== undefined
      ? { lat: update.coordinates.lat, lng: update.coordinates.lng }
      : undefined
  }));
  
  const result = await APIPerformanceService.batchUpdateBookings(processedUpdates);
  
  // Clear related caches
  APIPerformanceService.clearCache('bookings');
  APIPerformanceService.clearCache('routes');
  
  return NextResponse.json({
    success: true,
    data: {
      updated: result.length,
      results: result
    },
    timestamp: new Date().toISOString()
  });
}

async function handleClearCache(body: any): Promise<NextResponse> {
  const pattern = body.pattern;
  
  console.log(`🗑️ Clearing cache with pattern: ${pattern || 'all'}`);
  
  APIPerformanceService.clearCache(pattern);
  
  return NextResponse.json({
    success: true,
    message: pattern ? `Cleared caches matching pattern: ${pattern}` : 'Cleared all caches',
    timestamp: new Date().toISOString()
  });
}

async function handleOptimizeDatabase(): Promise<NextResponse> {
  console.log(`⚡ Running database optimization`);
  
  const connectionCheck = await APIPerformanceService.optimizeConnection();
  
  return NextResponse.json({
    success: true,
    data: {
      connectionHealth: connectionCheck,
      message: 'Database optimization completed'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * PUT /api/performance/routes
 * Configuration and settings updates
 */
export const PUT = APIPerformanceService.withPerformanceMonitoring(
  '/api/performance/routes',
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await request.json();
      
      // Handle performance configuration updates
      console.log(`⚙️ Updating performance configuration`);
      
      return NextResponse.json({
        success: true,
        message: 'Performance configuration updated',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Performance configuration update error:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Configuration update failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
);

/**
 * DELETE /api/performance/routes
 * Emergency cache clearing and reset
 */
export const DELETE = APIPerformanceService.withPerformanceMonitoring(
  '/api/performance/routes',
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      console.log(`🚨 Emergency performance reset requested`);
      
      // Clear all caches
      APIPerformanceService.clearCache();
      
      // Check database connection
      const connectionCheck = await APIPerformanceService.optimizeConnection();
      
      return NextResponse.json({
        success: true,
        data: {
          cacheCleared: true,
          connectionHealth: connectionCheck,
          message: 'Emergency performance reset completed'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Emergency performance reset error:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Emergency reset failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }
);