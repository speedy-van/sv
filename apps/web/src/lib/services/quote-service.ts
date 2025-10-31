/**
 * Quote Service
 * 
 * Handles quote generation using the Dynamic Pricing Engine
 */

import { PrismaClient } from '@prisma/client';
import { dynamicPricingEngine } from './dynamic-pricing-engine';

// Placeholder interfaces
interface PricingVariables {
  distance: number;
  weight: number;
  volume: number;
  urgency: 'standard' | 'express' | 'premium';
  timeOfDay: 'peak' | 'standard' | 'offPeak';
  fragility?: 'low' | 'medium' | 'high';
  laneUtilization?: number;
  networkCapacity?: number;
  timeOfWeek?: string;
  seasonalFactor?: number;
  fuelCostPence?: number;
  weatherConditions?: string;
  trafficConditions?: string;
  localEvents?: boolean;
  customerSegment?: string;
  serviceTier?: string;
  loyaltyDiscount?: number;
  volumeDiscount?: number;
  pickupPostcode?: string;
  deliveryPostcode?: string;
  isUrbanPickup?: boolean;
  isUrbanDelivery?: boolean;
  congestionZone?: boolean;
}

// Pricing result shape handled by dynamicPricingEngine

const prisma = new PrismaClient();

export interface QuoteRequest {
  customerId: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupPostcode: string;
  deliveryPostcode: string;
  weight?: number; // kg
  volume?: number; // m3
  fragility?: 'low' | 'medium' | 'high';
  specialHandling?: boolean;
  requestedPickupTime?: Date;
}

export interface QuoteResponse {
  quoteId: string;
  prices: {
    economy: number;
    standard: number;
    premium: number;
  };
  validUntil: Date;
  breakdown: any; // Pricing breakdown for transparency
  estimatedDistance: number;
  estimatedDuration: number;
}

