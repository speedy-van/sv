/**
 * B2B Pricing Service
 * 
 * Handles company-specific pricing including:
 * - Custom pricing rules per company
 * - Volume discounts
 * - Distance-based pricing
 * - Time-based surcharges
 */

import { prisma } from '@/lib/prisma';
import { PricingRuleType, Prisma } from '@prisma/client';
import { companyAuditService } from './audit.service';

// Types
export interface PricingInput {
  companyId: string;
  pickupPostcode: string;
  dropoffPostcode: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  items?: any[];
  serviceType?: string;
  vehicleType?: string;
  crewSize?: number;
  scheduledDate?: Date;
}

export interface PricingResult {
  distanceMiles: number;
  estimatedDurationMins: number;
  subtotalGBP: number;
  vatGBP: number;
  totalGBP: number;
  discountGBP?: number;
  discountReason?: string;
  appliedRuleId?: string;
  breakdown: PricingBreakdown;
}

export interface PricingBreakdown {
  baseRate: number;
  distanceCharge: number;
  volumeCharge: number;
  timeCharge: number;
  surcharges: Array<{ name: string; amount: number }>;
  discounts: Array<{ name: string; amount: number; reason: string }>;
}

export interface CreatePricingRuleInput {
  companyId: string;
  name: string;
  description?: string;
  ruleType: PricingRuleType;
  priority?: number;
  
  // Distance pricing
  baseRateGBP?: number;
  perMileRateGBP?: number;
  minChargeGBP?: number;
  maxChargeGBP?: number;
  
  // Volume/Weight pricing
  perCubicMeterGBP?: number;
  perKgGBP?: number;
  
  // Discounts
  discountPercent?: number;
  discountFixedGBP?: number;
  volumeThreshold?: number;
  
  // Time multipliers
  peakMultiplier?: number;
  offPeakMultiplier?: number;
  weekendMultiplier?: number;
  
  // Conditions
  conditions?: any;
  
  validFrom?: Date;
  validTo?: Date;
  createdBy: string;
}

// Default pricing constants (in pence)
const DEFAULT_PRICING = {
  BASE_RATE_GBP: 4500, // £45.00
  PER_MILE_GBP: 150, // £1.50 per mile
  MIN_CHARGE_GBP: 6500, // £65.00 minimum
  VAT_RATE: 0.20,
  CREW_MULTIPLIER: {
    1: 1.0,
    2: 1.0,
    3: 1.3,
    4: 1.5,
  },
  PEAK_HOURS: { start: 7, end: 9 }, // 7am-9am
  PEAK_MULTIPLIER: 1.15,
  WEEKEND_MULTIPLIER: 1.10,
};

