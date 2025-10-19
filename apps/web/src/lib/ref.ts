/**
 * Unified Reference Generation System
 * All orders and routes use SV-NNNNNN format with sequential numbering
 */

import { prisma } from './prisma';

export interface ReferenceData {
  type: 'booking' | 'route' | 'driver' | 'customer' | 'admin';
  reference: string;
  createdAt: Date;
}

/**
 * Generate a unified SV reference number
 * Format: SV-NNNNNN (e.g., SV-000001, SV-000002)
 * Both orders and routes share the same sequence
 */
export async function generateReference(type: 'booking' | 'route' | 'driver' | 'customer' | 'admin'): Promise<string> {
  try {
    // Use database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get or create the sequence record
      let sequence = await tx.referenceSequence.findUnique({
        where: { id: 'sv-sequence' }
      });

      if (!sequence) {
        // Create initial sequence if it doesn't exist
        sequence = await tx.referenceSequence.create({
          data: {
            id: 'sv-sequence',
            type: 'unified',
            lastNumber: 0,
            prefix: 'SV',
          }
        });
      }

      // Increment the counter
      const nextNumber = sequence.lastNumber + 1;

      // Update the sequence
      await tx.referenceSequence.update({
        where: { id: 'sv-sequence' },
        data: {
          lastNumber: nextNumber,
          updatedAt: new Date(),
        }
      });

      // Format the reference number: SV-NNNNNN
      const reference = `${sequence.prefix}-${String(nextNumber).padStart(6, '0')}`;
      
      return reference;
    });

    return result;
  } catch (error) {
    console.error('Failed to generate reference:', error);
    // Fallback to timestamp-based reference if database fails
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SV-${timestamp}${random}`;
  }
}

/**
 * Validate if a reference exists in the database
 */
export async function validateReference(reference: string): Promise<boolean> {
  try {
    // Check if reference exists in Booking or Route tables
    const [booking, route] = await Promise.all([
      prisma.booking.findFirst({
        where: { reference },
        select: { id: true }
      }),
      prisma.route.findFirst({
        where: { reference },
        select: { id: true }
      })
    ]);

    return !!(booking || route);
  } catch (error) {
    console.error('Failed to validate reference:', error);
    return false;
  }
}

/**
 * Get reference data by reference number
 */
export async function getReferenceData(reference: string): Promise<ReferenceData | null> {
  try {
    // Try to find in bookings first
    const booking = await prisma.booking.findFirst({
      where: { reference },
      select: { id: true, createdAt: true }
    });

    if (booking) {
      return {
        type: 'booking',
        reference,
        createdAt: booking.createdAt,
      };
    }

    // Try to find in routes
    const route = await prisma.route.findFirst({
      where: { reference },
      select: { id: true, createdAt: true }
    });

    if (route) {
      return {
        type: 'route',
        reference,
        createdAt: route.createdAt,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to get reference data:', error);
    return null;
  }
}

/**
 * Create a unique reference (alias for generateReference)
 */
export async function createUniqueReference(type: 'booking' | 'route' | 'driver' | 'customer' | 'admin'): Promise<string> {
  return await generateReference(type);
}

/**
 * Get the next available reference number (for preview purposes)
 */
export async function getNextReferenceNumber(): Promise<string> {
  try {
    const sequence = await prisma.referenceSequence.findUnique({
      where: { id: 'sv-sequence' }
    });

    if (!sequence) {
      return 'SV-000001';
    }

    const nextNumber = sequence.lastNumber + 1;
    return `${sequence.prefix}-${String(nextNumber).padStart(6, '0')}`;
  } catch (error) {
    console.error('Failed to get next reference number:', error);
    return 'SV-000001';
  }
}

