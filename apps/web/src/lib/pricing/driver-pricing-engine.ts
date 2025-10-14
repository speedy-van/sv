/**
 * Comprehensive Driver Pricing Engine for Speedy Van
 * Supports both single orders and multi-stop routes
 * Based on industry best practices from Dispatch, delivAI, and major logistics companies
 */

export interface SingleOrderInput {
  distanceMiles: number;
  durationMinutes: number;
  itemsCount: number;
  totalWeight?: number; // in kg
  totalVolume?: number; // in m³
  hasStairs?: boolean;
  floorCount?: number;
  isPeakTime?: boolean;
  isUrgent?: boolean;
  vehicleType?: 'small_van' | 'medium_van' | 'large_van' | 'luton_van';
  scheduledAt?: Date;
}

export interface MultiStopRouteInput {
  stops: Array<{
    stopNumber: number;
    distanceFromPrevious: number; // miles from previous stop
    itemsCount: number;
    hasStairs?: boolean;
    floorCount?: number;
  }>;
  totalDistance: number; // total route distance in miles
  totalDuration: number; // total route duration in minutes
  vehicleType?: 'small_van' | 'medium_van' | 'large_van' | 'luton_van';
  isPeakTime?: boolean;
  scheduledAt?: Date;
}

export interface DriverEarningsResult {
  baseRate: number;
  distanceRate: number;
  timeRate: number;
  itemsRate: number;
  stopFees: number;
  accessFees: number;
  peakTimeBonus: number;
  urgencyBonus: number;
  efficiencyBonus: number;
  totalEarnings: number;
  breakdown: Array<{
    component: string;
    description: string;
    amount: number;
  }>;
}

/**
 * Driver Pricing Engine
 * Calculates fair driver earnings based on actual work performed
 */
export class DriverPricingEngine {
  // ==================== BASE RATES ====================
  
  // Base rates per vehicle type (in pence)
  private static readonly BASE_RATES = {
    small_van: 2000,   // £20
    medium_van: 2500,  // £25
    large_van: 3000,   // £30
    luton_van: 3500,   // £35
  };

  // Distance rate per mile (in pence)
  private static readonly DISTANCE_RATE_PER_MILE = 150; // £1.50 per mile

  // Time rate per minute (in pence)
  private static readonly TIME_RATE_PER_MINUTE = 50; // £0.50 per minute

  // Item handling rate (in pence)
  private static readonly ITEM_RATE = 200; // £2 per item

  // ==================== MULTI-STOP RATES ====================
  
  // Per-stop fees (progressive pricing)
  private static readonly STOP_FEES = {
    first: 0,      // First stop included in base
    second: 500,   // £5 for 2nd stop
    third: 1000,   // £10 for 3rd stop
    fourth: 1500,  // £15 for 4th stop
    additional: 2000, // £20 for each additional stop after 4th
  };

  // ==================== SURCHARGES ====================
  
  // Access difficulty surcharges (in pence)
  private static readonly FLOOR_RATE = 500; // £5 per floor without lift
  
  // Peak time bonus (percentage)
  private static readonly PEAK_TIME_BONUS_MULTIPLIER = 0.15; // 15% bonus

  // Urgency bonus (in pence)
  private static readonly URGENCY_BONUS = 1000; // £10

  // Multi-stop efficiency bonus (percentage)
  private static readonly EFFICIENCY_BONUS_MULTIPLIER = 0.10; // 10% bonus for 3+ stops

  // ==================== SINGLE ORDER CALCULATION ====================

