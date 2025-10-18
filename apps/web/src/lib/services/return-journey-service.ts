/**
 * Return Journey Service
 * 
 * Handles pricing and matching for return journeys on long-distance moves.
 * When a driver completes a long-distance delivery (e.g., Glasgow → London),
 * they need to return home. This service finds customers who need delivery
 * in the opposite direction and offers them discounted pricing.
 * 
 * Benefits:
 * - Driver: Earns money on return journey instead of driving empty
 * - Customer: Gets 40-60% discount on long-distance move
 * - Platform: Maximizes van utilization and reduces carbon footprint
 */

export interface ReturnJourneyRequest {
  // Original journey details
  originalPickup: {
    address: string;
    postcode: string;
    coordinates: { lat: number; lng: number };
    city: string;
  };
  originalDropoff: {
    address: string;
    postcode: string;
    coordinates: { lat: number; lng: number };
    city: string;
  };
  originalDeliveryDate: Date;
  estimatedReturnDate: Date; // Usually next day
  
  // Return journey customer details
  returnCustomerPickup: {
    address: string;
    postcode: string;
    coordinates: { lat: number; lng: number };
  };
  returnCustomerDropoff: {
    address: string;
    postcode: string;
    coordinates: { lat: number; lng: number };
  };
  
  items: Array<{
    category: string;
    quantity: number;
    weight?: number;
    volume?: number;
    fragile?: boolean;
  }>;
  
  serviceType: 'ECONOMY' | 'STANDARD' | 'PREMIUM';
}

export interface ReturnJourneyPricing {
  eligible: boolean;
  reason?: string;
  
  // Pricing breakdown
  standardPrice: number; // What customer would pay for single order
  returnJourneyPrice: number; // Discounted price for return journey
  discount: number; // Amount saved
  discountPercentage: number; // Percentage saved
  
  // Journey details
  deviationDistance: number; // Extra miles driver needs to travel
  deviationAcceptable: boolean; // Is deviation < 20% of total?
  
  // Driver earnings
  driverEarnings: number; // What driver earns from return journey
  
  // Matching score
  matchScore: number; // 0-100, how good is this match?
}

export class ReturnJourneyService {
  private static instance: ReturnJourneyService;

  static getInstance(): ReturnJourneyService {
    if (!ReturnJourneyService.instance) {
      ReturnJourneyService.instance = new ReturnJourneyService();
    }
    return ReturnJourneyService.instance;
  }

  /**
   * Calculate pricing for a return journey booking
   */
  async calculateReturnJourneyPricing(request: ReturnJourneyRequest): Promise<ReturnJourneyPricing> {
    // Step 1: Validate eligibility
    const eligibility = this.validateReturnJourneyEligibility(request);
    if (!eligibility.eligible) {
      return {
        eligible: false,
        reason: eligibility.reason,
        standardPrice: 0,
        returnJourneyPrice: 0,
        discount: 0,
        discountPercentage: 0,
        deviationDistance: 0,
        deviationAcceptable: false,
        driverEarnings: 0,
        matchScore: 0,
      };
    }

    // Step 2: Calculate standard price (what customer would normally pay)
    const standardPrice = await this.calculateStandardPrice(request);

    // Step 3: Calculate deviation distance
    const deviationDistance = this.calculateDeviationDistance(request);
    const returnDistanceCalc = this.calculateDistance( // DEPRECATED - internal use only
      request.originalDropoff.coordinates,
      request.originalPickup.coordinates
    );
    const deviationPercentage = deviationDistance / returnDistanceCalc;
    const deviationAcceptable = deviationPercentage < 0.20; // < 20% deviation

    // Step 4: Calculate return journey discount
    // Base discount: 50%
    // Additional discount if deviation is minimal: up to 10%
    let discountPercentage = 0.50; // 50% base discount
    if (deviationPercentage < 0.05) {
      discountPercentage = 0.60; // 60% discount for perfect match
    } else if (deviationPercentage < 0.10) {
      discountPercentage = 0.55; // 55% discount for good match
    }

    const discount = standardPrice * discountPercentage;
    const returnJourneyPrice = standardPrice - discount;

    // Step 5: Calculate driver earnings using proper formula
    // Use the same calculation as regular bookings (Base + Mileage + Time)
    const estimatedDuration = Math.round((returnDistanceCalc / 30) * 60); // 30 mph average
    
    // Calculate driver earnings properly
    const baseFare = 2500; // £25
    const mileageFee = Math.round(returnDistanceCalc * 55); // £0.55/mile
    const timeFee = Math.round(estimatedDuration * 15); // £0.15/min
    const driverEarnings = (baseFare + mileageFee + timeFee) / 100; // Convert to pounds

    // Step 6: Calculate match score (0-100)
    const matchScore = this.calculateMatchScore(request, deviationPercentage);

    return {
      eligible: true,
      standardPrice,
      returnJourneyPrice,
      discount,
      discountPercentage: discountPercentage * 100,
      deviationDistance,
      deviationAcceptable,
      driverEarnings,
      matchScore,
    };
  }

