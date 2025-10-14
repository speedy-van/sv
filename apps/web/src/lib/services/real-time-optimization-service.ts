import { prisma } from '@/lib/prisma';
import type { Driver, Booking, Route, Address } from '@prisma/client';

export interface OptimizationRequest {
  bookingId: string;
  driverId?: string;
  constraints: {
    timeWindows: Array<{ start: Date; end: Date }>;
    vehicleCapacity: number;
    driverSkills: string[];
    maxDistance: number;
    priorityLevel: 'LOW' | 'STANDARD' | 'HIGH' | 'URGENT';
  };
  objectives: Array<'minimize_cost' | 'minimize_time' | 'maximize_satisfaction' | 'maximize_efficiency'>;
}

export interface DriverScore {
  driverId: string;
  score: number;
  estimatedCost: number;
  factors: {
    distance: number;
    performance: number;
    availability: number;
    skillMatch: number;
    cost: number;
    customerPreference: number;
  };
  tradeoffs: string[];
}

export interface BookingWithRoute extends Booking {
  route?: Route | null;
  pickupAddress?: {
    id: string;
    label: string;
    postcode: string;
    lat: number;
    lng: number;
  } | null;
  dropoffAddress?: {
    id: string;
    label: string;
    postcode: string;
    lat: number;
    lng: number;
  } | null;
}

export interface DriverWithRelations extends Driver {
  Assignment: Array<{
    Booking: Booking;
  }>;
  DriverShift: Array<{
    startTime: Date;
    endTime: Date;
  }>;
}

export interface DriverShift {
  startTime: Date;
  endTime: Date;
}

export interface OptimizationResult {
  optimizedRoute: {
    driverId: string;
    estimatedDuration: number;
    estimatedDistance: number;
    estimatedCost: number;
    waypoints: Array<{
      address: string;
      estimatedArrival: Date;
      serviceTime: number;
      priority: number;
    }>;
  };
  alternatives: Array<{
    driverId: string;
    score: number;
    tradeoffs: string[];
  }>;
  optimizationScore: number;
  recommendations: string[];
  confidence: number;
}

export interface ResourceAllocation {
  driverId: string;
  vehicleId: string;
  helperIds: string[];
  equipment: string[];
  estimatedUtilization: number;
  skillMatch: number;
  availabilityScore: number;
}

export class RealTimeOptimizationService {
  private static instance: RealTimeOptimizationService;

  static getInstance(): RealTimeOptimizationService {
    if (!RealTimeOptimizationService.instance) {
      RealTimeOptimizationService.instance = new RealTimeOptimizationService();
    }
    return RealTimeOptimizationService.instance;
  }

