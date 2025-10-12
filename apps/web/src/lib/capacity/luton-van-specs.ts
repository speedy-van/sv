/**
 * Luton Van Capacity Specifications
 * 
 * Authoritative configuration for Luton van physical and operational constraints.
 * Used by route planning, capacity validation, and pricing engines.
 * 
 * Sources:
 * - Industry standard Luton van specifications (e.g., Mercedes Sprinter, Ford Transit)
 * - UK removal industry best practices
 * - Speedy Van operational requirements
 */

// ============================================================================
// Physical Specifications
// ============================================================================

/**
 * Luton Van Physical Dimensions and Capacity
 */
export const LUTON_VAN_SPECS = {
  // Cargo Area Dimensions (internal load space)
  cargo: {
    length_m: 4.1,        // 4.1 meters (~13.5 feet)
    width_m: 2.0,         // 2.0 meters (~6.6 feet)
    height_m: 2.2,        // 2.2 meters (~7.2 feet)
    
    // Calculated volume (conservative estimate accounting for wheel arches, etc.)
    usable_volume_m3: 16.0,  // ~16 cubic meters (realistic usable space)
    max_volume_m3: 18.0,     // Maximum theoretical volume (4.1 × 2.0 × 2.2 = 18.04)
  },

  // Weight Specifications
  weight: {
    // Gross Vehicle Weight (GVW) - Total allowed weight when loaded
    gross_vehicle_weight_kg: 3500,
    
    // Unladen Weight (curb weight of empty van)
    unladen_weight_kg: 1800,
    
    // Maximum Payload Capacity
    max_payload_kg: 1700,  // GVW - Unladen = 3500 - 1800 = 1700 kg
    
    // Safe Working Load (recommended for daily operations)
    safe_payload_kg: 1500,  // 88% of max payload (safety buffer)
    
    // Driver + Equipment Weight (deducted from payload)
    driver_equipment_kg: 150,  // Driver (75kg) + Tools/Equipment (75kg)
    
    // Available Payload (after accounting for driver & equipment)
    available_payload_kg: 1350,  // 1500 - 150 = 1350 kg
  },

  // Access Constraints
  access: {
    // Tail Lift Specifications
    tail_lift_capacity_kg: 500,  // Maximum weight per lift
    tail_lift_platform_length_m: 1.5,
    tail_lift_platform_width_m: 1.8,
    
    // Door Opening Dimensions
    rear_door_height_m: 2.1,
    rear_door_width_m: 1.9,
    
    // Side Door Specifications (if equipped)
    side_door_height_m: 1.8,
    side_door_width_m: 1.2,
  },

  // Operational Constraints
  operational: {
    // Loading Configuration
    floor_loading_kg_per_m2: 300,  // Maximum floor pressure
    
    // Stacking Limits
    max_stack_height_m: 2.0,  // Safe stacking height to prevent crushing
    
    // Weight Distribution
    max_axle_weight_kg: {
      front: 1600,  // Front axle limit
      rear: 1900,   // Rear axle limit
    },
    
    // Center of Gravity
    recommended_cog_height_m: 1.2,  // Keep heavy items low
  },
} as const;

// ============================================================================
// Capacity Thresholds and Safety Factors
// ============================================================================

/**
 * Capacity utilization thresholds for route planning
 */
export const CAPACITY_THRESHOLDS = {
  // Volume Utilization Levels
  volume: {
    optimal: 0.70,      // 70% - Optimal loading (recommended)
    high: 0.85,         // 85% - High utilization (acceptable)
    critical: 0.95,     // 95% - Critical (safety margin)
    maximum: 1.0,       // 100% - Absolute maximum
  },

  // Weight Utilization Levels
  weight: {
    optimal: 0.70,      // 70% - Optimal loading
    high: 0.85,         // 85% - High utilization
    critical: 0.90,     // 90% - Critical (legal compliance buffer)
    maximum: 1.0,       // 100% - Absolute maximum
  },
} as const;

/**
 * Safety buffers for different booking tiers
 */
