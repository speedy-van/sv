/**
 * Client-side Earnings Calculator - Dynamic Driver Price Engine Integration
 *
 * This service provides earnings calculations that run entirely in the browser
 * using the same dynamic pricing logic as the server-side engine.
 *
 * Features:
 * - No Prisma dependency
 * - Pure mathematical calculations
 * - Fast preview calculations
 * - Consistent with server-side dynamic pricing engine
 */

// ============================================================================
// TYPES AND INTERFACES (matching server-side)
// ============================================================================

export interface RoutePreviewData {
  bookings: Array<{
    id: string;
    totalGBP: number;
    baseDistanceMiles?: number;
    estimatedDurationMinutes?: number;
  }>;
  driverId?: string;
  // Admin override capabilities
  adminMultiplier?: number;
  adminFixedAdjustment?: number;
  adminOverrideReason?: string;
}

export interface ClientEarningsResult {
  driverPayout: number; // in pence
  platformFee: number; // in pence
  totalRevenue: number; // in pence
  formattedDriverPayout: string;
  formattedPlatformFee: string;
  formattedTotalRevenue: string;
}

// ============================================================================
// DYNAMIC PRICING CONSTANTS (matching server-side engine)
// ============================================================================

const DYNAMIC_RATES = {
  // Base rates per service type (in pence)
  baseRates: {
    ECONOMY: 2500,    // £25
    STANDARD: 3000,   // £30
    PREMIUM: 4000,    // £40
    ENTERPRISE: 5000, // £50
  },

  // Per-mile rates (in pence)
  mileRates: {
    ECONOMY: 60,     // £0.60 per mile
    STANDARD: 70,    // £0.70 per mile
    PREMIUM: 85,     // £0.85 per mile
    ENTERPRISE: 100, // £1.00 per mile
  },

  // Per-minute rates (in pence)
  minuteRates: {
    ECONOMY: 18,    // £0.18 per minute
    STANDARD: 20,   // £0.20 per minute
    PREMIUM: 25,    // £0.25 per minute
    ENTERPRISE: 30, // £0.30 per minute
  },

  // Multi-drop stop fees (progressive)
  stopFees: {
    second: 800,   // £8 for 2nd stop
    third: 1500,   // £15 for 3rd stop
    additional: 2000, // £20 for each additional stop
  },

  // Multi-drop bonuses
  multiDropBonus: {
    minimum: 2000, // £20 minimum for 3+ stops
    perExtraStop: 1000, // £10 per stop above 2
  },

  // Minimum earnings floor
  earningsFloor: 2000, // £20 minimum
};

// ============================================================================
// CLIENT-SIDE CALCULATIONS
// ============================================================================

/**
 * Calculate route earnings preview for admin route creation
 * Uses dynamic pricing logic matching the server-side engine
 */
