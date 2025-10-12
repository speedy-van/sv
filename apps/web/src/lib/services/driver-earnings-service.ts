/**
 * Driver Earnings Service - Unified Calculation Engine
 * 
 * This service provides a single source of truth for driver earnings calculations.
 * Supports both single deliveries and multi-drop routes.
 * 
 * Features:
 * - Configurable base rates from admin dashboard
 * - Multi-drop route support
 * - Performance multipliers
 * - Bonuses and penalties
 * - Helper share calculations
 * - Earnings caps and floors
 * - Detailed breakdown for transparency
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface DriverEarningsInput {
  // Assignment details
  assignmentId: string;
  driverId: string;
  bookingId: string;
  
  // Route details
  distanceMiles: number;
  durationMinutes: number;
  dropCount: number;
  
  // Time breakdown
  loadingMinutes?: number;
  unloadingMinutes?: number;
  drivingMinutes?: number;
  waitingMinutes?: number;
  
  // Booking details
  customerPaymentPence: number;
  urgencyLevel?: 'standard' | 'express' | 'premium';
  serviceType?: 'economy' | 'standard' | 'priority';
  
  // Performance factors
  onTimeDelivery?: boolean;
  customerRating?: number;
  
  // Additional costs
  tollCostsPence?: number;
  parkingCostsPence?: number;
  
  // Bonuses/Penalties (admin approved)
  adminApprovedBonusPence?: number;
  adminApprovedPenaltyPence?: number;
  adminApprovalId?: string;
  
  // Helper details
  hasHelper?: boolean;
  helperSharePercentage?: number;
}

export interface DriverEarningsBreakdown {
  // Base components
  baseFare: number;              // Base fare per job (pence)
  perDropFee: number;            // Fee per delivery stop (pence)
  mileageFee: number;            // Distance-based fee (pence)
  timeFee: number;               // Time-based fee (pence)
  
  // Multipliers
  urgencyMultiplier: number;     // Multiplier for urgency
  performanceMultiplier: number; // Performance-based multiplier
  serviceTypeMultiplier: number; // Service type multiplier
  
  // Bonuses
  bonuses: {
    onTimeBonus: number;
    multiDropBonus: number;
    highRatingBonus: number;
    adminBonus: number;
    total: number;
  };
  
  // Penalties
  penalties: {
    lateDelivery: number;
    lowRating: number;
    adminPenalty: number;
    total: number;
  };
  
  // Reimbursements
  reimbursements: {
    tolls: number;
    parking: number;
    total: number;
  };
  
  // Calculations
  subtotal: number;              // Before bonuses/penalties
  grossEarnings: number;         // After bonuses/penalties
  helperShare: number;           // Amount for helper
  netEarnings: number;           // Final driver payout
  cappedNetEarnings: number;     // After applying cap
  
  // Metadata
  capApplied: boolean;
  floorApplied: boolean;
  earningsCap: number;
  earningsFloor: number;
}

export interface DriverEarningsResult {
  success: boolean;
  earningsId?: string;
  breakdown: DriverEarningsBreakdown;
  currency: 'GBP';
  calculatedAt: string;
  requiresAdminApproval: boolean;
  warnings: string[];
  recommendations: string[];
}

// ============================================================================
// CONFIGURATION INTERFACE
// ============================================================================

export interface DriverEarningsConfig {
  // Base rates (in pence)
  baseFarePerJob: number;
  perDropFee: number;
  perMileFee: number;
  perMinuteFee: number;
  
  // Multipliers
  urgencyMultipliers: {
    standard: number;
    express: number;
    premium: number;
  };
  
  serviceTypeMultipliers: {
    economy: number;
    standard: number;
    priority: number;
  };
  
  // Performance bonuses (in pence)
  onTimeBonusPence: number;
  multiDropBonusPerStop: number;
  highRatingBonusPence: number;
  
  // Penalties (in pence)
  lateDeliveryPenaltyPence: number;
  lowRatingPenaltyPence: number;
  
  // Caps and floors
  maxEarningsPercentOfBooking: number; // e.g., 100% = 1.0 (driver gets full amount)
  minEarningsPerJob: number;           // Minimum payout in pence
  
  // Helper share
  defaultHelperSharePercentage: number; // e.g., 20% = 0.20
  
  // Multi-drop settings
  multiDropThreshold: number;          // Number of drops to trigger bonus
  
  // Performance thresholds
  highRatingThreshold: number;         // e.g., 4.5
  lowRatingThreshold: number;          // e.g., 3.0
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: DriverEarningsConfig = {
  baseFarePerJob: 2500,        // £25.00
  perDropFee: 1200,            // £12.00 per drop
  perMileFee: 55,              // £0.55 per mile
  perMinuteFee: 15,            // £0.15 per minute
  
  urgencyMultipliers: {
    standard: 1.0,
    express: 1.3,
    premium: 1.6,
  },
  
  serviceTypeMultipliers: {
    economy: 0.85,     // 15% discount for economy multi-drop
    standard: 1.0,
    priority: 1.5,
  },
  
  onTimeBonusPence: 500,       // £5.00
  multiDropBonusPerStop: 300,  // £3.00 per stop above threshold
  highRatingBonusPence: 800,   // £8.00
  
  lateDeliveryPenaltyPence: 1000,  // £10.00
  lowRatingPenaltyPence: 500,      // £5.00
  
  maxEarningsPercentOfBooking: 1.0,   // 100% - driver gets full calculated amount
  minEarningsPerJob: 2000,            // £20.00 minimum
  
  defaultHelperSharePercentage: 0.20, // 20% for helper
  
  multiDropThreshold: 2,              // Bonus kicks in at 3+ drops
  
  highRatingThreshold: 4.5,
  lowRatingThreshold: 3.0,
};

// ============================================================================
// DRIVER EARNINGS SERVICE CLASS
// ============================================================================

export class DriverEarningsService {
  private config: DriverEarningsConfig;
  
  constructor(config?: Partial<DriverEarningsConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Load configuration from database (admin settings)
   */
  async loadConfigFromDatabase(): Promise<void> {
    try {
      const settings = await prisma.pricingSettings.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
      
      if (settings) {
        // Apply driver rate multiplier from admin settings
        const multiplier = settings.driverRateMultiplier || 1.0;
        
        this.config.baseFarePerJob = Math.round(DEFAULT_CONFIG.baseFarePerJob * multiplier);
        this.config.perDropFee = Math.round(DEFAULT_CONFIG.perDropFee * multiplier);
        this.config.perMileFee = Math.round(DEFAULT_CONFIG.perMileFee * multiplier);
        this.config.perMinuteFee = Math.round(DEFAULT_CONFIG.perMinuteFee * multiplier);
        
        logger.info('Driver earnings config loaded from database', {
          settingsId: settings.id,
          driverRateMultiplier: multiplier,
        });
      }
    } catch (error) {
      logger.error('Failed to load earnings config from database', error as Error);
      // Continue with default config
    }
  }
  
  /**
   * Calculate driver earnings with full breakdown
   */
  async calculateEarnings(input: DriverEarningsInput): Promise<DriverEarningsResult> {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Load latest config from database
      await this.loadConfigFromDatabase();
      
      // Validate input
      this.validateInput(input, warnings);
      
      // Calculate base components
      const baseFare = this.config.baseFarePerJob;
      const perDropFee = this.calculatePerDropFee(input.dropCount);
      const mileageFee = this.calculateMileageFee(input.distanceMiles);
      const timeFee = this.calculateTimeFee(input.durationMinutes);
      
      // Calculate multipliers
      const urgencyMultiplier = this.getUrgencyMultiplier(input.urgencyLevel);
      const serviceTypeMultiplier = this.getServiceTypeMultiplier(input.serviceType);
      const performanceMultiplier = this.calculatePerformanceMultiplier(input);
      
      // Calculate bonuses
      const bonuses = this.calculateBonuses(input);
      
      // Calculate penalties
      const penalties = this.calculatePenalties(input);
      
      // Calculate reimbursements
      const reimbursements = {
        tolls: input.tollCostsPence || 0,
        parking: input.parkingCostsPence || 0,
        total: (input.tollCostsPence || 0) + (input.parkingCostsPence || 0),
      };
      
      // Calculate subtotal
      const subtotal = Math.round(
        (baseFare + perDropFee + mileageFee + timeFee) *
        urgencyMultiplier *
        serviceTypeMultiplier *
        performanceMultiplier
      );
      
      // Calculate gross earnings
      const grossEarnings = subtotal + bonuses.total - penalties.total + reimbursements.total;
      
      // Calculate helper share
      const helperSharePercentage = input.hasHelper
        ? (input.helperSharePercentage || this.config.defaultHelperSharePercentage)
        : 0;
      const helperShare = Math.round(grossEarnings * helperSharePercentage);
      
      // Calculate net earnings (driver gets full amount minus helper share only)
      let netEarnings = grossEarnings - helperShare;
      
      // Apply earnings cap (percentage of customer payment)
      const earningsCap = Math.round(
        input.customerPaymentPence * this.config.maxEarningsPercentOfBooking
      );
      const capApplied = netEarnings > earningsCap;
      const cappedNetEarnings = Math.min(netEarnings, earningsCap);
      
      // Apply earnings floor
      const earningsFloor = this.config.minEarningsPerJob;
      const floorApplied = cappedNetEarnings < earningsFloor;
      if (floorApplied) {
        netEarnings = earningsFloor;
        warnings.push(`Earnings below minimum (£${earningsFloor / 100}), floor applied`);
      } else {
        netEarnings = cappedNetEarnings;
      }
      
      if (capApplied) {
        warnings.push(`Earnings capped at ${this.config.maxEarningsPercentOfBooking * 100}% of booking value`);
      }
      
      // FIXED: Daily Cap Enforcement (UK Compliance - £500/day)
      const DAILY_CAP_PENCE = 50000; // £500
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todaysEarnings = await prisma.driverEarnings.aggregate({
        where: {
          driverId: input.driverId,
          calculatedAt: { gte: today, lt: tomorrow }
        },
        _sum: { netAmountPence: true }
      });
      
      const currentDailyTotal = todaysEarnings._sum.netAmountPence || 0;
      const projectedDailyTotal = currentDailyTotal + netEarnings;
      
      if (projectedDailyTotal > DAILY_CAP_PENCE) {
        const remainingCapacity = Math.max(0, DAILY_CAP_PENCE - currentDailyTotal);
        warnings.push(
          `Daily earnings cap (£500) reached. ` +
          `Current: £${currentDailyTotal/100}, ` +
          `Requested: £${netEarnings/100}, ` +
          `Capped to: £${remainingCapacity/100}`
        );
        netEarnings = remainingCapacity;
        
        // Require admin approval if cap is hit
        if (remainingCapacity === 0) {
          warnings.push('CRITICAL: Driver has reached daily cap. Job requires admin approval.');
        }
      }
      
      // Prevent negative earnings
      netEarnings = Math.max(0, netEarnings);
      
      // Generate recommendations
      this.generateRecommendations(input, netEarnings, recommendations);
      
      // Build breakdown
      const breakdown: DriverEarningsBreakdown = {
        baseFare,
        perDropFee,
        mileageFee,
        timeFee,
        urgencyMultiplier,
        performanceMultiplier,
        serviceTypeMultiplier,
        bonuses,
        penalties,
        reimbursements,
        subtotal,
        grossEarnings,
        helperShare,
        netEarnings,
        cappedNetEarnings,
        capApplied,
        floorApplied,
        earningsCap,
        earningsFloor,
      };
      
      // Determine if admin approval is required
      const requiresAdminApproval = this.requiresAdminApproval(input, breakdown);
      
      logger.info('Driver earnings calculated', {
        assignmentId: input.assignmentId,
        driverId: input.driverId,
        netEarnings,
        dropCount: input.dropCount,
        distanceMiles: input.distanceMiles,
      });
      
      return {
        success: true,
        breakdown,
        currency: 'GBP',
        calculatedAt: new Date().toISOString(),
        requiresAdminApproval,
        warnings,
        recommendations,
      };
      
    } catch (error) {
      logger.error('Failed to calculate driver earnings', error as Error, {
        assignmentId: input.assignmentId,
        driverId: input.driverId,
      });
      
      throw error;
    }
  }
  
  /**
   * Save earnings to database
   */
  async saveEarnings(
    input: DriverEarningsInput,
    result: DriverEarningsResult
  ): Promise<string> {
    const earnings = await prisma.driverEarnings.create({
      data: {
        driverId: input.driverId,
        assignmentId: input.assignmentId,
        baseAmountPence: result.breakdown.baseFare,
        surgeAmountPence: Math.round(
          result.breakdown.subtotal - result.breakdown.baseFare
        ),
        tipAmountPence: 0, // Tips handled separately
        feeAmountPence: 0, // No platform fee - driver gets full amount
        netAmountPence: result.breakdown.netEarnings,
        grossEarningsPence: result.breakdown.grossEarnings,
        platformFeePence: 0, // No platform fee
        cappedNetEarningsPence: result.breakdown.cappedNetEarnings,
        rawNetEarningsPence: result.breakdown.netEarnings,
        currency: 'gbp',
        calculatedAt: new Date(),
        paidOut: false,
        requiresAdminApproval: result.requiresAdminApproval,
        adminApprovalId: input.adminApprovalId,
      } as any,
    });
    
    logger.info('Driver earnings saved to database', {
      earningsId: earnings.id,
      assignmentId: input.assignmentId,
      netEarnings: result.breakdown.netEarnings,
    });
    
    return earnings.id;
  }
  
  // ============================================================================
  // PRIVATE CALCULATION METHODS
  // ============================================================================
  
  private validateInput(input: DriverEarningsInput, warnings: string[]): void {
    if (input.distanceMiles <= 0 || input.distanceMiles > 1000) {
      warnings.push(`Invalid distance: ${input.distanceMiles} miles`);
    }
    
    if (input.durationMinutes <= 0 || input.durationMinutes > 780) {
      warnings.push(`Invalid duration: ${input.durationMinutes} minutes`);
    }
    
    if (input.dropCount <= 0 || input.dropCount > 20) {
      warnings.push(`Invalid drop count: ${input.dropCount}`);
    }
    
    if (input.customerPaymentPence <= 0) {
      warnings.push(`Invalid customer payment: ${input.customerPaymentPence} pence`);
    }
  }
  
  private calculatePerDropFee(dropCount: number): number {
    return dropCount * this.config.perDropFee;
  }
  
  private calculateMileageFee(miles: number): number {
    return Math.round(miles * this.config.perMileFee);
  }
  
  private calculateTimeFee(minutes: number): number {
    return Math.round(minutes * this.config.perMinuteFee);
  }
  
  private getUrgencyMultiplier(urgency?: string): number {
    if (!urgency) return 1.0;
    return this.config.urgencyMultipliers[urgency as keyof typeof this.config.urgencyMultipliers] || 1.0;
  }
  
  private getServiceTypeMultiplier(serviceType?: string): number {
    if (!serviceType) return 1.0;
    return this.config.serviceTypeMultipliers[serviceType as keyof typeof this.config.serviceTypeMultipliers] || 1.0;
  }
  
  private calculatePerformanceMultiplier(input: DriverEarningsInput): number {
    let multiplier = 1.0;
    
    // On-time delivery bonus
    if (input.onTimeDelivery) {
      multiplier += 0.05; // 5% bonus
    }
    
    // High rating bonus
    if (input.customerRating && input.customerRating >= this.config.highRatingThreshold) {
      multiplier += 0.05; // 5% bonus
    }
    
    return multiplier;
  }
  
  private calculateBonuses(input: DriverEarningsInput): DriverEarningsBreakdown['bonuses'] {
    const bonuses = {
      onTimeBonus: 0,
      multiDropBonus: 0,
      highRatingBonus: 0,
      adminBonus: input.adminApprovedBonusPence || 0,
      total: 0,
    };
    
    // On-time delivery bonus
    if (input.onTimeDelivery) {
      bonuses.onTimeBonus = this.config.onTimeBonusPence;
    }
    
    // Multi-drop bonus (for drops above threshold)
    if (input.dropCount > this.config.multiDropThreshold) {
      const extraDrops = input.dropCount - this.config.multiDropThreshold;
      bonuses.multiDropBonus = extraDrops * this.config.multiDropBonusPerStop;
    }
    
    // High rating bonus
    if (input.customerRating && input.customerRating >= this.config.highRatingThreshold) {
      bonuses.highRatingBonus = this.config.highRatingBonusPence;
    }
    
    bonuses.total = Object.values(bonuses).reduce((sum, val) => sum + val, 0);
    
    return bonuses;
  }
  
  private calculatePenalties(input: DriverEarningsInput): DriverEarningsBreakdown['penalties'] {
    const penalties = {
      lateDelivery: 0,
      lowRating: 0,
      adminPenalty: input.adminApprovedPenaltyPence || 0,
      total: 0,
    };
    
    // Late delivery penalty
    if (input.onTimeDelivery === false) {
      penalties.lateDelivery = this.config.lateDeliveryPenaltyPence;
    }
    
    // Low rating penalty
    if (input.customerRating && input.customerRating < this.config.lowRatingThreshold) {
      penalties.lowRating = this.config.lowRatingPenaltyPence;
    }
    
    penalties.total = Object.values(penalties).reduce((sum, val) => sum + val, 0);
    
    return penalties;
  }
  
  private requiresAdminApproval(
    input: DriverEarningsInput,
    breakdown: DriverEarningsBreakdown
  ): boolean {
    // Require approval if earnings are very high
    if (breakdown.netEarnings > 50000) { // £500
      return true;
    }
    
    // Require approval if admin bonus/penalty is applied
    if (input.adminApprovedBonusPence || input.adminApprovedPenaltyPence) {
      return true;
    }
    
    // Require approval if cap was applied and difference is significant
    if (breakdown.capApplied && (breakdown.grossEarnings - breakdown.cappedNetEarnings) > 5000) {
      return true;
    }
    
    return false;
  }
  
  private generateRecommendations(
    input: DriverEarningsInput,
    netEarnings: number,
    recommendations: string[]
  ): void {
    // Recommend helper for long routes
    if (input.distanceMiles > 100 && !input.hasHelper) {
      recommendations.push('Consider adding a helper for long-distance routes');
    }
    
    // Recommend multi-drop optimization
    if (input.dropCount > 5) {
      recommendations.push('Route optimization can improve efficiency for multi-drop deliveries');
    }
    
    // Low earnings warning
    if (netEarnings < 3000) { // £30
      recommendations.push('Earnings are low - consider route optimization or pricing adjustment');
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<DriverEarningsConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): DriverEarningsConfig {
    return { ...this.config };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const driverEarningsService = new DriverEarningsService();