  async optimizeBookingAssignment(request: OptimizationRequest): Promise<OptimizationResult> {
    try {
      // Step 1: Get booking details
      const booking = await this.getBookingDetails(request.bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Step 2: Find available drivers
      const availableDrivers = await this.findAvailableDrivers(booking, request.constraints);

      // Step 3: Calculate optimization scores for each driver
      const driverScores = await Promise.all(
        availableDrivers.map(driver => this.calculateDriverScore(driver, booking, request))
      );

      // Step 4: Select optimal driver
      const optimalDriver = this.selectOptimalDriver(driverScores, request.objectives);

      if (!optimalDriver) {
        throw new Error('No suitable driver found for optimization');
      }

      // Step 5: Generate optimized route
      const optimizedRoute = await this.generateOptimizedRoute(optimalDriver, booking);

      // Step 6: Calculate alternatives
      const alternatives = this.generateAlternatives(driverScores, optimalDriver.driverId);

      // Step 7: Calculate overall optimization score
      const optimizationScore = this.calculateOptimizationScore(optimalDriver, booking, request);

      // Step 8: Generate recommendations
      const recommendations = this.generateOptimizationRecommendations(optimalDriver, booking, alternatives);

      return {
        optimizedRoute,
        alternatives,
        optimizationScore,
        recommendations,
        confidence: this.calculateConfidence(driverScores, optimizationScore)
      };

    } catch (error) {
      console.error('Optimization failed:', error);
      throw new Error('Failed to optimize booking assignment');
    }
  }

  async optimizeFleetUtilization(timeWindow: { start: Date; end: Date }): Promise<{
    currentUtilization: number;
    optimizedUtilization: number;
    recommendations: Array<{
      type: 'rebalance' | 'schedule_maintenance' | 'adjust_capacity';
      description: string;
      impact: number;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  }> {
    // Get current fleet status
    const fleetStatus = await this.getFleetStatus(timeWindow);
    
    // Calculate current utilization
    const currentUtilization = this.calculateFleetUtilization(fleetStatus);
    
    // Generate optimization recommendations
    const recommendations = await this.generateFleetOptimizationRecommendations(fleetStatus);
    
    // Calculate potential optimized utilization
    const optimizedUtilization = this.calculateOptimizedUtilization(currentUtilization, recommendations);

    return {
      currentUtilization,
      optimizedUtilization,
      recommendations
    };
  }

  async optimizeResourceAllocation(bookingIds: string[]): Promise<ResourceAllocation[]> {
    const allocations: ResourceAllocation[] = [];

    for (const bookingId of bookingIds) {
      const booking = await this.getBookingDetails(bookingId);
      if (!booking) continue;

      // Find optimal resource allocation for this booking
      const allocation = await this.findOptimalResourceAllocation(booking);
      allocations.push(allocation);
    }

    // Optimize across all allocations to avoid conflicts
    return this.resolveResourceConflicts(allocations);
  }

  private async getBookingDetails(bookingId: string) {
    return await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        BookingItem: true,
        customer: true,
      }
    });
  }

  private async findAvailableDrivers(booking: BookingWithRoute, constraints: OptimizationRequest['constraints']): Promise<Driver[]> {
    const scheduledTime = new Date(booking.scheduledAt);
    const timeBuffer = 2 * 60 * 60 * 1000; // 2 hours buffer

    return await prisma.driver.findMany({
      where: {
        status: 'active',
        // Check availability in the time window
        DriverShift: {
          some: {
            startTime: { lte: new Date(scheduledTime.getTime() - timeBuffer) },
            endTime: { gte: new Date(scheduledTime.getTime() + timeBuffer) },
            isActive: true
          }
        },
        // Check if not already assigned
        Assignment: {
          none: {
            Booking: {
              scheduledAt: {
                gte: new Date(scheduledTime.getTime() - timeBuffer),
                lte: new Date(scheduledTime.getTime() + timeBuffer)
              },
              status: { in: ['CONFIRMED', 'COMPLETED'] }
            }
          }
        }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            isActive: true
          }
        },
        DriverShift: {
          where: {
            startTime: { lte: new Date(scheduledTime.getTime() + timeBuffer) },
            endTime: { gte: new Date(scheduledTime.getTime() - timeBuffer) },
            isActive: true
          }
        }
      }
    });
  }

  private async calculateDriverScore(driver: Driver, booking: BookingWithRoute, request: OptimizationRequest): Promise<DriverScore> {
    let score = 0;
    const factors = {
      distance: 0,
      performance: 0,
      availability: 0,
      skillMatch: 0,
      cost: 0,
      customerPreference: 0
    };

    // Distance factor (closer is better)
    const driverPostcode = driver.basePostcode || 'SW1A 1AA'; // Default to London center
    const pickupPostcode = booking.pickupAddress?.postcode || 'SW1A 1AA';
    const distance = await this.calculateDistance(driverPostcode, pickupPostcode);
    factors.distance = Math.max(0, 1 - (distance / request.constraints.maxDistance));

    // Performance factor (simplified - no performance data available)
    factors.performance = 0.8; // Default performance score

    // Availability factor
    factors.availability = this.calculateAvailabilityScore(driver as DriverWithRelations, booking.scheduledAt);

    // Skill match factor
    factors.skillMatch = this.calculateSkillMatch(driver as DriverWithRelations, booking, request.constraints.driverSkills);

    // Cost factor (lower cost is better for cost optimization)
    const estimatedCost = await this.estimateDriverCost(driver as DriverWithRelations, booking);
    factors.cost = 1 - (estimatedCost / 200); // Normalize against £200 baseline

    // Customer preference factor
    factors.customerPreference = await this.getCustomerPreferenceScore(driver.id, booking.customerId || '');

    // Weight factors based on objectives
    const weights = this.getObjectiveWeights(request.objectives);
    
    score = 
      factors.distance * weights.distance +
      factors.performance * weights.performance +
      factors.availability * weights.availability +
      factors.skillMatch * weights.skillMatch +
      factors.cost * weights.cost +
      factors.customerPreference * weights.customerPreference;

    return {
      driverId: driver.id,
      score,
      estimatedCost,
      factors,
      tradeoffs: []
    };
  }

  private selectOptimalDriver(driverScores: DriverScore[], objectives: string[]): DriverScore | null {
    // Sort by score (highest first)
    driverScores.sort((a, b) => b.score - a.score);
    
    // Apply additional selection criteria based on objectives
    if (objectives.includes('minimize_cost')) {
      // If cost is a primary objective, consider cost-performance ratio
      driverScores.sort((a, b) => (b.score / b.estimatedCost) - (a.score / a.estimatedCost));
    }

    return driverScores[0];
  }

  private async generateOptimizedRoute(optimalDriver: DriverScore, booking: BookingWithRoute) {
    // Calculate route details
    const pickupPostcode = booking.pickupAddress?.postcode || 'SW1A 1AA';
    const dropoffPostcode = booking.dropoffAddress?.postcode || 'SW1A 1AA';
    const distance = await this.calculateDistance(pickupPostcode, dropoffPostcode);

    // Assume 1 item if no items specified
    const itemCount = (booking as any).items?.length || 1;
    const estimatedDuration = this.estimateDuration(distance, itemCount);
    const estimatedCost = optimalDriver.estimatedCost;

    // Generate waypoints
    const waypoints = [
      {
        address: booking.pickupAddress?.label || 'Pickup Address',
        estimatedArrival: new Date(booking.scheduledAt),
        serviceTime: 30, // 30 minutes for pickup
        priority: 1
      },
      {
        address: booking.dropoffAddress?.label || 'Dropoff Address',
        estimatedArrival: new Date(booking.scheduledAt.getTime() + estimatedDuration * 60 * 1000),
        serviceTime: 45, // 45 minutes for dropoff
        priority: 1
      }
    ];

    return {
      driverId: optimalDriver.driverId,
      estimatedDuration,
      estimatedDistance: distance,
      estimatedCost,
      waypoints
    };
  }

  private generateAlternatives(driverScores: DriverScore[], selectedDriverId: string): Array<{ driverId: string; score: number; tradeoffs: string[] }> {
    return driverScores
      .filter(ds => ds.driverId !== selectedDriverId)
      .slice(0, 3) // Top 3 alternatives
      .map(ds => ({
        driverId: ds.driverId,
        score: ds.score,
        tradeoffs: this.identifyTradeoffs(ds.factors)
      }));
  }

  private calculateOptimizationScore(optimalDriver: DriverScore, booking: BookingWithRoute, request: OptimizationRequest): number {
    // Base score from driver selection
    let score = optimalDriver.score;

    // Adjust based on constraint satisfaction
    if (request.constraints.priorityLevel === 'URGENT' && optimalDriver.factors.availability > 0.9) {
      score += 0.1;
    }

    // Adjust based on objective alignment
    if (request.objectives.includes('maximize_satisfaction') && optimalDriver.factors.performance > 0.9) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  private generateOptimizationRecommendations(optimalDriver: DriverScore, booking: BookingWithRoute, alternatives: Array<{ driverId: string; score: number; tradeoffs: string[] }>): string[] {
    const recommendations: string[] = [];

    if (optimalDriver.score < 0.7) {
      recommendations.push('Consider adjusting time window for better driver availability');
    }

    if (alternatives.length > 0 && alternatives[0].score > optimalDriver.score * 0.95) {
      recommendations.push('Multiple high-quality drivers available - consider customer preference');
    }

    if (optimalDriver.factors.distance < 0.5) {
      recommendations.push('Driver is far from pickup location - consider local alternatives');
    }

    if (optimalDriver.factors.cost > 150) {
      recommendations.push('High-cost assignment - review pricing strategy');
    }

    return recommendations;
  }

  private calculateConfidence(driverScores: DriverScore[], optimizationScore: number): number {
    if (driverScores.length === 0) return 0;

    // Base confidence on score distribution
    const topScore = driverScores[0].score;
    const avgScore = driverScores.reduce((sum, ds) => sum + ds.score, 0) / driverScores.length;
    
    let confidence = 0.8; // Base confidence

    // Higher confidence if clear winner
    if (topScore > avgScore * 1.2) confidence += 0.1;

    // Higher confidence with good optimization score
    if (optimizationScore > 0.8) confidence += 0.1;

    // Lower confidence with few options
    if (driverScores.length < 3) confidence -= 0.1;

    return Math.max(0.5, Math.min(1.0, confidence));
  }

  private async getFleetStatus(timeWindow: { start: Date; end: Date }): Promise<DriverWithRelations[]> {
    const drivers = await prisma.driver.findMany({
      where: { status: 'active' },
      include: {
        Assignment: {
          where: {
            createdAt: {
              gte: timeWindow.start,
              lte: timeWindow.end
            }
          },
          include: { Booking: true }
        },
        DriverShift: {
          where: {
            startTime: { lte: timeWindow.end },
            endTime: { gte: timeWindow.start }
          }
        }
      }
    });

    return drivers;
  }

  private calculateFleetUtilization(fleetStatus: DriverWithRelations[]): number {
    if (fleetStatus.length === 0) return 0;

    const totalCapacity = fleetStatus.reduce((sum, driver) => {
      const shiftHours = driver.DriverShift.reduce((hours: number, shift: DriverShift) => {
        const duration = (new Date(shift.endTime).getTime() - new Date(shift.startTime).getTime()) / (1000 * 60 * 60);
        return hours + duration;
      }, 0);
      return sum + shiftHours;
    }, 0);

    const utilizedHours = fleetStatus.reduce((sum, driver) => {
      return sum + driver.Assignment.reduce((hours: number, assignment) => {
        return hours + (assignment.Booking.estimatedDurationMinutes / 60);
      }, 0);
    }, 0);

    return totalCapacity > 0 ? utilizedHours / totalCapacity : 0;
  }

  private async generateFleetOptimizationRecommendations(fleetStatus: DriverWithRelations[]) {
    const recommendations: Array<{
      type: 'rebalance' | 'schedule_maintenance' | 'adjust_capacity';
      description: string;
      impact: number;
      priority: 'LOW' | 'MEDIUM' | 'HIGH';
    }> = [];

    // Analyze utilization patterns
    const underutilizedDrivers = fleetStatus.filter(driver => {
      const utilization = this.calculateDriverUtilization(driver);
      return utilization < 0.6;
    });

    const overutilizedDrivers = fleetStatus.filter(driver => {
      const utilization = this.calculateDriverUtilization(driver);
      return utilization > 0.9;
    });

    if (underutilizedDrivers.length > 0) {
      recommendations.push({
        type: 'rebalance',
        description: `${underutilizedDrivers.length} drivers are underutilized - consider rebalancing workload`,
        impact: 0.15,
        priority: 'MEDIUM'
      });
    }

    if (overutilizedDrivers.length > 0) {
      recommendations.push({
        type: 'adjust_capacity',
        description: `${overutilizedDrivers.length} drivers are overutilized - consider adding capacity`,
        impact: 0.2,
        priority: 'HIGH'
      });
    }

    return recommendations;
  }

  private calculateOptimizedUtilization(current: number, recommendations: Array<{ type: string; impact: number }>): number {
    let optimized = current;
    
    recommendations.forEach(rec => {
      optimized += rec.impact;
    });

    return Math.min(0.95, optimized); // Cap at 95% for realistic optimization
  }

  private async findOptimalResourceAllocation(booking: BookingWithRoute): Promise<ResourceAllocation> {
    // Simplified resource allocation logic
    const availableDrivers = await this.findAvailableDrivers(booking, {
      timeWindows: [{ start: booking.scheduledAt, end: booking.scheduledAt }],
      vehicleCapacity: 1000,
      driverSkills: [],
      maxDistance: 50,
      priorityLevel: 'STANDARD'
    });

    if (availableDrivers.length === 0) {
      throw new Error('No available drivers for resource allocation');
    }

    const driver = availableDrivers[0];
    const vehicle = null as any; // TODO: Implement vehicle assignment logic

    return {
      driverId: driver.id,
      vehicleId: vehicle?.id || 'default',
      helperIds: [], // Simplified - no helper allocation
      equipment: ['basic_tools'],
      estimatedUtilization: 0.8,
      skillMatch: 0.9,
      availabilityScore: 0.95
    };
  }

  private resolveResourceConflicts(allocations: ResourceAllocation[]): ResourceAllocation[] {
    // Simplified conflict resolution - in production, implement proper conflict detection and resolution
    const usedDrivers = new Set<string>();
    const resolvedAllocations: ResourceAllocation[] = [];

    for (const allocation of allocations) {
      if (!usedDrivers.has(allocation.driverId)) {
        usedDrivers.add(allocation.driverId);
        resolvedAllocations.push(allocation);
      }
    }

    return resolvedAllocations;
  }

  // Helper methods (simplified implementations)
  private async calculateDistance(postcode1: string, postcode2: string): Promise<number> {
    // Mock distance calculation - integrate with mapping service
    return Math.random() * 30 + 5; // 5-35 miles
  }

  private calculateAvailabilityScore(driver: DriverWithRelations, scheduledTime: Date): number {
    // Simplified availability calculation
    return driver.DriverShift.length > 0 ? 0.9 : 0.5;
  }

  private calculateSkillMatch(driver: DriverWithRelations, booking: BookingWithRoute, requiredSkills: string[]): number {
    // Simplified skill matching
    return 0.8;
  }

  private async estimateDriverCost(driver: DriverWithRelations, booking: BookingWithRoute): Promise<number> {
    // Simplified cost estimation
    return Math.random() * 100 + 50; // £50-150
  }

  private async getCustomerPreferenceScore(driverId: string, customerId: string): Promise<number> {
    // Simplified customer preference
    return 0.8;
  }

  private getObjectiveWeights(objectives: string[]) {
    const weights = {
      distance: 0.2,
      performance: 0.25,
      availability: 0.2,
      skillMatch: 0.15,
      cost: 0.1,
      customerPreference: 0.1
    };

    // Adjust weights based on objectives
    if (objectives.includes('minimize_cost')) {
      weights.cost = 0.3;
      weights.performance = 0.2;
    }

    if (objectives.includes('maximize_satisfaction')) {
      weights.performance = 0.3;
      weights.customerPreference = 0.2;
    }

    return weights;
  }

  private estimateDuration(distance: number, itemCount: number): number {
    // Simplified duration estimation in minutes
    return distance * 3 + itemCount * 5 + 60; // 3 min/mile + 5 min/item + 1 hour base
  }

  private identifyTradeoffs(factors: DriverScore['factors']): string[] {
    const tradeoffs: string[] = [];
    
    if (factors.distance < 0.5) tradeoffs.push('Longer travel distance');
    if (factors.performance < 0.8) tradeoffs.push('Lower performance rating');
    if (factors.cost > 0.8) tradeoffs.push('Higher cost');
    
    return tradeoffs;
  }

  private calculateDriverUtilization(driver: DriverWithRelations): number {
    // Simplified utilization calculation
    const totalShiftHours = driver.DriverShift.reduce((sum: number, shift: DriverShift) => {
      const duration = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    const assignedHours = driver.Assignment.reduce((sum: number, assignment) => {
      return sum + (assignment.Booking.estimatedDurationMinutes / 60);
    }, 0);

    return totalShiftHours > 0 ? assignedHours / totalShiftHours : 0;
  }
}

export const realTimeOptimizationService = RealTimeOptimizationService.getInstance();
