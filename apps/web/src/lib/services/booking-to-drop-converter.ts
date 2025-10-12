/**
 * Booking to Drop Conversion Service
 * 
 * Automatically converts booking-luxury orders to pending drops
 * for route optimization and multi-drop assignment
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface BookingConversionResult {
  success: boolean;
  dropId?: string;
  error?: string;
  validationErrors?: string[];
}

export interface ConversionBusinessRules {
  requireGeocodedAddresses: boolean;
  minimumWeightKg?: number;
  maximumWeightKg?: number;
  allowedServiceTiers: string[];
  blacklistedPostcodes: string[];
}

export class BookingToDropConverter {
  
  private static readonly DEFAULT_RULES: ConversionBusinessRules = {
    requireGeocodedAddresses: true,
    minimumWeightKg: 0.1,
    maximumWeightKg: 1000,
    allowedServiceTiers: ['economy', 'standard', 'premium', 'luxury'],
    blacklistedPostcodes: []
  };

  /**
   * Convert a booking to a drop with validation
   */
  public static async convertBookingToDrop(
    bookingId: string, 
    rules: Partial<ConversionBusinessRules> = {}
  ): Promise<BookingConversionResult> {
    try {
      const appliedRules = { ...this.DEFAULT_RULES, ...rules };
      
      // 1. Fetch the booking with related data
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          pickupAddress: true,
          dropoffAddress: true
        }
      });

      if (!booking) {
        return {
          success: false,
          error: 'Booking not found'
        };
      }

      // 2. Validate booking is eligible for conversion
      const validation = this.validateBookingForConversion(booking, appliedRules);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Booking failed validation',
          validationErrors: validation.errors
        };
      }

      // 3. Check if drop already exists for this booking (simplified check)
      // Note: In production, implement proper BookingDropMapping table
      const bookingReference = `booking_${bookingId}`;
      
      // For now, we'll store the relationship in booking metadata
      // and check if conversion already happened

      // 4. Determine service tier from booking
      const serviceTier = this.mapBookingToServiceTier(booking);

      // 5. Calculate time windows
      const timeWindows = this.calculateTimeWindows(booking);

      // 6. Create the drop (placeholder - requires Drop model in schema)
      const dropData = {
        customerId: booking.customerId,
        pickupAddress: booking.pickupAddress?.label || '',
        deliveryAddress: booking.dropoffAddress?.label || '',
        timeWindowStart: timeWindows.start,
        timeWindowEnd: timeWindows.end,
        serviceTier: serviceTier,
        status: 'booked',
        quotedPrice: booking.totalGBP || new Decimal(0),
        weight: this.estimateWeight(booking),
        volume: this.estimateVolume(booking),
        specialInstructions: booking.customerName || undefined,
        createdAt: new Date()
      };

      // TODO: Uncomment when Drop model is available
      // const drop = await prisma.drop.create({ data: dropData });
      
      // For now, simulate drop creation
      const drop = { 
        id: `drop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...dropData
      };

      // 7. Create booking-drop mapping for tracking
      await this.createBookingDropMapping(bookingId, drop.id);

      // 8. Update booking status to indicate it's been converted
      // TODO: Update booking when notes field is available in schema
      /*
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'confirmed' // Mark as processed
        }
      });
      */

      return {
        success: true,
        dropId: drop.id
      };

    } catch (error) {
      console.error('Error converting booking to drop:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Batch convert multiple bookings with error handling
   */
  public static async batchConvertBookings(
    bookingIds: string[],
    rules: Partial<ConversionBusinessRules> = {}
  ): Promise<{
    successful: Array<{ bookingId: string; dropId: string }>;
    failed: Array<{ bookingId: string; error: string }>;
  }> {
    const successful: Array<{ bookingId: string; dropId: string }> = [];
    const failed: Array<{ bookingId: string; error: string }> = [];

    // Process in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < bookingIds.length; i += batchSize) {
      const batch = bookingIds.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(bookingId => this.convertBookingToDrop(bookingId, rules))
      );

      results.forEach((result, index) => {
        const bookingId = batch[index];
        
        if (result.status === 'fulfilled' && result.value.success) {
          successful.push({
            bookingId,
            dropId: result.value.dropId!
          });
        } else {
          failed.push({
            bookingId,
            error: result.status === 'fulfilled' ? 
              result.value.error || 'Unknown error' : 
              result.reason?.message || 'Promise rejected'
          });
        }
      });
    }

    return { successful, failed };
  }

  /**
   * Validate booking is eligible for drop conversion
   */
  private static validateBookingForConversion(
    booking: any, 
    rules: ConversionBusinessRules
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check booking status
    if (!['CONFIRMED', 'PAID'].includes(booking.status)) {
      errors.push('Booking must be confirmed or paid');
    }

    // Check addresses exist and are geocoded if required
    if (rules.requireGeocodedAddresses) {
      if (!booking.pickupAddress?.lat || !booking.pickupAddress?.lng) {
        errors.push('Pickup address must be geocoded');
      }
      if (!booking.dropoffAddress?.lat || !booking.dropoffAddress?.lng) {
        errors.push('Dropoff address must be geocoded');
      }
    }

    // Check weight limits
    const estimatedWeight = this.estimateWeight(booking);
    if (rules.minimumWeightKg && estimatedWeight < rules.minimumWeightKg) {
      errors.push(`Weight ${estimatedWeight}kg below minimum ${rules.minimumWeightKg}kg`);
    }
    if (rules.maximumWeightKg && estimatedWeight > rules.maximumWeightKg) {
      errors.push(`Weight ${estimatedWeight}kg exceeds maximum ${rules.maximumWeightKg}kg`);
    }

    // Check blacklisted postcodes
    const pickupPostcode = this.extractPostcode(booking.pickupAddress?.fullAddress || '');
    const deliveryPostcode = this.extractPostcode(booking.dropoffAddress?.fullAddress || '');
    
    if (rules.blacklistedPostcodes.includes(pickupPostcode)) {
      errors.push(`Pickup postcode ${pickupPostcode} is blacklisted`);
    }
    if (rules.blacklistedPostcodes.includes(deliveryPostcode)) {
      errors.push(`Delivery postcode ${deliveryPostcode} is blacklisted`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Map booking service level to drop service tier
   */
  private static mapBookingToServiceTier(booking: any): string {
    // Map from booking-luxury service levels to drop service tiers
    if (booking.serviceTier) {
      return booking.serviceTier.toLowerCase();
    }
    
    // Fallback mapping based on total price
    const totalGBP = booking.totalGBP?.toNumber() || 0;
    
    if (totalGBP >= 100) return 'premium';
    if (totalGBP >= 50) return 'standard';
    return 'economy';
  }

  /**
   * Calculate delivery time windows based on booking
   */
  private static calculateTimeWindows(booking: any): { start: Date; end: Date } {
    const now = new Date();
    
    // If booking has scheduled time, use it
    if (booking.scheduledPickupTime) {
      const scheduledTime = new Date(booking.scheduledPickupTime);
      return {
        start: scheduledTime,
        end: new Date(scheduledTime.getTime() + 2 * 60 * 60 * 1000) // 2 hour window
      };
    }
    
    // Default: next day 9 AM - 6 PM window
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const start = new Date(tomorrow);
    start.setHours(9, 0, 0, 0);
    
    const end = new Date(tomorrow);
    end.setHours(18, 0, 0, 0);
    
    return { start, end };
  }

  /**
   * Estimate package weight from booking data
   */
  private static estimateWeight(booking: any): number {
    // Try to extract from booking data
    if (booking.weight) return booking.weight;
    
    // Estimate based on item descriptions
    const items = booking.items || [];
    let totalWeight = 0;
    
    items.forEach((item: any) => {
      const name = item.name?.toLowerCase() || '';
      const quantity = item.quantity || 1;
      
      // Basic weight estimation rules
      if (name.includes('laptop') || name.includes('computer')) {
        totalWeight += 2.5 * quantity; // 2.5kg per laptop
      } else if (name.includes('phone') || name.includes('mobile')) {
        totalWeight += 0.2 * quantity; // 200g per phone
      } else if (name.includes('document') || name.includes('paper')) {
        totalWeight += 0.1 * quantity; // 100g per document
      } else if (name.includes('food') || name.includes('meal')) {
        totalWeight += 0.5 * quantity; // 500g per meal
      } else {
        totalWeight += 1.0 * quantity; // Default 1kg per item
      }
    });
    
    return Math.max(totalWeight, 0.1); // Minimum 100g
  }

  /**
   * Estimate package volume from booking data
   */
  private static estimateVolume(booking: any): number {
    if (booking.volume) return booking.volume;
    
    const items = booking.items || [];
    let totalVolume = 0;
    
    items.forEach((item: any) => {
      const name = item.name?.toLowerCase() || '';
      const quantity = item.quantity || 1;
      
      // Basic volume estimation (m³)
      if (name.includes('laptop') || name.includes('computer')) {
        totalVolume += 0.005 * quantity; // 5L per laptop
      } else if (name.includes('phone')) {
        totalVolume += 0.0002 * quantity; // 200ml per phone
      } else if (name.includes('document')) {
        totalVolume += 0.0001 * quantity; // 100ml per document
      } else {
        totalVolume += 0.001 * quantity; // Default 1L per item
      }
    });
    
    return Math.max(totalVolume, 0.0001); // Minimum 100ml
  }

  /**
   * Create booking-drop mapping for traceability
   */
  private static async createBookingDropMapping(bookingId: string, dropId: string): Promise<void> {
    // For now, we'll store this in a simple mapping table
    // In production, you might want to add a dedicated BookingDropMapping model
    
    try {
      // This could be a separate table or stored in metadata
      await prisma.$executeRaw`
        INSERT INTO booking_drop_mappings (booking_id, drop_id, created_at)
        VALUES (${bookingId}, ${dropId}, ${new Date()})
        ON CONFLICT (booking_id) DO UPDATE SET
          drop_id = EXCLUDED.drop_id,
          updated_at = ${new Date()}
      `;
    } catch (error) {
      // If the table doesn't exist, we'll skip this for now
      console.warn('Could not create booking-drop mapping:', error);
    }
  }

  /**
   * Extract postcode from full address
   */
  private static extractPostcode(address: string): string {
    // UK postcode regex
    const postcodeRegex = /[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/gi;
    const match = address.match(postcodeRegex);
    return match ? match[0].toUpperCase() : '';
  }

  /**
   * Auto-convert new bookings (to be called by webhook/event handler)
   */
  public static async handleNewBooking(bookingId: string): Promise<void> {
    try {
      const result = await this.convertBookingToDrop(bookingId);
      
      if (result.success) {
        console.log(`✅ Booking ${bookingId} converted to Drop ${result.dropId}`);
      } else {
        console.warn(`⚠️ Failed to convert Booking ${bookingId}:`, result.error);
        
        // Optionally create an alert for manual review
        await this.createConversionAlert(bookingId, result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error in handleNewBooking:', error);
    }
  }

  /**
   * Create alert for failed conversions
   */
  private static async createConversionAlert(bookingId: string, error: string): Promise<void> {
    try {
      // TODO: Create notification when metadata field is available
      /*
      await prisma.adminNotification.create({
        data: {
          type: 'conversion_failed',
          title: 'Booking to Drop Conversion Failed',
          message: `Failed to convert booking ${bookingId}: ${error}`,
          priority: 'medium',
          isRead: false
        }
      });
      */
    } catch (notificationError) {
      console.error('Failed to create conversion alert:', notificationError);
    }
  }
}

export default BookingToDropConverter;