/**
 * Debug API Route for Dual Provider System
 * Debug endpoint to check configuration and health
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const hasGoogleKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const hasMapboxToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    // Test imports
    let dualProviderService;
    let providerHealthMonitor;
    let dualProviderCache;
    let postcodeValidator;
    
    try {
      const serviceModule = await import('@/lib/dual-provider-service');
      dualProviderService = serviceModule.dualProviderService;
    } catch (error) {
      console.error('Failed to import dual provider service:', error);
    }
    
    try {
      const healthModule = await import('@/lib/provider-health-monitor');
      providerHealthMonitor = healthModule.providerHealthMonitor;
    } catch (error) {
      console.error('Failed to import provider health monitor:', error);
    }
    
    try {
      const cacheModule = await import('@/lib/dual-provider-cache');
      dualProviderCache = cacheModule.dualProviderCache;
    } catch (error) {
      console.error('Failed to import dual provider cache:', error);
    }
    
    try {
      const validatorModule = await import('@/lib/postcode-validator');
      postcodeValidator = validatorModule.PostcodeValidator;
    } catch (error) {
      console.error('Failed to import postcode validator:', error);
    }

    // Test postcode validation
    let postcodeTest;
    if (postcodeValidator) {
      postcodeTest = {
        'ML3 0DG': postcodeValidator.validateUKPostcode('ML3 0DG'),
        'SW1A 1AA': postcodeValidator.validateUKPostcode('SW1A 1AA'),
        'invalid': postcodeValidator.validateUKPostcode('invalid'),
      };
    }

    // Get service health if available
    let serviceHealth;
    if (dualProviderService) {
      try {
        serviceHealth = dualProviderService.getServiceHealth();
      } catch (error) {
        serviceHealth = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Get cache stats if available
    let cacheStats;
    if (dualProviderCache) {
      try {
        cacheStats = dualProviderCache.getStats();
      } catch (error) {
        cacheStats = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    return NextResponse.json({
      success: true,
      debug: 'Dual Provider System Debug',
      environment: {
        hasGoogleKey,
        hasMapboxToken,
        nodeEnv: process.env.NODE_ENV,
      },
      imports: {
        dualProviderService: !!dualProviderService,
        providerHealthMonitor: !!providerHealthMonitor,
        dualProviderCache: !!dualProviderCache,
        postcodeValidator: !!postcodeValidator,
      },
      tests: {
        postcodeValidation: postcodeTest,
      },
      serviceHealth,
      cacheStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