  /**
   * Calculate driver earnings for a single order
   */
  static calculateSingleOrder(input: SingleOrderInput): DriverEarningsResult {
    const breakdown: Array<{ component: string; description: string; amount: number }> = [];

    // 1. Base rate
    const vehicleType = input.vehicleType || 'medium_van';
    const baseRate = this.BASE_RATES[vehicleType];
    breakdown.push({
      component: 'base',
      description: `Base rate for ${vehicleType.replace('_', ' ')}`,
      amount: baseRate,
    });

    // 2. Distance rate
    const distanceRate = Math.floor(input.distanceMiles * this.DISTANCE_RATE_PER_MILE);
    breakdown.push({
      component: 'distance',
      description: `Distance charge (${input.distanceMiles.toFixed(1)} miles)`,
      amount: distanceRate,
    });

    // 3. Time rate
    const timeRate = Math.floor(input.durationMinutes * this.TIME_RATE_PER_MINUTE);
    breakdown.push({
      component: 'time',
      description: `Time charge (${Math.round(input.durationMinutes)} min)`,
      amount: timeRate,
    });

    // 4. Items handling
    const itemsRate = input.itemsCount * this.ITEM_RATE;
    breakdown.push({
      component: 'items',
      description: `Items handling (${input.itemsCount} items)`,
      amount: itemsRate,
    });

    // 5. No stop fees for single order
    const stopFees = 0;

    // 6. Access fees (stairs/floors)
    let accessFees = 0;
    if (input.hasStairs && input.floorCount && input.floorCount > 0) {
      accessFees = input.floorCount * this.FLOOR_RATE;
      breakdown.push({
        component: 'access',
        description: `Stairs surcharge (${input.floorCount} floors)`,
        amount: accessFees,
      });
    }

    // 7. Peak time bonus
    let peakTimeBonus = 0;
    if (input.isPeakTime || (input.scheduledAt && this.isPeakTime(input.scheduledAt))) {
      const subtotal = baseRate + distanceRate + timeRate + itemsRate + accessFees;
      peakTimeBonus = Math.floor(subtotal * this.PEAK_TIME_BONUS_MULTIPLIER);
      breakdown.push({
        component: 'peak_time',
        description: 'Peak time bonus (15%)',
        amount: peakTimeBonus,
      });
    }

    // 8. Urgency bonus
    let urgencyBonus = 0;
    if (input.isUrgent) {
      urgencyBonus = this.URGENCY_BONUS;
      breakdown.push({
        component: 'urgency',
        description: 'Urgent delivery bonus',
        amount: urgencyBonus,
      });
    }

    // 9. No efficiency bonus for single order
    const efficiencyBonus = 0;

    // Calculate total
    const totalEarnings = baseRate + distanceRate + timeRate + itemsRate + stopFees + 
                         accessFees + peakTimeBonus + urgencyBonus + efficiencyBonus;

    return {
      baseRate,
      distanceRate,
      timeRate,
      itemsRate,
      stopFees,
      accessFees,
      peakTimeBonus,
      urgencyBonus,
      efficiencyBonus,
      totalEarnings,
      breakdown,
    };
  }

  // ==================== MULTI-STOP ROUTE CALCULATION ====================

