/**
 * Dynamic Multi-Drop Eligibility Engine
 * 
 * This engine determines in real-time whether a booking should be offered
 * the multi-drop option based on:
 * 1. Current booking characteristics (load, distance, time)
 * 2. Available bookings on similar routes
 * 3. Driver availability and capacity
 * 4. Time windows and scheduling constraints
 * 
 * This is used in Booking Luxury Step 2 to show/hide the multi-drop option dynamically.
 */

import { intelligentRouteOptimizer, type BookingRequest, type MultiDropEligibility } from './intelligent-route-optimizer';

export interface AvailableBooking {
  id: string;
  pickup: { lat: number; lng: number; city: string };
  dropoff: { lat: number; lng: number; city: string };
  scheduledDate: Date;
  loadPercentage: number; // 0-1
  estimatedDuration: number; // minutes
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS';
}

export interface RouteMatch {
  matchScore: number; // 0-100
  potentialSavings: number; // £
  estimatedDeliveryTime: string; // HH:MM
  numberOfStops: number;
  totalDistance: number; // miles
  sharePercentage: number; // 0-1 (customer's share of total route cost)
}

export interface MultiDropDecision {
  // Should we show multi-drop option?
  showMultiDropOption: boolean;
  
  // Why or why not?
  reason: string;
  
  // Eligibility analysis
  eligibility: MultiDropEligibility;
  
  // If eligible, best route match
  bestMatch?: RouteMatch;
  
  // Pricing comparison
  pricing: {
    singleOrderPrice: number;
    multiDropPrice?: number;
    savings?: number;
    savingsPercentage?: number;
  };
  
  // Recommendations for user
  recommendation: {
    type: 'SINGLE_ORDER' | 'MULTI_DROP' | 'RETURN_JOURNEY';
    title: string;
    description: string;
    badge?: 'BEST_VALUE' | 'FASTEST' | 'ECO_FRIENDLY';
  };
}

export class MultiDropEligibilityEngine {
  private static instance: MultiDropEligibilityEngine;
  
  // Matching thresholds
  private readonly MIN_MATCH_SCORE = 60; // Minimum score to suggest multi-drop
  private readonly MAX_DEVIATION_MILES = 30; // Maximum deviation from direct route
  private readonly MAX_TIME_DIFFERENCE_HOURS = 4; // Maximum time difference between bookings
  
  static getInstance(): MultiDropEligibilityEngine {
    if (!MultiDropEligibilityEngine.instance) {
      MultiDropEligibilityEngine.instance = new MultiDropEligibilityEngine();
    }
    return MultiDropEligibilityEngine.instance;
  }
  
  /**
   * Main method: Should we show multi-drop option for this booking?
   * This is called in Booking Luxury Step 2
   */
  async shouldShowMultiDropOption(booking: BookingRequest): Promise<MultiDropDecision> {
    // Step 1: Check basic eligibility (load, distance, time)
    const eligibility = await intelligentRouteOptimizer.analyzeMultiDropEligibility(booking);
    
    // Step 2: If not eligible, return early with single order recommendation
    if (!eligibility.eligible) {
      return this.createSingleOrderDecision(booking, eligibility);
    }
    
    // Step 3: Search for available bookings on similar routes
    const availableBookings = await this.findAvailableBookings(booking);
    
    // Step 4: If no available bookings, check if we should still show option
    if (availableBookings.length === 0) {
      return this.createNoMatchDecision(booking, eligibility);
    }
    
    // Step 5: Find best route match
    const bestMatch = await this.findBestRouteMatch(booking, availableBookings);
    
    // Step 6: If no good match, return single order
    if (!bestMatch || bestMatch.matchScore < this.MIN_MATCH_SCORE) {
      return this.createNoMatchDecision(booking, eligibility);
    }
    
    // Step 7: Calculate pricing
    const pricing = await this.calculatePricing(booking, bestMatch);
    
    // Step 8: Create multi-drop decision
    return this.createMultiDropDecision(booking, eligibility, bestMatch, pricing);
  }
  
