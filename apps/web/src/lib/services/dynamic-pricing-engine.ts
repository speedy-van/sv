import { prisma } from '@/lib/prisma';

export interface DynamicPricingRequest {
  pickupAddress: {
    address: string;
    postcode: string;
    coordinates?: { lat: number; lng: number };
  };
  dropoffAddress: {
    address: string;
    postcode: string;
    coordinates?: { lat: number; lng: number };
  };
  scheduledDate: Date;
  serviceType: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  customerSegment: 'INDIVIDUAL' | 'BUSINESS' | 'ENTERPRISE';
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  items: Array<{
    category: string;
    quantity: number;
    weight?: number;
    volume?: number;
    fragile?: boolean;
  }>;
  customerId?: string;
  
  // Multi-drop route support
  isMultiDrop?: boolean; // True if this booking is part of a multi-drop route
  multiDropInfo?: {
    totalRouteDistance: number; // Total distance of the entire route in miles
    numberOfStops: number; // Total number of stops in the route
    customerSharePercentage: number; // This customer's share of the route (0-1)
    estimatedTotalRouteCost: number; // Total cost of the entire route
  };
}

export interface DynamicPricingResponse {
  basePrice: number;
  dynamicMultipliers: {
    demand: number;
    supply: number;
    market: number;
    customer: number;
    time: number;
    weather: number;
  };
  finalPrice: number;
  breakdown: {
    baseFare: number;
    distanceCost: number;
    timeCost: number;
    itemsCost: number;
    surcharges: number;
    discounts: number;
    multiDropDiscount?: number; // Discount applied for multi-drop routes
  };
  confidence: number;
  validUntil: Date;
  recommendations?: string[];
  
  // Multi-drop route information
  isMultiDrop?: boolean;
  multiDropSavings?: number; // Amount saved by sharing the route
  routeType?: 'single' | 'multi-drop';
}

export class DynamicPricingEngine {
  private static instance: DynamicPricingEngine;

  static getInstance(): DynamicPricingEngine {
    if (!DynamicPricingEngine.instance) {
      DynamicPricingEngine.instance = new DynamicPricingEngine();
    }
    return DynamicPricingEngine.instance;
  }

  async calculateDynamicPrice(request: DynamicPricingRequest): Promise<DynamicPricingResponse> {
    try {
      // Step 1: Calculate base price
      const basePrice = await this.calculateBasePrice(request);

      // Step 2: Analyze market conditions
      const marketConditions = await this.analyzeMarketConditions(request);

      // Step 3: Calculate dynamic multipliers
      const multipliers = await this.calculateMultipliers(request, marketConditions);

      // Step 4: Apply customer-specific adjustments
      const customerAdjustments = await this.getCustomerAdjustments(request);

      // Step 5: Calculate final price
      const finalPrice = this.applyDynamicPricing(basePrice, multipliers, customerAdjustments);

      // Step 6: Generate breakdown
      const breakdown = this.generatePriceBreakdown(basePrice, multipliers, customerAdjustments);

      // Step 7: Calculate confidence score
      const confidence = this.calculateConfidenceScore(marketConditions, multipliers);

      return {
        basePrice,
        dynamicMultipliers: multipliers,
        finalPrice,
        breakdown,
        confidence,
        validUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        recommendations: this.generateRecommendations(request, multipliers),
      };
    } catch (error) {
      console.error('Dynamic pricing calculation failed:', error);
      throw new Error('Failed to calculate dynamic pricing');
    }
  }