export const TIER_SAFETY_BUFFERS = {
  economy: {
    volume_buffer: 0.05,  // 5% volume buffer
    weight_buffer: 0.10,  // 10% weight buffer (legal compliance)
  },
  standard: {
    volume_buffer: 0.10,  // 10% volume buffer
    weight_buffer: 0.10,  // 10% weight buffer
  },
  express: {
    volume_buffer: 0.15,  // 15% volume buffer (extra safety)
    weight_buffer: 0.15,  // 15% weight buffer
  },
} as const;

// ============================================================================
// Multi-Drop Configuration
// ============================================================================

/**
 * Multi-drop routing constraints
 */
export const MULTI_DROP_CONFIG = {
  // Maximum number of stops per route
  max_stops_per_route: 5,  // 1 pickup + 4 drop-offs (practical limit)
  
  // Maximum number of simultaneous loads
  max_simultaneous_loads: 3,  // Items from 3 different pickups
  
  // Time constraints
  max_route_duration_hours: 10,  // Maximum driver shift length
  
  // Capacity degradation per stop (accounts for packing inefficiency)
  volume_degradation_per_stop: 0.02,  // 2% volume loss per additional stop
  
  // Minimum stop separation (for route optimization)
  min_stop_distance_km: 0,  // No minimum (can be adjacent addresses)
  max_stop_distance_km: 80, // Maximum distance between any two stops
} as const;

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Capacity validation rules for route feasibility
 */
export const VALIDATION_RULES = {
  // Volume Rules
  volume: {
    // Reject if single item exceeds van volume
    reject_oversized_items: true,
    
    // Reject if total volume exceeds maximum
    reject_volume_overflow: true,
    
    // Warn if utilization is suboptimal
    warn_low_utilization_threshold: 0.30,  // < 30% utilization
  },

  // Weight Rules
  weight: {
    // Reject if single item exceeds payload
    reject_overweight_items: true,
    
    // Reject if total weight exceeds maximum
    reject_weight_overflow: true,
    
    // Warn if weight distribution is unbalanced
    warn_unbalanced_load_threshold: 0.15,  // > 15% weight difference
  },

  // Dimensional Rules
  dimensions: {
    // Reject if item dimensions exceed cargo area
    reject_oversized_dimensions: true,
    
    // Warn if item requires disassembly
    warn_disassembly_required: true,
  },
} as const;

// ============================================================================
// Pricing Multipliers (capacity-based)
// ============================================================================

/**
 * Pricing adjustments based on capacity utilization
 */
