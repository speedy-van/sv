/**
 * Leg-by-Leg Capacity Validation Engine
 * 
 * Tracks cumulative load (volume & weight) at every stop in a multi-drop route.
 * Validates that vehicle capacity is never exceeded from pickup to final drop-off.
 * 
 * Critical for multi-drop routing: Load increases at pickups, decreases at drop-offs.
 */

import { z } from 'zod';
import { 
  LUTON_VAN_SPECS, 
  TIER_SAFETY_BUFFERS,
  MULTI_DROP_CONFIG,
  isWithinCapacity,
  type VehicleSpecs,
} from './luton-van-specs';
import {
  getItemById,
  calculateCapacityMetrics,
  type RemovalItemWithHandling,
} from '../dataset/uk-removal-dataset-loader';

// ============================================================================
// Types and Schemas
// ============================================================================

/**
 * Stop types in a route
 */
export type StopType = 'pickup' | 'dropoff';

/**
 * Individual stop in a route
 */
export interface RouteStop {
  id: string;
  type: StopType;
  address: string;
  itemIds: string[];  // Items being picked up or dropped off at this stop
  sequenceNumber: number;  // Order in route (1 = first, 2 = second, etc.)
}

/**
 * Load state at a specific point in the route
 */
export interface LoadState {
  stopId: string;
  stopType: StopType;
  stopSequence: number;
  address: string;
  
  // Cumulative load AFTER this stop
  cumulativeVolume_m3: number;
  cumulativeWeight_kg: number;
  
  // Items currently in van
  activeItemIds: string[];
  activeItemCount: number;
  
  // Capacity utilization
  volumeUtilization: number;
  weightUtilization: number;
  
  // Items involved in this stop
  itemsAdded: string[];   // Picked up at this stop
  itemsRemoved: string[]; // Dropped off at this stop
}

/**
 * Capacity violation at a specific stop
 */
export interface CapacityViolation {
  stopId: string;
  stopSequence: number;
  stopType: StopType;
  address: string;
  
  violationType: 'volume' | 'weight' | 'both';
  
  // Violation details
  volume_m3: number;
  volumeCapacity_m3: number;
  volumeExcess_m3: number;
  volumeUtilization: number;
  
  weight_kg: number;
  weightCapacity_kg: number;
  weightExcess_kg: number;
  weightUtilization: number;
  
  message: string;
}

/**
 * Complete leg-by-leg capacity analysis
 */
export interface LegByLegAnalysis {
  routeId?: string;
  tier: 'economy' | 'standard' | 'express';
  
  // Route summary
  totalStops: number;
  pickupStops: number;
  dropoffStops: number;
  
  // Overall capacity
  peakVolume_m3: number;
  peakWeight_kg: number;
  peakVolumeUtilization: number;
  peakWeightUtilization: number;
  
  // Feasibility
  isFeasible: boolean;
  violations: CapacityViolation[];
  
  // Detailed leg-by-leg breakdown
  legStates: LoadState[];
  
  // Warnings (not violations, but noteworthy)
  warnings: string[];
  
  // Vehicle specs used
  vehicleSpecs: VehicleSpecs;
}

// Zod schema for route stops
const RouteStopSchema = z.object({
  id: z.string(),
  type: z.enum(['pickup', 'dropoff']),
  address: z.string(),
  itemIds: z.array(z.string()),
  sequenceNumber: z.number().int().positive(),
});

const RouteStopsArraySchema = z.array(RouteStopSchema).min(2, 'Route must have at least 2 stops');

// ============================================================================
// Core Validation Engine
// ============================================================================

/**
 * Validate capacity leg-by-leg through an entire multi-drop route
 * 
 * @param stops - Ordered list of stops (pickups and dropoffs)
 * @param options - Validation options (tier, custom capacity limits)
 * @returns Complete leg-by-leg analysis with feasibility verdict
 */