  /**
   * Find available bookings on similar routes
   */
  private async findAvailableBookings(booking: BookingRequest): Promise<AvailableBooking[]> {
    // TODO: Query database for available bookings
    // For now, return empty array (will be implemented with database integration)
    
    // This would query:
    // SELECT * FROM bookings
    // WHERE status IN ('PENDING', 'CONFIRMED')
    // AND scheduled_date BETWEEN (booking.scheduledDate - 4 hours) AND (booking.scheduledDate + 4 hours)
    // AND (
    //   ST_Distance(pickup_location, booking.pickup) < 30 miles
    //   OR ST_Distance(dropoff_location, booking.dropoff) < 30 miles
    // )
    
    return [];
  }
  
  /**
   * Find best route match from available bookings
   */
  private async findBestRouteMatch(
    booking: BookingRequest,
    availableBookings: AvailableBooking[]
  ): Promise<RouteMatch | null> {
    let bestMatch: RouteMatch | null = null;
    let highestScore = 0;
    
    for (const available of availableBookings) {
      const match = await this.calculateRouteMatch(booking, available);
      
      if (match.matchScore > highestScore) {
        highestScore = match.matchScore;
        bestMatch = match;
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Calculate route match score
   */
  private async calculateRouteMatch(
    booking: BookingRequest,
    available: AvailableBooking
  ): Promise<RouteMatch> {
    // Calculate distances
    const directDistance = this.calculateDistance(booking.pickup.coordinates, booking.dropoff.coordinates);
    
    // Calculate combined route distance
    const combinedDistance = 
      this.calculateDistance(booking.pickup.coordinates, available.pickup) +
      this.calculateDistance(available.pickup, available.dropoff) +
      this.calculateDistance(available.dropoff, booking.dropoff.coordinates);
    
    // Calculate deviation
    const deviation = combinedDistance - directDistance;
    const deviationPercentage = deviation / directDistance;
    
    // Calculate match score (0-100)
    let score = 100;
    
    // Deduct for deviation
    score -= Math.min(deviationPercentage * 100, 50);
    
    // Deduct for time difference
    const timeDiff = Math.abs(booking.scheduledDate.getTime() - available.scheduledDate.getTime()) / (1000 * 60 * 60);
    score -= Math.min(timeDiff * 5, 20);
    
    // Deduct for combined load
    const combinedLoad = available.loadPercentage + 0.3; // Assume booking is 30% load
    if (combinedLoad > 0.9) {
      score -= 20;
    }
    
    // Calculate potential savings (30% discount on shared route)
    const singleOrderPrice = 150; // Placeholder
    const potentialSavings = singleOrderPrice * 0.30;
    
    // Calculate share percentage
    const sharePercentage = directDistance / combinedDistance;
    
    return {
      matchScore: Math.max(0, score),
      potentialSavings,
      estimatedDeliveryTime: '14:30', // Placeholder
      numberOfStops: 2,
      totalDistance: combinedDistance,
      sharePercentage,
    };
  }
  
  /**
   * Calculate pricing for single order vs multi-drop
   */
  private async calculatePricing(booking: BookingRequest, match: RouteMatch): Promise<MultiDropDecision['pricing']> {
    // Import dynamic pricing engine
    const { dynamicPricingEngine } = await import('./dynamic-pricing-engine');
    
    // Calculate single order price
    const singleOrderResult = await dynamicPricingEngine.calculateDynamicPrice({
      pickupAddress: booking.pickup,
      dropoffAddress: booking.dropoff,
      items: booking.items,
      scheduledDate: booking.scheduledDate,
      serviceType: booking.serviceType,
      customerSegment: 'INDIVIDUAL' as const,
      loyaltyTier: 'BRONZE' as const,
      isMultiDrop: false,
    });

    const singleOrderPrice = singleOrderResult.finalPrice;
    
    // Calculate multi-drop price (customer pays their share of total route)
    const multiDropPrice = singleOrderPrice * match.sharePercentage;
    
    // Calculate savings
    const savings = singleOrderPrice - multiDropPrice;
    const savingsPercentage = (savings / singleOrderPrice) * 100;
    
    return {
      singleOrderPrice,
      multiDropPrice,
      savings,
      savingsPercentage,
    };
  }
  
  /**
   * Create decision: Single order (not eligible)
   */
  private createSingleOrderDecision(booking: BookingRequest, eligibility: MultiDropEligibility): MultiDropDecision {
    return {
      showMultiDropOption: false,
      reason: eligibility.reason || 'Not eligible for multi-drop',
      eligibility,
      pricing: {
        singleOrderPrice: eligibility.alternativeOptions[0]?.estimatedPrice || 0,
      },
      recommendation: {
        type: 'SINGLE_ORDER',
        title: 'Dedicated Van Service',
        description: 'Your booking requires exclusive use of the van. You\'ll have the driver\'s full attention and fastest delivery time.',
        badge: 'FASTEST',
      },
    };
  }
  
  /**
   * Create decision: No match found (eligible but no available bookings)
   */
  private createNoMatchDecision(booking: BookingRequest, eligibility: MultiDropEligibility): MultiDropDecision {
    // Check if return journey is available
    const hasReturnJourney = eligibility.alternativeOptions.some(opt => opt.type === 'RETURN_JOURNEY');
    
    if (hasReturnJourney) {
      const returnJourneyOption = eligibility.alternativeOptions.find(opt => opt.type === 'RETURN_JOURNEY')!;
      
      return {
        showMultiDropOption: false,
        reason: 'No matching bookings available, but return journey option available',
        eligibility,
        pricing: {
          singleOrderPrice: eligibility.alternativeOptions[0]?.estimatedPrice || 0,
        },
        recommendation: {
          type: 'RETURN_JOURNEY',
          title: 'Return Journey - Save up to 60%',
          description: `Share the van with a return journey customer and save £${(eligibility.alternativeOptions[0].estimatedPrice * 0.5).toFixed(0)}!`,
          badge: 'BEST_VALUE',
        },
      };
    }
    
    return {
      showMultiDropOption: false,
      reason: 'Eligible for multi-drop but no matching bookings available at this time',
      eligibility,
      pricing: {
        singleOrderPrice: eligibility.alternativeOptions[0]?.estimatedPrice || 0,
      },
      recommendation: {
        type: 'SINGLE_ORDER',
        title: 'Dedicated Van Service',
        description: 'No shared routes available. Book now for guaranteed delivery time.',
        badge: 'FASTEST',
      },
    };
  }
  
  /**
   * Create decision: Multi-drop available
   */
  private createMultiDropDecision(
    booking: BookingRequest,
    eligibility: MultiDropEligibility,
    match: RouteMatch,
    pricing: MultiDropDecision['pricing']
  ): MultiDropDecision {
    return {
      showMultiDropOption: true,
      reason: `Great match found! Save ${pricing.savingsPercentage?.toFixed(0)}% by sharing the route.`,
      eligibility,
      bestMatch: match,
      pricing,
      recommendation: {
        type: 'MULTI_DROP',
        title: `Multi-Drop Route - Save £${pricing.savings?.toFixed(0)}`,
        description: `Share the van with ${match.numberOfStops - 1} other customer${match.numberOfStops > 2 ? 's' : ''}. Eco-friendly and cost-effective!`,
        badge: 'BEST_VALUE',
      },
    };
  }
  
  /**
   * Calculate distance using Haversine formula
   */
  private calculateDistance(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
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
}

export const multiDropEligibilityEngine = MultiDropEligibilityEngine.getInstance();

