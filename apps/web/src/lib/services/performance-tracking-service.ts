import { prisma } from '@/lib/prisma';

export interface PerformanceMetrics {
  customerSatisfactionScore: number; // 0-1 scale
  onTimePerformanceScore: number;    // 0-1 scale
  firstTimeSuccessRate: number;      // 0-1 scale
  assetRouteComplianceScore: number; // 0-1 scale
  overallPerformanceScore: number;   // 0-1 scale
  performanceMultiplier: number;     // 0.8-1.5 scale
}

export interface PerformanceTier {
  tier: 'exceptional' | 'high' | 'standard' | 'below_standard';
  multiplier: number;
  description: string;
  requirements: {
    minCSAT: number;
    minOTP: number;
    minFTSR: number;
    minARC: number;
  };
}

export interface EarningsCalculation {
  routeBaseFare: number;
  perDropFee: number;
  mileageComponent: number;
  performanceMultiplier: number;
  subtotal: number;
  bonuses: {
    routeExcellence: number;
    weeklyPerformance: number;
    fuelEfficiency: number;
    backhaul: number;
    monthlyAchievement: number;
    quarterlyTier: number;
  };
  penalties: {
    lateDelivery: number;
    routeDeviation: number;
    complianceBreach: number;
    customerDamage: number;
  };
  helperShare: number;
  finalPayout: number;
}

export class PerformanceTrackingService {
  private static instance: PerformanceTrackingService;

  static getInstance(): PerformanceTrackingService {
    if (!PerformanceTrackingService.instance) {
      PerformanceTrackingService.instance = new PerformanceTrackingService();
    }
    return PerformanceTrackingService.instance;
  }

  private readonly performanceTiers: PerformanceTier[] = [
    {
      tier: 'exceptional',
      multiplier: 1.45,
      description: 'Exceptional performance across all metrics',
      requirements: { minCSAT: 4.8, minOTP: 0.95, minFTSR: 0.98, minARC: 0.95 }
    },
    {
      tier: 'high',
      multiplier: 1.25,
      description: 'High performance with consistent quality',
      requirements: { minCSAT: 4.5, minOTP: 0.90, minFTSR: 0.95, minARC: 0.90 }
    },
    {
      tier: 'standard',
      multiplier: 1.05,
      description: 'Standard performance meeting expectations',
      requirements: { minCSAT: 4.0, minOTP: 0.85, minFTSR: 0.90, minARC: 0.85 }
    },
    {
      tier: 'below_standard',
      multiplier: 0.85,
      description: 'Below standard performance requiring improvement',
      requirements: { minCSAT: 0, minOTP: 0, minFTSR: 0, minARC: 0 }
    }
  ];

