/**
 * Payout Processing Service
 * 
 * Handles the automated payout calculation and processing for completed routes
 */

import { PrismaClient } from '@prisma/client';
import { PerformanceTrackingService } from '@/lib/services/performance-tracking-service';

// Placeholder interfaces (removed unused RoutePayoutData)

interface PayoutBreakdown {
  basePay: number;
  distancePay: number;
  timePay: number;
  stopBonus: number;
  total: number;
  adminApprovalRequired?: boolean;
  breakdown?: any;
  // Legacy fields for compatibility
  netDriverPayout?: number;
  helperShare?: number;
  companyShare?: number;
  performanceMultiplier?: number;
  totalBonuses?: number;
  totalPenalties?: number;
  routeBaseFare?: number;
  perDropFees?: number;
  mileageComponent?: number;
  performanceAdjustment?: number;
  routeExcellenceBonus?: number;
  backhaulBonus?: number;
  fuelEfficiencyBonus?: number;
  penalties?: any[];
  helperDetails?: any;
}

const prisma = new PrismaClient();

export interface ProcessPayoutRequest {
  routeId: string;
  helperHours?: number;
  helperSkillLevel?: 'trainee' | 'skilled' | 'team_lead';
  fuelEfficiencyData?: {
    expectedLiters: number;
    actualLiters: number;
  };
  penalties?: Array<{
    type: 'damage' | 'late_delivery' | 'route_deviation' | 'compliance_breach';
    amount: number;
    description: string;
  }>;
}

export interface PayoutProcessingResult {
  success: boolean;
  payoutBreakdown: PayoutBreakdown;
  ledgerTransactions: Array<{
    transactionType: string;
    amount: number;
    description?: string;
  }>;
  driverPayoutId?: string;
  helperPayoutId?: string;
}

export class PayoutProcessingService {
  /**
   * Process payout for a completed route
   */
  public static async processRoutePayout(request: ProcessPayoutRequest): Promise<PayoutProcessingResult> {
    try {
      // 1. Get route details with all related data
      const route = await this.getRouteWithDetails(request.routeId);
      
      if (!route) {
        throw new Error('Route not found');
      }

      if (route.status !== 'completed') {
        throw new Error('Route must be completed to process payout');
      }

      // 2. Calculate performance metrics
      const performanceData = this.extractPerformanceData(route);
      
      // 3. Calculate earnings using Advanced Pricing Engine
      // Get driver's earnings today for cap calculation
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (route.driverId) {
        void prisma.driverEarnings.aggregate({
        where: {
          driverId: route.driverId,
          calculatedAt: {
            gte: today,
            lt: tomorrow
          }
        },
        _sum: {
          netAmountPence: true
        }
      });
      }

      // ✅ Calculate earnings using REAL performance-based engine
      const performanceService = PerformanceTrackingService.getInstance();
      
      // Extract route data for calculation
      const routeRevenue = (route as any).totalOutcome || 0;
      const routeDistance = (route.optimizedDistanceKm || 0) * 0.621371; // Convert km to miles
      const dropCount = (route as any).drops?.length || 1;
      
      const routeData = {
        baseFare: 25.00, // £25 base fare per route
        dropCount,
        mileage: routeDistance,
        routeOutcome: routeRevenue,
        helperCount: 0 // Will be calculated from request if needed
      };
      
      if (!route.driverId) {
        throw new Error('Cannot calculate earnings for route without assigned driver');
      }

      const earningsCalculation = await performanceService.calculateDriverEarnings(
        route.driverId,
        `route_${route.id}`,
        routeData
      );
      
      // 4. Convert to compatible payout breakdown format
      const payoutBreakdown: PayoutBreakdown = {
        basePay: earningsCalculation.routeBaseFare,
        distancePay: earningsCalculation.mileageComponent,
        timePay: 0, // Time not tracked in route completion
        stopBonus: earningsCalculation.perDropFee,
        total: earningsCalculation.finalPayout,
        breakdown: earningsCalculation as any,
        // Legacy compatibility fields
        netDriverPayout: earningsCalculation.finalPayout,
        helperShare: earningsCalculation.helperShare,
        companyShare: (routeRevenue / 100) - earningsCalculation.finalPayout,
        performanceMultiplier: earningsCalculation.performanceMultiplier,
        totalBonuses: Object.values(earningsCalculation.bonuses).reduce((sum, bonus) => sum + bonus, 0),
        totalPenalties: Object.values(earningsCalculation.penalties).reduce((sum, penalty) => sum + penalty, 0),
        routeBaseFare: earningsCalculation.routeBaseFare,
        perDropFees: earningsCalculation.perDropFee,
        mileageComponent: earningsCalculation.mileageComponent,
        performanceAdjustment: 0,
        routeExcellenceBonus: 0,
        backhaulBonus: 0,
        fuelEfficiencyBonus: 0,
        penalties: [],
        helperDetails: null
      };

      // 5. Create ledger transactions
      const ledgerTransactions = await this.createLedgerTransactions(
        request.routeId,
        route.driverId,
        payoutBreakdown
      );

      // 6. Process actual payouts (would integrate with payment system)
      const driverPayoutId = await this.processDriverPayout(route.driverId, payoutBreakdown);
      const helperPayoutId = request.helperHours ? 
        await this.processHelperPayout(request.routeId, payoutBreakdown) : 
        undefined;

      // 7. Update route status
      await prisma.route.update({
        where: { id: request.routeId },
        data: {
          status: 'closed',
          driverPayout: payoutBreakdown.netDriverPayout,
          helperPayout: payoutBreakdown.helperShare,
          companyMargin: payoutBreakdown.companyShare,
          performanceMultiplier: payoutBreakdown.performanceMultiplier,
          bonusesTotal: payoutBreakdown.totalBonuses,
          penaltiesTotal: payoutBreakdown.totalPenalties
        }
      });

      // 8. Update driver performance metrics
      await this.updateDriverPerformance(route.driverId, payoutBreakdown, performanceData);

      return {
        success: true,
        payoutBreakdown,
        ledgerTransactions: ledgerTransactions.map(t => ({
          transactionType: t.transactionType,
          amount: t.amount.toNumber(),
          description: t.description || undefined
        })),
        driverPayoutId,
        helperPayoutId
      };

    } catch (error) {
      console.error('Error processing payout:', error);
      throw error;
    }
  }

