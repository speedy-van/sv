/**
 * Intelligent Multi-Booking Route Optimizer
 * 
 * Combines multiple bookings (2-10) into a single optimized route.
 * Makes smart decisions about:
 * 1. Which bookings to combine in one route
 * 2. Optimal pickup/dropoff sequence (may interleave)
 * 3. When to keep items loaded vs unload early
 * 4. Balancing distance, time, and capacity constraints
 * 
 * Key Features:
 * - Supports flexible pickup/drop patterns (not just pickup-all → drop-all)
 * - Considers distance between stops to minimize total travel time
 * - Respects Luton van capacity at every leg
 * - Generates multiple alternative routes for comparison
 */

import { z } from 'zod';
import {
  planCapacityConstrainedRoute,
  type BookingRequest,
  type RouteSolution,
} from './capacity-constrained-vrp';
import {
  type RouteStop,
  type LegByLegAnalysis,
} from './leg-by-leg-validator';
import {
  calculateCapacityMetrics,
} from '../dataset/uk-removal-dataset-loader';
import { PerformanceTrackingService } from '../services/performance-tracking-service';

// ============================================================================
// Types and Schemas
// ============================================================================

/**
 * Location with coordinates (for distance calculations)
 */
export interface Location {
  address: string;
  lat?: number;
  lng?: number;
}

/**
 * Extended booking request with location details
 */
export interface ExtendedBookingRequest extends BookingRequest {
  pickupLocation?: Location;
  deliveryLocation?: Location;
  estimatedPickupDuration_minutes?: number;
  estimatedDeliveryDuration_minutes?: number;
}

/**
 * Multi-booking route (2-10 bookings combined)
 */
export interface MultiBookingRoute {
  routeId: string;
  bookingIds: string[];
  tier: 'economy' | 'standard' | 'express';
  
  // Stop sequence
  stops: RouteStop[];
  
  // Capacity analysis
  capacityAnalysis: LegByLegAnalysis;
  
  // Performance metrics - ALL IN MILES (STRICT COMPLIANCE)
  estimatedTotalDistance_miles: number; // ✅ MILES (converted from km)
  estimatedTotalDistance_km: number;    // ⚠️ DEPRECATED - kept for compatibility
  estimatedTotalDuration_hours: number;
  estimatedCostPerBooking: number;
  
  // Driver earnings validation (£500 cap enforcement)
  estimatedDriverPay_pence: number;     // ✅ Total driver earnings for this route
  requiresAdminApproval: boolean;       // ✅ True if exceeds £500 with other routes
  
  // Efficiency scores
  capacityEfficiency: number; // 0-1 (higher = better space utilization)
  routeEfficiency: number;    // 0-1 (higher = less backtracking)
  
  // Optimization details
  optimizationStrategy: string;
  alternativeRoutesCount: number;
  
  // Status for admin review
  status: 'pending_review' | 'approved' | 'rejected'; // ✅ Pre-execution review

  // Dynamic pricing preview
  pricingPreview?: DriverEarningsResponse;
}

/**
 * Multi-booking route planning result
 */
export interface MultiBookingRoutePlan {
  success: boolean;
  
  // Recommended routes
  recommendedRoutes: MultiBookingRoute[];
  
  // Alternative groupings
  alternativeGroupings: Array<{
    routes: MultiBookingRoute[];
    totalVans: number;
    totalCost: number;
    efficiency: number;
  }>;
  
  // Feasibility info
  allBookingsFit: boolean;
  requiresMultipleVans: boolean;
  
  // Statistics
  totalBookings: number;
  bookingsPerRoute: number[];
  averageCapacityUtilization: number;
  
  // Recommendations
  suggestions: string[];
  warnings: string[];
}