  /**
   * Validate if booking is eligible for return journey pricing
   */
  private validateReturnJourneyEligibility(request: ReturnJourneyRequest): { eligible: boolean; reason?: string } {
    // Rule 1: Original journey must be long distance (> 150 miles)
    const originalDistance = this.calculateDistance( // DEPRECATED - internal use only
      request.originalPickup.coordinates,
      request.originalDropoff.coordinates
    );
    if (originalDistance < 150) {
      return {
        eligible: false,
        reason: `Original journey too short (${originalDistance.toFixed(0)} miles). Return journey pricing only available for trips > 150 miles.`,
      };
    }

    // Rule 2: Return customer pickup must be near original dropoff (within 30 miles)
    const pickupDeviation = this.calculateDistance( // DEPRECATED - internal use only
      request.originalDropoff.coordinates,
      request.returnCustomerPickup.coordinates
    );
    if (pickupDeviation > 30) {
      return {
        eligible: false,
        reason: `Return pickup too far from original destination (${pickupDeviation.toFixed(0)} miles away). Must be within 30 miles.`,
      };
    }

    // Rule 3: Return customer dropoff must be near original pickup (within 30 miles)
    const dropoffDeviation = this.calculateDistance( // DEPRECATED - internal use only
      request.originalPickup.coordinates,
      request.returnCustomerDropoff.coordinates
    );
    if (dropoffDeviation > 30) {
      return {
        eligible: false,
        reason: `Return dropoff too far from original origin (${dropoffDeviation.toFixed(0)} miles away). Must be within 30 miles.`,
      };
    }

    // Rule 4: Load must fit in van (< 100% capacity)
    const loadPercentage = this.estimateLoadPercentage(request.items);
    if (loadPercentage > 1.0) {
      return {
        eligible: false,
        reason: `Load too large (${(loadPercentage * 100).toFixed(0)}% of van capacity). Exceeds van capacity.`,
      };
    }

    // Rule 5: Return date must be within 2 days of original delivery
    const daysDifference = Math.abs(
      (request.estimatedReturnDate.getTime() - request.originalDeliveryDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDifference > 2) {
      return {
        eligible: false,
        reason: `Return journey too far in future (${daysDifference.toFixed(0)} days). Must be within 2 days of original delivery.`,
      };
    }

    return { eligible: true };
  }

  /**
   * Calculate standard price (what customer would pay for single order)
   */
  private async calculateStandardPrice(request: ReturnJourneyRequest): Promise<number> {
    const distance = this.calculateDistance( // DEPRECATED - internal use only
      request.returnCustomerPickup.coordinates,
      request.returnCustomerDropoff.coordinates
    );

    // Service type base rates
    const serviceRates = {
      ECONOMY: 35,
      STANDARD: 45,
      PREMIUM: 65,
    };

    let basePrice = serviceRates[request.serviceType];

    // Tiered distance pricing
    let distanceCost = 0;
    const freeDistance = 5;
    const remainingDistance = Math.max(0, distance - freeDistance);

    if (remainingDistance <= 0) {
      distanceCost = 0;
    } else if (distance <= 50) {
      distanceCost = remainingDistance * 2.5;
    } else if (distance <= 150) {
      distanceCost = 45 * 2.5 + (distance - 50) * 2.0;
    } else if (distance <= 300) {
      distanceCost = 45 * 2.5 + 100 * 2.0 + (distance - 150) * 1.5;
    } else {
      distanceCost = 45 * 2.5 + 100 * 2.0 + 150 * 1.5 + (distance - 300) * 1.2;
    }

    basePrice += distanceCost;

    // Items cost
    const itemsCost = request.items.reduce((total, item) => {
      let itemCost = item.quantity * 5;
      if (item.fragile) itemCost *= 1.5;
      if (item.weight && item.weight > 25) itemCost += 10;
      return total + itemCost;
    }, 0);

    return basePrice + itemsCost;
  }

  /**
   * Calculate deviation distance (extra miles driver needs to travel)
   */
  private calculateDeviationDistance(request: ReturnJourneyRequest): number {
    // Direct return distance (original dropoff → original pickup)
    const directReturnDistance = this.calculateDistance( // DEPRECATED - internal use only
      request.originalDropoff.coordinates,
      request.originalPickup.coordinates
    );

    // Actual return distance with customer pickup/dropoff
    const actualReturnDistance =
      this.calculateDistance(request.originalDropoff.coordinates, request.returnCustomerPickup.coordinates) + // DEPRECATED - internal use only
      this.calculateDistance(request.returnCustomerPickup.coordinates, request.returnCustomerDropoff.coordinates) + // DEPRECATED - internal use only
      this.calculateDistance(request.returnCustomerDropoff.coordinates, request.originalPickup.coordinates); // DEPRECATED - internal use only

    return actualReturnDistance - directReturnDistance;
  }

  /**
   * Calculate match score (0-100)
   */
  private calculateMatchScore(request: ReturnJourneyRequest, deviationPercentage: number): number {
    let score = 100;

    // Deduct points for deviation
    score -= deviationPercentage * 100; // 0-20 points deducted

    // Deduct points for pickup/dropoff distance from ideal
    const pickupDeviation = this.calculateDistance( // DEPRECATED - internal use only
      request.originalDropoff.coordinates,
      request.returnCustomerPickup.coordinates
    );
    score -= Math.min(pickupDeviation, 30); // 0-30 points deducted

    const dropoffDeviation = this.calculateDistance( // DEPRECATED - internal use only
      request.originalPickup.coordinates,
      request.returnCustomerDropoff.coordinates
    );
    score -= Math.min(dropoffDeviation, 30); // 0-30 points deducted

    // Bonus points for same-day return
    const daysDifference = Math.abs(
      (request.estimatedReturnDate.getTime() - request.originalDeliveryDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDifference < 1) {
      score += 10; // Bonus for same-day
    }

    return Math.max(0, Math.min(100, score));
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
   * Estimate load percentage
   */
  private estimateLoadPercentage(items: Array<{ category: string; quantity: number; weight?: number; volume?: number }>): number {
    const VAN_CAPACITY_M3 = 15;
    const VAN_CAPACITY_KG = 1000;

    let totalVolume = 0;
    let totalWeight = 0;

    items.forEach((item) => {
      const itemVolume = item.volume || this.estimateItemVolume(item.category, item.quantity);
      totalVolume += itemVolume;

      const itemWeight = item.weight || this.estimateItemWeight(item.category, item.quantity);
      totalWeight += itemWeight;
    });

    const volumePercentage = Math.min(totalVolume / VAN_CAPACITY_M3, 1.0);
    const weightPercentage = Math.min(totalWeight / VAN_CAPACITY_KG, 1.0);

    return Math.max(volumePercentage, weightPercentage);
  }

  private estimateItemVolume(category: string, quantity: number): number {
    const volumeEstimates: Record<string, number> = {
      furniture: 1.5,
      boxes: 0.1,
      appliances: 1.0,
      general: 0.5,
    };

    return (volumeEstimates[category] || volumeEstimates['general']) * quantity;
  }

  private estimateItemWeight(category: string, quantity: number): number {
    const weightEstimates: Record<string, number> = {
      furniture: 50,
      boxes: 10,
      appliances: 40,
      general: 20,
    };

    return (weightEstimates[category] || weightEstimates['general']) * quantity;
  }
}

export const returnJourneyService = ReturnJourneyService.getInstance();