export function calculateRoutePreviewEarnings(
  previewData: RoutePreviewData
): ClientEarningsResult {
  const { bookings, driverId } = previewData;
  const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.totalGBP), 0);

  if (!driverId || bookings.length === 0) {
    return {
      driverPayout: 0,
      platformFee: totalRevenue,
      totalRevenue,
      formattedDriverPayout: '£0.00',
      formattedPlatformFee: `£${(totalRevenue / 100).toFixed(2)}`,
      formattedTotalRevenue: `£${(totalRevenue / 100).toFixed(2)}`,
    };
  }

  // Calculate total distance and duration
  const totalDistance = bookings.reduce((sum, b) => sum + (Number(b.baseDistanceMiles) || 0), 0);
  const totalDuration = bookings.reduce((sum, b) => sum + (Number(b.estimatedDurationMinutes) || 60), 0);

  // Use dynamic pricing logic (simplified for preview)
  const serviceType = 'STANDARD'; // Default for preview

  // Base fare per booking
  const baseFarePerBooking = DYNAMIC_RATES.baseRates[serviceType];
  const totalBaseFare = bookings.length * baseFarePerBooking;

  // Distance earnings
  const distanceEarnings = Math.round(totalDistance * DYNAMIC_RATES.mileRates[serviceType]);

  // Time earnings
  const timeEarnings = Math.round(totalDuration * DYNAMIC_RATES.minuteRates[serviceType]);

  // Stop fees for multi-drop
  let stopFees = 0;
  if (bookings.length >= 2) stopFees += DYNAMIC_RATES.stopFees.second;
  if (bookings.length >= 3) stopFees += DYNAMIC_RATES.stopFees.third;
  if (bookings.length > 3) stopFees += (bookings.length - 3) * DYNAMIC_RATES.stopFees.additional;

  // Multi-drop bonus
  let multiDropBonus = 0;
  if (bookings.length > 2) {
    multiDropBonus = Math.max(
      DYNAMIC_RATES.multiDropBonus.minimum,
      (bookings.length - 2) * DYNAMIC_RATES.multiDropBonus.perExtraStop
    );
  }

  // Calculate total earnings
  const grossEarnings = totalBaseFare + distanceEarnings + timeEarnings + stopFees + multiDropBonus;
  const helperShare = 0; // No helper for preview
  const netEarnings = grossEarnings - helperShare;

  // Apply minimum earnings floor
  const finalEarnings = Math.max(netEarnings, DYNAMIC_RATES.earningsFloor);

  let finalDriverPayout = finalEarnings;

  // Apply admin overrides if specified
  if (previewData.adminMultiplier && previewData.adminMultiplier !== 1.0) {
    finalDriverPayout = Math.round(finalDriverPayout * previewData.adminMultiplier);
  }

  if (previewData.adminFixedAdjustment && previewData.adminFixedAdjustment !== 0) {
    finalDriverPayout += previewData.adminFixedAdjustment;
  }

  // Ensure minimum earnings
  finalDriverPayout = Math.max(finalDriverPayout, 500); // £5 minimum

  const platformFee = totalRevenue - finalDriverPayout;

  return {
    driverPayout: finalDriverPayout,
    platformFee,
    totalRevenue,
    formattedDriverPayout: `£${(finalDriverPayout / 100).toFixed(2)}`,
    formattedPlatformFee: `£${(platformFee / 100).toFixed(2)}`,
    formattedTotalRevenue: `£${(totalRevenue / 100).toFixed(2)}`,
  };
}

/**
 * Calculate earnings for a single booking (client-side only)
 * Uses dynamic pricing logic
 */
export function calculateSingleBookingEarnings(
  bookingPrice: number, // in pence (not used in dynamic pricing)
  distanceMiles: number = 0,
  durationMinutes: number = 60,
  dropCount: number = 1,
  serviceType: 'economy' | 'standard' | 'priority' = 'standard'
): {
  baseFare: number;
  perDropFee: number;
  mileageFee: number;
  timeFee: number;
  serviceMultiplier: number;
  subtotal: number;
  multiDropBonus: number;
  totalEarnings: number;
  formattedEarnings: string;
} {
  // Map service type to dynamic pricing format
  const dynamicServiceType = serviceType.toUpperCase() as keyof typeof DYNAMIC_RATES.baseRates;
  const rates = DYNAMIC_RATES.baseRates[dynamicServiceType] ? dynamicServiceType : 'STANDARD';

  // Base calculations using dynamic pricing
  const baseFare = DYNAMIC_RATES.baseRates[rates];
  const mileageFee = Math.round(distanceMiles * DYNAMIC_RATES.mileRates[rates]);
  const timeFee = Math.round(durationMinutes * DYNAMIC_RATES.minuteRates[rates]);

  // Stop fees (only applicable for multi-drop, but calculated per booking for consistency)
  let perDropFee = 0;
  if (dropCount > 1) {
    perDropFee = DYNAMIC_RATES.stopFees.second; // Simplified for single booking calculation
  }

  // Service multiplier (handled by dynamic engine, default to 1.0 for client-side)
  const serviceMultiplier = 1.0;

  // Subtotal (base + distance + time + stops)
  const subtotal = baseFare + mileageFee + timeFee + perDropFee;

  // Multi-drop bonus (only if this is part of a multi-drop route)
  const multiDropBonus = dropCount > 2
    ? Math.max(DYNAMIC_RATES.multiDropBonus.minimum, (dropCount - 2) * DYNAMIC_RATES.multiDropBonus.perExtraStop)
    : 0;

  // Total earnings
  const totalEarnings = subtotal + multiDropBonus;

  return {
    baseFare,
    perDropFee,
    mileageFee,
    timeFee,
    serviceMultiplier,
    subtotal,
    multiDropBonus,
    totalEarnings,
    formattedEarnings: `£${(totalEarnings / 100).toFixed(2)}`,
  };
}