  /**
   * Calculate driver earnings for a multi-stop route
   */
  static calculateMultiStopRoute(input: MultiStopRouteInput): DriverEarningsResult {
    const breakdown: Array<{ component: string; description: string; amount: number }> = [];

    // 1. Base rate
    const vehicleType = input.vehicleType || 'medium_van';
    const baseRate = this.BASE_RATES[vehicleType];
    breakdown.push({
      component: 'base',
      description: `Base rate for ${vehicleType.replace('_', ' ')}`,
      amount: baseRate,
    });

    // 2. Distance rate (total route distance)
    const distanceRate = Math.floor(input.totalDistance * this.DISTANCE_RATE_PER_MILE);
    breakdown.push({
      component: 'distance',
      description: `Total route distance (${input.totalDistance.toFixed(1)} miles)`,
      amount: distanceRate,
    });

    // 3. Time rate (total route duration)
    const timeRate = Math.floor(input.totalDuration * this.TIME_RATE_PER_MINUTE);
    breakdown.push({
      component: 'time',
      description: `Total route time (${Math.round(input.totalDuration)} min)`,
      amount: timeRate,
    });

    // 4. Items handling (all stops)
    const totalItems = input.stops.reduce((sum, stop) => sum + stop.itemsCount, 0);
    const itemsRate = totalItems * this.ITEM_RATE;
    breakdown.push({
      component: 'items',
      description: `Total items across ${input.stops.length} stops (${totalItems} items)`,
      amount: itemsRate,
    });

    // 5. Stop fees (progressive pricing)
    let stopFees = 0;
    const stopCount = input.stops.length;
    
    if (stopCount >= 2) {
      stopFees += this.STOP_FEES.second;
    }
    if (stopCount >= 3) {
      stopFees += this.STOP_FEES.third;
    }
    if (stopCount >= 4) {
      stopFees += this.STOP_FEES.fourth;
    }
    if (stopCount > 4) {
      stopFees += (stopCount - 4) * this.STOP_FEES.additional;
    }

    if (stopFees > 0) {
      breakdown.push({
        component: 'stops',
        description: `Multi-stop fees (${stopCount} stops)`,
        amount: stopFees,
      });
    }

    // 6. Access fees (stairs/floors across all stops)
    let accessFees = 0;
    let totalFloors = 0;
    input.stops.forEach((stop, index) => {
      if (stop.hasStairs && stop.floorCount && stop.floorCount > 0) {
        accessFees += stop.floorCount * this.FLOOR_RATE;
        totalFloors += stop.floorCount;
      }
    });

    if (accessFees > 0) {
      breakdown.push({
        component: 'access',
        description: `Stairs surcharge across stops (${totalFloors} total floors)`,
        amount: accessFees,
      });
    }

    // 7. Peak time bonus
    let peakTimeBonus = 0;
    if (input.isPeakTime || (input.scheduledAt && this.isPeakTime(input.scheduledAt))) {
      const subtotal = baseRate + distanceRate + timeRate + itemsRate + stopFees + accessFees;
      peakTimeBonus = Math.floor(subtotal * this.PEAK_TIME_BONUS_MULTIPLIER);
      breakdown.push({
        component: 'peak_time',
        description: 'Peak time bonus (15%)',
        amount: peakTimeBonus,
      });
    }

    // 8. No urgency bonus for multi-stop routes
    const urgencyBonus = 0;

    // 9. Efficiency bonus for multi-stop routes (3+ stops)
    let efficiencyBonus = 0;
    if (stopCount >= 3) {
      const subtotal = baseRate + distanceRate + timeRate + itemsRate + stopFees + accessFees;
      efficiencyBonus = Math.floor(subtotal * this.EFFICIENCY_BONUS_MULTIPLIER);
      breakdown.push({
        component: 'efficiency',
        description: `Multi-stop efficiency bonus (10% for ${stopCount} stops)`,
        amount: efficiencyBonus,
      });
    }

    // Calculate total
    const totalEarnings = baseRate + distanceRate + timeRate + itemsRate + stopFees + 
                         accessFees + peakTimeBonus + urgencyBonus + efficiencyBonus;

    return {
      baseRate,
      distanceRate,
      timeRate,
      itemsRate,
      stopFees,
      accessFees,
      peakTimeBonus,
      urgencyBonus,
      efficiencyBonus,
      totalEarnings,
      breakdown,
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Check if the given time is during peak hours
   */
  private static isPeakTime(date: Date): boolean {
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return true;
    }

    // Weekday peak hours: 7-10am and 5-8pm
    if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate driver earnings from booking data (single order)
   */
  static calculateFromBooking(booking: {
    baseDistanceMiles: number;
    estimatedDurationMinutes: number;
    vehicleType?: string;
    itemsCount: number;
    hasStairs?: boolean;
    floorCount?: number;
    scheduledAt: Date;
    isUrgent?: boolean;
  }): DriverEarningsResult {
    return this.calculateSingleOrder({
      distanceMiles: booking.baseDistanceMiles,
      durationMinutes: booking.estimatedDurationMinutes,
      vehicleType: (booking.vehicleType as any) || 'medium_van',
      itemsCount: booking.itemsCount,
      hasStairs: booking.hasStairs,
      floorCount: booking.floorCount,
      scheduledAt: booking.scheduledAt,
      isUrgent: booking.isUrgent,
    });
  }
}