// Zod schemas
const ExtendedBookingRequestSchema = z.object({
  id: z.string(),
  pickupAddress: z.string(),
  deliveryAddress: z.string(),
  itemIds: z.array(z.string()).min(1),
  priority: z.enum(['standard', 'express', 'economy']).optional(),
  pickupLocation: z.object({
    address: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  deliveryLocation: z.object({
    address: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  estimatedPickupDuration_minutes: z.number().optional(),
  estimatedDeliveryDuration_minutes: z.number().optional(),
});

// ============================================================================
// Main Entry Point: Plan Multi-Booking Routes
// ============================================================================

/**
 * Plan optimal routes for multiple bookings (2-10 per route)
 * 
 * @param bookings - Array of bookings to combine into routes
 * @param options - Planning options
 * @returns Optimized multi-booking route plan
 */
export async function planMultiBookingRoutes(
  bookings: ExtendedBookingRequest[],
  options?: {
    tier?: 'economy' | 'standard' | 'express';
    maxBookingsPerRoute?: number;
    allowMultipleVans?: boolean;
    prioritizeCapacityEfficiency?: boolean; // vs prioritizing route distance
  }
): Promise<MultiBookingRoutePlan> {
  // Validate inputs
  const validatedBookings = bookings.map(b => 
    ExtendedBookingRequestSchema.parse(b)
  ) as ExtendedBookingRequest[];
  
  const tier = options?.tier || 'economy';
  const maxBookingsPerRoute = Math.min(options?.maxBookingsPerRoute || 10, 10);
  const prioritizeCapacity = options?.prioritizeCapacityEfficiency ?? true;
  
  const suggestions: string[] = [];
  const warnings: string[] = [];
  
  // Step 1: Calculate metrics for all bookings
  const bookingsWithMetrics = await Promise.all(
    validatedBookings.map(async (booking) => {
      const metrics = await calculateCapacityMetrics(booking.itemIds);
      return {
        booking,
        volume_m3: metrics.totalVolume,
        weight_kg: metrics.totalWeight,
        itemCount: booking.itemIds.length,
      };
    })
  );
  
  // Sort by volume (helps with grouping)
  bookingsWithMetrics.sort((a, b) => b.volume_m3 - a.volume_m3);
  
  // Step 2: Try different grouping strategies
  const groupingStrategies = [
    // Strategy 1: Greedy capacity-first (pack as many as possible)
    () => groupByCapacityFirst(bookingsWithMetrics, tier, maxBookingsPerRoute),
    
    // Strategy 2: Geographic clustering (combine nearby bookings)
    () => groupByGeographicProximity(bookingsWithMetrics, tier, maxBookingsPerRoute),
    
    // Strategy 3: Balanced (try to create equal-sized routes)
  () => groupBalanced(bookingsWithMetrics, tier, maxBookingsPerRoute),
  ];
  
  const allGroupings: Array<{
    routes: MultiBookingRoute[];
    totalVans: number;
    totalCost: number;
    efficiency: number;
  }> = [];
  
  for (const strategy of groupingStrategies) {
    try {
      const groups = strategy();
      
      // For each group, plan optimal route
      const routes: MultiBookingRoute[] = [];
      let totalCost = 0;
      let totalEfficiency = 0;
      
      for (const group of groups) {
        const routePlan = await planCapacityConstrainedRoute(
          group.map(item => item.booking),
          { tier, maxIterations: 100 }
        );
        
        if (routePlan.primaryRoute) {
          const route = await buildMultiBookingRoute(
            routePlan.primaryRoute,
            group.map(item => item.booking),
            tier
          );
          
          routes.push(route);
          totalCost += route.estimatedCostPerBooking * group.length;
          totalEfficiency += route.capacityEfficiency;
        }
      }
      
      if (routes.length > 0) {
        allGroupings.push({
          routes,
          totalVans: routes.length,
          totalCost,
          efficiency: totalEfficiency / routes.length,
        });
      }
    } catch (error) {
      console.error('[Multi-Booking Planner] Strategy failed:', error);
    }
  }
  
  // Step 3: Select best grouping
  if (allGroupings.length === 0) {
    warnings.push('Could not find feasible multi-booking routes');
    suggestions.push('Consider reducing items or using higher tier (Standard/Express)');
    
    return {
      success: false,
      recommendedRoutes: [],
      alternativeGroupings: [],
      allBookingsFit: false,
      requiresMultipleVans: true,
      totalBookings: validatedBookings.length,
      bookingsPerRoute: [],
      averageCapacityUtilization: 0,
      suggestions,
      warnings,
    };
  }
  
  // Sort by efficiency (or cost, depending on priority)
  const sortedGroupings = prioritizeCapacity
    ? allGroupings.sort((a, b) => b.efficiency - a.efficiency)
    : allGroupings.sort((a, b) => a.totalCost - b.totalCost);
  
  const bestGrouping = sortedGroupings[0];
  
  // Step 4: Build response
  const bookingsPerRoute = bestGrouping.routes.map(r => r.bookingIds.length);
  const avgCapacityUtilization = bestGrouping.routes.reduce(
    (sum, r) => sum + r.capacityAnalysis.peakVolumeUtilization, 0
  ) / bestGrouping.routes.length;
  
  // Generate suggestions
  if (bestGrouping.totalVans > 1) {
    suggestions.push(`Requires ${bestGrouping.totalVans} vans for optimal routing`);
  }
  
  if (avgCapacityUtilization < 0.3) {
    suggestions.push('Low capacity utilization - consider combining more bookings');
  }
  
  if (avgCapacityUtilization > 0.85) {
    warnings.push('High capacity utilization - route may be tight');
  }
  
  return {
    success: true,
    recommendedRoutes: bestGrouping.routes,
    alternativeGroupings: sortedGroupings.slice(1, 3), // Top 2 alternatives
    allBookingsFit: true,
    requiresMultipleVans: bestGrouping.totalVans > 1,
    totalBookings: validatedBookings.length,
    bookingsPerRoute,
    averageCapacityUtilization: avgCapacityUtilization * 100,
    suggestions,
    warnings,
  };
}

// ============================================================================
// Daily Cap Validation (£500 Enforcement)
// ============================================================================

/**
 * ✅ STRICT COMPLIANCE: Validate driver earnings don't exceed £500 daily cap
 * 
 * Must be called BEFORE route execution.
 * If cap exceeded, route MUST require admin approval.
 */
export async function validateDailyCapAndRequireApproval(
  routes: MultiBookingRoute[],
  driverId: string,
  currentDailyEarnings_pence: number
): Promise<{
  success: boolean;
  routes: MultiBookingRoute[];
  totalNewEarnings_pence: number;
  projectedDailyTotal_pence: number;
  exceedsCap: boolean;
  requiresAdminApproval: boolean;
  warnings: string[];
}> {
  const DAILY_CAP_PENCE = 50000; // £500.00
  
  const warnings: string[] = [];
  let runningDailyTotal = currentDailyEarnings_pence;
  let totalNewEarnings = 0;
  let requiresAdminApproval = false;

  const updatedRoutes: MultiBookingRoute[] = routes.map(route => ({ ...route }));

  for (const route of updatedRoutes) {
    const pricingRequest = buildPricingRequestForRoute(
      route,
      driverId,
      runningDailyTotal
    );

    try {
      const pricingResponse = calculateDriverEarnings(pricingRequest);
      route.pricingPreview = pricingResponse;

      const netPence = pricingResponse.breakdown.capped_net_earnings_pence;
      route.estimatedDriverPay_pence = netPence;
      route.requiresAdminApproval = pricingResponse.daily_cap_validation.requires_admin_approval;
      route.status = pricingResponse.status === 'pending_admin_review' ? 'pending_review' : 'approved';

      pricingResponse.warnings.forEach(warning => warnings.push(`[Route ${route.routeId}] ${warning}`));

      runningDailyTotal += netPence;
      totalNewEarnings += netPence;

      if (pricingResponse.daily_cap_validation.requires_admin_approval || pricingResponse.status === 'pending_admin_review') {
        requiresAdminApproval = true;
      }
    } catch (error) {
      console.error('[Multi-Booking Planner] Pricing preview failed:', error);
      warnings.push(`Pricing preview failed for route ${route.routeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Fall back to existing estimate
      runningDailyTotal += route.estimatedDriverPay_pence;
      totalNewEarnings += route.estimatedDriverPay_pence;
    }
  }

  const projectedDailyTotal = runningDailyTotal;
  const exceedsCap = projectedDailyTotal > DAILY_CAP_PENCE;

  if (exceedsCap) {
    const excessAmount = projectedDailyTotal - DAILY_CAP_PENCE;
    warnings.push(
      `⚠️ EXCEEDS £500 DAILY CAP by £${(excessAmount / 100).toFixed(2)} - ADMIN APPROVAL REQUIRED`
    );
    warnings.push(
      `Current: £${(currentDailyEarnings_pence / 100).toFixed(2)} + New: £${(totalNewEarnings / 100).toFixed(2)} = £${(projectedDailyTotal / 100).toFixed(2)}`
    );
    requiresAdminApproval = true;
  }

  if (requiresAdminApproval) {
    updatedRoutes.forEach(route => {
      route.requiresAdminApproval = true;
      route.status = 'pending_review';
    });
  }
  
  return {
    success: true,
    routes: updatedRoutes,
    totalNewEarnings_pence: totalNewEarnings,
    projectedDailyTotal_pence: projectedDailyTotal,
    exceedsCap,
    requiresAdminApproval,
    warnings,
  };
}

// ============================================================================
// Grouping Strategies
// ============================================================================

/**
 * Strategy 1: Greedy capacity-first
 * Pack as many bookings as possible into each route
 */
function groupByCapacityFirst(
  bookingsWithMetrics: Array<{
    booking: ExtendedBookingRequest;
    volume_m3: number;
    weight_kg: number;
  }>,
  tier: 'economy' | 'standard' | 'express',
  maxBookingsPerRoute: number
): Array<Array<{ booking: ExtendedBookingRequest; volume_m3: number; weight_kg: number }>> {
  const groups: typeof bookingsWithMetrics[] = [];
  const remaining = [...bookingsWithMetrics];
  
  while (remaining.length > 0) {
    const group: typeof bookingsWithMetrics = [];
    let groupVolume = 0;
    let groupWeight = 0;
    
    // Capacity limits (rough estimate)
    const maxVolume = 15 * 0.9; // 90% of Luton van capacity
    const maxWeight = 1000 * 0.9;
    
    for (let i = 0; i < remaining.length && group.length < maxBookingsPerRoute; i++) {
      const item = remaining[i];
      
      // Check if adding this booking would exceed capacity
      if (
        groupVolume + item.volume_m3 <= maxVolume &&
        groupWeight + item.weight_kg <= maxWeight
      ) {
        group.push(item);
        groupVolume += item.volume_m3;
        groupWeight += item.weight_kg;
        remaining.splice(i, 1);
        i--; // Adjust index after removal
      }
    }
    
    if (group.length > 0) {
      groups.push(group);
    } else {
      // Can't fit remaining items - force add single booking
      groups.push([remaining.shift()!]);
    }
  }
  
  return groups;
}

/**
 * Strategy 2: Geographic clustering
 * Group bookings that are geographically close
 */
function groupByGeographicProximity(
  bookingsWithMetrics: Array<{
    booking: ExtendedBookingRequest;
    volume_m3: number;
    weight_kg: number;
  }>,
  tier: 'economy' | 'standard' | 'express',
  maxBookingsPerRoute: number
): Array<Array<{ booking: ExtendedBookingRequest; volume_m3: number; weight_kg: number }>> {
  // For now, use capacity-first as fallback
  // TODO: Implement actual geographic clustering with lat/lng
  return groupByCapacityFirst(bookingsWithMetrics, tier, maxBookingsPerRoute);
}

/**
 * Strategy 3: Balanced grouping
 * Try to create routes with similar number of bookings
 */
function groupBalanced(
  bookingsWithMetrics: Array<{
    booking: ExtendedBookingRequest;
    volume_m3: number;
    weight_kg: number;
  }>,
  tier: 'economy' | 'standard' | 'express',
  maxBookingsPerRoute: number
): Array<Array<{ booking: ExtendedBookingRequest; volume_m3: number; weight_kg: number }>> {
  const totalBookings = bookingsWithMetrics.length;
  
  // Calculate ideal number of routes
  const idealBookingsPerRoute = Math.ceil(totalBookings / Math.ceil(totalBookings / maxBookingsPerRoute));
  
  const groups: typeof bookingsWithMetrics[] = [];
  const remaining = [...bookingsWithMetrics];
  
  while (remaining.length > 0) {
    const groupSize = Math.min(idealBookingsPerRoute, remaining.length);
    const group = remaining.splice(0, groupSize);
    groups.push(group);
  }
  
  return groups;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build MultiBookingRoute from RouteSolution
 */
async function buildMultiBookingRoute(
  routeSolution: RouteSolution,
  bookings: ExtendedBookingRequest[],
  tier: 'economy' | 'standard' | 'express'
): Promise<MultiBookingRoute> {
  const analysis = routeSolution.capacityAnalysis;
  
  // Estimate distance (placeholder - implement actual routing later)
  const estimatedDistance_km = bookings.length * 15; // Rough estimate: 15km per booking
  const estimatedDistance_miles = estimatedDistance_km * 0.621371; // ✅ CONVERT TO MILES
  const estimatedDuration = bookings.length * 1.5; // 1.5 hours per booking
  
  // Calculate efficiency metrics
  const capacityEfficiency = analysis.peakVolumeUtilization; // 0-1
  const routeEfficiency = 0.8; // Placeholder - would calculate based on actual routing
  
  // Estimate cost per booking
  const baseCost = tier === 'economy' ? 50 : tier === 'standard' ? 70 : 90;
  const distanceCost = estimatedDistance_miles * 1.5; // ✅ Use MILES for cost
  const totalCost = baseCost + distanceCost;
  const costPerBooking = totalCost / bookings.length;
  
  // ✅ ESTIMATE DRIVER PAY (using enterprise pricing formula)
  // Base: £1.50 per mile (economy) + loading allowance
  const driverRatePerMile = tier === 'economy' ? 1.50 : tier === 'standard' ? 1.80 : 2.20;
  const distanceEarnings = estimatedDistance_miles * driverRatePerMile;
  const loadingAllowance = bookings.length * 15; // £15 per pickup/drop
  const estimatedDriverPay_gbp = distanceEarnings + loadingAllowance;
  const estimatedDriverPay_pence = Math.floor(estimatedDriverPay_gbp * 100);
  
  return {
    routeId: routeSolution.routeId,
    bookingIds: bookings.map(b => b.id),
    tier,
    stops: routeSolution.stops,
    capacityAnalysis: analysis,
    
    // ✅ MILES + KM (for compatibility)
    estimatedTotalDistance_miles: estimatedDistance_miles,
    estimatedTotalDistance_km: estimatedDistance_km,
    estimatedTotalDuration_hours: estimatedDuration,
    estimatedCostPerBooking: costPerBooking,
    
    // ✅ DRIVER PAY + ADMIN APPROVAL
    estimatedDriverPay_pence: estimatedDriverPay_pence,
    requiresAdminApproval: false, // Will be set after checking daily total
    
    capacityEfficiency,
    routeEfficiency,
    optimizationStrategy: routeSolution.optimizationMethod,
    alternativeRoutesCount: 0,
    
    // ✅ STATUS (for pre-execution review)
    status: 'pending_review',
  };
}

// ============================================================================
// Distance Calculation (Haversine Formula)
// ============================================================================

/**
 * Calculate distance between two locations (haversine formula)
 */
export function calculateDistance(
  loc1: Location,
  loc2: Location
): number {
  if (!loc1.lat || !loc1.lng || !loc2.lat || !loc2.lng) {
    return 10; // Default 10km if coordinates missing
  }
  
  const R = 6371; // Earth radius in km
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLng = toRad(loc2.lng - loc1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ============================================================================
// Exports
// ============================================================================

export {
  ExtendedBookingRequestSchema,
};

function buildPricingRequestForRoute(
  route: MultiBookingRoute,
  driverId: string,
  currentDailyEarningsPence: number
): DriverEarningsRequest {
  const primaryBookingId = route.bookingIds[0] ?? driverId;
  const assignmentIdCandidate = route.routeId && route.routeId.length >= 25 ? route.routeId : primaryBookingId;

  const rawDistanceMiles = route.estimatedTotalDistance_miles || (route.estimatedTotalDistance_km * 0.621371);
  const safeDistanceMiles = Number.isFinite(rawDistanceMiles) ? rawDistanceMiles : 0;
  const legCount = Math.max(1, (route.stops?.length || 0) - 1);
  const perLegDistance = Array.from({ length: legCount }).map(() => Number((safeDistanceMiles / legCount).toFixed(2)));
  const averageLegDistanceMiles = perLegDistance.length
    ? Number((perLegDistance.reduce((sum, value) => sum + value, 0) / perLegDistance.length).toFixed(2))
    : Number((safeDistanceMiles / Math.max(1, legCount)).toFixed(2));

  const handlingPerStopMinutes = 8;
  const totalHandlingMinutes = (route.stops?.length || 0) * handlingPerStopMinutes;
  const loadingMinutes = Math.ceil(totalHandlingMinutes / 2);
  const unloadingMinutes = Math.max(0, totalHandlingMinutes - loadingMinutes);

  const dropCount = Math.max(
    route.stops?.filter(stop => stop.type === 'dropoff').length || 0,
    route.bookingIds.length
  );

  const serviceType: DriverEarningsRequest['serviceType'] = (() => {
    if (route.tier === 'economy' && dropCount > 1) {
      return 'multi-drop';
    }
    if (route.tier === 'economy') return 'economy';
    if (route.tier === 'express') return 'express';
    return 'standard';
  })();

  const estimatedDurationMinutes = Math.max(0, Math.round(route.estimatedTotalDuration_hours * 60));
  const estimatedCostPerBooking = Number.isFinite(route.estimatedCostPerBooking) ? route.estimatedCostPerBooking : 0;
  const customerPaidTotalPence = Math.max(0, Math.floor(estimatedCostPerBooking * route.bookingIds.length * 100));

  return {
    driverId,
    assignmentId: assignmentIdCandidate,
    bookingId: primaryBookingId,
    distance_miles: Number(safeDistanceMiles.toFixed(2)),
    per_leg_distance_miles: perLegDistance,
    average_leg_distance_miles: averageLegDistanceMiles,
    driving_duration_minutes: estimatedDurationMinutes,
    loading_duration_minutes: loadingMinutes,
    unloading_duration_minutes: unloadingMinutes,
    waiting_duration_minutes: 0,
    sla_delay_minutes: 0,
    serviceType,
    drop_count: dropCount,
    toll_costs_pence: 0,
    parking_costs_pence: 0,
    admin_approved_bonus_pence: 0,
    admin_approval_id: undefined,
    used_capacity_cubic_meters: route.capacityAnalysis?.peakVolume_m3,
    vehicle_capacity_cubic_meters: (route.capacityAnalysis as any)?.vehicleCapacity_m3,
    total_weight_kg: route.capacityAnalysis?.peakWeight_kg,
    current_daily_earnings_pence: currentDailyEarningsPence,
    customer_paid_total_pence: customerPaidTotalPence,
  };
}