export async function validateLegByLegCapacity(
  stops: RouteStop[],
  options?: {
    tier?: 'economy' | 'standard' | 'express';
    routeId?: string;
    customCapacityLimits?: {
      maxVolume_m3?: number;
      maxWeight_kg?: number;
    };
  }
): Promise<LegByLegAnalysis> {
  // Validate input
  RouteStopsArraySchema.parse(stops);
  
  const tier = options?.tier || 'economy';
  const routeId = options?.routeId;
  
  // Sort stops by sequence number
  const orderedStops = [...stops].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  
  // Calculate effective capacity with buffers
  const volumeBuffer = TIER_SAFETY_BUFFERS[tier].volume_buffer;
  const weightBuffer = TIER_SAFETY_BUFFERS[tier].weight_buffer;
  
  const effectiveVolumeCapacity = 
    options?.customCapacityLimits?.maxVolume_m3 || 
    LUTON_VAN_SPECS.cargo.usable_volume_m3 * (1 - volumeBuffer);
    
  const effectiveWeightCapacity = 
    options?.customCapacityLimits?.maxWeight_kg ||
    LUTON_VAN_SPECS.weight.available_payload_kg * (1 - weightBuffer);
  
  // Track cumulative load
  let cumulativeVolume = 0;
  let cumulativeWeight = 0;
  const activeItems = new Set<string>();
  
  // Track analysis
  const legStates: LoadState[] = [];
  const violations: CapacityViolation[] = [];
  const warnings: string[] = [];
  
  let peakVolume = 0;
  let peakWeight = 0;
  let peakVolumeUtilization = 0;
  let peakWeightUtilization = 0;
  
  // Validate stop count
  if (orderedStops.length > MULTI_DROP_CONFIG.max_stops_per_route) {
    warnings.push(
      `Route has ${orderedStops.length} stops, exceeding recommended maximum of ${MULTI_DROP_CONFIG.max_stops_per_route}`
    );
  }
  
  // Process each stop in sequence
  for (const stop of orderedStops) {
    const itemsAdded: string[] = [];
    const itemsRemoved: string[] = [];
    
    // Calculate volume and weight changes at this stop
    const itemMetrics = await calculateCapacityMetrics(stop.itemIds);
    
    if (itemMetrics.missingItemIds.length > 0) {
      warnings.push(
        `Stop ${stop.sequenceNumber} (${stop.id}): ${itemMetrics.missingItemIds.length} items not found in dataset`
      );
    }
    
    if (stop.type === 'pickup') {
      // Add items to van
      cumulativeVolume += itemMetrics.totalVolume;
      cumulativeWeight += itemMetrics.totalWeight;
      stop.itemIds.forEach(id => {
        activeItems.add(id);
        itemsAdded.push(id);
      });
    } else {
      // Remove items from van
      cumulativeVolume -= itemMetrics.totalVolume;
      cumulativeWeight -= itemMetrics.totalWeight;
      stop.itemIds.forEach(id => {
        activeItems.delete(id);
        itemsRemoved.push(id);
      });
      
      // Safety check: volume/weight should never be negative
      if (cumulativeVolume < 0) {
        cumulativeVolume = 0;
        warnings.push(
          `Stop ${stop.sequenceNumber} (${stop.id}): Negative volume detected (likely data error)`
        );
      }
      if (cumulativeWeight < 0) {
        cumulativeWeight = 0;
        warnings.push(
          `Stop ${stop.sequenceNumber} (${stop.id}): Negative weight detected (likely data error)`
        );
      }
    }
    
    // Calculate utilization
    const volumeUtilization = cumulativeVolume / effectiveVolumeCapacity;
    const weightUtilization = cumulativeWeight / effectiveWeightCapacity;
    
    // Update peak values
    if (cumulativeVolume > peakVolume) peakVolume = cumulativeVolume;
    if (cumulativeWeight > peakWeight) peakWeight = cumulativeWeight;
    if (volumeUtilization > peakVolumeUtilization) peakVolumeUtilization = volumeUtilization;
    if (weightUtilization > peakWeightUtilization) peakWeightUtilization = weightUtilization;
    
    // Record load state
    const loadState: LoadState = {
      stopId: stop.id,
      stopType: stop.type,
      stopSequence: stop.sequenceNumber,
      address: stop.address,
      cumulativeVolume_m3: cumulativeVolume,
      cumulativeWeight_kg: cumulativeWeight,
      activeItemIds: Array.from(activeItems),
      activeItemCount: activeItems.size,
      volumeUtilization,
      weightUtilization,
      itemsAdded,
      itemsRemoved,
    };
    
    legStates.push(loadState);
    
    // Check for capacity violations
    const volumeExceeded = volumeUtilization > 1.0;
    const weightExceeded = weightUtilization > 1.0;
    
    if (volumeExceeded || weightExceeded) {
      const violation: CapacityViolation = {
        stopId: stop.id,
        stopSequence: stop.sequenceNumber,
        stopType: stop.type,
        address: stop.address,
        violationType: volumeExceeded && weightExceeded ? 'both' : volumeExceeded ? 'volume' : 'weight',
        volume_m3: cumulativeVolume,
        volumeCapacity_m3: effectiveVolumeCapacity,
        volumeExcess_m3: Math.max(0, cumulativeVolume - effectiveVolumeCapacity),
        volumeUtilization,
        weight_kg: cumulativeWeight,
        weightCapacity_kg: effectiveWeightCapacity,
        weightExcess_kg: Math.max(0, cumulativeWeight - effectiveWeightCapacity),
        weightUtilization,
        message: generateViolationMessage(
          stop,
          cumulativeVolume,
          effectiveVolumeCapacity,
          cumulativeWeight,
          effectiveWeightCapacity,
          volumeExceeded,
          weightExceeded
        ),
      };
      
      violations.push(violation);
    }
  }
  
  // Count pickups and dropoffs
  const pickupStops = orderedStops.filter(s => s.type === 'pickup').length;
  const dropoffStops = orderedStops.filter(s => s.type === 'dropoff').length;
  
  // Final analysis
  return {
    routeId,
    tier,
    totalStops: orderedStops.length,
    pickupStops,
    dropoffStops,
    peakVolume_m3: peakVolume,
    peakWeight_kg: peakWeight,
    peakVolumeUtilization,
    peakWeightUtilization,
    isFeasible: violations.length === 0,
    violations,
    legStates,
    warnings,
    vehicleSpecs: LUTON_VAN_SPECS,
  };
}

