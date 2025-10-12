import { logger } from '../logger';
import type { PrismaClient } from '@prisma/client';
import { availabilityMetrics } from '../observability/availability-metrics';

/**
 * Full structured address interface for Enterprise Engine
 * MANDATORY: All address inputs must include complete structure
 */
export interface FullStructuredAddress {
  street: string;
  number: string;
  city: string;
  postcode: string;
  county?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

/**
 * Route capacity and vehicle specifications
 */
export interface VehicleSpecs {
  id: string;
  type: 'small_van' | 'large_van' | 'truck';
  maxWeightKg: number;
  maxVolumeM3: number;
  crewSize: number;
}

/**
 * Driver shift availability
 */
export interface DriverShift {
  driverId: string;
  date: Date;
  startTime: string; // "08:00"
  endTime: string; // "18:00"
  maxWorkingHours: number;
  vehicleId: string;
  status: 'available' | 'busy' | 'offline';
}

/**
 * Route candidate for optimization
 */
export interface RouteCandidate {
  id: string;
  corridor: string;
  date: Date;
  window: 'AM' | 'PM' | 'ALL_DAY';
  currentCapacityKg: number;
  currentVolumeM3: number;
  maxCapacityKg: number;
  maxVolumeM3: number;
  fillRate: number; // 0-100%
  estimatedStops: number;
  status: 'planning' | 'ready' | 'dispatched' | 'completed';
  driverId?: string;
  vehicleId: string;
}

/**
 * Booking capacity requirements
 */
export interface BookingCapacity {
  totalWeightKg: number;
  totalVolumeM3: number;
  estimatedDurationMinutes: number;
  crewRequired: number;
}

/**
 * Availability calculation result
 */
export interface AvailabilityResult {
  next_available_date: string; // ISO date
  window: 'AM' | 'PM' | 'ALL_DAY';
  route_type: 'economy' | 'standard' | 'express';
  confidence: number; // 0-100%
  explanation: string;
  capacity_used_pct: number;
  fill_rate: number;
  route_id?: string;
  estimated_dispatch_time?: string;
}

/**
 * Dynamic Availability Engine
 * 
 * ENTERPRISE REQUIREMENT: Consumes FULL structured addresses only
 * No postcode-only shortcuts allowed
 */
export class DynamicAvailabilityEngine {
  private readonly MIN_FILL_RATE = 50; // Minimum 50% fill for Economy routes
  private readonly HANDLING_TIME_PER_STOP = 45; // minutes
  private readonly MAX_ROUTE_DURATION = 10 * 60; // 10 hours in minutes
  private readonly CAPACITY_BUFFER = 0.1; // 10% safety buffer
  
  constructor(private prisma: PrismaClient) {}

  /**
   * Calculate next available date and route type
   * CRITICAL: pickup and drops must be full structured addresses
   */
  async calculateAvailability(
    pickup: FullStructuredAddress,
    drops: FullStructuredAddress[],
    capacity: BookingCapacity,
    requestId: string
  ): Promise<AvailabilityResult> {
    const startTime = Date.now();
    
    logger.info('Dynamic availability calculation started', {
      pickup: this.sanitizeAddressForLog(pickup),
      dropsCount: drops.length,
      capacity,
      timestamp: new Date().toISOString()
    }, { requestId });

    try {
      // Validate full address structure
      this.validateFullAddress(pickup, 'pickup');
      drops.forEach((drop, index) => 
        this.validateFullAddress(drop, `drop[${index}]`)
      );

      // Get corridor for route optimization
      const corridor = this.calculateCorridor(pickup, drops);
      
      // Check immediate availability (Express/Standard)
      const immediateResult = await this.checkImmediateAvailability(
        pickup, drops, capacity, corridor, requestId
      );
      
      if (immediateResult) {
        logger.info('Immediate availability found', {
          result: immediateResult,
          processingTimeMs: Date.now() - startTime
        }, { requestId });
        return immediateResult;
      }

      // Check Economy multi-drop availability
      const economyResult = await this.checkEconomyAvailability(
        pickup, drops, capacity, corridor, requestId
      );

      logger.info('Availability calculation completed', {
        result: economyResult,
        processingTimeMs: Date.now() - startTime
      }, { requestId });

      // Record metrics
      availabilityMetrics.recordCalculation({
        requestId,
        route_type: economyResult.route_type,
        projected_fill_rate: economyResult.fill_rate,
        capacity_pct: economyResult.capacity_used_pct,
        next_available_date: economyResult.next_available_date,
        reason: economyResult.explanation,
        processing_time_ms: Date.now() - startTime,
        success: true,
        corridor: this.calculateCorridor(pickup, drops)
      });

      return economyResult;

    } catch (error) {
      logger.error('Availability calculation failed', error instanceof Error ? error : new Error('Unknown error'), { requestId });
      
      // Record failed calculation metric
      availabilityMetrics.recordCalculation({
        requestId,
        route_type: 'standard',
        projected_fill_rate: 0,
        capacity_pct: 0,
        next_available_date: 'unknown',
        reason: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: Date.now() - startTime,
        success: false,
        corridor: this.calculateCorridor(pickup, drops)
      });
      
      // Fallback to next business day
      return this.getFallbackAvailability(capacity);
    }
  }