export class QuoteService {
  /**
   * Generate a new quote with dynamic pricing
   */
  public static async createQuote(request: QuoteRequest): Promise<QuoteResponse> {
    try {
      // 1. Get customer profile for segment-based pricing
      const customer = await prisma.user.findUnique({
        where: { id: request.customerId },
        include: { customerProfile: true }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // 2. Calculate distance and duration (would use real mapping service in production)
      const { distance, duration } = await this.calculateDistanceAndDuration( // DEPRECATED - internal use only
        request.pickupPostcode,
        request.deliveryPostcode
      );

      // 3. Get current market variables (using defaults for now)
      const marketVariables = {
        laneUtilization: 0.6,
        networkCapacity: 0.7,
        timeOfWeek: 'standard' as const,
        seasonalFactor: 1.0,
        fuelCostPence: 145,
        weatherConditions: 'good' as const,
        trafficConditions: 'moderate' as const,
        localEvents: false
      };

      // 4. Build pricing variables
      const pricingVariables: PricingVariables = {
        // Core job factors
        weight: request.weight || 10, // Default 10kg
        volume: request.volume || 0.1, // Default 0.1m3
        distance,
        urgency: 'standard', // Default urgency
        timeOfDay: 'standard', // Default time of day
        fragility: request.fragility || 'low',

        // Operational factors (from market data)
        laneUtilization: marketVariables.laneUtilization || 0.6,
        networkCapacity: marketVariables.networkCapacity || 0.7,
        timeOfWeek: marketVariables.timeOfWeek || 'standard',
        seasonalFactor: marketVariables.seasonalFactor || 1.0,

        // External factors
        fuelCostPence: marketVariables.fuelCostPence || 145,
        weatherConditions: marketVariables.weatherConditions || 'good',
        trafficConditions: marketVariables.trafficConditions || 'moderate',
        localEvents: marketVariables.localEvents || false,

        // Customer factors
        customerSegment: customer.customerProfile?.segment || 'bronze',
        serviceTier: 'standard', // Will be applied per tier
        loyaltyDiscount: this.calculateLoyaltyDiscount(customer.customerProfile),
        volumeDiscount: this.calculateVolumeDiscount(customer.customerProfile),

        // Geographic factors
        pickupPostcode: request.pickupPostcode,
        deliveryPostcode: request.deliveryPostcode,
        isUrbanPickup: this.isUrbanPostcode(request.pickupPostcode),
        isUrbanDelivery: this.isUrbanPostcode(request.deliveryPostcode),
        congestionZone: this.isCongestionZone(request.pickupPostcode, request.deliveryPostcode)
      };

      // 5. Calculate pricing
      const pricingResult = await dynamicPricingEngine.calculatePrice(pricingVariables);

      // 6. Store quote in database
      const quote = await prisma.quote.create({
        data: {
          customerId: request.customerId,
          pickupAddress: request.pickupAddress,
          deliveryAddress: request.deliveryAddress,
          weight: request.weight,
          volume: request.volume,
          distance,
          economyPrice: pricingResult.prices.economy,
          standardPrice: pricingResult.prices.standard,
          premiumPrice: pricingResult.prices.premium,
          validUntil: pricingResult.validUntil,
          variables: pricingVariables as any // Store for audit/analysis
        }
      });

      return {
        quoteId: quote.id,
        prices: pricingResult.prices,
        validUntil: pricingResult.validUntil,
        breakdown: pricingResult.breakdown,
        estimatedDistance: distance,
        estimatedDuration: duration
      };

    } catch (error) {
      console.error('Error creating quote:', error);
      throw new Error('Failed to generate quote');
    }
  }

  /**
   * Retrieve an existing quote
   */
  public static async getQuote(quoteId: string): Promise<QuoteResponse | null> {
    try {
      const quote = await prisma.quote.findUnique({
        where: { id: quoteId }
      });

      if (!quote) return null;

      // Check if quote is still valid
      if (new Date() > quote.validUntil) {
        return null; // Quote expired
      }

      return {
        quoteId: quote.id,
        prices: {
          economy: quote.economyPrice.toNumber(),
          standard: quote.standardPrice.toNumber(),
          premium: quote.premiumPrice.toNumber()
        },
        validUntil: quote.validUntil,
        breakdown: quote.variables,
        estimatedDistance: quote.distance || 0,
        estimatedDuration: 0 // Would calculate from stored data
      };

    } catch (error) {
      console.error('Error retrieving quote:', error);
      return null;
    }
  }

  /**
   * Calculate distance and duration between postcodes
   * In production, this would use Google Maps API or similar
   */
  private static async calculateDistanceAndDuration( // DEPRECATED - internal use only
    _pickupPostcode: string,
    _deliveryPostcode: string
  ): Promise<{ distance: number; duration: number }> {
    void _pickupPostcode; void _deliveryPostcode;
    // Mock calculation - in production use real mapping API
    const mockDistance = Math.random() * 50 + 5; // 5-55 km
    const mockDuration = mockDistance * 2 + 20; // Rough estimate in minutes

    return {
      distance: Math.round(mockDistance * 100) / 100,
      duration: Math.round(mockDuration)
    };
  }

  /**
   * Calculate loyalty discount based on customer history
   */
  private static calculateLoyaltyDiscount(customerProfile: any): number {
    if (!customerProfile) return 0;

    const totalSpent = customerProfile.totalSpent?.toNumber() || 0;
    
    if (totalSpent > 5000) return 0.1; // 10% for high-value customers
    if (totalSpent > 2000) return 0.05; // 5% for medium-value customers
    if (totalSpent > 500) return 0.02; // 2% for loyal customers
    
    return 0;
  }

  /**
   * Calculate volume discount for frequent customers
   */
  private static calculateVolumeDiscount(customerProfile: any): number {
    if (!customerProfile) return 0;

    const avgOrderValue = customerProfile.avgOrderValue?.toNumber() || 0;
    
    if (avgOrderValue > 200) return 0.05; // 5% for large orders
    if (avgOrderValue > 100) return 0.025; // 2.5% for medium orders
    
    return 0;
  }

  /**
   * Check if postcode is in urban area
   */
  private static isUrbanPostcode(postcode: string): boolean {
    // Major UK urban areas (simplified check)
    const urbanPrefixes = ['M', 'B', 'L', 'S', 'G', 'E', 'W', 'N', 'SE', 'SW', 'NW'];
    const prefix = postcode.substring(0, 2).toUpperCase();
    return urbanPrefixes.some(urban => prefix.startsWith(urban));
  }

  /**
   * Check if route passes through congestion charging zone
   */
  private static isCongestionZone(pickupPostcode: string, deliveryPostcode: string): boolean {
    // London congestion zone postcodes (simplified)
    const congestionZones = ['EC', 'WC', 'E1', 'SE1', 'SW1'];
    
    const pickupPrefix = pickupPostcode.substring(0, 2).toUpperCase();
    const deliveryPrefix = deliveryPostcode.substring(0, 2).toUpperCase();
    
    return congestionZones.includes(pickupPrefix) || congestionZones.includes(deliveryPrefix);
  }

  /**
   * Refresh an expired quote with current pricing
   */
  public static async refreshQuote(quoteId: string): Promise<QuoteResponse | null> {
    try {
      const existingQuote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { customer: { include: { customerProfile: true } } }
      });

      if (!existingQuote) return null;

      // Create new quote with same parameters
      const newQuoteRequest: QuoteRequest = {
        customerId: existingQuote.customerId,
        pickupAddress: existingQuote.pickupAddress,
        deliveryAddress: existingQuote.deliveryAddress,
        pickupPostcode: this.extractPostcode(existingQuote.pickupAddress),
        deliveryPostcode: this.extractPostcode(existingQuote.deliveryAddress),
        weight: existingQuote.weight || undefined,
        volume: existingQuote.volume || undefined
      };

      return await this.createQuote(newQuoteRequest);

    } catch (error) {
      console.error('Error refreshing quote:', error);
      return null;
    }
  }

  /**
   * Extract postcode from address (simple implementation)
   */
  private static extractPostcode(address: string): string {
    // Simple regex to extract UK postcode
    const postcodeRegex = /[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}/i;
    const match = address.match(postcodeRegex);
    return match ? match[0] : 'SW1A 1AA'; // Default London postcode
  }
}