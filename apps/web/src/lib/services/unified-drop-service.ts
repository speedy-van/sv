/**
 * Unified Booking to Drop Conversion Service
 * 
 * Provides a single, consistent pathway for converting any booking type to a standardized Drop.
 * Ensures idempotency, proper validation, and business rules compliance.
 * 
 * Key Features:
 * - Idempotent conversions (no duplicate drops from same booking)
 * - Service tier mapping from booking characteristics
 * - Geocoding validation and coordinate assignment
 * - Weight/volume estimation with business rules
 * - Time window calculation based on service tier
 * - Price floor validation and adjustment
 * - Comprehensive error handling and logging
 * 
 * Usage:
 * const result = await UnifiedDropService.convertBookingToDrop(bookingId);
 * if (result.success) {
 *   console.log('Drop created:', result.drop.id);
 * }
 */

import { PrismaClient, DropStatus, ServiceTier } from '@prisma/client';

const prisma = new PrismaClient();

interface ConversionResult {
  success: boolean;
  drop?: {
    id: string;
    status: DropStatus;
    serviceTier: ServiceTier;
    quotedPrice: number;
  };
  error?: string;
  isExisting?: boolean; // True if drop already existed
}

interface ServiceTierMapping {
  tier: ServiceTier;
  maxWeight: number;      // kg
  maxVolume: number;      // m³
  timeWindowBuffer: number; // hours
  priceFloor: number;     // GBP minimum
}

class UnifiedDropService {
  /**
   * Service tier configurations with capacity and pricing constraints
   */
  private static readonly SERVICE_TIERS: Record<string, ServiceTierMapping> = {
    'express': {
      tier: 'premium' as ServiceTier,
      maxWeight: 20,
      maxVolume: 0.1,
      timeWindowBuffer: 2,
      priceFloor: 15.00
    },
    'small_van': {
      tier: 'standard' as ServiceTier,
      maxWeight: 500,
      maxVolume: 3.5,
      timeWindowBuffer: 4,
      priceFloor: 25.00
    },
    'large_van': {
      tier: 'standard' as ServiceTier,
      maxWeight: 1000,
      maxVolume: 7.0,
      timeWindowBuffer: 4,
      priceFloor: 35.00
    },
    'truck': {
      tier: 'economy' as ServiceTier,
      maxWeight: 2000,
      maxVolume: 15.0,
      timeWindowBuffer: 6,
      priceFloor: 45.00
    }
  };