  async calculatePerformanceMetrics(driverId: string, timeWindow: number = 30): Promise<PerformanceMetrics> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeWindow);

    // Get recent assignments for the driver
    const assignments = await prisma.assignment.findMany({
      where: {
        driverId,
        createdAt: { gte: cutoffDate },
        status: 'completed'
      },
      include: {
        Booking: true,
        DriverRating: true,
      }
    });

    if (assignments.length === 0) {
      return this.getDefaultMetrics();
    }

    // Calculate Customer Satisfaction (CSAT)
    const ratings = assignments.flatMap(a => a.DriverRating);
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 4.0;
    const customerSatisfactionScore = avgRating / 5.0;

    // Calculate On-Time Performance (OTP)
    // Note: Using claimedAt as proxy for actual pickup time since actualPickupTime doesn't exist in schema
    const onTimeDeliveries = assignments.filter(a => {
      if (!a.claimedAt || !a.Booking.scheduledAt) return false;
      const scheduledTime = new Date(a.Booking.scheduledAt);
      const actualTime = new Date(a.claimedAt);
      const delayMinutes = (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
      return delayMinutes <= 15; // 15-minute tolerance
    });
    const onTimePerformanceScore = onTimeDeliveries.length / assignments.length;

    // Calculate First-Time Success Rate (FTSR)
    const successfulFirstAttempts = assignments.filter(a => {
      // Simplified: assume successful if completed without incidents
      return a.Booking.status === 'COMPLETED';
    });
    const firstTimeSuccessRate = successfulFirstAttempts.length / assignments.length;

    // Calculate Asset & Route Compliance (ARC)
    // Note: routeOptimizationScore doesn't exist in schema, using default compliance
    const compliantRoutes = assignments.filter(a => {
      // Simplified: assume compliance based on completion status
      return a.Booking.status === 'COMPLETED';
    });
    const assetRouteComplianceScore = compliantRoutes.length > 0 ? compliantRoutes.length / assignments.length : 0.9;

    // Calculate overall performance score (weighted average)
    const overallPerformanceScore = 
      (customerSatisfactionScore * 0.40) +
      (onTimePerformanceScore * 0.30) +
      (firstTimeSuccessRate * 0.20) +
      (assetRouteComplianceScore * 0.10);

    // Determine performance multiplier
    const performanceMultiplier = this.getPerformanceMultiplier(
      customerSatisfactionScore,
      onTimePerformanceScore,
      firstTimeSuccessRate,
      assetRouteComplianceScore
    );

    return {
      customerSatisfactionScore,
      onTimePerformanceScore,
      firstTimeSuccessRate,
      assetRouteComplianceScore,
      overallPerformanceScore,
      performanceMultiplier
    };
  }

  private getPerformanceMultiplier(csat: number, otp: number, ftsr: number, arc: number): number {
    const csatScore = csat * 5; // Convert to 5-point scale
    
    for (const tier of this.performanceTiers) {
      if (csatScore >= tier.requirements.minCSAT &&
          otp >= tier.requirements.minOTP &&
          ftsr >= tier.requirements.minFTSR &&
          arc >= tier.requirements.minARC) {
        return tier.multiplier;
      }
    }
    
    return this.performanceTiers[this.performanceTiers.length - 1].multiplier;
  }

  async calculateDriverEarnings(
    driverId: string,
    assignmentId: string,
    routeData: {
      baseFare: number;
      dropCount: number;
      mileage: number;
      routeOutcome: number;
      helperCount: number;
    }
  ): Promise<EarningsCalculation> {
    
    // Get performance metrics
    const performance = await this.calculatePerformanceMetrics(driverId);
    
    // Base components
    const routeBaseFare = routeData.baseFare;
    const perDropFee = routeData.dropCount * 12; // £12 per drop
    const mileageComponent = routeData.mileage * 0.55; // £0.55 per mile
    
    // Apply performance multiplier to variable components
    const performanceAdjustedAmount = (perDropFee + mileageComponent) * performance.performanceMultiplier;
    const subtotal = routeBaseFare + performanceAdjustedAmount;
    
    // Calculate bonuses
    const bonuses = await this.calculateBonuses(driverId, performance, routeData);
    
    // Calculate penalties
    const penalties = await this.calculatePenalties(driverId, assignmentId);
    
    // Calculate helper share (20% of final driver payout - UNIFIED)
    const helperShare = routeData.helperCount > 0 ? subtotal * 0.20 : 0;
    
    // Calculate final payout
    const totalBonuses = Object.values(bonuses).reduce((sum, bonus) => sum + bonus, 0);
    const totalPenalties = Object.values(penalties).reduce((sum, penalty) => sum + penalty, 0);
    const finalPayout = subtotal + totalBonuses - totalPenalties - helperShare;
    
    return {
      routeBaseFare,
      perDropFee,
      mileageComponent,
      performanceMultiplier: performance.performanceMultiplier,
      subtotal,
      bonuses,
      penalties,
      helperShare,
      finalPayout: Math.max(0, finalPayout) // Ensure non-negative
    };
  }

  private async calculateBonuses(
    driverId: string,
    performance: PerformanceMetrics,
    _routeData: any
  ) {
    void _routeData;
    const bonuses = {
      routeExcellence: 0,
      weeklyPerformance: 0,
      fuelEfficiency: 0,
      backhaul: 0,
      monthlyAchievement: 0,
      quarterlyTier: 0
    };

    // Route Excellence Bonus (perfect performance)
    if (performance.performanceMultiplier >= 1.5) {
      bonuses.routeExcellence = 25;
    }

    // Weekly Performance Lottery (top 10% of drivers)
    const weeklyRank = await this.getWeeklyPerformanceRank(driverId);
    if (weeklyRank <= 0.1) { // Top 10%
      bonuses.weeklyPerformance = Math.random() > 0.9 ? 50 : 0; // 10% chance to win £50
    }

    // Fuel Efficiency Bonus (quarterly calculation)
    const fuelEfficiency = await this.calculateFuelEfficiency(driverId);
    if (fuelEfficiency > 0) {
      bonuses.fuelEfficiency = fuelEfficiency * 0.5; // 50% of savings
    }

    // Backhaul Bonus (15% of additional revenue)
    const backhaulRevenue = await this.getBackhaulRevenue(driverId);
    bonuses.backhaul = backhaulRevenue * 0.15;

    // Monthly Achievement Rewards
    const monthlyAchievements = await this.getMonthlyAchievements(driverId);
    bonuses.monthlyAchievement = monthlyAchievements.totalReward;

    // Quarterly Performance Tier Bonus
    const quarterlyTier = await this.getQuarterlyTier(driverId);
    bonuses.quarterlyTier = quarterlyTier.bonus;

    return bonuses;
  }

  private async calculatePenalties(driverId: string, assignmentId: string) {
    const penalties = {
      lateDelivery: 0,
      routeDeviation: 0,
      complianceBreach: 0,
      customerDamage: 0
    };

    // Get assignment details
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        Booking: true,
        DriverIncident: true
      }
    });

    if (!assignment) return penalties;

    // Late Delivery Penalties
    if (assignment.claimedAt && assignment.Booking.scheduledAt) {
      const scheduledTime = new Date(assignment.Booking.scheduledAt);
      const actualTime = new Date(assignment.claimedAt);
      const delayMinutes = (actualTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
      
      if (delayMinutes > 120) { // >2 hours
        penalties.lateDelivery = assignment.Booking.distanceCostGBP * 0.25;
      } else if (delayMinutes > 60) { // 1-2 hours
        penalties.lateDelivery = assignment.Booking.distanceCostGBP * 0.15;
      } else if (delayMinutes > 30) { // 30-60 minutes
        penalties.lateDelivery = assignment.Booking.distanceCostGBP * 0.05;
      }
    }

    // Route Deviation Penalties
    // Note: routeOptimizationScore doesn't exist in schema, skipping route deviation penalties
    // if (assignment.Booking.routeOptimizationScore && assignment.Booking.routeOptimizationScore < 0.7) {
    //   penalties.routeDeviation = assignment.Booking.distanceCostGBP * 0.1;
    // }

    // Compliance Breach Penalties
    const complianceIssues = assignment.DriverIncident.filter(i => 
      i.type === 'technical_issue' || i.severity === 'medium'
    );
    penalties.complianceBreach = complianceIssues.length * 10; // £10 per issue

    // Customer Damage Penalties
    const damageIncidents = assignment.DriverIncident.filter(i => 
      i.type === 'property_damage'
    );
    penalties.customerDamage = damageIncidents.length * 100; // £100 per damage incident

    return penalties;
  }

  async updateDriverPerformance(driverId: string): Promise<void> {
    const metrics = await this.calculatePerformanceMetrics(driverId);
    
    // Update or create driver performance record
    await prisma.driverPerformance.upsert({
      where: { driverId },
      update: {
        averageRating: metrics.customerSatisfactionScore * 5, // Convert to 5-point scale
        onTimeRate: metrics.onTimePerformanceScore,
        completionRate: metrics.firstTimeSuccessRate,
        lastCalculated: new Date(),
      },
      create: {
        driverId,
        averageRating: metrics.customerSatisfactionScore * 5, // Convert to 5-point scale
        onTimeRate: metrics.onTimePerformanceScore,
        completionRate: metrics.firstTimeSuccessRate,
        lastCalculated: new Date(),
      }
    });

    // Check if coaching is needed
    if (metrics.performanceMultiplier < 1.0) {
      await this.triggerPerformanceCoaching(driverId, metrics);
    }
  }

  private async triggerPerformanceCoaching(driverId: string, metrics: PerformanceMetrics): Promise<void> {
    // Create coaching notification
    await prisma.driverNotification.create({
      data: {
        driverId,
        type: 'performance_update',
        title: 'Performance Coaching Available',
        message: 'Your recent performance indicates you may benefit from additional coaching. Please contact support to schedule a session.',
        data: {
          performanceScore: metrics.overallPerformanceScore,
          areas_for_improvement: this.identifyImprovementAreas(metrics),
        }
      }
    });
  }

  private identifyImprovementAreas(metrics: PerformanceMetrics): string[] {
    const areas: string[] = [];
    
    if (metrics.customerSatisfactionScore < 0.8) {
      areas.push('customer_service');
    }
    if (metrics.onTimePerformanceScore < 0.85) {
      areas.push('time_management');
    }
    if (metrics.firstTimeSuccessRate < 0.9) {
      areas.push('delivery_execution');
    }
    if (metrics.assetRouteComplianceScore < 0.85) {
      areas.push('route_following');
    }
    
    return areas;
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      customerSatisfactionScore: 0.8,
      onTimePerformanceScore: 0.85,
      firstTimeSuccessRate: 0.9,
      assetRouteComplianceScore: 0.85,
      overallPerformanceScore: 0.85,
      performanceMultiplier: 1.0
    };
  }

  // Helper methods (simplified implementations)
  private async getWeeklyPerformanceRank(_driverId: string): Promise<number> {
    void _driverId;
    // Mock implementation - calculate actual rank in production
    return Math.random();
  }

  private async calculateFuelEfficiency(_driverId: string): Promise<number> {
    void _driverId;
    // Mock implementation - calculate actual fuel savings
    return Math.random() * 20;
  }

  private async getBackhaulRevenue(_driverId: string): Promise<number> {
    void _driverId;
    // Mock implementation - get actual backhaul revenue
    return Math.random() * 100;
  }

  private async getMonthlyAchievements(_driverId: string): Promise<{ totalReward: number }> {
    void _driverId;
    // Mock implementation - calculate monthly achievements
    return { totalReward: Math.random() * 50 };
  }

  private async getQuarterlyTier(_driverId: string): Promise<{ bonus: number }> {
    void _driverId;
    // Mock implementation - calculate quarterly tier bonus
    return { bonus: Math.random() * 100 };
  }
}

export const performanceTrackingService = PerformanceTrackingService.getInstance();
