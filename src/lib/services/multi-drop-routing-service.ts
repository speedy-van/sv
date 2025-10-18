/**
 * Multi-Drop Routing Service
 *
 * Handles multi-drop route optimization, capacity management, and future date scheduling
 * within the 7-day constraint for economy pricing.
 */

import { PricingInput, PricingResult } from '../pricing/schemas';
import { prisma } from '../../../apps/web/src/lib/prisma';

export interface RouteCapacity {
  vehicleType: string;
  maxVolume: number;
  maxWeight: number;
  maxStops: number;
  availableSlots: number;
}

export interface MultiDropRoute {
  id: string;
  date: string;
  vehicleType: string;
  capacity: RouteCapacity;
  stops: Array<{
    address: string;
    postcode: string;
    coordinates: { lat: number; lng: number };
    items: string[]; // Item IDs
    estimatedDuration: number;
  }>;
  totalVolume: number;
  totalWeight: number;
  estimatedDuration: number;
  routeOptimized: boolean;
}

export interface RouteAssignment {
  routeId: string;
  bookingId: string;
  stopIndex: number;
  estimatedArrival: string;
  assignedDriver?: string;
}

export interface FutureDateSuggestion {
  date: string;
  availableCapacity: number;
  estimatedPrice: number;
  routeType: 'economy' | 'standard' | 'priority';
}

export class MultiDropRoutingService {

  /**
   * Find existing multi-drop routes that can accommodate a new booking
   */
  static async findAvailableRoutes(
    input: PricingInput,
    maxFutureDays: number = 7
  ): Promise<MultiDropRoute[]> {
    const routes: MultiDropRoute[] = [];

    // Calculate total volume and weight for this booking
    const totalVolume = input.items.reduce((sum, item) => sum + ((item.volume || 0) * item.quantity), 0);
    const totalWeight = input.items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);

    // Check if booking fits in standard van (economy constraint)
    const VAN_FIT_VOLUME = 15; // m³
    const VAN_FIT_WEIGHT = 1000; // kg

    if (totalVolume > VAN_FIT_VOLUME || totalWeight > VAN_FIT_WEIGHT) {
      // Booking too large for economy multi-drop
      return routes;
    }

    // Look for existing routes within the next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + maxFutureDays);

    // Query existing routes from database (simplified for now)
    // In production, this would query actual route data
    const existingRoutes = await this.queryExistingRoutes(startDate, endDate, input.dropoffs[0].postcode);

    for (const route of existingRoutes) {
      // Check if this route can accommodate the new booking
      if (this.canAccommodateBooking(route, input, totalVolume, totalWeight)) {
        routes.push(route);
      }
    }

