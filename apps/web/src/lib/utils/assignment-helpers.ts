/**
 * Assignment Helper Utilities
 * 
 * These helpers handle the fact that Booking.Assignment is now an array (one-to-many)
 * instead of a single object (one-to-one), allowing us to track assignment history.
 */

import type { Assignment } from '@prisma/client';

/**
 * Get the active assignment from a booking's assignment array.
 * Returns the most recent non-cancelled/non-declined assignment.
 * 
 * @param assignments - Array of assignments from a booking
 * @returns The active assignment or null if none found
 */
export function getActiveAssignment<T extends Pick<Assignment, 'status' | 'createdAt'>>(
  assignments: T[] | T | null | undefined
): T | null {
  // Handle if it's already a single assignment (shouldn't happen, but defensive)
  if (!Array.isArray(assignments)) {
    if (!assignments) return null;
    if (assignments.status === 'cancelled' || assignments.status === 'declined') {
      return null;
    }
    return assignments;
  }

  // Filter out cancelled/declined assignments and get the most recent
  const activeAssignments = assignments
    .filter(a => a.status !== 'cancelled' && a.status !== 'declined')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return activeAssignments[0] || null;
}

/**
 * Get the most recent assignment regardless of status (for history/audit purposes).
 * 
 * @param assignments - Array of assignments from a booking
 * @returns The most recent assignment or null if none found
 */
export function getLatestAssignment<T extends Pick<Assignment, 'createdAt'>>(
  assignments: T[] | T | null | undefined
): T | null {
  if (!Array.isArray(assignments)) {
    return assignments || null;
  }

  if (assignments.length === 0) return null;

  return assignments.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
}

/**
 * Check if a booking has an active assignment.
 * 
 * @param assignments - Array of assignments from a booking
 * @returns True if there's an active assignment
 */
export function hasActiveAssignment<T extends Pick<Assignment, 'status'>>(
  assignments: T[] | T | null | undefined
): boolean {
  if (!Array.isArray(assignments)) {
    if (!assignments) return false;
    return assignments.status !== 'cancelled' && assignments.status !== 'declined';
  }

  return assignments.some(a => a.status !== 'cancelled' && a.status !== 'declined');
}

/**
 * Prisma include configuration for getting active assignments only.
 * Use this in your Prisma queries to get only non-cancelled assignments.
 */
export const ACTIVE_ASSIGNMENT_INCLUDE = {
  where: {
    status: { notIn: ['cancelled', 'declined'] as const }
  },
  orderBy: { createdAt: 'desc' as const },
  take: 1
} as const;

/**
 * Safely upsert an assignment for a booking.
 * Since bookingId is not unique (one booking can have multiple assignments),
 * this helper finds an active assignment and updates it, or creates a new one.
 * 
 * @param prisma - Prisma client or transaction client
 * @param bookingId - The booking ID
 * @param data - Data to update or create with
 * @returns The upserted assignment
 */
export async function upsertAssignment(
  prisma: any,
  bookingId: string,
  data: {
    driverId: string;
    status: 'invited' | 'claimed' | 'accepted' | 'declined' | 'completed' | 'cancelled';
    expiresAt?: Date | null;
    claimedAt?: Date | null;
    score?: number | null;
    round?: number;
  }
) {
  // Find the most recent active assignment for this booking
  const existingAssignment = await prisma.assignment.findFirst({
    where: {
      bookingId,
      status: { in: ['invited', 'claimed'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (existingAssignment) {
    // Update existing assignment
    return await prisma.assignment.update({
      where: { id: existingAssignment.id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  } else {
    // Create new assignment
    return await prisma.assignment.create({
      data: {
        bookingId,
        ...data
      }
    });
  }
}