  private async calculateBasePrice(request: DynamicPricingRequest): Promise<number> {
    // Check if this is a multi-drop route
    if (request.isMultiDrop && request.multiDropInfo) {
      return this.calculateMultiDropPrice(request);
    }

    // Service type base rates
    const serviceRates = {
      ECONOMY: 35,
      STANDARD: 45,
      PREMIUM: 65,
      ENTERPRISE: 85,
    };

    let basePrice = serviceRates[request.serviceType];

    // Distance calculation with tiered pricing
    const distance = await this.calculateDistance(request.pickupAddress, request.dropoffAddress);
    
    // Tiered distance pricing (more economical for long distances)
    let distanceCost = 0;
    const freeDistance = 5; // First 5 miles free
    const remainingDistance = Math.max(0, distance - freeDistance);
    
    if (remainingDistance <= 0) {
      distanceCost = 0;
    } else if (distance <= 50) {
      // Short distance: 5-50 miles at £2.50/mile
      distanceCost = remainingDistance * 2.5;
    } else if (distance <= 150) {
      // Medium distance: 51-150 miles
      // First 45 miles (5-50) at £2.50/mile = £112.50
      // Remaining at £2.00/mile
      distanceCost = (45 * 2.5) + ((distance - 50) * 2.0);
    } else if (distance <= 300) {
      // Long distance: 151-300 miles
      // First 45 miles at £2.50/mile = £112.50
      // Next 100 miles at £2.00/mile = £200
      // Remaining at £1.50/mile
      distanceCost = (45 * 2.5) + (100 * 2.0) + ((distance - 150) * 1.5);
    } else {
      // Very long distance: 300+ miles
      // First 45 miles at £2.50/mile = £112.50
      // Next 100 miles at £2.00/mile = £200
      // Next 150 miles at £1.50/mile = £225
      // Remaining at £1.20/mile
      distanceCost = (45 * 2.5) + (100 * 2.0) + (150 * 1.5) + ((distance - 300) * 1.2);
    }
    
    console.log('💰 Distance pricing calculated:', {
      distance: distance.toFixed(1) + ' miles',
      tier: distance <= 50 ? 'Short' : distance <= 150 ? 'Medium' : distance <= 300 ? 'Long' : 'Very Long',
      distanceCost: '£' + distanceCost.toFixed(2),
    });
    
    basePrice += distanceCost;

    // Items cost
    const itemsCost = request.items.reduce((total, item) => {
      let itemCost = item.quantity * 5; // £5 per item base
      if (item.fragile) itemCost *= 1.5;
      if (item.weight && item.weight > 25) itemCost += 10; // Heavy item surcharge
      return total + itemCost;
    }, 0);

    return basePrice + itemsCost;
  }

  private async analyzeMarketConditions(request: DynamicPricingRequest) {
    // Get current demand in the area
    const currentDemand = await this.getCurrentDemand(request.pickupAddress.postcode);
    
    // Get available supply
    const availableSupply = await this.getAvailableSupply(request.pickupAddress.postcode);
    
    // Get competitor pricing (mock data for now)
    const competitorPricing = await this.getCompetitorPricing(request);
    
    // Get external factors
    const externalFactors = await this.getExternalFactors(request.scheduledDate);

    return {
      demand: currentDemand,
      supply: availableSupply,
      competitors: competitorPricing,
      external: externalFactors,
    };
  }

  private async calculateMultipliers(request: DynamicPricingRequest, conditions: any) {
    const demandMultiplier = this.calculateDemandMultiplier(conditions.demand, conditions.supply);
    const marketMultiplier = this.calculateMarketMultiplier(conditions.competitors);
    const timeMultiplier = this.calculateTimeMultiplier(request.scheduledDate);
    const weatherMultiplier = await this.calculateWeatherMultiplier(request.scheduledDate);
    const customerMultiplier = this.calculateCustomerMultiplier(request);

    return {
      demand: demandMultiplier,
      supply: 1.0, // Calculated within demand
      market: marketMultiplier,
      customer: customerMultiplier,
      time: timeMultiplier,
      weather: weatherMultiplier,
    };
  }

  private calculateDemandMultiplier(demand: number, supply: number): number {
    const demandSupplyRatio = demand / Math.max(supply, 1);
    
    if (demandSupplyRatio > 3.0) return 1.75; // Very high demand
    if (demandSupplyRatio > 2.0) return 1.5;  // High demand
    if (demandSupplyRatio > 1.5) return 1.25; // Moderate demand
    if (demandSupplyRatio > 1.0) return 1.1;  // Slight demand
    
    return 0.95; // Low demand discount
  }

  private calculateMarketMultiplier(competitors: any): number {
    // Simplified competitive positioning
    const avgCompetitorPrice = competitors.averagePrice || 100;
    const ourPosition = competitors.ourPosition || 'middle';
    
    switch (ourPosition) {
      case 'premium': return 1.2;
      case 'competitive': return 1.0;
      case 'value': return 0.9;
      default: return 1.0;
    }
  }

  private calculateTimeMultiplier(scheduledDate: Date): number {
    const hour = scheduledDate.getHours();
    const dayOfWeek = scheduledDate.getDay();
    
    // Weekend multiplier
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return 1.25;
    }
    