    return routes;
  }

  /**
   * Generate future date suggestions for economy pricing
   */
  static async generateFutureDateSuggestions(
    input: PricingInput,
    maxFutureDays: number = 7
  ): Promise<FutureDateSuggestion[]> {
    const suggestions: FutureDateSuggestion[] = [];

    // Calculate booking requirements
    const totalVolume = input.items.reduce((sum, item) => sum + ((item.volume || 0) * item.quantity), 0);
    const totalWeight = input.items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);

    // Only suggest economy dates for van-fit bookings
    const VAN_FIT_VOLUME = 15; // m³
    const VAN_FIT_WEIGHT = 1000; // kg

    if (totalVolume > VAN_FIT_VOLUME || totalWeight > VAN_FIT_WEIGHT) {
      return suggestions; // No economy suggestions for oversized bookings
    }

    for (let daysAhead = 1; daysAhead <= maxFutureDays; daysAhead++) {
      const suggestionDate = new Date();
      suggestionDate.setDate(suggestionDate.getDate() + daysAhead);

      // Skip weekends if needed (optional business logic)
      if (suggestionDate.getDay() === 0 || suggestionDate.getDay() === 6) {
        continue; // Skip weekends for now
      }

      // Check capacity for this date
      const availableCapacity = await this.getAvailableCapacityForDate(suggestionDate, input.dropoffs[0].postcode);

      if (availableCapacity > 0) {
        // Calculate estimated price (15% discount for economy)
        const basePrice = await this.calculateBasePriceForDate(input, suggestionDate);
        const economyPrice = basePrice * 0.85;

        suggestions.push({
          date: suggestionDate.toISOString(),
          availableCapacity,
          estimatedPrice: economyPrice,
          routeType: 'economy'
        });
      }

      // Only return first available date for economy
      if (suggestions.length > 0) {
        break;
      }
    }

    return suggestions;
  }

  /**
   * Assign booking to multi-drop route
   */
  static async assignToMultiDropRoute(
    bookingId: string,
    routeId: string,
    stopIndex: number
  ): Promise<RouteAssignment> {
    const assignment: RouteAssignment = {
      routeId,
      bookingId,
      stopIndex,
      estimatedArrival: new Date().toISOString() // Would be calculated based on route optimization
    };

    // In production, this would save to database
    // await prisma.routeAssignment.create({ data: assignment });

    return assignment;
  }

  /**
   * Create new multi-drop route for booking
   */
  static async createMultiDropRoute(
    input: PricingInput,
    scheduledDate: string
  ): Promise<MultiDropRoute> {
    const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const totalVolume = input.items.reduce((sum, item) => sum + ((item.volume || 0) * item.quantity), 0);
    const totalWeight = input.items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);

    const route: MultiDropRoute = {
      id: routeId,
      date: scheduledDate,
      vehicleType: 'luton-van', // Standard for multi-drop
      capacity: {
        vehicleType: 'luton-van',
        maxVolume: 15,
        maxWeight: 1000,
        maxStops: 5,
        availableSlots: 5 - 1 // Reserve one slot for this booking
      },
      stops: [{
        address: input.dropoffs[0].address,
        postcode: input.dropoffs[0].postcode,
        coordinates: {
          lat: input.dropoffs[0].coordinates!.lat,
          lng: input.dropoffs[0].coordinates!.lng
        },
        items: input.items.map(item => item.id),
        estimatedDuration: 30 // 30 minutes per stop
      }],
      totalVolume,
      totalWeight,
      estimatedDuration: 30, // Base duration
      routeOptimized: false
    };

    // In production, this would save to database
    // await prisma.multiDropRoute.create({ data: route });

    return route;
  }

  /**
   * Check if route can accommodate booking
   */
  private static canAccommodateBooking(
    route: MultiDropRoute,
    input: PricingInput,
    totalVolume: number,
    totalWeight: number
  ): boolean {
    // Check capacity constraints
    if (route.totalVolume + totalVolume > route.capacity.maxVolume) {
      return false;
    }

    if (route.totalWeight + totalWeight > route.capacity.maxWeight) {
      return false;
    }

    if (route.stops.length >= route.capacity.maxStops) {
      return false;
    }

    // TODO: Check geographical feasibility using UnifiedPricingFacade
    // Distance calculations are disabled per unified pricing system requirements
    // Use UnifiedPricingFacade.getQuote() to determine route feasibility
    //
    // Example integration:
    // const pricingDetails = await UnifiedPricingFacade.getQuote({
    //   origin: lastStop.coordinates,
    //   destination: newStop.coordinates
    // });
    // if (pricingDetails.distance > 50) { return false; }

    return true;
  }

  /**
   * Query existing routes from database
   */
  private static async queryExistingRoutes(
    startDate: Date,
    endDate: Date,
    postcodeArea: string
  ): Promise<MultiDropRoute[]> {
    // In production, this would query the actual database
    // For now, return empty array (no existing routes)
    return [];
  }

  /**
   * Get available capacity for a specific date and area
   */
  private static async getAvailableCapacityForDate(
    date: Date,
    postcodeArea: string
  ): Promise<number> {
    // In production, this would query actual capacity data
    // For now, return simulated availability
    const dayOfWeek = date.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    // Weekdays have more capacity
    return isWeekday ? 3 : 1;
  }

  /**
   * Calculate base price for a specific date
   */
  private static async calculateBasePriceForDate(
    input: PricingInput,
    date: Date
  ): Promise<number> {
    // This would use the unified pricing engine
    // For now, return a base price
    return 150.00; // £150 base price
  }

  // REMOVED: Distance calculation methods
  // All distance calculations must use UnifiedPricingFacade per unified pricing system requirements

  /**
   * Get next available economy date within 7 days
   */
  static async getNextAvailableEconomyDate(
    input: PricingInput
  ): Promise<string | null> {
    const suggestions = await this.generateFutureDateSuggestions(input, 7);
    return suggestions.length > 0 ? suggestions[0].date : null;
  }

  /**
   * Check if economy pricing is available for a booking
   */
  static async isEconomyAvailable(
    input: PricingInput,
    scheduledDate?: string
  ): Promise<boolean> {
    if (!scheduledDate) {
      return false;
    }

    const bookingDate = new Date(scheduledDate);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);

    if (bookingDate > maxDate) {
      return false;
    }

    // Check if booking fits in van
    const totalVolume = input.items.reduce((sum, item) => sum + ((item.volume || 0) * item.quantity), 0);
    const totalWeight = input.items.reduce((sum, item) => sum + ((item.weight || 0) * item.quantity), 0);

    const VAN_FIT_VOLUME = 15;
    const VAN_FIT_WEIGHT = 1000;

    if (totalVolume > VAN_FIT_VOLUME || totalWeight > VAN_FIT_WEIGHT) {
      return false;
    }

    // Check if there are available routes or capacity
    const routes = await this.findAvailableRoutes(input, 7);
    const suggestions = await this.generateFutureDateSuggestions(input, 7);

    return routes.length > 0 || suggestions.length > 0;
  }

  /**
   * Calculate economy discount for multi-drop routing
   */
  static calculateEconomyDiscount(basePrice: number): number {
    return basePrice * 0.85; // 15% discount
  }

  /**
   * Calculate priority premium for dedicated service
   */
  static calculatePriorityPremium(basePrice: number): number {
    return basePrice * 1.5; // 50% premium
  }
}

// Export singleton instance
export const multiDropRoutingService = MultiDropRoutingService;