  /**
   * Get route with all necessary details for payout calculation
   */
  private static async getRouteWithDetails(routeId: string) {
    return await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        drops: {
          include: {
            User: true
          }
        },
        driver: true,
        Vehicle: true
      }
    });
  }

  /**
   * Extract performance data from route
   */
  private static extractPerformanceData(route: any) {
    const drops = route.drops || [];
    
    // Calculate customer ratings (mock data for now)
    const customerRatings = drops
      .filter((drop: any) => drop.customerRating)
      .map((drop: any) => drop.customerRating);
    
    // Calculate on-time performance
    const onTimeDrops = drops.filter((drop: any) => 
      drop.actualDeliveryTime && drop.timeWindowEnd && 
      drop.actualDeliveryTime <= drop.timeWindowEnd
    ).length;

    // Calculate successful drops
    const successfulDrops = drops.filter((drop: any) => drop.status === 'completed').length;

    return {
      customerRatings: customerRatings.length > 0 ? customerRatings : [4], // Default to 4 stars
      totalDrops: drops.length,
      onTimeDrops,
      successfulDrops,
      actualDistanceKm: route.actualDistanceKm || route.optimizedDistanceKm || 0,
      optimizedDistanceKm: route.optimizedDistanceKm || 0
    };
  }

  /**
   * Calculate backhaul bonus eligibility
   */
  private static calculateBackhaulBonus(_route: any) {
    void _route;
    // This would be determined by whether the route ended in an area
    // where there's high probability of getting a return load
    // For now, return null (no backhaul bonus)
    return undefined;
  }

  /**
   * Create all ledger transactions for the payout
   */
  private static async createLedgerTransactions(
    routeId: string,
    driverId: string,
    breakdown: PayoutBreakdown
  ) {
    const transactions = [
      {
        routeId,
        userId: driverId,
        transactionType: 'base_fare' as const,
        amount: breakdown.routeBaseFare,
        description: 'Route base fare'
      },
      {
        routeId,
        userId: driverId,
        transactionType: 'per_drop_fee' as const,
        amount: breakdown.perDropFees,
        description: 'Per-drop completion fees'
      },
      {
        routeId,
        userId: driverId,
        transactionType: 'mileage' as const,
        amount: breakdown.mileageComponent,
        description: 'Mileage component'
      },
      {
        routeId,
        userId: driverId,
        transactionType: 'performance_bonus' as const,
        amount: breakdown.performanceAdjustment,
        description: `Performance adjustment (${breakdown.performanceMultiplier}x multiplier)`
      }
    ];

    // Add bonus transactions
    if (breakdown.routeExcellenceBonus && breakdown.routeExcellenceBonus > 0) {
      transactions.push({
        routeId,
        userId: driverId,
        transactionType: 'route_excellence_bonus' as any,
        amount: breakdown.routeExcellenceBonus,
        description: 'Route excellence bonus'
      });
    }

    if (breakdown.backhaulBonus && breakdown.backhaulBonus > 0) {
      transactions.push({
        routeId,
        userId: driverId,
        transactionType: 'backhaul_bonus' as any,
        amount: breakdown.backhaulBonus,
        description: 'Backhaul bonus'
      });
    }

    if (breakdown.fuelEfficiencyBonus && breakdown.fuelEfficiencyBonus > 0) {
      transactions.push({
        routeId,
        userId: driverId,
        transactionType: 'fuel_efficiency_bonus' as any,
        amount: breakdown.fuelEfficiencyBonus,
        description: 'Fuel efficiency bonus'
      });
    }

    // Add penalty transactions
    for (const penalty of (breakdown.penalties || [])) {
      transactions.push({
        routeId,
        userId: driverId,
        transactionType: 'penalty' as any,
        amount: -penalty.amount,
        description: `Penalty: ${penalty.description}`
      });
    }

    // Add helper share transaction
    if (breakdown.helperShare && breakdown.helperShare > 0) {
      transactions.push({
        routeId,
        userId: driverId, // Will be changed to helper ID when we have helper management
        transactionType: 'helper_share' as any,
        amount: breakdown.helperShare,
        description: breakdown.helperDetails ? 
          `Helper payout (${breakdown.helperDetails.hours}h @ £${breakdown.helperDetails.hourlyRate}/h)` :
          'Helper payout'
      });
    }

    // Create all transactions (filter out those with undefined amounts)
    return await Promise.all(
      transactions
        .filter(transaction => transaction.amount !== undefined && transaction.amount !== null)
        .map(transaction =>
          prisma.payoutLedger.create({ data: transaction as any })
        )
    );
  }

  /**
   * Process driver payout (integration with payment system would go here)
   */
  private static async processDriverPayout(
    driverId: string,
    breakdown: PayoutBreakdown
  ): Promise<string> {
    // In production, this would integrate with Stripe, bank transfers, etc.
    // For now, create a record in the driver payout table
    
    const payout = await prisma.driverPayout.create({
      data: {
        driverId,
        totalAmountPence: Math.round((breakdown.netDriverPayout || 0) * 100),
        status: 'pending'
      }
    });

    // Simulate processing (in production, would call payment API)
    setTimeout(async () => {
      await prisma.driverPayout.update({
        where: { id: payout.id },
        data: {
          status: 'completed',
          processedAt: new Date()
        }
      });
    }, 5000); // 5 second delay to simulate processing

    return payout.id;
  }

  /**
   * Process helper payout
   */
  private static async processHelperPayout(
    routeId: string,
    _breakdown: PayoutBreakdown
  ): Promise<string> {
    void _breakdown;
    // For now, create a simple record
    // In production, would have proper helper management system
    
    return `helper-payout-${routeId}-${Date.now()}`;
  }

  /**
   * Update driver performance metrics
   */
  private static async updateDriverPerformance(
    driverId: string,
    payoutBreakdown: PayoutBreakdown,
    performanceData: any
  ) {
    // Store performance metrics for this route
    await prisma.performanceMetrics.create({
      data: {
        driverId,
        routeId: (payoutBreakdown.routeBaseFare || 0).toString(), // This should be the actual routeId
        csatScore: performanceData.customerRatings.reduce((a: number, b: number) => a + b, 0) / performanceData.customerRatings.length,
        onTimePerformance: performanceData.onTimeDrops / performanceData.totalDrops,
        firstTimeSuccess: performanceData.successfulDrops / performanceData.totalDrops,
        assetCompliance: performanceData.actualDistanceKm > 0 ? 
          Math.min(1, performanceData.optimizedDistanceKm / performanceData.actualDistanceKm) : 1,
        performanceScore: payoutBreakdown.performanceMultiplier
      }
    });

    // Update driver profile with latest performance
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      include: { 
        driver: { 
          include: { DriverProfile: true } 
        } 
      }
    });

    // Note: Driver profile updates would go here when enterprise fields are added to DriverProfile model
    // For now, we skip profile updates as the current schema doesn't have totalJobs, totalEarnings, etc.
    if (driver?.driver?.DriverProfile) {
      console.log(`Driver ${driverId} profile exists but enterprise fields not yet available in schema`);
    }
  }

  /**
   * Get payout history for a driver
   */
  public static async getDriverPayoutHistory(
    driverId: string,
    limit: number = 10
  ) {
    const payouts = await (prisma as any).payoutLedger.findMany({
      where: { userId: driverId },
      orderBy: { calculatedAt: 'desc' },
      take: limit,
      include: {
        route: {
          include: {
            drops: true
          }
        }
      }
    });

    return payouts.map((payout: any) => ({
      id: payout.id,
      routeId: payout.routeId,
      transactionType: payout.transactionType,
      amount: payout.amount.toNumber(),
      description: payout.description,
      calculatedAt: payout.calculatedAt,
      processedAt: payout.processedAt,
      route: payout.route ? {
        id: payout.route.id,
        dropsCount: payout.route.drops.length,
        totalOutcome: payout.route.totalOutcome.toNumber(),
        status: payout.route.status
      } : null
    }));
  }

  /**
   * Generate comprehensive payout report
   */
  public static async generatePayoutReport(routeId: string) {
    const route = await this.getRouteWithDetails(routeId);
    
    if (!route) {
      throw new Error('Route not found');
    }

    const ledgerEntries = await (prisma as any).payoutLedger.findMany({
      where: { routeId },
      orderBy: { calculatedAt: 'asc' }
    });

    const performanceMetrics = await (prisma as any).performanceMetrics.findFirst({
      where: { 
        driverId: route.driverId,
        routeId 
      }
    });

    return {
      route: {
        id: route.id,
        status: route.status,
        startTime: route.startTime,
        endTime: route.endTime,
        totalOutcome: route.totalOutcome.toNumber(),
        optimizedDistance: route.optimizedDistanceKm,
        actualDistance: route.actualDistanceKm
      },
      driver: route.driver ? {
        id: route.driver.id,
        name: route.driver.name,
        email: route.driver.email
      } : null,
      drops: route.drops.map((drop: any) => ({
        id: drop.id,
        status: drop.status,
        pickupAddress: drop.pickupAddress,
        deliveryAddress: drop.deliveryAddress,
        quotedPrice: drop.quotedPrice.toNumber(),
        serviceTier: drop.serviceTier
      })),
      ledgerEntries: ledgerEntries.map((entry: any) => ({
        transactionType: entry.transactionType,
        amount: entry.amount.toNumber(),
        description: entry.description,
        calculatedAt: entry.calculatedAt
      })),
      performanceMetrics: performanceMetrics ? {
        csatScore: performanceMetrics.csatScore,
        onTimePerformance: performanceMetrics.onTimePerformance,
        firstTimeSuccess: performanceMetrics.firstTimeSuccess,
        assetCompliance: performanceMetrics.assetCompliance,
        performanceScore: performanceMetrics.performanceScore
      } : null,
      totals: {
        grossDriverPayout: route.driverPayout?.toNumber() || 0,
        helperPayout: route.helperPayout?.toNumber() || 0,
        companyMargin: route.companyMargin?.toNumber() || 0,
        performanceMultiplier: route.performanceMultiplier || 1.0,
        totalBonuses: route.bonusesTotal?.toNumber() || 0,
        totalPenalties: route.penaltiesTotal?.toNumber() || 0
      }
    };
  }

  // ========== Helper Functions for Advanced Pricing ==========

  /**
   * Calculate capacity utilization for a route
   */
  private static calculateCapacityUtilization(route: any): number {
    if (!route.drops || route.drops.length === 0) return 0;

    let totalWeight = 0;
    let totalVolume = 0;

    for (const drop of route.drops) {
      totalWeight += drop.weight || 10;
      totalVolume += drop.volume || 0.1;
    }

    // Assume small van capacity for estimation
    const maxWeight = 1000; // kg
    const maxVolume = 15; // m³

    const weightUtilization = Math.min(totalWeight / maxWeight, 1);
    const volumeUtilization = Math.min(totalVolume / maxVolume, 1);

    // Return the higher utilization (limiting factor)
    return Math.max(weightUtilization, volumeUtilization);
  }

  /**
   * Calculate admin bonuses based on performance and helper hours
   */
  private static calculateAdminBonuses(performanceData: any, helperHours?: number): number {
    let bonuses = 0;

    // Performance-based bonuses
    if (performanceData && performanceData.performanceScore > 0.9) {
      bonuses += 500; // £5 bonus for excellent performance
    }

    // Helper bonuses (if applicable)
    if (helperHours && helperHours > 0) {
      const hourlyRate = 1800; // £18/hour for helper
      bonuses += helperHours * hourlyRate;
    }

    return bonuses;
  }


}