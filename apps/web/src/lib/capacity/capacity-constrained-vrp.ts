/**
 * Capacity-Constrained Vehicle Routing Problem (VRP) Solver
 * 
 * Intelligent route optimization with strict Luton van capacity enforcement.
 * Uses greedy insertion heuristic with repair mechanisms for infeasible routes.
 * 
 * Key Features:
 * - Rejects infeasible load combinations upfront
 * - Suggests alternative routing strategies
 * - Optimizes stop sequence to minimize capacity violations
 * - Accounts for UK_Removal_Dataset item specifications
 */

import { z } from 'zod';
import {
  validateLegByLegCapacity,
  type RouteStop,
  type LegByLegAnalysis,
} from './leg-by-leg-validator';
import {
  LUTON_VAN_SPECS,
  MULTI_DROP_CONFIG,
  isWithinCapacity,
} from './luton-van-specs';
import {
  calculateCapacityMetrics,
  type RemovalItemWithHandling,
} from '../dataset/uk-removal-dataset-loader';

// ============================================================================
// Types and Schemas
// ============================================================================

/**
 * Booking request with pickup and delivery locations
 */
export interface BookingRequest {
  id: string;
  pickupAddress: string;
  deliveryAddress: string;
  itemIds: string[];
  priority?: 'standard' | 'express' | 'economy';
  timeWindow?: {
    earliestPickup?: Date;
    latestDelivery?: Date;
  };
}

/**
 * Optimized route solution
 */
export interface RouteSolution {
  routeId: string;
  feasible: boolean;
  tier: 'economy' | 'standard' | 'express';
  
  // Route sequence
  stops: RouteStop[];
  
  // Capacity analysis
  capacityAnalysis: LegByLegAnalysis;
  
  // Performance metrics
  totalDistance_km?: number;
  estimatedDuration_hours?: number;
  
  // Optimization info
  optimizationMethod: string;
  iterationsRequired: number;
}

/**
 * Route planning result with alternatives
 */
export interface RoutePlanResult {
  primaryRoute: RouteSolution | null;
  alternativeRoutes: RouteSolution[];
  
  rejectionReasons: string[];
  suggestions: string[];
  
  // Feasibility summary
  isFeasible: boolean;
  requiresMultipleVans: boolean;
  
  // Metadata
  bookingRequests: BookingRequest[];
  totalItemCount: number;
  totalVolume_m3: number;
  totalWeight_kg: number;
}

// Zod schemas
const BookingRequestSchema = z.object({
  id: z.string(),
  pickupAddress: z.string().min(1),
  deliveryAddress: z.string().min(1),
  itemIds: z.array(z.string()).min(1),
  priority: z.enum(['standard', 'express', 'economy']).optional(),
  timeWindow: z.object({
    earliestPickup: z.date().optional(),
    latestDelivery: z.date().optional(),
  }).optional(),
});

// ============================================================================
// VRP Solver - Main Entry Point
// ============================================================================

/**
 * Plan optimal route for one or more booking requests
 * 
 * @param bookings - Array of booking requests to combine into route
 * @param options - Planning options (tier, max iterations, etc.)
 * @returns Optimized route plan with alternatives
 */
