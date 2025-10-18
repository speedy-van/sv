/**
 * Intelligent Route Optimizer Service
 * 
 * Uses Capacitated Vehicle Routing Problem (CVRP) principles to determine:
 * 1. Whether a booking can be part of a multi-drop route
 * 2. Optimal pricing based on actual route feasibility
 * 3. Dynamic decision-making without hardcoded assumptions
 * 
 * This system works for ANY route (Edinburgh-Brighton, Inverness-Southampton, etc.)
 * without relying on fixed scenarios like Glasgow-London.
 */

export interface BookingRequest {
  id?: string;
  pickup: {
    address: string;
    postcode: string;
    coordinates: { lat: number; lng: number };
    city: string;
  };
  dropoff: {
    address: string;
    postcode: string;
    coordinates: { lat: number; lng: number };
    city: string;
  };
  items: Array<{
    category: string;
    name: string;
    quantity: number;
    weight?: number; // kg
    volume?: number; // m³
    requiresTwoWorkers?: boolean;
    dismantleTime?: number; // minutes
    reassembleTime?: number; // minutes
  }>;
  scheduledDate: Date;
  timeWindow?: {
    earliest: string; // HH:MM
    latest: string; // HH:MM
  };
  floorLevel?: number;
  hasLift?: boolean;
  serviceType: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
}

export interface LoadAnalysis {
  totalVolume: number; // m³
  totalWeight: number; // kg
  volumePercentage: number; // 0-1
  weightPercentage: number; // 0-1
  loadPercentage: number; // max of volume and weight percentage
  estimatedLoadTime: number; // minutes
  estimatedUnloadTime: number; // minutes
  requiresTwoWorkers: boolean;
}

export interface RouteAnalysis {
  distance: number; // miles
  drivingTime: number; // minutes
  totalTime: number; // driving + loading + unloading
  feasibleInOneDay: boolean; // < 13 hours
  feasibleForMultiDrop: boolean; // < 200 miles AND < 8 hours driving
}

export interface MultiDropEligibility {
  eligible: boolean;
  reason?: string;
  confidence: number; // 0-100
  
  // Constraints
  loadConstraint: {
    passed: boolean;
    currentLoad: number; // percentage
    availableCapacity: number; // percentage
    reason?: string;
  };
  
  distanceConstraint: {
    passed: boolean;
    distance: number; // miles
    maxDistance: number; // miles
    reason?: string;
  };
  
  timeConstraint: {
    passed: boolean;
    estimatedTime: number; // hours
    maxTime: number; // hours
    reason?: string;
  };
  
  largeItemsConstraint: {
    passed: boolean;
    largeItemCount: number;
    maxLargeItems: number;
    reason?: string;
  };
  
  // Recommendations
  alternativeOptions: Array<{
    type: 'SINGLE_ORDER' | 'RETURN_JOURNEY' | 'SPLIT_LOAD';
    description: string;
    estimatedPrice: number;
  }>;
}

export interface PricingFactors {
  baseDistance: number; // miles
  actualRoadDistance: number; // miles (baseDistance * 1.15)
  loadComplexity: number; // 1.0-2.0 multiplier
  timeComplexity: number; // 1.0-1.5 multiplier
  urgencyMultiplier: number; // based on service type
  seasonalMultiplier: number; // based on date
  regionalMultiplier: number; // based on location
}

export class IntelligentRouteOptimizer {
  private static instance: IntelligentRouteOptimizer;
  
  // Luton Van Specifications
  private readonly VAN_CAPACITY_M3 = 15; // cubic meters
  private readonly VAN_CAPACITY_KG = 1000; // kilograms
  private readonly VAN_LENGTH_M = 4.2; // meters
  
  // Operational Constraints
  private readonly MAX_WORKING_HOURS = 13; // hours per day
  private readonly MAX_DRIVING_HOURS = 8; // hours of continuous driving
  private readonly AVERAGE_SPEED_MPH = 50; // average speed on UK roads
  private readonly MULTI_DROP_MAX_DISTANCE = 200; // miles
  private readonly MULTI_DROP_MAX_LOAD = 0.70; // 70% capacity
  private readonly MULTI_DROP_MAX_LARGE_ITEMS = 8; // max large items allowed
  