// Service Implementation
export const companyPricingService = {
  /**
   * Calculate price for a B2B quote/booking
   */
  async calculatePrice(input: PricingInput): Promise<PricingResult> {
    // Get company-specific pricing rules
    const rules = await this.getActiveRules(input.companyId);
    
    // Calculate distance
    const distance = await this.calculateDistance(
      input.pickupPostcode,
      input.dropoffPostcode,
      input.pickupLat,
      input.pickupLng,
      input.dropoffLat,
      input.dropoffLng
    );

    // Initialize breakdown
    const breakdown: PricingBreakdown = {
      baseRate: 0,
      distanceCharge: 0,
      volumeCharge: 0,
      timeCharge: 0,
      surcharges: [],
      discounts: [],
    };

    let subtotalGBP = 0;
    let appliedRuleId: string | undefined;

    // Apply pricing rules in priority order
    const distanceRule = rules.find(r => r.ruleType === PricingRuleType.DISTANCE);
    if (distanceRule) {
      appliedRuleId = distanceRule.id;
      breakdown.baseRate = distanceRule.baseRateGBP || DEFAULT_PRICING.BASE_RATE_GBP;
      breakdown.distanceCharge = Math.round(
        distance.miles * (distanceRule.perMileRateGBP || DEFAULT_PRICING.PER_MILE_GBP)
      );
      
      subtotalGBP = breakdown.baseRate + breakdown.distanceCharge;
      
      // Apply min/max
      if (distanceRule.minChargeGBP && subtotalGBP < distanceRule.minChargeGBP) {
        subtotalGBP = distanceRule.minChargeGBP;
      }
      if (distanceRule.maxChargeGBP && subtotalGBP > distanceRule.maxChargeGBP) {
        subtotalGBP = distanceRule.maxChargeGBP;
      }
    } else {
      // Use default pricing
      breakdown.baseRate = DEFAULT_PRICING.BASE_RATE_GBP;
      breakdown.distanceCharge = Math.round(distance.miles * DEFAULT_PRICING.PER_MILE_GBP);
      subtotalGBP = breakdown.baseRate + breakdown.distanceCharge;
      
      if (subtotalGBP < DEFAULT_PRICING.MIN_CHARGE_GBP) {
        subtotalGBP = DEFAULT_PRICING.MIN_CHARGE_GBP;
      }
    }

    // Apply volume-based pricing if items provided
    if (input.items && input.items.length > 0) {
      const volumeRule = rules.find(r => r.ruleType === PricingRuleType.VOLUME);
      const totalVolume = this.calculateTotalVolume(input.items);
      
      if (volumeRule && volumeRule.perCubicMeterGBP) {
        breakdown.volumeCharge = Math.round(totalVolume * volumeRule.perCubicMeterGBP);
        subtotalGBP += breakdown.volumeCharge;
      }
    }

    // Apply crew size multiplier
    const crewSize = input.crewSize || 2;
    const crewMultiplier = DEFAULT_PRICING.CREW_MULTIPLIER[crewSize as keyof typeof DEFAULT_PRICING.CREW_MULTIPLIER] || 1.0;
    if (crewMultiplier !== 1.0) {
      const crewSurcharge = Math.round(subtotalGBP * (crewMultiplier - 1));
      breakdown.surcharges.push({
        name: `Crew size (${crewSize} people)`,
        amount: crewSurcharge,
      });
      subtotalGBP += crewSurcharge;
    }

    // Apply time-based pricing
    if (input.scheduledDate) {
      const hour = input.scheduledDate.getHours();
      const dayOfWeek = input.scheduledDate.getDay();
      
      const timeRule = rules.find(r => r.ruleType === PricingRuleType.TIME);
      
      // Peak hours
      if (hour >= DEFAULT_PRICING.PEAK_HOURS.start && hour <= DEFAULT_PRICING.PEAK_HOURS.end) {
        const multiplier = timeRule?.peakMultiplier || DEFAULT_PRICING.PEAK_MULTIPLIER;
        const peakSurcharge = Math.round(subtotalGBP * (multiplier - 1));
        breakdown.surcharges.push({
          name: 'Peak hours surcharge',
          amount: peakSurcharge,
        });
        subtotalGBP += peakSurcharge;
      }
      
      // Weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const multiplier = timeRule?.weekendMultiplier || DEFAULT_PRICING.WEEKEND_MULTIPLIER;
        const weekendSurcharge = Math.round(subtotalGBP * (multiplier - 1));
        breakdown.surcharges.push({
          name: 'Weekend surcharge',
          amount: weekendSurcharge,
        });
        subtotalGBP += weekendSurcharge;
      }
    }

    // Apply discounts
    const discountRule = rules.find(r => r.ruleType === PricingRuleType.DISCOUNT);
    let discountGBP = 0;
    let discountReason: string | undefined;

    if (discountRule) {
      if (discountRule.discountPercent) {
        discountGBP = Math.round(subtotalGBP * (discountRule.discountPercent / 100));
        discountReason = `${discountRule.discountPercent}% company discount`;
      } else if (discountRule.discountFixedGBP) {
        discountGBP = discountRule.discountFixedGBP;
        discountReason = 'Fixed company discount';
      }

      if (discountGBP > 0) {
        breakdown.discounts.push({
          name: discountRule.name,
          amount: discountGBP,
          reason: discountReason || '',
        });
        subtotalGBP -= discountGBP;
      }
    }

    // Calculate VAT
    const vatGBP = Math.round(subtotalGBP * DEFAULT_PRICING.VAT_RATE);
    const totalGBP = subtotalGBP + vatGBP;

    return {
      distanceMiles: distance.miles,
      estimatedDurationMins: distance.durationMins,
      subtotalGBP,
      vatGBP,
      totalGBP,
      discountGBP: discountGBP > 0 ? discountGBP : undefined,
      discountReason,
      appliedRuleId,
      breakdown,
    };
  },

  /**
   * Calculate distance between two postcodes
   */
  async calculateDistance(
    pickupPostcode: string,
    dropoffPostcode: string,
    pickupLat?: number,
    pickupLng?: number,
    dropoffLat?: number,
    dropoffLng?: number
  ): Promise<{ miles: number; durationMins: number }> {
    // If we have coordinates, use haversine formula
    if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
      const miles = this.haversineDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
      // Estimate duration: average 30 mph in UK
      const durationMins = Math.round((miles / 30) * 60);
      return { miles: Math.round(miles * 10) / 10, durationMins };
    }

    // Fallback: use postcodes.io to get coordinates
    try {
      const [pickup, dropoff] = await Promise.all([
        this.getPostcodeCoordinates(pickupPostcode),
        this.getPostcodeCoordinates(dropoffPostcode),
      ]);

      if (pickup && dropoff) {
        const miles = this.haversineDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
        const durationMins = Math.round((miles / 30) * 60);
        return { miles: Math.round(miles * 10) / 10, durationMins };
      }
    } catch (error) {
      console.error('[Pricing] Failed to calculate distance:', error);
    }

    // Default fallback
    return { miles: 10, durationMins: 30 };
  },

  /**
   * Haversine formula for distance calculation
   */
  haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  /**
   * Get coordinates for a postcode
   */
  async getPostcodeCoordinates(postcode: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await fetch(
        `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s/g, ''))}`
      );
      const data = await response.json();
      
      if (data.result) {
        return {
          lat: data.result.latitude,
          lng: data.result.longitude,
        };
      }
    } catch (error) {
      console.error('[Pricing] Failed to get postcode coordinates:', error);
    }
    return null;
  },

  /**
   * Calculate total volume from items
   */
  calculateTotalVolume(items: any[]): number {
    return items.reduce((total, item) => {
      if (item.volume) {
        return total + (item.volume * (item.quantity || 1));
      }
      if (item.dimensions) {
        const { length, width, height } = item.dimensions;
        const volume = (length * width * height) / 1000000; // Convert cm³ to m³
        return total + (volume * (item.quantity || 1));
      }
      return total;
    }, 0);
  },

  /**
   * Get active pricing rules for a company
   */
  async getActiveRules(companyId: string) {
    const now = new Date();
    
    return prisma.pricingRule.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [
          { validFrom: null, validTo: null },
          { validFrom: { lte: now }, validTo: null },
          { validFrom: null, validTo: { gte: now } },
          { validFrom: { lte: now }, validTo: { gte: now } },
        ],
      },
      orderBy: { priority: 'desc' },
    });
  },

  /**
   * Create a pricing rule
   */
  async createRule(input: CreatePricingRuleInput) {
    const rule = await prisma.pricingRule.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        description: input.description,
        ruleType: input.ruleType,
        priority: input.priority || 0,
        baseRateGBP: input.baseRateGBP,
        perMileRateGBP: input.perMileRateGBP,
        minChargeGBP: input.minChargeGBP,
        maxChargeGBP: input.maxChargeGBP,
        perCubicMeterGBP: input.perCubicMeterGBP,
        perKgGBP: input.perKgGBP,
        discountPercent: input.discountPercent,
        discountFixedGBP: input.discountFixedGBP,
        volumeThreshold: input.volumeThreshold,
        peakMultiplier: input.peakMultiplier,
        offPeakMultiplier: input.offPeakMultiplier,
        weekendMultiplier: input.weekendMultiplier,
        conditions: input.conditions,
        validFrom: input.validFrom,
        validTo: input.validTo,
        createdBy: input.createdBy,
      },
    });

    await companyAuditService.log({
      companyId: input.companyId,
      actorId: input.createdBy,
      actorType: 'admin',
      action: 'PRICING_RULE_CREATED',
      targetType: 'pricing_rule',
      targetId: rule.id,
      after: rule,
    });

    return rule;
  },

  /**
   * Update a pricing rule
   */
  async updateRule(id: string, updates: Partial<CreatePricingRuleInput>, actorId: string) {
    const before = await prisma.pricingRule.findUnique({ where: { id } });
    
    const rule = await prisma.pricingRule.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    await companyAuditService.log({
      companyId: rule.companyId,
      actorId,
      actorType: 'admin',
      action: 'PRICING_RULE_UPDATED',
      targetType: 'pricing_rule',
      targetId: id,
      before,
      after: rule,
    });

    return rule;
  },

  /**
   * Delete a pricing rule
   */
  async deleteRule(id: string, actorId: string) {
    const rule = await prisma.pricingRule.findUnique({ where: { id } });
    
    if (!rule) {
      throw new Error('Pricing rule not found');
    }

    await prisma.pricingRule.delete({ where: { id } });

    await companyAuditService.log({
      companyId: rule.companyId,
      actorId,
      actorType: 'admin',
      action: 'PRICING_RULE_DELETED',
      targetType: 'pricing_rule',
      targetId: id,
      before: rule,
    });

    return rule;
  },

  /**
   * Get all pricing rules for a company
   */
  async getRules(companyId: string) {
    return prisma.pricingRule.findMany({
      where: { companyId },
      orderBy: [{ ruleType: 'asc' }, { priority: 'desc' }],
    });
  },
};

export default companyPricingService;
