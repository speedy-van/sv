/**
 * Dynamic Capacity Analysis API
 * 
 * POST /api/routes/analyze
 * 
 * Analyzes a multi-drop route and returns detailed per-leg capacity breakdown.
 * Shows how volume/weight changes after each pickup and drop-off, demonstrating
 * intelligent capacity reuse.
 * 
 * Used by:
 * - Admin dashboard to visualize route efficiency
 * - Driver app to show load status at each stop
 * - Analytics to track capacity utilization trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { planCapacityConstrainedRoute, type BookingRequest } from '@/lib/capacity/capacity-constrained-vrp';
import { validateLegByLegCapacity, type RouteStop } from '@/lib/capacity/leg-by-leg-validator';

// ============================================================================
// Request/Response Schemas
// ============================================================================

const RouteAnalysisRequestSchema = z.object({
  bookings: z.array(z.object({
    id: z.string(),
    pickupAddress: z.string(),
    deliveryAddress: z.string(),
    itemIds: z.array(z.string()),
    priority: z.enum(['standard', 'express', 'economy']).optional(),
  })).min(1, 'At least one booking required'),
  tier: z.enum(['economy', 'standard', 'express']).optional().default('economy'),
  requestId: z.string().optional(),
});

interface LegLoadData {
  stopId: string;
  stopSequence: number;
  stopType: 'pickup' | 'dropoff';
  address: string;
  
  // Load state AFTER this stop
  volumeM3: number;
  weightKg: number;
  activeItemCount: number;
  
  // Utilization percentages (0-100)
  volumeUtilizationPercent: number;
  weightUtilizationPercent: number;
  
  // Items involved
  itemsAdded: string[];
  itemsRemoved: string[];
  
  // Freed capacity (negative for pickups, positive for dropoffs)
  volumeFreedM3: number;
  weightFreedKg: number;
  
  // Status
  isOverCapacity: boolean;
  warningMessage?: string;
}

interface RouteAnalysisResponse {
  success: boolean;
  requestId: string;
  
  // Route summary
  routeSummary: {
    isFeasible: boolean;
    totalStops: number;
    pickupStops: number;
    dropoffStops: number;
    optimizationMethod: string;
  };
  
  // Capacity overview
  capacityOverview: {
    peakVolumeM3: number;
    peakWeightKg: number;
    peakVolumeUtilizationPercent: number;
    peakWeightUtilizationPercent: number;
    
    totalVolumeM3: number;
    totalWeightKg: number;
    
    vehicleCapacityVolumeM3: number;
    vehicleCapacityWeightKg: number;
  };
  
  // Per-leg breakdown
  legByLegData: LegLoadData[];
  
  // Efficiency metrics
  efficiencyMetrics: {
    averageUtilizationPercent: number;
    capacityReuseCount: number;  // Number of times freed space was reused
    emptySpaceWastedM3: number;  // Total unused capacity across all legs
  };
  
  // Warnings and suggestions
  violations: Array<{
    stopSequence: number;
    violationType: 'volume' | 'weight' | 'both';
    message: string;
  }>;
  
  warnings: string[];
  suggestions: string[];
}

// ============================================================================
// API Handler
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = `analyze_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  
  try {
    // Parse request body
    const body = await request.json();
    const validatedData = RouteAnalysisRequestSchema.parse(body);
    
    const { bookings, tier } = validatedData;
    
    // Plan optimized route using dynamic capacity algorithm
    const routePlan = await planCapacityConstrainedRoute(
      bookings as BookingRequest[],
      { tier, maxIterations: 100 }
    );
    
    if (!routePlan.primaryRoute) {
      return NextResponse.json<RouteAnalysisResponse>({
        success: false,
        requestId,
        routeSummary: {
          isFeasible: false,
          totalStops: 0,
          pickupStops: 0,
          dropoffStops: 0,
          optimizationMethod: 'none',
        },
        capacityOverview: {
          peakVolumeM3: routePlan.totalVolume_m3,
          peakWeightKg: routePlan.totalWeight_kg,
          peakVolumeUtilizationPercent: 0,
          peakWeightUtilizationPercent: 0,
          totalVolumeM3: routePlan.totalVolume_m3,
          totalWeightKg: routePlan.totalWeight_kg,
          vehicleCapacityVolumeM3: 15.0,
          vehicleCapacityWeightKg: 1000,
        },
        legByLegData: [],
        efficiencyMetrics: {
          averageUtilizationPercent: 0,
          capacityReuseCount: 0,
          emptySpaceWastedM3: 0,
        },
        violations: [],
        warnings: routePlan.rejectionReasons,
        suggestions: routePlan.suggestions,
      });
    }
    
    const route = routePlan.primaryRoute;
    const analysis = route.capacityAnalysis;
    
    // Build leg-by-leg data with freed capacity calculations
    const legByLegData: LegLoadData[] = [];
    let previousVolumeM3 = 0;
    let previousWeightKg = 0;
    let capacityReuseCount = 0;
    
    for (const legState of analysis.legStates) {
      const volumeChange = legState.cumulativeVolume_m3 - previousVolumeM3;
      const weightChange = legState.cumulativeWeight_kg - previousWeightKg;
      
      // Count capacity reuse: when we drop items (free space) then later use it
      if (legState.stopType === 'dropoff' && volumeChange < 0) {
        capacityReuseCount++;
      }
      
      const legData: LegLoadData = {
        stopId: legState.stopId,
        stopSequence: legState.stopSequence,
        stopType: legState.stopType,
        address: legState.address,
        volumeM3: legState.cumulativeVolume_m3,
        weightKg: legState.cumulativeWeight_kg,
        activeItemCount: legState.activeItemCount,
        volumeUtilizationPercent: legState.volumeUtilization * 100,
        weightUtilizationPercent: legState.weightUtilization * 100,
        itemsAdded: legState.itemsAdded,
        itemsRemoved: legState.itemsRemoved,
        volumeFreedM3: -volumeChange,  // Negative for pickups, positive for dropoffs
        weightFreedKg: -weightChange,
        isOverCapacity: legState.volumeUtilization > 1.0 || legState.weightUtilization > 1.0,
        warningMessage: legState.volumeUtilization > 0.9 || legState.weightUtilization > 0.9
          ? 'Approaching capacity limit'
          : undefined,
      };
      
      legByLegData.push(legData);
      
      previousVolumeM3 = legState.cumulativeVolume_m3;
      previousWeightKg = legState.cumulativeWeight_kg;
    }
    
    // Calculate efficiency metrics
    const avgUtilization = legByLegData.reduce((sum, leg) => 
      sum + Math.max(leg.volumeUtilizationPercent, leg.weightUtilizationPercent), 0
    ) / legByLegData.length;
    
    const emptySpaceWasted = legByLegData.reduce((sum, leg) => {
      const unusedVolume = analysis.vehicleSpecs.cargo.usable_volume_m3 * 
        (1 - leg.volumeUtilizationPercent / 100);
      return sum + unusedVolume;
    }, 0);
    
    // Format violations
    const violations = analysis.violations.map(v => ({
      stopSequence: v.stopSequence,
      violationType: v.violationType,
      message: v.message,
    }));
    
    // Build response
    const response: RouteAnalysisResponse = {
      success: true,
      requestId,
      routeSummary: {
        isFeasible: analysis.isFeasible,
        totalStops: analysis.totalStops,
        pickupStops: analysis.pickupStops,
        dropoffStops: analysis.dropoffStops,
        optimizationMethod: route.optimizationMethod,
      },
      capacityOverview: {
        peakVolumeM3: analysis.peakVolume_m3,
        peakWeightKg: analysis.peakWeight_kg,
        peakVolumeUtilizationPercent: analysis.peakVolumeUtilization * 100,
        peakWeightUtilizationPercent: analysis.peakWeightUtilization * 100,
        totalVolumeM3: routePlan.totalVolume_m3,
        totalWeightKg: routePlan.totalWeight_kg,
        vehicleCapacityVolumeM3: analysis.vehicleSpecs.cargo.usable_volume_m3,
        vehicleCapacityWeightKg: analysis.vehicleSpecs.weight.available_payload_kg,
      },
      legByLegData,
      efficiencyMetrics: {
        averageUtilizationPercent: avgUtilization,
        capacityReuseCount,
        emptySpaceWastedM3: emptySpaceWasted,
      },
      violations,
      warnings: analysis.warnings,
      suggestions: routePlan.suggestions,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[Route Analysis API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          requestId,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        requestId,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Exports for testing
// ============================================================================

export type {
  LegLoadData,
  RouteAnalysisResponse,
};