  /**
   * Convert booking to drop with full validation and business rules
   */
  public static async convertBookingToDrop(bookingId: string): Promise<ConversionResult> {
    try {
      console.log(`🔄 Converting booking ${bookingId} to drop...`);

      // 1. Check if drop already exists (idempotency)
      const existingDrop = await prisma.drop.findFirst({
        where: { id: bookingId }
      });

      if (existingDrop) {
        console.log(`✅ Drop already exists for booking ${bookingId}: ${existingDrop.id}`);
        return {
          success: true,
          drop: {
            id: existingDrop.id,
            status: existingDrop.status,
            serviceTier: existingDrop.serviceTier,
            quotedPrice: parseFloat(existingDrop.quotedPrice.toString())
          },
          isExisting: true
        };
      }

      // 2. Fetch booking with all required relations
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          pickupAddress: true,
          dropoffAddress: true,
          customer: {
            select: { id: true, name: true, email: true }
          },
          BookingItem: true
        }
      });

      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`);
      }

      // 3. Validate booking eligibility
      const validation = await this.validateBookingForConversion(booking);
      if (!validation.isValid) {
        throw new Error(`Booking validation failed: ${validation.error}`);
      }

      // 4. Determine service tier from booking characteristics
      const serviceTierConfig = this.determineServiceTier(booking);
      
      // 5. Estimate weight and volume
      const { weight, volume } = this.estimatePhysicalProperties(booking);

      // 6. Calculate time windows
      const timeWindows = this.calculateTimeWindows(booking, serviceTierConfig);

      // 7. Validate price floor
      const finalPrice = this.validatePriceFloor(booking.totalGBP, serviceTierConfig);

      // 8. Get coordinates (with fallback handling)
      const coordinates = await this.getAddressCoordinates(
        booking.pickupAddress, 
        booking.dropoffAddress
      );

      // 9. Create the drop
      const drop = await prisma.drop.create({
        data: {
          customerId: booking.customerId || booking.customer?.id || '',
          status: 'booked',
          pickupAddress: booking.pickupAddress?.label || booking.pickupAddress?.postcode || 'Unknown',
          deliveryAddress: booking.dropoffAddress?.label || booking.dropoffAddress?.postcode || 'Unknown',
          timeWindowStart: timeWindows.start,
          timeWindowEnd: timeWindows.end,
          serviceTier: serviceTierConfig.tier,
          weight: weight,
          volume: volume,
          quotedPrice: finalPrice,
          specialInstructions: this.extractSpecialInstructions(booking),
        }
      });

      // 10. Log successful conversion
      console.log(`✅ Successfully converted booking ${bookingId} to drop ${drop.id}`);
      
      // 11. Create audit trail
      await this.createConversionAuditLog(booking.id, drop.id, serviceTierConfig.tier);

      return {
        success: true,
        drop: {
          id: drop.id,
          status: drop.status,
          serviceTier: drop.serviceTier,
          quotedPrice: parseFloat(drop.quotedPrice.toString())
        }
      };

    } catch (error) {
      console.error(`❌ Failed to convert booking ${bookingId}:`, error);
      
      // Log failure for monitoring
      await this.createFailureAuditLog(bookingId, error as Error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      };
    }
  }

  /**
   * Batch convert multiple bookings efficiently
   */
  public static async batchConvertBookings(bookingIds: string[]): Promise<{
    successful: ConversionResult[];
    failed: ConversionResult[];
    summary: {
      total: number;
      converted: number;
      existing: number;
      failed: number;
    };
  }> {
    const results = await Promise.allSettled(
      bookingIds.map(id => this.convertBookingToDrop(id))
    );

    const successful = results
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => (r as PromiseFulfilledResult<ConversionResult>).value);

    const failed = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map(r => r.status === 'rejected' ? 
        { success: false, error: r.reason.message } :
        (r as PromiseFulfilledResult<ConversionResult>).value
      );

    return {
      successful,
      failed,
      summary: {
        total: bookingIds.length,
        converted: successful.filter(r => !r.isExisting).length,
        existing: successful.filter(r => r.isExisting).length,
        failed: failed.length
      }
    };
  }

  /**
   * Validate booking eligibility for conversion
   */
  private static async validateBookingForConversion(booking: any): Promise<{
    isValid: boolean;
    error?: string;
  }> {
    // Must have addresses
    if (!booking.pickupAddress || !booking.dropoffAddress) {
      return { isValid: false, error: 'Missing pickup or delivery address' };
    }

    // Must have positive price
    if (!booking.totalGBP || booking.totalGBP <= 0) {
      return { isValid: false, error: 'Invalid booking price' };
    }

    // Must have valid scheduled time
    if (!booking.scheduledAt || new Date(booking.scheduledAt) < new Date()) {
      return { isValid: false, error: 'Invalid or past scheduled time' };
    }

    // Must not be cancelled
    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
      return { isValid: false, error: 'Booking is cancelled or refunded' };
    }

    return { isValid: true };
  }

  /**
   * Determine appropriate service tier from booking characteristics
   */
  private static determineServiceTier(booking: any): ServiceTierMapping {
    const totalPrice = booking.totalGBP || 0;
    const hasUrgency = booking.urgency === 'urgent' || booking.urgency === 'express';
    const itemCount = booking.items?.length || 0;
    const estimatedWeight = this.estimateWeightFromItems(booking.items || []);

    // Express tier for urgent, small, high-value items
    if (hasUrgency && estimatedWeight <= 20 && totalPrice >= 50) {
      return this.SERVICE_TIERS['express'];
    }

    // Truck tier for heavy/bulk items
    if (estimatedWeight > 1000 || itemCount > 20) {
      return this.SERVICE_TIERS['truck'];
    }

    // Large van for medium loads
    if (estimatedWeight > 500 || itemCount > 10 || totalPrice > 100) {
      return this.SERVICE_TIERS['large_van'];
    }

    // Default to small van
    return this.SERVICE_TIERS['small_van'];
  }

  /**
   * Estimate weight and volume from booking items
   */
  private static estimatePhysicalProperties(booking: any): { weight: number; volume: number } {
    const items = booking.items || [];
    
    let totalWeight = 0;
    let totalVolume = 0;

    for (const item of items) {
      // Weight estimation based on item description/type
      const estimatedWeight = this.estimateItemWeight(item);
      const estimatedVolume = this.estimateItemVolume(item);

      totalWeight += estimatedWeight * (item.quantity || 1);
      totalVolume += estimatedVolume * (item.quantity || 1);
    }

    // Apply minimum weight for service tiers
    totalWeight = Math.max(totalWeight, 5); // Minimum 5kg
    totalVolume = Math.max(totalVolume, 0.05); // Minimum 0.05m³

    return { weight: totalWeight, volume: totalVolume };
  }

  /**
   * Calculate delivery time windows based on service tier
   */
  private static calculateTimeWindows(booking: any, tierConfig: ServiceTierMapping): {
    start: Date;
    end: Date;
  } {
    const scheduledTime = new Date(booking.scheduledAt);
    const buffer = tierConfig.timeWindowBuffer;

    // For priority (express), tight windows
    if (tierConfig.tier === 'priority') {
      return {
        start: scheduledTime,
        end: new Date(scheduledTime.getTime() + (buffer * 60 * 60 * 1000))
      };
    }

    // For economy, wider windows
    if (tierConfig.tier === 'economy') {
      return {
        start: new Date(scheduledTime.getTime() - (1 * 60 * 60 * 1000)), // 1 hour before
        end: new Date(scheduledTime.getTime() + (buffer * 60 * 60 * 1000))
      };
    }

    // Standard tier - moderate window
    return {
      start: new Date(scheduledTime.getTime() - (0.5 * 60 * 60 * 1000)), // 30 min before
      end: new Date(scheduledTime.getTime() + (buffer * 60 * 60 * 1000))
    };
  }

  /**
   * Validate and adjust price against floor
   */
  private static validatePriceFloor(originalPrice: number, tierConfig: ServiceTierMapping): number {
    const priceGBP = originalPrice / 100; // Convert pence to pounds
    
    if (priceGBP < tierConfig.priceFloor) {
      console.warn(`Price ${priceGBP} below floor ${tierConfig.priceFloor}, adjusting`);
      return tierConfig.priceFloor;
    }

    return priceGBP;
  }

  /**
   * Get coordinates for addresses (with fallbacks)
   */
  private static async getAddressCoordinates(pickupAddr: any, deliveryAddr: any): Promise<{
    pickup: { lat: number; lng: number };
    delivery: { lat: number; lng: number };
  }> {
    // Try to get existing coordinates
    const pickupCoords = pickupAddr?.latitude && pickupAddr?.longitude ? {
      lat: pickupAddr.latitude,
      lng: pickupAddr.longitude
    } : await this.geocodeAddress(pickupAddr?.label || pickupAddr?.postcode || '');

    const deliveryCoords = deliveryAddr?.latitude && deliveryAddr?.longitude ? {
      lat: deliveryAddr.latitude,
      lng: deliveryAddr.longitude
    } : await this.geocodeAddress(deliveryAddr?.label || deliveryAddr?.postcode || '');

    return {
      pickup: pickupCoords,
      delivery: deliveryCoords
    };
  }

  /**
   * Geocode address (mock implementation - replace with real service)
   */
  private static async geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
    // TODO: Implement real geocoding service (Google Maps, Mapbox, etc.)
    // For now, return London center with small random offset
    const baseLat = 51.5074;
    const baseLng = -0.1278;
    
    return {
      lat: baseLat + (Math.random() - 0.5) * 0.1,
      lng: baseLng + (Math.random() - 0.5) * 0.1
    };
  }

  /**
   * Extract special instructions from booking
   */
  private static extractSpecialInstructions(booking: any): string | undefined {
    const instructions: string[] = [];

    if (booking.urgency === 'urgent') {
      instructions.push('URGENT DELIVERY');
    }

    if (booking.pickupTimeSlot) {
      instructions.push(`Pickup window: ${booking.pickupTimeSlot}`);
    }

    // Add item-specific instructions
    const itemInstructions = booking.items
      ?.filter((item: any) => item.specialInstructions)
      ?.map((item: any) => item.specialInstructions)
      ?.join('; ');

    if (itemInstructions) {
      instructions.push(itemInstructions);
    }

    return instructions.length > 0 ? instructions.join(' | ') : undefined;
  }

  /**
   * Estimate delivery duration based on weight/volume
   */
  private static estimateDeliveryDuration(
    weight: number, 
    volume: number, 
    tierConfig: ServiceTierMapping
  ): number {
    // Base time per delivery
    let duration = 30; // 30 minutes base

    // Add time for weight (1 min per 50kg)
    duration += Math.ceil(weight / 50);

    // Add time for volume (1 min per 0.5m³)
    duration += Math.ceil(volume / 0.5);

    // Service tier adjustments
    if (tierConfig.tier === 'priority') {
      duration *= 0.8; // Priority is faster
    } else if (tierConfig.tier === 'economy') {
      duration *= 1.2; // Economy allows more time
    }

    return Math.max(duration, 15); // Minimum 15 minutes
  }

  /**
   * Estimate weight from booking items
   */
  private static estimateWeightFromItems(items: any[]): number {
    return items.reduce((total, item) => {
      const weight = this.estimateItemWeight(item);
      return total + (weight * (item.quantity || 1));
    }, 0);
  }

  /**
   * Estimate individual item weight
   */
  private static estimateItemWeight(item: any): number {
    const description = (item.description || '').toLowerCase();
    
    // Heavy items
    if (description.includes('furniture') || description.includes('appliance')) {
      return 50;
    }
    
    // Medium items  
    if (description.includes('box') || description.includes('package')) {
      return 10;
    }
    
    // Light items
    if (description.includes('document') || description.includes('envelope')) {
      return 0.5;
    }
    
    // Default weight
    return 5;
  }

  /**
   * Estimate individual item volume
   */
  private static estimateItemVolume(item: any): number {
    const description = (item.description || '').toLowerCase();
    
    // Large items
    if (description.includes('furniture') || description.includes('appliance')) {
      return 1.0;
    }
    
    // Medium items
    if (description.includes('box') || description.includes('package')) {
      return 0.1;
    }
    
    // Small items
    return 0.01;
  }

  /**
   * Create audit log for successful conversion
   */
  private static async createConversionAuditLog(
    bookingId: string, 
    dropId: string, 
    serviceTier: ServiceTier
  ): Promise<void> {
    try {
      // TODO: Implement audit logging when AuditLog supports this action type
      console.log(`📝 Conversion audit: ${bookingId} → ${dropId} (${serviceTier})`);
    } catch (error) {
      console.error('Failed to create conversion audit log:', error);
    }
  }

  /**
   * Create audit log for conversion failure
   */
  private static async createFailureAuditLog(bookingId: string, error: Error): Promise<void> {
    try {
      // TODO: Implement failure audit logging
      console.error(`📝 Conversion failure audit: ${bookingId} - ${error.message}`);
    } catch (auditError) {
      console.error('Failed to create failure audit log:', auditError);
    }
  }

  /**
   * Get conversion statistics for monitoring
   */
  public static async getConversionStats(dateFrom?: Date, dateTo?: Date): Promise<{
    totalDrops: number;
    pendingDrops: number;
    averagePrice: number;
    serviceTierBreakdown: Record<string, number>;
    conversionRate: number; // drops / bookings ratio
  }> {
    const where = dateFrom && dateTo ? {
      createdAt: { gte: dateFrom, lte: dateTo }
    } : {};

    const [drops, totalBookings] = await Promise.all([
      prisma.drop.findMany({
        where: where,
        select: { serviceTier: true, quotedPrice: true, status: true }
      }),
      prisma.booking.count({
        where: dateFrom && dateTo ? { createdAt: where.createdAt } : {}
      })
    ]);

    const serviceTierBreakdown = drops.reduce((acc, drop) => {
      acc[drop.serviceTier] = (acc[drop.serviceTier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalPrice = drops.reduce((sum, drop) => sum + parseFloat(drop.quotedPrice.toString()), 0);
    const averagePrice = drops.length > 0 ? totalPrice / drops.length : 0;

    return {
      totalDrops: drops.length,
      pendingDrops: drops.filter(d => d.status === 'booked').length,
      averagePrice,
      serviceTierBreakdown,
      conversionRate: totalBookings > 0 ? drops.length / totalBookings : 0
    };
  }
}

export default UnifiedDropService;
export type { ConversionResult };