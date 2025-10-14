/**
 * Booking Service
 * 
 * Handles booking confirmation and drop creation
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BookingRequest {
  quoteId: string;
  serviceTier: 'economy' | 'standard' | 'priority' | 'express' | 'luxury';
  requestedPickupTime?: Date;
  specialInstructions?: string;
}

export interface BookingResponse {
  dropId: string;
  status: 'booked' | 'confirmed';
  estimatedPickupTime: Date;
  estimatedDeliveryTime: Date;
  finalPrice: number;
  serviceTier: 'economy' | 'standard' | 'priority' | 'express' | 'luxury';
}

export class BookingService {
  /**
   * Confirm a booking from a valid quote
   */
  public static async createBooking(request: BookingRequest): Promise<BookingResponse> {
    try {
      // 1. Validate quote exists and is still valid
      const quote = await prisma.quote.findUnique({
        where: { id: request.quoteId },
        include: { customer: true }
      });

      if (!quote) {
        throw new Error('Quote not found');
      }

      if (new Date() > quote.validUntil) {
        throw new Error('Quote has expired');
      }

      if (quote.isAccepted) {
        throw new Error('Quote has already been used');
      }

      // 2. Get the price for the selected service tier
      let finalPrice: number;
      switch (request.serviceTier) {
        case 'economy':
          finalPrice = quote.economyPrice.toNumber();
          break;
        case 'standard':
          finalPrice = quote.standardPrice.toNumber();
          break;
        case 'priority':
          finalPrice = quote.premiumPrice.toNumber();
          break;
        case 'express':
          finalPrice = quote.premiumPrice.toNumber() * 1.2; // 20% more for express
          break;
        case 'luxury':
          finalPrice = quote.premiumPrice.toNumber() * 1.5; // 50% more for luxury
          break;
        default:
          throw new Error('Invalid service tier');
      }

      // 3. Calculate estimated pickup and delivery times
      const estimatedPickupTime = request.requestedPickupTime || new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const estimatedDeliveryTime = new Date(estimatedPickupTime.getTime() + (quote.distance || 0) * 2 * 60 * 1000); // Rough estimate

      // 4. Create the drop
      const drop = await prisma.drop.create({
        data: {
          customerId: quote.customerId,
          quoteId: quote.id,
          status: 'booked',
          pickupAddress: quote.pickupAddress,
          deliveryAddress: quote.deliveryAddress,
          timeWindowStart: estimatedPickupTime,
          timeWindowEnd: new Date(estimatedPickupTime.getTime() + 4 * 60 * 60 * 1000), // 4-hour window
          serviceTier: request.serviceTier,
          weight: quote.weight,
          volume: quote.volume,
          specialInstructions: request.specialInstructions,
          quotedPrice: finalPrice,
          distance: quote.distance
        }
      });

      // 5. Mark quote as accepted
      await prisma.quote.update({
        where: { id: quote.id },
        data: {
          isAccepted: true,
          acceptedTier: request.serviceTier
        }
      });

      // 6. Trigger route optimization (would be done asynchronously in production)
      await this.triggerRouteOptimization();

      return {
        dropId: drop.id,
        status: 'booked',
        estimatedPickupTime,
        estimatedDeliveryTime,
        finalPrice,
        serviceTier: request.serviceTier
      };

    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Get booking details
   */
  public static async getBooking(dropId: string): Promise<BookingResponse | null> {
    try {
      const drop = await prisma.drop.findUnique({
        where: { id: dropId },
        include: {
          User: true,
          Route: true
        }
      });

      if (!drop) return null;

      return {
        dropId: drop.id,
        status: drop.status as any,
        estimatedPickupTime: drop.timeWindowStart,
        estimatedDeliveryTime: drop.timeWindowEnd,
        finalPrice: drop.quotedPrice.toNumber(),
        serviceTier: drop.serviceTier as any
      };

    } catch (error) {
      console.error('Error retrieving booking:', error);
      return null;
    }
  }

  /**
   * Cancel a booking
   */
  public static async cancelBooking(
    dropId: string, 
    reason: string
  ): Promise<{ success: boolean; refundAmount?: number }> {
    try {
      const drop = await prisma.drop.findUnique({
        where: { id: dropId },
        include: { Route: true }
      });

      if (!drop) {
        throw new Error('Booking not found');
      }

      if (drop.status === 'delivered') {
        throw new Error('Cannot cancel delivered booking');
      }

      if (drop.status === 'in_transit' && drop.Route) {
        throw new Error('Cannot cancel booking that is already in progress');
      }

      // Calculate refund amount based on cancellation policy
      const refundAmount = this.calculateRefund(drop);

      // Update drop status
      await prisma.drop.update({
        where: { id: dropId },
        data: {
          status: 'cancelled',
          specialInstructions: `${drop.specialInstructions || ''} [CANCELLED: ${reason}]`
        }
      });

      // If drop was part of a route, trigger re-optimization
      if (drop.routeId) {
        await this.triggerRouteOptimization();
      }

      return {
        success: true,
        refundAmount
      };

    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  /**
   * Update booking details (if allowed)
   */
  public static async updateBooking(
    dropId: string,
    updates: {
      timeWindowStart?: Date;
      specialInstructions?: string;
      pickupAddress?: string;
      deliveryAddress?: string;
    }
  ): Promise<BookingResponse> {
    try {
      const drop = await prisma.drop.findUnique({
        where: { id: dropId }
      });

      if (!drop) {
        throw new Error('Booking not found');
      }

      if (drop.status === 'delivered' || drop.status === 'cancelled') {
        throw new Error('Cannot update delivered or cancelled booking');
      }

      if (drop.status === 'in_transit') {
        throw new Error('Cannot update booking that is in progress');
      }

      // Update allowed fields
      const updatedDrop = await prisma.drop.update({
        where: { id: dropId },
        data: {
          timeWindowStart: updates.timeWindowStart || drop.timeWindowStart,
          timeWindowEnd: updates.timeWindowStart ? 
            new Date(updates.timeWindowStart.getTime() + 4 * 60 * 60 * 1000) : 
            drop.timeWindowEnd,
          specialInstructions: updates.specialInstructions || drop.specialInstructions,
          pickupAddress: updates.pickupAddress || drop.pickupAddress,
          deliveryAddress: updates.deliveryAddress || drop.deliveryAddress
        }
      });

      // If address changed, trigger re-optimization
      if (updates.pickupAddress || updates.deliveryAddress) {
        await this.triggerRouteOptimization();
      }

      return {
        dropId: updatedDrop.id,
        status: updatedDrop.status as any,
        estimatedPickupTime: updatedDrop.timeWindowStart,
        estimatedDeliveryTime: updatedDrop.timeWindowEnd,
        finalPrice: updatedDrop.quotedPrice.toNumber(),
        serviceTier: updatedDrop.serviceTier as any
      };

    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }

  /**
   * Get all bookings for a customer
   */
  public static async getCustomerBookings(
    customerId: string,
    status?: 'booked' | 'assigned' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled'
  ): Promise<BookingResponse[]> {
    try {
      const drops = await prisma.drop.findMany({
        where: {
          customerId,
          ...(status && { status })
        },
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit to last 50 bookings
      });

      return drops.map(drop => ({
        dropId: drop.id,
        status: drop.status as any,
        estimatedPickupTime: drop.timeWindowStart,
        estimatedDeliveryTime: drop.timeWindowEnd,
        finalPrice: drop.quotedPrice.toNumber(),
        serviceTier: drop.serviceTier as any
      }));

    } catch (error) {
      console.error('Error retrieving customer bookings:', error);
      return [];
    }
  }

  /**
   * Calculate refund amount based on cancellation timing
   */
  private static calculateRefund(drop: any): number {
    const price = drop.quotedPrice.toNumber();
    const hoursUntilPickup = (drop.timeWindowStart.getTime() - Date.now()) / (1000 * 60 * 60);

    // Refund policy:
    // More than 24 hours: 100% refund
    // 12-24 hours: 75% refund  
    // 2-12 hours: 50% refund
    // Less than 2 hours: 25% refund

    if (hoursUntilPickup > 24) return price;
    if (hoursUntilPickup > 12) return price * 0.75;
    if (hoursUntilPickup > 2) return price * 0.50;
    return price * 0.25;
  }

  /**
   * Trigger route optimization (placeholder for actual implementation)
   */
  private static async triggerRouteOptimization(): Promise<void> {
    // In production, this would trigger an async job to re-optimize routes
    console.log('Route optimization triggered');
    // Could use a message queue like Bull/BullMQ or similar
  }
}