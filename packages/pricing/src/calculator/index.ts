import {
  PricingRequest,
  PricingResult,
  PricingBreakdown,
  DistanceMatrix,
  VEHICLE_CAPACITIES,
  ITEM_CATEGORY_MULTIPLIERS,
  URGENCY_MULTIPLIERS,
  VehicleCapacity,
  EnhancedPricingRequest,
  ComprehensivePricingResult,
  LoadType,
  CAPACITY_THRESHOLDS,
  CapacityUtilization,
  CapacityAwarePricingResult,
} from '../models';
import { VehicleType, ItemCategory } from '@speedy-van/shared';

/**
 * Enterprise-grade pricing calculator for Speedy Van
 * Handles comprehensive pricing logic with multiple factors
 */
export class PricingCalculator {
  /**
   * Calculate comprehensive pricing for a delivery request
   */
  async calculatePrice(request: PricingRequest): Promise<PricingResult> {
    // Get distance and duration
    const distanceMatrix = await this.calculateDistance(
      request.pickupLocation,
      request.deliveryLocation
    );

    // Determine optimal vehicle type
    const recommendedVehicle = this.determineVehicleType(request.items, request.vehicleType);
    const vehicleCapacity = VEHICLE_CAPACITIES[recommendedVehicle];

    // CRITICAL: Calculate capacity utilization to determine load type
    const capacityUtilization = this.calculateCapacityUtilization(
      request.items,
      vehicleCapacity
    );

    // Calculate individual price components
    const basePrice = this.calculateBasePrice(vehicleCapacity);
    const distancePrice = this.calculateDistancePrice(distanceMatrix.distance, vehicleCapacity);
    const itemsPrice = this.calculateItemsPrice(request.items);
    const timePrice = this.calculateTimePrice(distanceMatrix.duration, vehicleCapacity);
    const urgencyPrice = this.calculateUrgencyPrice(
      basePrice + distancePrice + itemsPrice + timePrice,
      request.urgency || 'standard'
    );

    // Calculate base total before multi-drop consideration
    const priceBeforeMultiDrop = basePrice + distancePrice + itemsPrice + timePrice + urgencyPrice;

    // CRITICAL: Apply multi-drop discount ONLY if capacity allows route sharing
    let multiDropDiscount = 0;
    let multiDropDiscountApplied = false;
    let totalPrice = priceBeforeMultiDrop;

    if (capacityUtilization.routeSharingAvailable) {
      // Route sharing available - apply multi-drop discount logic here if needed
      // For now, no automatic discount - will be handled by route orchestration
      multiDropDiscountApplied = false;
    } else {
      // Full load - NO multi-drop discount
      console.log(`🚛 Full Load Detected: ${(capacityUtilization.overallUtilization * 100).toFixed(1)}% capacity - Route sharing disabled`);
    }

    // Debug logging for development
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PRICING === 'true') {
      console.log('🔍 Pricing breakdown debug:', {
        basePrice,
        distancePrice,
        itemsPrice,
        timePrice,
        urgencyPrice,
        distanceMatrix,
        vehicleCapacity,
        itemsCount: request.items.length,
        capacityUtilization: {
          overall: (capacityUtilization.overallUtilization * 100).toFixed(1) + '%',
          loadType: capacityUtilization.loadType,
          routeSharingAvailable: capacityUtilization.routeSharingAvailable,
          message: capacityUtilization.message,
        },
        multiDropDiscountApplied,
        totalPrice,
      });
    }

    // Create breakdown
    const breakdown = this.createPricingBreakdown({
      basePrice,
      distancePrice,
      itemsPrice,
      timePrice,
      urgencyPrice,
      distance: distanceMatrix.distance,
      duration: distanceMatrix.duration,
      urgency: request.urgency || 'standard',
    });

    // Return capacity-aware result
    const result: CapacityAwarePricingResult = {
      basePrice,
      distancePrice,
      itemsPrice,
      timePrice,
      urgencyPrice,
      totalPrice,
      estimatedDuration: distanceMatrix.duration,
      recommendedVehicle,
      breakdown,
      capacityUtilization,
      multiDropDiscountApplied,
      multiDropDiscount,
      priceBeforeMultiDrop,
    };