export async function planCapacityConstrainedRoute(
  bookings: BookingRequest[],
  options?: {
    tier?: 'economy' | 'standard' | 'express';
    maxIterations?: number;
    allowMultipleVans?: boolean;
  }
): Promise<RoutePlanResult> {
  // Validate inputs
  const validatedBookings = bookings.map(b => BookingRequestSchema.parse(b)) as BookingRequest[];
  
  const tier = options?.tier || 'economy';
  const maxIterations = options?.maxIterations || 100;
  const allowMultipleVans = options?.allowMultipleVans ?? true;
  
  // Calculate total load
  const allItemIds = validatedBookings.flatMap(b => b.itemIds);
  const totalMetrics = await calculateCapacityMetrics(allItemIds);
  
  const rejectionReasons: string[] = [];
  const suggestions: string[] = [];
  
  // Quick feasibility check: Can all items fit in a single van?
  const quickCheck = isWithinCapacity(
    totalMetrics.totalVolume,
    totalMetrics.totalWeight,
    { tier, stopCount: validatedBookings.length * 2 } // Estimate: 1 pickup + 1 dropoff per booking
  );
  
  if (!quickCheck.fits) {
    rejectionReasons.push(...quickCheck.reasons);
    
    if (allowMultipleVans) {
      suggestions.push('Consider splitting into multiple van loads');
      suggestions.push('Use higher tier (Standard/Express) with smaller buffers');
    } else {
      suggestions.push('Reduce item count or weight');
      suggestions.push('Split delivery into multiple trips');
    }
    
    return {
      primaryRoute: null,
      alternativeRoutes: [],
      rejectionReasons,
      suggestions,
      isFeasible: false,
      requiresMultipleVans: true,
      bookingRequests: validatedBookings,
      totalItemCount: allItemIds.length,
      totalVolume_m3: totalMetrics.totalVolume,
      totalWeight_kg: totalMetrics.totalWeight,
    };
  }
  
  // Attempt route optimization
  try {
    // Strategy 1: INTELLIGENT DYNAMIC CAPACITY OPTIMIZER (NEW!)
    // This strategy actively reuses freed capacity after each drop
    const dynamicRoute = await findOptimalInterleavingPattern(validatedBookings, tier);
    
    if (dynamicRoute.capacityAnalysis.isFeasible) {
      return {
        primaryRoute: dynamicRoute,
        alternativeRoutes: [],
        rejectionReasons: [],
        suggestions: [
          'Route optimized using dynamic capacity reuse strategy',
          `Peak utilization: ${(dynamicRoute.capacityAnalysis.peakVolumeUtilization * 100).toFixed(1)}% volume, ${(dynamicRoute.capacityAnalysis.peakWeightUtilization * 100).toFixed(1)}% weight`,
          ...dynamicRoute.capacityAnalysis.warnings,
        ],
        isFeasible: true,
        requiresMultipleVans: false,
        bookingRequests: validatedBookings,
        totalItemCount: allItemIds.length,
        totalVolume_m3: totalMetrics.totalVolume,
        totalWeight_kg: totalMetrics.totalWeight,
      };
    }
    
    // Strategy 2: Fallback to greedy (for comparison)
    const greedyRoute = await buildGreedyRoute(validatedBookings, tier);
    
    if (greedyRoute.capacityAnalysis.isFeasible) {
      return {
        primaryRoute: greedyRoute,
        alternativeRoutes: [dynamicRoute], // Include dynamic route for analysis
        rejectionReasons: [],
        suggestions: greedyRoute.capacityAnalysis.warnings,
        isFeasible: true,
        requiresMultipleVans: false,
        bookingRequests: validatedBookings,
        totalItemCount: allItemIds.length,
        totalVolume_m3: totalMetrics.totalVolume,
        totalWeight_kg: totalMetrics.totalWeight,
      };
    }
    
    // Strategy 3: Repair infeasible route
    const repairedRoute = await repairInfeasibleRoute(
      dynamicRoute.capacityAnalysis.isFeasible ? greedyRoute : dynamicRoute, 
      tier, 
      maxIterations
    );
    
    if (repairedRoute && repairedRoute.capacityAnalysis.isFeasible) {
      return {
        primaryRoute: repairedRoute,
        alternativeRoutes: [greedyRoute, dynamicRoute],
        rejectionReasons: [],
        suggestions: ['Route optimized using repair heuristic', ...repairedRoute.capacityAnalysis.warnings],
        isFeasible: true,
        requiresMultipleVans: false,
        bookingRequests: validatedBookings,
        totalItemCount: allItemIds.length,
        totalVolume_m3: totalMetrics.totalVolume,
        totalWeight_kg: totalMetrics.totalWeight,
      };
    }
    
    // Strategy 4: Try alternative stop sequences
    const alternativeRoutes = await generateAlternativeRoutes(validatedBookings, tier, 3);
    const feasibleAlternative = alternativeRoutes.find(r => r.capacityAnalysis.isFeasible);
    
    if (feasibleAlternative) {
      return {
        primaryRoute: feasibleAlternative,
        alternativeRoutes: alternativeRoutes.filter(r => r !== feasibleAlternative),
        rejectionReasons: [],
        suggestions: ['Found feasible route using alternative sequencing'],
        isFeasible: true,
        requiresMultipleVans: false,
        bookingRequests: validatedBookings,
        totalItemCount: allItemIds.length,
        totalVolume_m3: totalMetrics.totalVolume,
        totalWeight_kg: totalMetrics.totalWeight,
      };
    }
    
    // All strategies failed
    rejectionReasons.push('No feasible single-van route found despite total capacity check passing');
    rejectionReasons.push('Likely issue: Peak load during multi-drop exceeds capacity');
    
    const bestRoute = [dynamicRoute, greedyRoute, ...alternativeRoutes]
      .sort((a, b) => a.capacityAnalysis.peakVolumeUtilization - b.capacityAnalysis.peakVolumeUtilization)[0];
    
    const peakLoad = bestRoute.capacityAnalysis.peakVolume_m3;
    const peakWeight = bestRoute.capacityAnalysis.peakWeight_kg;
    
    suggestions.push(`Peak load: ${peakLoad.toFixed(2)}m³, ${peakWeight.toFixed(0)}kg`);
    suggestions.push('Optimize delivery sequence to reduce peak load');
    suggestions.push('Consider splitting high-overlap bookings');
    suggestions.push('Try higher tier (Standard/Express) with reduced buffers');
    
    return {
      primaryRoute: bestRoute,
      alternativeRoutes: [dynamicRoute, greedyRoute, ...alternativeRoutes].filter(r => r !== bestRoute),
      rejectionReasons,
      suggestions,
      isFeasible: false,
      requiresMultipleVans: false,
      bookingRequests: validatedBookings,
      totalItemCount: allItemIds.length,
      totalVolume_m3: totalMetrics.totalVolume,
      totalWeight_kg: totalMetrics.totalWeight,
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    rejectionReasons.push(`Route planning failed: ${errorMessage}`);
    
    return {
      primaryRoute: null,
      alternativeRoutes: [],
      rejectionReasons,
      suggestions: ['Contact support for manual route planning'],
      isFeasible: false,
      requiresMultipleVans: false,
      bookingRequests: validatedBookings,
      totalItemCount: allItemIds.length,
      totalVolume_m3: totalMetrics.totalVolume,
      totalWeight_kg: totalMetrics.totalWeight,
    };
  }
}

// ============================================================================
// Route Building Strategies
// ============================================================================

/**
 * Build route using greedy nearest-neighbor insertion
 * Strategy: Process bookings in order, pickup before dropoff
 */
async function buildGreedyRoute(
  bookings: BookingRequest[],
  tier: 'economy' | 'standard' | 'express'
): Promise<RouteSolution> {
  const stops: RouteStop[] = [];
  let sequenceNumber = 1;
  
  // Simple greedy: All pickups first, then all dropoffs
  for (const booking of bookings) {
    stops.push({
      id: `${booking.id}_pickup`,
      type: 'pickup',
      address: booking.pickupAddress,
      itemIds: booking.itemIds,
      sequenceNumber: sequenceNumber++,
    });
  }
  
  for (const booking of bookings) {
    stops.push({
      id: `${booking.id}_dropoff`,
      type: 'dropoff',
      address: booking.deliveryAddress,
      itemIds: booking.itemIds,
      sequenceNumber: sequenceNumber++,
    });
  }
  
  const capacityAnalysis = await validateLegByLegCapacity(stops, { tier });
  
  return {
    routeId: `route_${Date.now()}`,
    feasible: capacityAnalysis.isFeasible,
    tier,
    stops,
    capacityAnalysis,
    optimizationMethod: 'greedy_pickups_first',
    iterationsRequired: 1,
  };
}

/**
 * INTELLIGENT DYNAMIC CAPACITY OPTIMIZER
 * 
 * Reorders stops to maximize capacity reuse after each drop-off.
 * Key insight: After a drop, freed space can be used for new pickups,
 * reducing peak load and enabling more efficient multi-drop routes.
 * 
 * Algorithm:
 * 1. Calculate volume/weight for each booking
 * 2. Try pickup-dropoff interleaving (drop early, free space, reuse)
 * 3. Prioritize drops that free the most space
 * 4. Find sequence with lowest peak utilization
 */
async function buildDynamicCapacityOptimizedRoute(
  bookings: BookingRequest[],
  tier: 'economy' | 'standard' | 'express'
): Promise<RouteSolution> {
  // Calculate metrics for each booking
  const bookingsWithMetrics = await Promise.all(
    bookings.map(async (booking) => {
      const metrics = await calculateCapacityMetrics(booking.itemIds);
      return { 
        booking, 
        volume: metrics.totalVolume,
        weight: metrics.totalWeight,
      };
    })
  );
  
  // Sort by volume (largest first) - we want to drop large items early
  const sortedBookings = bookingsWithMetrics.sort((a, b) => b.volume - a.volume);
  
  // Build interleaved route: pickup large item → drop it early → free space → pickup next
  const stops: RouteStop[] = [];
  let sequenceNumber = 1;
  
  // Strategy: For each booking, add pickup then immediate dropoff
  // This frees space quickly, allowing subsequent pickups without exceeding capacity
  for (const { booking } of sortedBookings) {
    // Add pickup
    stops.push({
      id: `${booking.id}_pickup`,
      type: 'pickup',
      address: booking.pickupAddress,
      itemIds: booking.itemIds,
      sequenceNumber: sequenceNumber++,
    });
    
    // Add dropoff immediately after (if single booking)
    // For multi-booking, delay dropoff strategically
    if (bookings.length === 1) {
      stops.push({
        id: `${booking.id}_dropoff`,
        type: 'dropoff',
        address: booking.deliveryAddress,
        itemIds: booking.itemIds,
        sequenceNumber: sequenceNumber++,
      });
    }
  }
  
  // For multi-booking: Add remaining dropoffs, prioritizing largest items first
  if (bookings.length > 1) {
    for (const { booking } of sortedBookings) {
      stops.push({
        id: `${booking.id}_dropoff`,
        type: 'dropoff',
        address: booking.deliveryAddress,
        itemIds: booking.itemIds,
        sequenceNumber: sequenceNumber++,
      });
    }
  }
  
  const capacityAnalysis = await validateLegByLegCapacity(stops, { tier });
  
  return {
    routeId: `route_dynamic_optimized_${Date.now()}`,
    feasible: capacityAnalysis.isFeasible,
    tier,
    stops,
    capacityAnalysis,
    optimizationMethod: 'dynamic_capacity_reuse',
    iterationsRequired: 1,
  };
}

/**
 * ADVANCED: Find optimal pickup-dropoff interleaving pattern
 * 
 * Tests multiple interleaving patterns to find the one with:
 * - Lowest peak utilization
 * - Maximum capacity reuse
 * - Fewest violations
 */
async function findOptimalInterleavingPattern(
  bookings: BookingRequest[],
  tier: 'economy' | 'standard' | 'express'
): Promise<RouteSolution> {
  const bookingsWithMetrics = await Promise.all(
    bookings.map(async (booking) => {
      const metrics = await calculateCapacityMetrics(booking.itemIds);
      return { 
        booking, 
        volume: metrics.totalVolume,
        weight: metrics.totalWeight,
        score: metrics.totalVolume * 0.6 + metrics.totalWeight * 0.4, // Weighted score
      };
    })
  );
  
  // Try different strategies and pick the best one
  const strategies: (() => RouteStop[])[] = [
    // Strategy 1: Drop largest items first (free space early)
    () => {
      const sorted = [...bookingsWithMetrics].sort((a, b) => b.score - a.score);
      return buildSequenceWithEarlyDrops(sorted, 1);
    },
    
    // Strategy 2: Interleave every other booking
    () => {
      const sorted = [...bookingsWithMetrics].sort((a, b) => b.score - a.score);
      return buildSequenceWithEarlyDrops(sorted, 2);
    },
    
    // Strategy 3: Batch pickups, then batch dropoffs (by size)
    () => {
      const sorted = [...bookingsWithMetrics].sort((a, b) => a.score - b.score);
      const stops: RouteStop[] = [];
      let seq = 1;
      
      sorted.forEach(({ booking }) => {
        stops.push({
          id: `${booking.id}_pickup`,
          type: 'pickup',
          address: booking.pickupAddress,
          itemIds: booking.itemIds,
          sequenceNumber: seq++,
        });
      });
      
      sorted.reverse().forEach(({ booking }) => {
        stops.push({
          id: `${booking.id}_dropoff`,
          type: 'dropoff',
          address: booking.deliveryAddress,
          itemIds: booking.itemIds,
          sequenceNumber: seq++,
        });
      });
      
      return stops;
    },
  ];
  
  // Test all strategies, pick the one with lowest peak utilization
  let bestRoute: RouteSolution | null = null;
  let bestPeakUtilization = Infinity;
  
  for (const strategy of strategies) {
    const stops = strategy();
    const analysis = await validateLegByLegCapacity(stops, { tier });
    
    const peakUtilization = Math.max(
      analysis.peakVolumeUtilization,
      analysis.peakWeightUtilization
    );
    
    if (analysis.isFeasible || peakUtilization < bestPeakUtilization) {
      bestPeakUtilization = peakUtilization;
      bestRoute = {
        routeId: `route_optimal_interleaved_${Date.now()}`,
        feasible: analysis.isFeasible,
        tier,
        stops,
        capacityAnalysis: analysis,
        optimizationMethod: 'optimal_interleaving',
        iterationsRequired: strategies.length,
      };
      
      // If feasible, no need to continue
      if (analysis.isFeasible) break;
    }
  }
  
  return bestRoute!;
}

/**
 * Helper: Build route sequence with early drops (every N pickups)
 */
function buildSequenceWithEarlyDrops(
  bookingsWithMetrics: Array<{
    booking: BookingRequest;
    volume: number;
    weight: number;
    score: number;
  }>,
  dropInterval: number
): RouteStop[] {
  const stops: RouteStop[] = [];
  let sequenceNumber = 1;
  const pendingDrops: Array<{ booking: BookingRequest }> = [];
  
  bookingsWithMetrics.forEach(({ booking }, index) => {
    // Add pickup
    stops.push({
      id: `${booking.id}_pickup`,
      type: 'pickup',
      address: booking.pickupAddress,
      itemIds: booking.itemIds,
      sequenceNumber: sequenceNumber++,
    });
    
    pendingDrops.push({ booking });
    
    // Every N pickups, drop the oldest items (FIFO)
    if ((index + 1) % dropInterval === 0 || index === bookingsWithMetrics.length - 1) {
      while (pendingDrops.length > 0) {
        const { booking: dropBooking } = pendingDrops.shift()!;
        stops.push({
          id: `${dropBooking.id}_dropoff`,
          type: 'dropoff',
          address: dropBooking.deliveryAddress,
          itemIds: dropBooking.itemIds,
          sequenceNumber: sequenceNumber++,
        });
      }
    }
  });
  
  return stops;
}

/**
 * Repair infeasible route by reordering stops
 * Strategy: Move dropoffs earlier to reduce peak load
 */
async function repairInfeasibleRoute(
  infeasibleRoute: RouteSolution,
  tier: 'economy' | 'standard' | 'express',
  maxIterations: number
): Promise<RouteSolution | null> {
  let currentStops = [...infeasibleRoute.stops];
  let bestRoute = infeasibleRoute;
  let bestViolationCount = infeasibleRoute.capacityAnalysis.violations.length;
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Find stop with highest violation
    const violations = bestRoute.capacityAnalysis.violations;
    if (violations.length === 0) {
      return bestRoute; // Repaired!
    }
    
    const criticalViolation = violations.reduce((max, v) => 
      v.volumeUtilization + v.weightUtilization > max.volumeUtilization + max.weightUtilization ? v : max
    );
    
    // Try to move a dropoff before the critical stop
    const dropoffStops = currentStops.filter(s => s.type === 'dropoff');
    
    for (const dropoff of dropoffStops) {
      // Try moving this dropoff earlier
      const reorderedStops = reorderStops(currentStops, dropoff.id, criticalViolation.stopSequence - 1);
      
      if (!reorderedStops) continue;
      
      const testAnalysis = await validateLegByLegCapacity(reorderedStops, { tier });
      
      if (testAnalysis.isFeasible) {
        return {
          routeId: `route_repaired_${Date.now()}`,
          feasible: true,
          tier,
          stops: reorderedStops,
          capacityAnalysis: testAnalysis,
          optimizationMethod: 'repair_reorder',
          iterationsRequired: iteration + 1,
        };
      }
      
      // Track best improvement
      if (testAnalysis.violations.length < bestViolationCount) {
        bestViolationCount = testAnalysis.violations.length;
        bestRoute = {
          routeId: `route_repair_attempt_${Date.now()}`,
          feasible: false,
          tier,
          stops: reorderedStops,
          capacityAnalysis: testAnalysis,
          optimizationMethod: 'repair_reorder',
          iterationsRequired: iteration + 1,
        };
        currentStops = reorderedStops;
      }
    }
    
    // No improvement found
    if (bestViolationCount === violations.length) {
      break;
    }
  }
  
  return bestViolationCount < infeasibleRoute.capacityAnalysis.violations.length ? bestRoute : null;
}