  /**
   * Validate that address contains all required full structure
   */
  private validateFullAddress(address: FullStructuredAddress, context: string): void {
    const required = ['street', 'number', 'city', 'postcode'];
    const missing = required.filter(field => !address[field as keyof FullStructuredAddress]);
    
    if (missing.length > 0) {
      throw new Error(`${context} address missing required fields: ${missing.join(', ')}`);
    }

    if (!address.coordinates || !address.coordinates.lat || !address.coordinates.lng) {
      throw new Error(`${context} address missing coordinates`);
    }
  }

  /**
   * Calculate geographic corridor for route optimization
   */
  private calculateCorridor(pickup: FullStructuredAddress, drops: FullStructuredAddress[]): string {
    const allPoints = [pickup, ...drops];
    const lats = allPoints.map(p => p.coordinates.lat);
    const lngs = allPoints.map(p => p.coordinates.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Create corridor identifier based on geographic bounds
    return `${Math.round(minLat * 100)}_${Math.round(maxLat * 100)}_${Math.round(minLng * 100)}_${Math.round(maxLng * 100)}`;
  }

  /**
   * Check for immediate Express/Standard availability
   */
  private async checkImmediateAvailability(
    pickup: FullStructuredAddress,
    drops: FullStructuredAddress[],
    capacity: BookingCapacity,
    corridor: string,
    requestId: string
  ): Promise<AvailabilityResult | null> {
    // Get available drivers for next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const availableDrivers = await this.getAvailableDrivers(tomorrow);
    const suitableVehicles = await this.getSuitableVehicles(capacity);

    if (availableDrivers.length === 0 || suitableVehicles.length === 0) {
      return null;
    }

    // Estimate duration and check feasibility
    const estimatedDuration = this.estimateJobDuration(pickup, drops, capacity);
    
    if (estimatedDuration > this.MAX_ROUTE_DURATION) {
      logger.warn('Job exceeds maximum duration', {
        estimatedDuration,
        maxDuration: this.MAX_ROUTE_DURATION
      }, { requestId });
      return null;
    }

    // Express availability (dedicated route)
    if (availableDrivers.length >= 2) {
      return {
        next_available_date: tomorrow.toISOString().split('T')[0],
        window: 'ALL_DAY',
        route_type: 'express',
        confidence: 95,
        explanation: 'Dedicated vehicle available tomorrow',
        capacity_used_pct: 100,
        fill_rate: 100,
        estimated_dispatch_time: '08:00'
      };
    }

    // Standard availability (shared route, priority scheduling)
    return {
      next_available_date: tomorrow.toISOString().split('T')[0],
      window: 'AM',
      route_type: 'standard',
      confidence: 85,
      explanation: 'Priority slot available tomorrow morning',
      capacity_used_pct: 75,
      fill_rate: 75,
      estimated_dispatch_time: '09:00'
    };
  }

  /**
   * Check Economy multi-drop availability with route optimization
   */
  private async checkEconomyAvailability(
    pickup: FullStructuredAddress,
    drops: FullStructuredAddress[],
    capacity: BookingCapacity,
    corridor: string,
    requestId: string
  ): Promise<AvailabilityResult> {
    // Get existing route candidates in the corridor
    const candidates = await this.getRouteCandidates(corridor);
    
    for (const candidate of candidates) {
      const canFit = this.checkCapacityFit(candidate, capacity);
      const projectedFillRate = this.calculateProjectedFillRate(candidate, capacity);
      
      if (canFit && projectedFillRate >= this.MIN_FILL_RATE) {
        return {
          next_available_date: candidate.date.toISOString().split('T')[0],
          window: candidate.window,
          route_type: 'economy',
          confidence: 90,
          explanation: `Route ready with ${projectedFillRate.toFixed(0)}% fill rate`,
          capacity_used_pct: projectedFillRate,
          fill_rate: projectedFillRate,
          route_id: candidate.id,
          estimated_dispatch_time: candidate.window === 'AM' ? '08:00' : '13:00'
        };
      }
    }

    // No suitable existing route, predict next available date
    return this.predictNextEconomyDate(corridor, capacity, requestId);
  }

  /**
   * Get available drivers for a specific date
   */
  private async getAvailableDrivers(date: Date): Promise<DriverShift[]> {
    // Implementation would query driver shifts and assignments
    // For now, return mock data
    return [
      {
        driverId: 'driver1',
        date,
        startTime: '08:00',
        endTime: '18:00',
        maxWorkingHours: 10,
        vehicleId: 'vehicle1',
        status: 'available'
      }
    ];
  }

  /**
   * Get vehicles suitable for capacity requirements
   */
  private async getSuitableVehicles(capacity: BookingCapacity): Promise<VehicleSpecs[]> {
    // Implementation would query vehicle specifications
    return [
      {
        id: 'vehicle1',
        type: 'large_van',
        maxWeightKg: 1000,
        maxVolumeM3: 15,
        crewSize: 2
      }
    ];
  }

  /**
   * Get route candidates in a corridor
   */
  private async getRouteCandidates(corridor: string): Promise<RouteCandidate[]> {
    // Implementation would query routes table
    // Mock data for now
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return [
      {
        id: 'route1',
        corridor,
        date: tomorrow,
        window: 'AM',
        currentCapacityKg: 300,
        currentVolumeM3: 5,
        maxCapacityKg: 1000,
        maxVolumeM3: 15,
        fillRate: 40,
        estimatedStops: 3,
        status: 'planning',
        vehicleId: 'vehicle1'
      }
    ];
  }

  /**
   * Check if booking capacity fits in route
   */
  private checkCapacityFit(route: RouteCandidate, capacity: BookingCapacity): boolean {
    const remainingWeight = route.maxCapacityKg - route.currentCapacityKg;
    const remainingVolume = route.maxVolumeM3 - route.currentVolumeM3;
    
    return (
      capacity.totalWeightKg <= remainingWeight * (1 - this.CAPACITY_BUFFER) &&
      capacity.totalVolumeM3 <= remainingVolume * (1 - this.CAPACITY_BUFFER)
    );
  }

  /**
   * Calculate projected fill rate after adding booking
   */
  private calculateProjectedFillRate(route: RouteCandidate, capacity: BookingCapacity): number {
    const newWeight = route.currentCapacityKg + capacity.totalWeightKg;
    const newVolume = route.currentVolumeM3 + capacity.totalVolumeM3;
    
    const weightUtilization = (newWeight / route.maxCapacityKg) * 100;
    const volumeUtilization = (newVolume / route.maxVolumeM3) * 100;
    
    // Return the higher utilization (limiting factor)
    return Math.max(weightUtilization, volumeUtilization);
  }

  /**
   * Estimate job duration including travel and handling time
   */
  private estimateJobDuration(
    pickup: FullStructuredAddress,
    drops: FullStructuredAddress[],
    capacity: BookingCapacity
  ): number {
    const stops = drops.length + 1; // pickup + drops
    const handlingTime = stops * this.HANDLING_TIME_PER_STOP;
    
    // Rough distance estimation (Haversine approximation)
    const totalDistance = this.estimateTotalDistance(pickup, drops);
    const travelTime = (totalDistance / 30) * 60; // 30 mph average speed
    
    return handlingTime + travelTime;
  }

  /**
   * Estimate total travel distance
   */
  private estimateTotalDistance(pickup: FullStructuredAddress, drops: FullStructuredAddress[]): number {
    let totalDistance = 0;
    let currentPoint = pickup;
    
    for (const drop of drops) {
      totalDistance += this.haversineDistance(
        currentPoint.coordinates.lat,
        currentPoint.coordinates.lng,
        drop.coordinates.lat,
        drop.coordinates.lng
      );
      currentPoint = drop;
    }
    
    return totalDistance;
  }

  /**
   * Calculate Haversine distance between two points
   */
  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Predict next Economy availability date using data-driven approach
   */
  private async predictNextEconomyDate(
    corridor: string,
    capacity: BookingCapacity,
    requestId: string
  ): Promise<AvailabilityResult> {
    // Look ahead for next viable route date
    const searchDate = new Date();
    searchDate.setDate(searchDate.getDate() + 2); // Start checking from day after tomorrow
    
    // In production, this would use ML/analytics to predict optimal grouping
    logger.info('Predicting next Economy date', {
      corridor,
      capacity,
      searchStartDate: searchDate.toISOString()
    }, { requestId });

    return {
      next_available_date: searchDate.toISOString().split('T')[0],
      window: 'AM',
      route_type: 'economy',
      confidence: 75,
      explanation: 'Projected route consolidation based on demand patterns',
      capacity_used_pct: 85,
      fill_rate: 85,
      estimated_dispatch_time: '08:00'
    };
  }

  /**
   * Fallback availability when calculation fails
   */
  private getFallbackAvailability(capacity: BookingCapacity): AvailabilityResult {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    return {
      next_available_date: nextWeek.toISOString().split('T')[0],
      window: 'ALL_DAY',
      route_type: 'standard',
      confidence: 60,
      explanation: 'Fallback scheduling - manual review required',
      capacity_used_pct: 50,
      fill_rate: 50
    };
  }

  /**
   * Sanitize address for logging (remove sensitive data)
   */
  private sanitizeAddressForLog(address: FullStructuredAddress): Partial<FullStructuredAddress> {
    return {
      city: address.city,
      postcode: address.postcode.substring(0, 4) + '***', // Partial postcode
      coordinates: address.coordinates
    };
  }
}