  // Time Estimates (minutes)
  private readonly BASE_LOAD_TIME_PER_M3 = 4; // minutes per cubic meter
  private readonly BASE_UNLOAD_TIME_PER_M3 = 3; // minutes per cubic meter
  private readonly FLOOR_TIME_MULTIPLIER = 1.4; // per floor without lift
  private readonly DISMANTLE_REASSEMBLE_BUFFER = 1.2; // 20% buffer
  
  static getInstance(): IntelligentRouteOptimizer {
    if (!IntelligentRouteOptimizer.instance) {
      IntelligentRouteOptimizer.instance = new IntelligentRouteOptimizer();
    }
    return IntelligentRouteOptimizer.instance;
  }
  
  /**
   * Main method: Analyze if a booking can be part of a multi-drop route
   * This is the ONLY method that should be called from outside
   */
  async analyzeMultiDropEligibility(booking: BookingRequest): Promise<MultiDropEligibility> {
    // Step 1: Analyze load
    const loadAnalysis = this.analyzeLoad(booking);
    
    // Step 2: Analyze route
    const routeAnalysis = this.analyzeRoute(booking, loadAnalysis);
    
    // Step 3: Check constraints
    const loadConstraint = this.checkLoadConstraint(loadAnalysis);
    const distanceConstraint = this.checkDistanceConstraint(routeAnalysis);
    const timeConstraint = this.checkTimeConstraint(routeAnalysis);
    const largeItemsConstraint = this.checkLargeItemsConstraint(booking);
    
    // Step 4: Determine eligibility (ALL constraints must pass)
    const eligible = loadConstraint.passed && 
                    distanceConstraint.passed && 
                    timeConstraint.passed && 
                    largeItemsConstraint.passed;
    
    // Step 5: Calculate confidence score
    const confidence = this.calculateConfidenceScore(loadAnalysis, routeAnalysis);
    
    // Step 6: Generate reason if not eligible
    let reason: string | undefined;
    if (!eligible) {
      reason = this.generateIneligibilityReason(loadConstraint, distanceConstraint, timeConstraint, largeItemsConstraint);
    }
    
    // Step 7: Generate alternative options
    const alternativeOptions = await this.generateAlternativeOptions(booking, loadAnalysis, routeAnalysis);
    
    return {
      eligible,
      reason,
      confidence,
      loadConstraint,
      distanceConstraint,
      timeConstraint,
      largeItemsConstraint,
      alternativeOptions,
    };
  }
  
  /**
   * Analyze the load (volume, weight, time)
   */
  private analyzeLoad(booking: BookingRequest): LoadAnalysis {
    let totalVolume = 0;
    let totalWeight = 0;
    let estimatedLoadTime = 0;
    let estimatedUnloadTime = 0;
    let requiresTwoWorkers = false;
    
    for (const item of booking.items) {
      // Volume
      const itemVolume = item.volume || this.estimateItemVolume(item.category, item.name);
      totalVolume += itemVolume * item.quantity;
      
      // Weight
      const itemWeight = item.weight || this.estimateItemWeight(item.category, item.name);
      totalWeight += itemWeight * item.quantity;
      
      // Time
      const itemLoadTime = this.estimateLoadTime(item);
      const itemUnloadTime = this.estimateUnloadTime(item);
      estimatedLoadTime += itemLoadTime * item.quantity;
      estimatedUnloadTime += itemUnloadTime * item.quantity;
      
      // Workers
      if (item.requiresTwoWorkers || this.requiresTwoWorkers(item.category, item.name, itemWeight)) {
        requiresTwoWorkers = true;
      }
    }
    
    // Apply floor level multiplier
    if (booking.floorLevel && booking.floorLevel > 0 && !booking.hasLift) {
      const floorMultiplier = Math.pow(this.FLOOR_TIME_MULTIPLIER, booking.floorLevel);
      estimatedLoadTime *= floorMultiplier;
      estimatedUnloadTime *= floorMultiplier;
    }
    
    // Calculate percentages
    const volumePercentage = Math.min(totalVolume / this.VAN_CAPACITY_M3, 1.0);
    const weightPercentage = Math.min(totalWeight / this.VAN_CAPACITY_KG, 1.0);
    const loadPercentage = Math.max(volumePercentage, weightPercentage);
    
    return {
      totalVolume,
      totalWeight,
      volumePercentage,
      weightPercentage,
      loadPercentage,
      estimatedLoadTime,
      estimatedUnloadTime,
      requiresTwoWorkers,
    };
  }
  