export const CAPACITY_PRICING_MULTIPLIERS = {
  // High utilization premium (near capacity limit)
  high_utilization: {
    threshold: 0.85,  // > 85% capacity
    multiplier: 1.15, // 15% premium
  },

  // Low utilization discount (inefficient use of van)
  low_utilization: {
    threshold: 0.30,  // < 30% capacity
    multiplier: 1.0,  // No discount (base rate still applies)
  },

  // Optimal utilization (sweet spot)
  optimal_utilization: {
    threshold_min: 0.60,  // 60% - 80% capacity
    threshold_max: 0.80,
    multiplier: 1.0,      // Base rate
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a load fits within Luton van capacity
 */
export function isWithinCapacity(
  volume_m3: number,
  weight_kg: number,
  options?: {
    tier?: 'economy' | 'standard' | 'express';
    stopCount?: number;
  }
): {
  fits: boolean;
  volumeUtilization: number;
  weightUtilization: number;
  reasons: string[];
} {
  const tier = options?.tier || 'economy';
  const stopCount = options?.stopCount || 1;

  const reasons: string[] = [];

  // Apply safety buffers
  const volumeBuffer = TIER_SAFETY_BUFFERS[tier].volume_buffer;
  const weightBuffer = TIER_SAFETY_BUFFERS[tier].weight_buffer;

  // Apply multi-drop degradation
  const volumeDegradation = stopCount > 1 
    ? MULTI_DROP_CONFIG.volume_degradation_per_stop * (stopCount - 1)
    : 0;

  // Calculate effective capacity
  const effectiveVolumeCapacity = 
    LUTON_VAN_SPECS.cargo.usable_volume_m3 * (1 - volumeBuffer - volumeDegradation);
  const effectiveWeightCapacity = 
    LUTON_VAN_SPECS.weight.available_payload_kg * (1 - weightBuffer);

  // Calculate utilization
  const volumeUtilization = volume_m3 / effectiveVolumeCapacity;
  const weightUtilization = weight_kg / effectiveWeightCapacity;

  // Check capacity
  let fits = true;

  if (volumeUtilization > 1.0) {
    fits = false;
    reasons.push(
      `Volume exceeds capacity: ${volume_m3.toFixed(2)}m³ > ${effectiveVolumeCapacity.toFixed(2)}m³ (${(volumeUtilization * 100).toFixed(1)}% utilization)`
    );
  }

  if (weightUtilization > 1.0) {
    fits = false;
    reasons.push(
      `Weight exceeds capacity: ${weight_kg.toFixed(0)}kg > ${effectiveWeightCapacity.toFixed(0)}kg (${(weightUtilization * 100).toFixed(1)}% utilization)`
    );
  }

  // Warnings (doesn't prevent booking, but flagged)
  if (volumeUtilization < VALIDATION_RULES.volume.warn_low_utilization_threshold) {
    reasons.push(
      `Low volume utilization: ${(volumeUtilization * 100).toFixed(1)}% (inefficient use of van)`
    );
  }

  if (volumeUtilization > CAPACITY_THRESHOLDS.volume.high) {
    reasons.push(
      `High volume utilization: ${(volumeUtilization * 100).toFixed(1)}% (tight fit)`
    );
  }

  if (weightUtilization > CAPACITY_THRESHOLDS.weight.high) {
    reasons.push(
      `High weight utilization: ${(weightUtilization * 100).toFixed(1)}% (near legal limit)`
    );
  }

  return {
    fits,
    volumeUtilization,
    weightUtilization,
    reasons,
  };
}

/**
 * Calculate pricing multiplier based on capacity utilization
 */
export function getCapacityPricingMultiplier(
  volume_m3: number,
  weight_kg: number
): number {
  const volumeUtilization = volume_m3 / LUTON_VAN_SPECS.cargo.usable_volume_m3;
  const weightUtilization = weight_kg / LUTON_VAN_SPECS.weight.available_payload_kg;
  
  // Use the higher of the two utilizations
  const utilization = Math.max(volumeUtilization, weightUtilization);

  // High utilization premium
  if (utilization >= CAPACITY_PRICING_MULTIPLIERS.high_utilization.threshold) {
    return CAPACITY_PRICING_MULTIPLIERS.high_utilization.multiplier;
  }

  // Optimal utilization (base rate)
  if (
    utilization >= CAPACITY_PRICING_MULTIPLIERS.optimal_utilization.threshold_min &&
    utilization <= CAPACITY_PRICING_MULTIPLIERS.optimal_utilization.threshold_max
  ) {
    return CAPACITY_PRICING_MULTIPLIERS.optimal_utilization.multiplier;
  }

  // Low utilization (no discount, but flagged)
  return CAPACITY_PRICING_MULTIPLIERS.low_utilization.multiplier;
}

/**
 * Get human-readable capacity status
 */
export function getCapacityStatus(
  volumeUtilization: number,
  weightUtilization: number
): {
  level: 'optimal' | 'high' | 'critical' | 'exceeded';
  color: 'green' | 'yellow' | 'orange' | 'red';
  message: string;
} {
  const utilization = Math.max(volumeUtilization, weightUtilization);

  if (utilization > 1.0) {
    return {
      level: 'exceeded',
      color: 'red',
      message: 'Capacity exceeded - Not feasible',
    };
  }

  if (utilization >= CAPACITY_THRESHOLDS.volume.critical) {
    return {
      level: 'critical',
      color: 'orange',
      message: 'Critical capacity - Very tight fit',
    };
  }

  if (utilization >= CAPACITY_THRESHOLDS.volume.high) {
    return {
      level: 'high',
      color: 'yellow',
      message: 'High capacity - Tight fit',
    };
  }

  return {
    level: 'optimal',
    color: 'green',
    message: 'Optimal capacity - Good fit',
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export type VehicleSpecs = typeof LUTON_VAN_SPECS;
export type CapacityThresholds = typeof CAPACITY_THRESHOLDS;
export type MultiDropConfig = typeof MULTI_DROP_CONFIG;
export type ValidationRules = typeof VALIDATION_RULES;
export type TierSafetyBuffers = typeof TIER_SAFETY_BUFFERS;
export type CapacityStatus = ReturnType<typeof getCapacityStatus>;