/**
 * Quick feasibility check (lightweight version)
 * Returns true if route is feasible, false otherwise
 */
export async function isRouteFeasible(
  stops: RouteStop[],
  tier: 'economy' | 'standard' | 'express' = 'economy'
): Promise<boolean> {
  try {
    const analysis = await validateLegByLegCapacity(stops, { tier });
    return analysis.isFeasible;
  } catch (error) {
    console.error('[Capacity Validation] Feasibility check failed:', error);
    return false;
  }
}

/**
 * Get peak load for a route (maximum capacity at any point)
 */
export async function getPeakLoad(
  stops: RouteStop[]
): Promise<{
  peakVolume_m3: number;
  peakWeight_kg: number;
  peakStop: RouteStop | null;
}> {
  const analysis = await validateLegByLegCapacity(stops);
  
  const peakState = analysis.legStates.reduce((max, current) => 
    current.cumulativeVolume_m3 > max.cumulativeVolume_m3 ? current : max
  );
  
  const peakStop = stops.find(s => s.id === peakState.stopId) || null;
  
  return {
    peakVolume_m3: analysis.peakVolume_m3,
    peakWeight_kg: analysis.peakWeight_kg,
    peakStop,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate human-readable violation message
 */
function generateViolationMessage(
  stop: RouteStop,
  volume: number,
  volumeCapacity: number,
  weight: number,
  weightCapacity: number,
  volumeExceeded: boolean,
  weightExceeded: boolean
): string {
  const parts: string[] = [
    `Capacity exceeded at stop ${stop.sequenceNumber} (${stop.type})`,
  ];
  
  if (volumeExceeded) {
    const excess = volume - volumeCapacity;
    parts.push(
      `Volume: ${volume.toFixed(2)}m³ exceeds ${volumeCapacity.toFixed(2)}m³ by ${excess.toFixed(2)}m³`
    );
  }
  
  if (weightExceeded) {
    const excess = weight - weightCapacity;
    parts.push(
      `Weight: ${weight.toFixed(0)}kg exceeds ${weightCapacity.toFixed(0)}kg by ${excess.toFixed(0)}kg`
    );
  }
  
  return parts.join(' | ');
}

/**
 * Format leg-by-leg table for display
 */
export function formatLegByLegTable(analysis: LegByLegAnalysis): string {
  const lines: string[] = [];
  
  lines.push('=== LEG-BY-LEG CAPACITY ANALYSIS ===');
  lines.push(`Route: ${analysis.routeId || 'Unnamed'} | Tier: ${analysis.tier}`);
  lines.push(`Stops: ${analysis.totalStops} (${analysis.pickupStops} pickups, ${analysis.dropoffStops} dropoffs)`);
  lines.push(`Feasible: ${analysis.isFeasible ? '✅ YES' : '❌ NO'}`);
  lines.push('');
  
  lines.push('Stop | Type     | Volume    | Weight   | Vol% | Wt%  | Items');
  lines.push('-----|----------|-----------|----------|------|------|-------');
  
  for (const leg of analysis.legStates) {
    const volumePercent = (leg.volumeUtilization * 100).toFixed(1);
    const weightPercent = (leg.weightUtilization * 100).toFixed(1);
    const volumeFlag = leg.volumeUtilization > 1.0 ? '⚠️' : '';
    const weightFlag = leg.weightUtilization > 1.0 ? '⚠️' : '';
    
    lines.push(
      `${leg.stopSequence.toString().padStart(4)} | ` +
      `${leg.stopType.padEnd(8)} | ` +
      `${leg.cumulativeVolume_m3.toFixed(2)}m³ ${volumeFlag}`.padEnd(10) + ' | ' +
      `${leg.cumulativeWeight_kg.toFixed(0)}kg ${weightFlag}`.padEnd(9) + ' | ' +
      `${volumePercent}%`.padStart(5) + ' | ' +
      `${weightPercent}%`.padStart(5) + ' | ' +
      `${leg.activeItemCount}`
    );
  }
  
  lines.push('');
  lines.push(`Peak Load: ${analysis.peakVolume_m3.toFixed(2)}m³ (${(analysis.peakVolumeUtilization * 100).toFixed(1)}%) | ${analysis.peakWeight_kg.toFixed(0)}kg (${(analysis.peakWeightUtilization * 100).toFixed(1)}%)`);
  
  if (analysis.violations.length > 0) {
    lines.push('');
    lines.push('⚠️ VIOLATIONS:');
    analysis.violations.forEach((v, i) => {
      lines.push(`  ${i + 1}. ${v.message}`);
    });
  }
  
  if (analysis.warnings.length > 0) {
    lines.push('');
    lines.push('⚠️ WARNINGS:');
    analysis.warnings.forEach((w, i) => {
      lines.push(`  ${i + 1}. ${w}`);
    });
  }
  
  return lines.join('\n');
}

// ============================================================================
// Exports
// ============================================================================

export { RouteStopSchema, RouteStopsArraySchema };