    return result;
  }

  /**
   * Calculate base price for vehicle type
   */
  private calculateBasePrice(vehicleCapacity: VehicleCapacity): number {
    return vehicleCapacity.basePrice;
  }

  /**
   * Calculate distance-based pricing
   */
  private calculateDistancePrice(distance: number, vehicleCapacity: VehicleCapacity): number {
    return distance * vehicleCapacity.pricePerKm;
  }

  /**
   * Calculate items-based pricing
   */
  private calculateItemsPrice(items: PricingRequest['items']): number {
    let totalPrice = 0;

    for (const item of items) {
      const categoryMultiplier = ITEM_CATEGORY_MULTIPLIERS[item.category] || ITEM_CATEGORY_MULTIPLIERS[ItemCategory.OTHER] || 1.2;
      const baseItemPrice = 5; // Base price per item
      
      // Debug item pricing calculation
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PRICING === 'true') {
        console.log(`💰 Item pricing: ${item.category} (qty: ${item.quantity}) - multiplier: ${categoryMultiplier}`);
      }
      
      let itemPrice = baseItemPrice * item.quantity * categoryMultiplier;

      // Add weight-based pricing - CRITICAL: NO DEFAULT WEIGHTS ALLOWED
      if (!item.weight && item.weight !== 0) {
        throw new Error(`CRITICAL PRICING ERROR: Missing weight for item ${item.id || item.name}. Cannot calculate accurate pricing without real weights. This will cause REAL FINANCIAL LOSS.`);
      }

      // Weight-based pricing using REAL weights from dataset
      itemPrice += item.weight * 0.5; // $0.50 per kg - based on actual item weight

      // Add volume-based pricing - prefer official volume data over dimensions calculation
      let volumePrice = 0;

      if (item.volumeM3 || item.volume) {
        // Use official volume from dataset
        const volume = item.volumeM3 || item.volume || 0;
        volumePrice = volume * 10; // $10 per cubic meter
      } else if (item.dimensions) {
        // Fallback to dimensions calculation (less accurate)
        const volume = (item.dimensions.length * item.dimensions.width * item.dimensions.height) / 1000000; // Convert to cubic meters
        volumePrice = volume * 10; // $10 per cubic meter
        console.warn(`⚠️ Using estimated volume for ${item.id || item.name} - official dataset volume preferred`);
      } else {
        // No volume data available - this affects capacity planning accuracy
        console.warn(`⚠️ No volume data for ${item.id || item.name} - capacity calculations may be inaccurate`);
      }

      itemPrice += volumePrice;

      totalPrice += itemPrice;
    }

    return totalPrice;
  }

  /**
   * Calculate time-based pricing
   */
  private calculateTimePrice(duration: number, vehicleCapacity: VehicleCapacity): number {
    return duration * vehicleCapacity.pricePerMinute;
  }

  /**
   * Calculate urgency-based pricing
   */
  private calculateUrgencyPrice(baseTotal: number, urgency: keyof typeof URGENCY_MULTIPLIERS): number {
    const multiplier = URGENCY_MULTIPLIERS[urgency];
    return baseTotal * (multiplier - 1); // Only the additional amount
  }

  /**
   * Determine optimal vehicle type based on items
   */
  private determineVehicleType(
    items: PricingRequest['items'],
    preferredType?: VehicleType
  ): VehicleType {
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
    const totalVolume = items.reduce((sum, item) => {
      if (!item.dimensions) return sum;
      const volume = (item.dimensions.length * item.dimensions.width * item.dimensions.height) / 1000000;
      return sum + volume * item.quantity;
    }, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    // Check if preferred type can handle the load
    if (preferredType) {
      const capacity = VEHICLE_CAPACITIES[preferredType];
      if (
        totalWeight <= capacity.maxWeight &&
        totalVolume <= capacity.maxVolume &&
        totalItems <= capacity.maxItems
      ) {
        return preferredType;
      }
    }

    // Find the smallest vehicle that can handle the load
    const vehicleTypes = [VehicleType.PICKUP, VehicleType.VAN, VehicleType.TRUCK];
    
    for (const vehicleType of vehicleTypes) {
      const capacity = VEHICLE_CAPACITIES[vehicleType];
      if (
        totalWeight <= capacity.maxWeight &&
        totalVolume <= capacity.maxVolume &&
        totalItems <= capacity.maxItems
      ) {
        return vehicleType;
      }
    }

    // Default to truck if nothing else fits
    return VehicleType.TRUCK;
  }

  /**
   * CRITICAL: Calculate capacity utilization to determine load type
   * 
   * This determines whether route sharing (multiple drops) is available.
   * 
   * Rules:
   * - ≥90% capacity = FULL_LOAD → No route sharing, full price
   * - ≤70% capacity = PARTIAL_LOAD → Route sharing available
   * - Between 70-90% = Borderline, treated as FULL_LOAD for safety
   */
  private calculateCapacityUtilization(
    items: PricingRequest['items'],
    vehicleCapacity: VehicleCapacity
  ): CapacityUtilization {
    // Calculate total weight and volume
    const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);
    
    const totalVolume = items.reduce((sum, item) => {
      if (item.volumeM3 || item.volume) {
        return sum + (item.volumeM3 || item.volume || 0) * item.quantity;
      }
      if (item.dimensions) {
        const volume = (item.dimensions.length * item.dimensions.width * item.dimensions.height) / 1000000;
        return sum + volume * item.quantity;
      }
      return sum;
    }, 0);

    // Calculate utilization percentages
    const weightUtilization = totalWeight / vehicleCapacity.maxWeight;
    const volumeUtilization = totalVolume / vehicleCapacity.maxVolume;

    // Overall utilization is the limiting factor (max of both)
    const overallUtilization = Math.max(weightUtilization, volumeUtilization);

    // Determine load type based on utilization
    let loadType: LoadType;
    let routeSharingAvailable: boolean;
    let message: string;

    if (overallUtilization >= CAPACITY_THRESHOLDS.FULL_LOAD) {
      // ≥90% = Full load
      loadType = LoadType.FULL_LOAD;
      routeSharingAvailable = false;
      message = 'Full load detected — route sharing not available. Price adjusted for full-distance trip.';
      
      console.log(`🚛 FULL LOAD: ${(overallUtilization * 100).toFixed(1)}% capacity (Weight: ${(weightUtilization * 100).toFixed(1)}%, Volume: ${(volumeUtilization * 100).toFixed(1)}%)`);
      
    } else if (overallUtilization <= CAPACITY_THRESHOLDS.PARTIAL_LOAD) {
      // ≤70% = Partial load
      loadType = LoadType.PARTIAL_LOAD;
      routeSharingAvailable = true;
      message = 'Partial load — route sharing available for potential cost savings.';
      
      console.log(`📦 PARTIAL LOAD: ${(overallUtilization * 100).toFixed(1)}% capacity - Route sharing available`);
      
    } else {
      // 70-90% = Borderline, treat as full load for safety
      loadType = LoadType.FULL_LOAD;
      routeSharingAvailable = false;
      message = 'Near-full load — route sharing not available. Price adjusted for dedicated trip.';
      
      console.log(`⚠️ NEAR-FULL LOAD: ${(overallUtilization * 100).toFixed(1)}% capacity - Treated as full load`);
    }

    return {
      weightUtilization,
      volumeUtilization,
      overallUtilization,
      loadType,
      routeSharingAvailable,
      message,
    };
  }

  /**
   * Calculate distance and duration between two points
   */
  private async calculateDistance(
    pickup: { latitude: number; longitude: number },
    delivery: { latitude: number; longitude: number }
  ): Promise<DistanceMatrix> {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(delivery.latitude - pickup.latitude);
    const dLon = this.toRadians(delivery.longitude - pickup.longitude);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(pickup.latitude)) *
        Math.cos(this.toRadians(delivery.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate duration (assuming average speed of 40 km/h in city)
    const duration = (distance / 40) * 60; // Convert to minutes

    return {
      distance,
      duration,
    };
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Create detailed pricing breakdown
   */
  private createPricingBreakdown(params: {
    basePrice: number;
    distancePrice: number;
    itemsPrice: number;
    timePrice: number;
    urgencyPrice: number;
    distance: number;
    duration: number;
    urgency: string;
  }): PricingBreakdown[] {
    const breakdown: PricingBreakdown[] = [
      {
        component: 'base',
        description: 'Base service fee',
        amount: params.basePrice,
      },
      {
        component: 'distance',
        description: `Distance charge (${params.distance.toFixed(1)} km)`,
        amount: params.distancePrice,
        unit: 'km',
      },
      {
        component: 'items',
        description: 'Items handling fee',
        amount: params.itemsPrice,
      },
      {
        component: 'time',
        description: `Time charge (${Math.round(params.duration)} min)`,
        amount: params.timePrice,
        unit: 'min',
      },
    ];

    if (params.urgencyPrice > 0) {
      breakdown.push({
        component: 'urgency',
        description: `${params.urgency} delivery surcharge`,
        amount: params.urgencyPrice,
      });
    }

    return breakdown;
  }

  /**
   * Validate pricing request
   */
  validateRequest(request: PricingRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate coordinates
    if (!this.isValidCoordinate(request.pickupLocation.latitude, request.pickupLocation.longitude)) {
      errors.push('Invalid pickup location coordinates');
    }

    if (!this.isValidCoordinate(request.deliveryLocation.latitude, request.deliveryLocation.longitude)) {
      errors.push('Invalid delivery location coordinates');
    }

    // Validate items
    if (!request.items || request.items.length === 0) {
      errors.push('At least one item is required');
    }

    // Validate scheduled date
    if (request.scheduledAt < new Date()) {
      errors.push('Scheduled time must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if coordinates are valid
   */
  private isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Alias for calculateEnhancedPrice - backwards compatibility
   */
  async calculateEnhancedPrice(request: EnhancedPricingRequest): Promise<ComprehensivePricingResult> {
    // For now, convert to basic request and enhance the result
    const basicRequest: PricingRequest = {
      pickupLocation: request.pickupLocation,
      deliveryLocation: request.deliveryLocation,
      items: request.items.map(item => ({
        category: item.category,
        quantity: item.quantity,
        weight: item.weight,
        dimensions: item.dimensions,
      })),
      scheduledAt: request.scheduledAt,
      vehicleType: request.vehicleType,
      urgency: request.urgency,
    };

    const basicResult = await this.calculatePrice(basicRequest);

    // Enhance with additional calculations
    const specialSurcharges = this.calculateSpecialItemSurcharges(request.items);
    const accessSurcharges = this.calculateAccessSurcharges(request.pickupProperty, request.dropoffProperty);
    const promoDiscount = this.calculatePromoDiscount(request.promoCode, basicResult.totalPrice);
    
    const subtotalBeforeVAT = Math.max(0, basicResult.totalPrice - promoDiscount);
    const vatAmount = subtotalBeforeVAT * 0.2; // 20% VAT
    const totalPrice = subtotalBeforeVAT + vatAmount;

    const multipliers = {
      service: this.calculateServiceMultiplier(request.serviceType),
      timeSlot: this.calculateTimeSlotMultiplier(request.timeSlot),
      seasonal: this.calculateSeasonalMultiplier(request.scheduledAt),
      demand: this.calculateDemandMultiplier(request.scheduledAt),
    };

    const recommendations = this.generateRecommendations(request);

    const result: ComprehensivePricingResult = {
      ...basicResult,
      totalPrice,
      subtotalBeforeVAT,
      vatAmount,
      promoDiscount,
      specialSurcharges,
      accessSurcharges,
      multipliers,
      recommendations,
    };

    return result;
  }

  /**
   * Calculate special item surcharges
   */
  private calculateSpecialItemSurcharges(items: EnhancedPricingRequest['items']): Array<{ name: string; amount: number; reason: string }> {
    const surcharges: Array<{ name: string; amount: number; reason: string }> = [];
    
    for (const item of items) {
      if (item.isFragile) {
        surcharges.push({
          name: `${item.name} (Fragile)`,
          amount: 15 * item.quantity,
          reason: 'Fragile item handling',
        });
      }
      
      if (item.isValuable) {
        surcharges.push({
          name: `${item.name} (Valuable)`,
          amount: 20 * item.quantity,
          reason: 'Valuable item insurance',
        });
      }
      
      if (item.weight && item.weight > 50) {
        surcharges.push({
          name: `${item.name} (Heavy)`,
          amount: 10 * item.quantity,
          reason: 'Heavy item handling',
        });
      }
    }
    
    return surcharges;
  }

  /**
   * Calculate property access surcharges
   */
  private calculateAccessSurcharges(
    pickupProperty?: EnhancedPricingRequest['pickupProperty'],
    dropoffProperty?: EnhancedPricingRequest['dropoffProperty']
  ): Array<{ name: string; amount: number; reason: string }> {
    const surcharges: Array<{ name: string; amount: number; reason: string }> = [];
    
    // Pickup property surcharges
    if (pickupProperty) {
      if (!pickupProperty.hasElevator && pickupProperty.floor > 0) {
        surcharges.push({
          name: 'Pickup - No Elevator',
          amount: 15 * pickupProperty.floor,
          reason: `Stairs at pickup (${pickupProperty.floor} floors)`,
        });
      }
      
      if (pickupProperty.narrowAccess) {
        surcharges.push({
          name: 'Pickup - Narrow Access',
          amount: 20,
          reason: 'Difficult access at pickup location',
        });
      }
      
      if (pickupProperty.longCarry) {
        surcharges.push({
          name: 'Pickup - Long Carry',
          amount: 25,
          reason: 'Long carry distance at pickup',
        });
      }
    }
    
    // Dropoff property surcharges
    if (dropoffProperty) {
      if (!dropoffProperty.hasElevator && dropoffProperty.floor > 0) {
        surcharges.push({
          name: 'Dropoff - No Elevator',
          amount: 15 * dropoffProperty.floor,
          reason: `Stairs at dropoff (${dropoffProperty.floor} floors)`,
        });
      }
      
      if (dropoffProperty.narrowAccess) {
        surcharges.push({
          name: 'Dropoff - Narrow Access',
          amount: 20,
          reason: 'Difficult access at dropoff location',
        });
      }
      
      if (dropoffProperty.longCarry) {
        surcharges.push({
          name: 'Dropoff - Long Carry',
          amount: 25,
          reason: 'Long carry distance at dropoff',
        });
      }
    }
    
    return surcharges;
  }

  /**
   * Calculate promotional discount
   */
  private calculatePromoDiscount(promoCode?: string, subtotal: number = 0): number {
    if (!promoCode) return 0;
    
    const promoCodes: Record<string, { discount: number; type: 'percentage' | 'fixed'; maxDiscount?: number }> = {
      'WELCOME10': { discount: 0.1, type: 'percentage', maxDiscount: 50 },
      'SAVE20': { discount: 20, type: 'fixed' },
      'STUDENT15': { discount: 0.15, type: 'percentage', maxDiscount: 30 },
      'BULK25': { discount: 0.25, type: 'percentage', maxDiscount: 100 },
    };
    
    const promo = promoCodes[promoCode.toUpperCase()];
    if (!promo) return 0;
    
    let discount = 0;
    
    if (promo.type === 'percentage') {
      discount = subtotal * promo.discount;
      if (promo.maxDiscount) {
        discount = Math.min(discount, promo.maxDiscount);
      }
    } else {
      discount = promo.discount;
    }
    
    return Math.min(discount, subtotal * 0.3); // Max 30% discount
  }

  /**
   * Calculate service type multipliers
   */
  private calculateServiceMultiplier(serviceType: string = 'standard'): number {
    const multipliers: Record<string, number> = {
      'standard': 1.0,
      'express': 1.3,
      'same-day': 1.8,
      'premium': 2.0,
      'economy': 0.8,
    };
    
    return multipliers[serviceType] || 1.0;
  }

  /**
   * Calculate time-based multipliers
   */
  private calculateTimeSlotMultiplier(timeSlot?: string): number {
    if (!timeSlot) return 1.0;
    
    const multipliers: Record<string, number> = {
      'early-morning': 1.1,
      'peak-morning': 1.3,
      'midday': 1.0,
      'peak-evening': 1.2,
      'late-evening': 1.15,
      'weekend': 1.25,
    };
    
    return multipliers[timeSlot] || 1.0;
  }

  /**
   * Calculate seasonal multipliers
   */
  private calculateSeasonalMultiplier(date: Date): number {
    const month = date.getMonth();
    
    // Peak season (Summer & Christmas)
    if (month >= 5 && month <= 7 || month === 11) {
      return 1.2;
    }
    
    // High season (Spring & Autumn)
    if (month >= 2 && month <= 4 || month >= 8 && month <= 10) {
      return 1.1;
    }
    
    // Normal season (Winter except Christmas)
    return 1.0;
  }

  /**
   * Calculate demand-based multipliers
   */
  private calculateDemandMultiplier(date: Date): number {
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    
    // Weekend demand
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 1.15;
    }
    
    // Peak hours demand
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
      return 1.25;
    }
    
    // Off-peak hours
    if (hour >= 22 || hour <= 6) {
      return 0.95;
    }
    
    return 1.0;
  }

  /**
   * Generate pricing recommendations
   */
  private generateRecommendations(request: EnhancedPricingRequest): string[] {
    const recommendations: string[] = [];
    
    // Time-based recommendations
    const hour = request.scheduledAt.getHours();
    if (hour >= 8 && hour <= 10 || hour >= 17 && hour <= 19) {
      recommendations.push('Consider scheduling outside peak hours (8-10am, 5-7pm) for better rates');
    }
    
    // Service type recommendations
    if (request.serviceType === 'same-day') {
      recommendations.push('Consider express service for significant savings on large bookings');
    }
    
    return recommendations;
  }
}