/**
 * Generate alternative route sequences
 */
async function generateAlternativeRoutes(
  bookings: BookingRequest[],
  tier: 'economy' | 'standard' | 'express',
  count: number
): Promise<RouteSolution[]> {
  const alternatives: RouteSolution[] = [];
  
  // Strategy 1: Interleave pickups and dropoffs
  const interleavedStops = buildInterleavedRoute(bookings);
  const interleavedAnalysis = await validateLegByLegCapacity(interleavedStops, { tier });
  alternatives.push({
    routeId: `route_interleaved_${Date.now()}`,
    feasible: interleavedAnalysis.isFeasible,
    tier,
    stops: interleavedStops,
    capacityAnalysis: interleavedAnalysis,
    optimizationMethod: 'interleaved_pickup_dropoff',
    iterationsRequired: 1,
  });
  
  // Strategy 2: Priority-based (express first)
  const priorityStops = buildPriorityRoute(bookings);
  const priorityAnalysis = await validateLegByLegCapacity(priorityStops, { tier });
  alternatives.push({
    routeId: `route_priority_${Date.now()}`,
    feasible: priorityAnalysis.isFeasible,
    tier,
    stops: priorityStops,
    capacityAnalysis: priorityAnalysis,
    optimizationMethod: 'priority_based',
    iterationsRequired: 1,
  });
  
  // Strategy 3: Smallest items first
  const smallestFirstStops = await buildSmallestFirstRoute(bookings);
  const smallestFirstAnalysis = await validateLegByLegCapacity(smallestFirstStops, { tier });
  alternatives.push({
    routeId: `route_smallest_first_${Date.now()}`,
    feasible: smallestFirstAnalysis.isFeasible,
    tier,
    stops: smallestFirstStops,
    capacityAnalysis: smallestFirstAnalysis,
    optimizationMethod: 'smallest_first',
    iterationsRequired: 1,
  });
  
  return alternatives.slice(0, count);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build interleaved route: pickup → dropoff → pickup → dropoff
 */
function buildInterleavedRoute(bookings: BookingRequest[]): RouteStop[] {
  const stops: RouteStop[] = [];
  let sequenceNumber = 1;
  
  for (const booking of bookings) {
    stops.push({
      id: `${booking.id}_pickup`,
      type: 'pickup',
      address: booking.pickupAddress,
      itemIds: booking.itemIds,
      sequenceNumber: sequenceNumber++,
    });
    
    stops.push({
      id: `${booking.id}_dropoff`,
      type: 'dropoff',
      address: booking.deliveryAddress,
      itemIds: booking.itemIds,
      sequenceNumber: sequenceNumber++,
    });
  }
  
  return stops;
}

/**
 * Build priority-based route: express → standard → economy
 */
function buildPriorityRoute(bookings: BookingRequest[]): RouteStop[] {
  const priorityOrder = { express: 1, standard: 2, economy: 3 };
  
  const sortedBookings = [...bookings].sort((a, b) => {
    const aPriority = priorityOrder[a.priority || 'standard'];
    const bPriority = priorityOrder[b.priority || 'standard'];
    return aPriority - bPriority;
  });
  
  return buildInterleavedRoute(sortedBookings);
}

/**
 * Build smallest-items-first route
 */
async function buildSmallestFirstRoute(bookings: BookingRequest[]): Promise<RouteStop[]> {
  // Calculate total volume for each booking
  const bookingsWithVolume = await Promise.all(
    bookings.map(async (booking) => {
      const metrics = await calculateCapacityMetrics(booking.itemIds);
      return { booking, volume: metrics.totalVolume };
    })
  );
  
  const sortedBookings = bookingsWithVolume
    .sort((a, b) => a.volume - b.volume)
    .map(item => item.booking);
  
  return buildInterleavedRoute(sortedBookings);
}

/**
 * Reorder stops by moving one stop to a new position
 */
function reorderStops(
  stops: RouteStop[],
  stopId: string,
  newSequence: number
): RouteStop[] | null {
  const stopIndex = stops.findIndex(s => s.id === stopId);
  if (stopIndex === -1) return null;
  
  const reordered = [...stops];
  const [movedStop] = reordered.splice(stopIndex, 1);
  
  // Insert at new position
  const insertIndex = Math.max(0, Math.min(newSequence - 1, reordered.length));
  reordered.splice(insertIndex, 0, movedStop);
  
  // Renumber sequences
  return reordered.map((stop, index) => ({
    ...stop,
    sequenceNumber: index + 1,
  }));
}

// ============================================================================
// Quick Feasibility Checks
// ============================================================================

/**
 * Quick check: Can bookings fit in single van?
 */
export async function canFitInSingleVan(
  bookings: BookingRequest[],
  tier: 'economy' | 'standard' | 'express' = 'economy'
): Promise<{
  fits: boolean;
  totalVolume_m3: number;
  totalWeight_kg: number;
  reasons: string[];
}> {
  const allItemIds = bookings.flatMap(b => b.itemIds);
  const metrics = await calculateCapacityMetrics(allItemIds);
  
  const check = isWithinCapacity(
    metrics.totalVolume,
    metrics.totalWeight,
    { tier, stopCount: bookings.length * 2 }
  );
  
  return {
    fits: check.fits,
    totalVolume_m3: metrics.totalVolume,
    totalWeight_kg: metrics.totalWeight,
    reasons: check.reasons,
  };
}

/**
 * Suggest split point for multiple vans
 */
export async function suggestVanSplit(
  bookings: BookingRequest[],
  tier: 'economy' | 'standard' | 'express' = 'economy'
): Promise<{
  van1Bookings: BookingRequest[];
  van2Bookings: BookingRequest[];
  van1Volume_m3: number;
  van1Weight_kg: number;
  van2Volume_m3: number;
  van2Weight_kg: number;
}> {
  // Simple split: divide by cumulative capacity
  const bookingsWithMetrics = await Promise.all(
    bookings.map(async (booking) => {
      const metrics = await calculateCapacityMetrics(booking.itemIds);
      return { booking, volume: metrics.totalVolume, weight: metrics.totalWeight };
    })
  );
  
  let van1: typeof bookingsWithMetrics = [];
  let van2: typeof bookingsWithMetrics = [];
  let van1Volume = 0;
  let van1Weight = 0;
  
  const halfCapacityVolume = LUTON_VAN_SPECS.cargo.usable_volume_m3 / 2;
  
  for (const item of bookingsWithMetrics) {
    if (van1Volume + item.volume <= halfCapacityVolume) {
      van1.push(item);
      van1Volume += item.volume;
      van1Weight += item.weight;
    } else {
      van2.push(item);
    }
  }
  
  const van2Volume = van2.reduce((sum, item) => sum + item.volume, 0);
  const van2Weight = van2.reduce((sum, item) => sum + item.weight, 0);
  
  return {
    van1Bookings: van1.map(item => item.booking),
    van2Bookings: van2.map(item => item.booking),
    van1Volume_m3: van1Volume,
    van1Weight_kg: van1Weight,
    van2Volume_m3: van2Volume,
    van2Weight_kg: van2Weight,
  };
}

// ============================================================================
// Exports
// ============================================================================

export { BookingRequestSchema };