  /**
   * Analyze the route (distance, time, feasibility)
   */
  private analyzeRoute(booking: BookingRequest, loadAnalysis: LoadAnalysis): RouteAnalysis {
    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(booking.pickup.coordinates, booking.dropoff.coordinates); // DEPRECATED - internal use only
    
    // Calculate driving time (distance / average speed)
    const drivingTime = (distance / this.AVERAGE_SPEED_MPH) * 60; // minutes
    
    // Calculate total time (driving + loading + unloading)
    const totalTime = drivingTime + loadAnalysis.estimatedLoadTime + loadAnalysis.estimatedUnloadTime;
    
    // Check if feasible in one day (< 13 hours)
    const feasibleInOneDay = totalTime < this.MAX_WORKING_HOURS * 60;
    
    // Check if feasible for multi-drop (< 200 miles AND < 8 hours driving)
    const feasibleForMultiDrop = distance < this.MULTI_DROP_MAX_DISTANCE && drivingTime < this.MAX_DRIVING_HOURS * 60;
    
    return {
      distance,
      drivingTime,
      totalTime,
      feasibleInOneDay,
      feasibleForMultiDrop,
    };
  }
  
  /**
   * Check load constraint (< 70% capacity)
   */
  private checkLoadConstraint(loadAnalysis: LoadAnalysis): MultiDropEligibility['loadConstraint'] {
    const passed = loadAnalysis.loadPercentage < this.MULTI_DROP_MAX_LOAD;
    const currentLoad = Math.round(loadAnalysis.loadPercentage * 100);
    const availableCapacity = Math.round((1 - loadAnalysis.loadPercentage) * 100);
    
    let reason: string | undefined;
    if (!passed) {
      reason = `Load too large for multi-drop (${currentLoad}% > ${this.MULTI_DROP_MAX_LOAD * 100}%). Van is ${currentLoad}% full, leaving only ${availableCapacity}% for other customers. Recommend single order pricing.`;
    }
    
    return {
      passed,
      currentLoad,
      availableCapacity,
      reason,
    };
  }
  
  /**
   * Check distance constraint (< 200 miles)
   */
  private checkDistanceConstraint(routeAnalysis: RouteAnalysis): MultiDropEligibility['distanceConstraint'] {
    const passed = routeAnalysis.distance < this.MULTI_DROP_MAX_DISTANCE;
    const distance = Math.round(routeAnalysis.distance);
    const maxDistance = this.MULTI_DROP_MAX_DISTANCE;
    
    let reason: string | undefined;
    if (!passed) {
      reason = `Route too long for multi-drop (${distance} miles > ${maxDistance} miles). Long-distance routes don't allow time for additional stops. Recommend single order or return journey pricing.`;
    }
    
    return {
      passed,
      distance,
      maxDistance,
      reason,
    };
  }
  
  /**
   * Check time constraint (< 8 hours total for multi-drop)
   */
  private checkTimeConstraint(routeAnalysis: RouteAnalysis): MultiDropEligibility['timeConstraint'] {
    const maxTimeMinutes = this.MAX_DRIVING_HOURS * 60;
    const passed = routeAnalysis.totalTime < maxTimeMinutes;
    const estimatedTime = routeAnalysis.totalTime / 60; // hours
    const maxTime = this.MAX_DRIVING_HOURS;
    
    let reason: string | undefined;
    if (!passed) {
      reason = `Route takes too long for multi-drop (${estimatedTime.toFixed(1)} hours > ${maxTime} hours). No time for additional stops. Recommend single order pricing.`;
    }
    
    return {
      passed,
      estimatedTime,
      maxTime,
      reason,
    };
  }
  