    // Peak hours (8-10 AM, 5-7 PM)
    if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
      return 1.3;
    }
    
    // Evening hours (7-11 PM)
    if (hour >= 19 && hour <= 23) {
      return 1.15;
    }
    
    // Early morning (6-8 AM)
    if (hour >= 6 && hour <= 8) {
      return 1.1;
    }
    
    return 1.0;
  }

  private async calculateWeatherMultiplier(scheduledDate: Date): Promise<number> {
    // Mock weather data - in production, integrate with weather API
    const weatherConditions = {
      temperature: 15,
      precipitation: 0,
      windSpeed: 10,
      visibility: 10,
    };
    
    let multiplier = 1.0;
    
    // Temperature adjustments
    if (weatherConditions.temperature < 0) multiplier += 0.1;
    if (weatherConditions.temperature > 30) multiplier += 0.15;
    
    // Precipitation adjustments
    if (weatherConditions.precipitation > 10) multiplier += 0.2;
    else if (weatherConditions.precipitation > 5) multiplier += 0.1;
    
    // Wind adjustments
    if (weatherConditions.windSpeed > 30) multiplier += 0.15;
    else if (weatherConditions.windSpeed > 20) multiplier += 0.08;
    
    // Visibility adjustments
    if (weatherConditions.visibility < 1) multiplier += 0.25;
    else if (weatherConditions.visibility < 5) multiplier += 0.1;
    
    return Math.min(multiplier, 1.5); // Cap at 50% increase
  }

  private calculateCustomerMultiplier(request: DynamicPricingRequest): number {
    let multiplier = 1.0;
    
    // Loyalty tier discounts
    switch (request.loyaltyTier) {
      case 'PLATINUM': multiplier = 0.85; break;
      case 'GOLD': multiplier = 0.9; break;
      case 'SILVER': multiplier = 0.95; break;
      case 'BRONZE': multiplier = 1.0; break;
    }
    
    // Customer segment adjustments
    switch (request.customerSegment) {
      case 'ENTERPRISE': multiplier *= 0.9; break;
      case 'BUSINESS': multiplier *= 0.95; break;
      case 'INDIVIDUAL': multiplier *= 1.0; break;
    }
    
    return multiplier;
  }

  private applyDynamicPricing(basePrice: number, multipliers: any, adjustments: any): number {
    let finalPrice = basePrice;
    
    // Calculate combined multiplier for demand, market, time, and weather
    // Apply a cap to prevent excessive pricing during peak times
    const combinedMultiplier = Math.min(
      multipliers.demand * multipliers.market * multipliers.time * multipliers.weather,
      1.75 // Maximum 75% increase to keep prices competitive
    );
    
    // Apply combined multiplier
    finalPrice *= combinedMultiplier;
    
    // Apply customer-specific multiplier (loyalty discounts, etc.)
    finalPrice *= multipliers.customer;
    
    // Apply customer adjustments
    if (adjustments.volumeDiscount) {
      finalPrice *= (1 - adjustments.volumeDiscount);
    }
    
    return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
  }

  private generatePriceBreakdown(basePrice: number, multipliers: any, adjustments: any) {
    return {
      baseFare: Math.round(basePrice * 0.6),
      distanceCost: Math.round(basePrice * 0.25),
      timeCost: Math.round(basePrice * 0.1),
      itemsCost: Math.round(basePrice * 0.05),
      surcharges: Math.round(basePrice * (multipliers.demand + multipliers.time + multipliers.weather - 3) * 100) / 100,
      discounts: Math.round(basePrice * (1 - multipliers.customer) * 100) / 100,
    };
  }

  private calculateConfidenceScore(conditions: any, multipliers: any): number {
    // Calculate confidence based on data quality and market stability
    let confidence = 0.8; // Base confidence
    
    // Adjust based on demand/supply stability
    const demandVariability = Math.abs(multipliers.demand - 1.0);
    confidence -= demandVariability * 0.2;
    
    // Adjust based on market data quality
    if (conditions.competitors.dataQuality === 'high') confidence += 0.1;
    if (conditions.competitors.dataQuality === 'low') confidence -= 0.1;
    
    return Math.max(0.5, Math.min(1.0, confidence));
  }

  private generateRecommendations(request: DynamicPricingRequest, multipliers: any): string[] {
    const recommendations: string[] = [];
    
    if (multipliers.demand > 1.3) {
      recommendations.push('High demand period - consider booking earlier for better rates');
    }
    
    if (multipliers.time > 1.2) {
      recommendations.push('Peak time surcharge applies - off-peak times may be cheaper');
    }
    
    if (multipliers.weather > 1.1) {
      recommendations.push('Weather conditions may affect pricing and delivery times');
    }
    
    if (request.loyaltyTier === 'BRONZE') {
      recommendations.push('Upgrade to higher loyalty tier for better rates');
    }
    
    return recommendations;
  }

  // Helper methods (simplified implementations)
  
  /**
   * Calculate price for multi-drop routes
   * Customer pays their fair share of the total route cost
   */
  private calculateMultiDropPrice(request: DynamicPricingRequest): number {
    const { multiDropInfo } = request;
    if (!multiDropInfo) {
      throw new Error('Multi-drop info required for multi-drop pricing');
    }

    // Base fare (reduced for multi-drop)
    const serviceRates = {
      ECONOMY: 25, // Lower than single order (35)
      STANDARD: 35, // Lower than single order (45)
      PREMIUM: 50, // Lower than single order (65)
      ENTERPRISE: 70, // Lower than single order (85)
    };

    let basePrice = serviceRates[request.serviceType];

    // Calculate this customer's share of the route distance cost
    const totalRouteDistance = multiDropInfo.totalRouteDistance;
    const customerShare = multiDropInfo.customerSharePercentage;

    // Use tiered pricing for the total route
    let totalDistanceCost = 0;
    const freeDistance = 5;
    const remainingDistance = Math.max(0, totalRouteDistance - freeDistance);
    
    if (remainingDistance <= 0) {
      totalDistanceCost = 0;
    } else if (totalRouteDistance <= 50) {
      totalDistanceCost = remainingDistance * 2.5;
    } else if (totalRouteDistance <= 150) {
      totalDistanceCost = (45 * 2.5) + ((totalRouteDistance - 50) * 2.0);
    } else if (totalRouteDistance <= 300) {
      totalDistanceCost = (45 * 2.5) + (100 * 2.0) + ((totalRouteDistance - 150) * 1.5);
    } else {
      totalDistanceCost = (45 * 2.5) + (100 * 2.0) + (150 * 1.5) + ((totalRouteDistance - 300) * 1.2);
    }

    // Customer pays their share of the distance cost
    const customerDistanceCost = totalDistanceCost * customerShare;

    // Items cost (same as single order)
    const itemsCost = request.items.reduce((total, item) => {
      let itemCost = item.quantity * 5;
      if (item.fragile) itemCost *= 1.5;
      if (item.weight && item.weight > 25) itemCost += 10;
      return total + itemCost;
    }, 0);

    const totalPrice = basePrice + customerDistanceCost + itemsCost;

    console.log('🚛 Multi-drop pricing calculated:', {
      serviceType: request.serviceType,
      basePrice: '£' + basePrice.toFixed(2),
      totalRouteDistance: totalRouteDistance.toFixed(1) + ' miles',
      customerShare: (customerShare * 100).toFixed(1) + '%',
      totalDistanceCost: '£' + totalDistanceCost.toFixed(2),
      customerDistanceCost: '£' + customerDistanceCost.toFixed(2),
      itemsCost: '£' + itemsCost.toFixed(2),
      totalPrice: '£' + totalPrice.toFixed(2),
      numberOfStops: multiDropInfo.numberOfStops,
    });

    return totalPrice;
  }

  private async calculateDistance(pickup: any, dropoff: any): Promise<number> {
    // Use Haversine formula for accurate distance calculation
    if (!pickup.coordinates || !dropoff.coordinates) {
      console.warn('⚠️ Missing coordinates for distance calculation, using default 15 miles');
      return 15; // Fallback to default
    }

    const { lat: lat1, lng: lon1 } = pickup.coordinates;
    const { lat: lat2, lng: lon2 } = dropoff.coordinates;

    // Haversine formula
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in miles

    // Add 15% for actual road distance (straight line vs actual route)
    const roadDistance = distance * 1.15;

    console.log('📏 Distance calculated:', {
      straightLine: distance.toFixed(1),
      roadDistance: roadDistance.toFixed(1),
      from: pickup.postcode,
      to: dropoff.postcode,
    });

    return Math.round(roadDistance);
  }

  private async getCurrentDemand(postcode: string): Promise<number> {
    // Get current bookings in the area
    const recentBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 60 * 1000), // Last 2 hours
        },
        pickupAddress: {
          postcode: {
            startsWith: postcode.substring(0, 3),
          },
        },
      },
    });
    
    return recentBookings;
  }

  private async getAvailableSupply(postcode: string): Promise<number> {
    // Get available drivers in the area
    const availableDrivers = await prisma.driver.count({
      where: {
        status: 'active',
        basePostcode: {
          startsWith: postcode.substring(0, 3),
        },
      },
    });
    
    return Math.max(availableDrivers, 1);
  }

  private async getCompetitorPricing(request: DynamicPricingRequest): Promise<any> {
    // Mock competitor data - integrate with competitor monitoring
    return {
      averagePrice: 100,
      ourPosition: 'competitive',
      dataQuality: 'medium',
    };
  }

  private async getExternalFactors(date: Date): Promise<any> {
    // Mock external factors - integrate with relevant APIs
    return {
      events: [],
      traffic: 'normal',
      economicIndicators: 'stable',
    };
  }

  private async getCustomerAdjustments(request: DynamicPricingRequest): Promise<any> {
    if (!request.customerId) return {};
    
    // Get customer history and calculate adjustments
    const customerBookings = await prisma.booking.count({
      where: { customerId: request.customerId },
    });
    
    let volumeDiscount = 0;
    if (customerBookings > 50) volumeDiscount = 0.15;
    else if (customerBookings > 20) volumeDiscount = 0.1;
    else if (customerBookings > 10) volumeDiscount = 0.05;
    
    return { volumeDiscount };
  }
}

export const dynamicPricingEngine = DynamicPricingEngine.getInstance();