  /**
   * Check large items constraint (≤ 8 large items for multi-drop)
   */
  private checkLargeItemsConstraint(booking: BookingRequest): MultiDropEligibility['largeItemsConstraint'] {
    const largeItemCount = this.countLargeItems(booking);
    const maxLargeItems = this.MULTI_DROP_MAX_LARGE_ITEMS;
    const passed = largeItemCount <= maxLargeItems;
    
    let reason: string | undefined;
    if (!passed) {
      reason = `Too many large items for multi-drop (${largeItemCount} > ${maxLargeItems}). Large/bulky items require dedicated van space and handling time. Recommend single order pricing.`;
      console.log(`🚛 ${reason}`);
    }
    
    return {
      passed,
      largeItemCount,
      maxLargeItems,
      reason,
    };
  }
  
  /**
   * Calculate confidence score (0-100)
   * Higher score = more confident that multi-drop is a good fit
   */
  private calculateConfidenceScore(loadAnalysis: LoadAnalysis, routeAnalysis: RouteAnalysis): number {
    let score = 100;
    
    // Deduct points for high load (0-30 points)
    const loadPenalty = loadAnalysis.loadPercentage * 30;
    score -= loadPenalty;
    
    // Deduct points for long distance (0-30 points)
    const distancePenalty = (routeAnalysis.distance / this.MULTI_DROP_MAX_DISTANCE) * 30;
    score -= distancePenalty;
    
    // Deduct points for long time (0-20 points)
    const timePenalty = (routeAnalysis.totalTime / (this.MAX_DRIVING_HOURS * 60)) * 20;
    score -= timePenalty;
    
    // Bonus points for ideal load (20-40% capacity)
    if (loadAnalysis.loadPercentage >= 0.20 && loadAnalysis.loadPercentage <= 0.40) {
      score += 10;
    }
    
    // Bonus points for short distance (< 100 miles)
    if (routeAnalysis.distance < 100) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Generate human-readable reason for ineligibility
   */
  private generateIneligibilityReason(
    loadConstraint: MultiDropEligibility['loadConstraint'],
    distanceConstraint: MultiDropEligibility['distanceConstraint'],
    timeConstraint: MultiDropEligibility['timeConstraint'],
    largeItemsConstraint: MultiDropEligibility['largeItemsConstraint']
  ): string {
    const reasons: string[] = [];
    
    if (!loadConstraint.passed) reasons.push(loadConstraint.reason!);
    if (!distanceConstraint.passed) reasons.push(distanceConstraint.reason!);
    if (!timeConstraint.passed) reasons.push(timeConstraint.reason!);
    if (!largeItemsConstraint.passed) reasons.push(largeItemsConstraint.reason!);
    
    return reasons.join(' ');
  }
  
  /**
   * Generate alternative pricing options
   */
  private async generateAlternativeOptions(
    booking: BookingRequest,
    loadAnalysis: LoadAnalysis,
    routeAnalysis: RouteAnalysis
  ): Promise<MultiDropEligibility['alternativeOptions']> {
    const options: MultiDropEligibility['alternativeOptions'] = [];
    
    // Option 1: Single Order (always available)
    const singleOrderPrice = await this.estimateSingleOrderPrice(booking, loadAnalysis, routeAnalysis);
    options.push({
      type: 'SINGLE_ORDER',
      description: 'Dedicated van service with exclusive use. No sharing with other customers.',
      estimatedPrice: singleOrderPrice,
    });
    
    // Option 2: Return Journey (if long distance)
    if (routeAnalysis.distance > 150) {
      const returnJourneyPrice = singleOrderPrice * 0.5; // 50% discount
      options.push({
        type: 'RETURN_JOURNEY',
        description: 'Share van with return journey customer. Save up to 60% on long-distance moves.',
        estimatedPrice: returnJourneyPrice,
      });
    }
    
    // Option 3: Split Load (if very large)
    if (loadAnalysis.loadPercentage > 1.0) {
      const splitLoadPrice = singleOrderPrice * 1.8; // 80% more for 2 vans
      options.push({
        type: 'SPLIT_LOAD',
        description: 'Load requires 2 vans. Items will be transported in two separate vehicles.',
        estimatedPrice: splitLoadPrice,
      });
    }
    
    return options;
  }
  
  /**
   * Estimate single order price
   */
  private async estimateSingleOrderPrice(
    booking: BookingRequest,
    loadAnalysis: LoadAnalysis,
    routeAnalysis: RouteAnalysis
  ): Promise<number> {
    // Import dynamic pricing engine
    const { dynamicPricingEngine } = await import('./dynamic-pricing-engine');
    
    const pricingRequest = {
      pickupAddress: booking.pickup,
      dropoffAddress: booking.dropoff,
      items: booking.items,
      scheduledDate: booking.scheduledDate,
      serviceType: booking.serviceType,
      customerSegment: 'INDIVIDUAL' as const,
      loyaltyTier: 'BRONZE' as const,
      isMultiDrop: false,
    };
    
    const result = await dynamicPricingEngine.calculateDynamicPrice(pricingRequest);
    return result.finalPrice;
  }
  
  /**
   * Calculate distance using Haversine formula
   */
  private calculateDistance(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number { // DEPRECATED - internal use only
    const R = 3958.8; // Earth's radius in miles
    const dLat = (to.lat - from.lat) * (Math.PI / 180);
    const dLon = (to.lng - from.lng) * (Math.PI / 180);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(from.lat * (Math.PI / 180)) * Math.cos(to.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Add 15% for actual road distance
    return distance * 1.15;
  }
  
  /**
   * Estimate item volume (m³)
   */
  private estimateItemVolume(category: string, name: string): number {
    const volumeEstimates: Record<string, Record<string, number>> = {
      furniture: {
        'sofa': 2.5,
        'bed_double': 1.8,
        'bed_king': 2.2,
        'wardrobe': 2.0,
        'dining_table': 1.5,
        'chest_of_drawers': 0.8,
        'bookshelf': 1.0,
        'tv_stand': 0.6,
        'desk': 1.2,
        'chair': 0.3,
        'default': 1.0,
      },
      appliances: {
        'fridge': 1.5,
        'washing_machine': 1.0,
        'dishwasher': 0.8,
        'oven': 1.2,
        'microwave': 0.15,
        'default': 0.8,
      },
      boxes: {
        'small': 0.05,
        'medium': 0.1,
        'large': 0.15,
        'default': 0.1,
      },
    };
    
    const categoryEstimates = volumeEstimates[category] || volumeEstimates['boxes'];
    return categoryEstimates[name] || categoryEstimates['default'] || 0.5;
  }
  
  /**
   * Estimate item weight (kg)
   */
  private estimateItemWeight(category: string, name: string): number {
    const weightEstimates: Record<string, Record<string, number>> = {
      furniture: {
        'sofa': 80,
        'bed_double': 60,
        'bed_king': 75,
        'wardrobe': 100,
        'dining_table': 50,
        'chest_of_drawers': 40,
        'bookshelf': 45,
        'tv_stand': 30,
        'desk': 40,
        'chair': 15,
        'default': 40,
      },
      appliances: {
        'fridge': 70,
        'washing_machine': 65,
        'dishwasher': 50,
        'oven': 60,
        'microwave': 15,
        'default': 40,
      },
      boxes: {
        'small': 5,
        'medium': 10,
        'large': 15,
        'default': 10,
      },
    };
    
    const categoryEstimates = weightEstimates[category] || weightEstimates['boxes'];
    return categoryEstimates[name] || categoryEstimates['default'] || 20;
  }
  
  /**
   * Estimate load time for an item (minutes)
   */
  private estimateLoadTime(item: BookingRequest['items'][0]): number {
    const baseTime = (item.volume || this.estimateItemVolume(item.category, item.name)) * this.BASE_LOAD_TIME_PER_M3;
    const dismantleTime = item.dismantleTime || 0;
    return (baseTime + dismantleTime) * this.DISMANTLE_REASSEMBLE_BUFFER;
  }
  
  /**
   * Estimate unload time for an item (minutes)
   */
  private estimateUnloadTime(item: BookingRequest['items'][0]): number {
    const baseTime = (item.volume || this.estimateItemVolume(item.category, item.name)) * this.BASE_UNLOAD_TIME_PER_M3;
    const reassembleTime = item.reassembleTime || 0;
    return (baseTime + reassembleTime) * this.DISMANTLE_REASSEMBLE_BUFFER;
  }
  
  /**
   * Check if item requires two workers
   */
  private requiresTwoWorkers(category: string, name: string, weight: number): boolean {
    // Heavy items (> 50kg) always require 2 workers
    if (weight > 50) return true;
    
    // Specific items that always require 2 workers
    const twoWorkerItems = [
      'wardrobe',
      'bed_king',
      'bed_super_king',
      'sofa_3_seater',
      'sofa_corner',
      'fridge_american',
      'washing_machine',
      'piano',
    ];
    
    return twoWorkerItems.some(item => name.includes(item));
  }
  
  /**
   * Check if item is considered large/bulky
   * Based on volume > 1.0 m³ OR weight > 30 kg
   */
  private isLargeItem(item: BookingRequest['items'][0]): boolean {
    // Use actual volume if available
    const volume = item.volume || this.estimateItemVolume(item.category, item.name);
    const weight = item.weight || this.estimateItemWeight(item.category, item.name);
    
    // Item is large if volume > 1.0 m³ OR weight > 30 kg
    return volume > 1.0 || weight > 30;
  }
  
  /**
   * Count total number of large items in booking
   */
  private countLargeItems(booking: BookingRequest): number {
    let largeItemCount = 0;
    
    for (const item of booking.items) {
      if (this.isLargeItem(item)) {
        largeItemCount += item.quantity;
      }
    }
    
    return largeItemCount;
  }

  /**
   * ✅ FIX #3: Check if a new booking can be added to an existing route
   * Used for re-optimization when new bookings arrive
   */
  async canAddBookingToRoute(params: {
    routeId: string;
    existingBookings: any[];
    newBooking: any;
    maxDetourPercentage: number;
    maxAdditionalTime: number;
  }): Promise<{
    feasible: boolean;
    additionalDistance: number;
    additionalTime: number;
    reason?: string;
  }> {
    const { existingBookings, newBooking, maxDetourPercentage, maxAdditionalTime } = params;
    
    // Calculate current route totals
    let currentTotalDistance = 0;
    let currentTotalLoad = 0;
    let currentTotalTime = 0;
    
    for (const booking of existingBookings) {
      currentTotalDistance += booking.baseDistanceMiles || 0;
      currentTotalLoad += booking.estimatedLoadPercentage || 0;
      currentTotalTime += booking.estimatedDurationMinutes || 0;
    }
    
    // Calculate new booking metrics
    const newBookingDistance = newBooking.baseDistanceMiles || 0;
    const newBookingLoad = newBooking.estimatedLoadPercentage || 0;
    const newBookingTime = newBooking.estimatedDurationMinutes || 0;
    
    // Check load constraint
    const projectedLoad = currentTotalLoad + newBookingLoad;
    if (projectedLoad > this.MULTI_DROP_MAX_LOAD) {
      return {
        feasible: false,
        additionalDistance: newBookingDistance,
        additionalTime: newBookingTime,
        reason: `Adding this booking would exceed van capacity (${(projectedLoad * 100).toFixed(0)}% > ${(this.MULTI_DROP_MAX_LOAD * 100).toFixed(0)}%)`,
      };
    }
    
    // Check distance constraint (detour percentage)
    const projectedDistance = currentTotalDistance + newBookingDistance;
    const detourPercentage = newBookingDistance / currentTotalDistance;
    if (detourPercentage > maxDetourPercentage) {
      return {
        feasible: false,
        additionalDistance: newBookingDistance,
        additionalTime: newBookingTime,
        reason: `Adding this booking would create too much detour (${(detourPercentage * 100).toFixed(0)}% > ${(maxDetourPercentage * 100).toFixed(0)}%)`,
      };
    }
    
    // Check time constraint
    const projectedTime = currentTotalTime + newBookingTime;
    if (newBookingTime > maxAdditionalTime) {
      return {
        feasible: false,
        additionalDistance: newBookingDistance,
        additionalTime: newBookingTime,
        reason: `Adding this booking would add too much time (${newBookingTime} minutes > ${maxAdditionalTime} minutes)`,
      };
    }
    
    // Check total time doesn't exceed max working hours
    if (projectedTime > this.MAX_WORKING_HOURS * 60) {
      return {
        feasible: false,
        additionalDistance: newBookingDistance,
        additionalTime: newBookingTime,
        reason: `Total route time would exceed maximum working hours (${(projectedTime / 60).toFixed(1)} hours > ${this.MAX_WORKING_HOURS} hours)`,
      };
    }
    
    // All checks passed
    return {
      feasible: true,
      additionalDistance: newBookingDistance,
      additionalTime: newBookingTime,
    };
  }
  
  /**
   * Create optimal routes from a list of bookings
   * Groups compatible bookings into efficient multi-drop routes
   */
  async createOptimalRoutes(bookings: Array<{
    bookingId: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    scheduledAt: Date;
    loadPercentage: number;
    priority: number;
    value: number;
  }>): Promise<Array<{
    bookingIds: string[];
    totalDistance: number;
    totalDuration: number;
    totalValue: number;
    optimizationScore: number;
  }>> {
    const routes: Array<{
      bookingIds: string[];
      totalDistance: number;
      totalDuration: number;
      totalValue: number;
      optimizationScore: number;
    }> = [];
    
    // Sort bookings by priority (high to low)
    const sortedBookings = [...bookings].sort((a, b) => b.priority - a.priority);
    
    // Track which bookings have been assigned
    const assignedBookings = new Set<string>();
    
    // Greedy algorithm: Build routes by finding compatible bookings
    for (const booking of sortedBookings) {
      if (assignedBookings.has(booking.bookingId)) continue;
      
      // Start a new route with this booking
      const route = {
        bookingIds: [booking.bookingId],
        totalDistance: this.calculateDistance( // DEPRECATED - internal use only
          { lat: booking.pickupLat, lng: booking.pickupLng },
          { lat: booking.dropoffLat, lng: booking.dropoffLng }
        ),
        totalDuration: 0, // Will be calculated
        totalValue: booking.value,
        totalLoad: booking.loadPercentage,
        optimizationScore: 0,
      };
      
      assignedBookings.add(booking.bookingId);
      
      // Try to add compatible bookings to this route
      for (const candidate of sortedBookings) {
        if (assignedBookings.has(candidate.bookingId)) continue;
        
        // Check if candidate is compatible
        const projectedLoad = route.totalLoad + candidate.loadPercentage;
        if (projectedLoad > this.MULTI_DROP_MAX_LOAD) continue;
        
        // Check time window compatibility (within 2 hours)
        const timeDiff = Math.abs(booking.scheduledAt.getTime() - candidate.scheduledAt.getTime());
        if (timeDiff > 2 * 60 * 60 * 1000) continue; // 2 hours
        
        // Add to route
        route.bookingIds.push(candidate.bookingId);
        route.totalDistance += this.calculateDistance( // DEPRECATED - internal use only
          { lat: candidate.pickupLat, lng: candidate.pickupLng },
          { lat: candidate.dropoffLat, lng: candidate.dropoffLng }
        );
        route.totalValue += candidate.value;
        route.totalLoad += candidate.loadPercentage;
        
        assignedBookings.add(candidate.bookingId);
        
        // Stop if we have enough bookings (max 6 per route)
        if (route.bookingIds.length >= 6) break;
      }
      
      // Calculate duration (distance / speed * 60 + loading time)
      route.totalDuration = (route.totalDistance / this.AVERAGE_SPEED_MPH) * 60 + route.bookingIds.length * 30;
      
      // Calculate optimization score (higher is better)
      route.optimizationScore = (route.bookingIds.length * 100) - (route.totalDistance * 0.5);
      
      // Add route to list
      routes.push({
        bookingIds: route.bookingIds,
        totalDistance: route.totalDistance,
        totalDuration: route.totalDuration,
        totalValue: route.totalValue,
        optimizationScore: route.optimizationScore,
      });
    }
    
    return routes;
  }
}

export const intelligentRouteOptimizer = IntelligentRouteOptimizer.getInstance();
