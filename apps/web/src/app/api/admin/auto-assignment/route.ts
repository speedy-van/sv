import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// BookingService removed
import { getPusherServer } from '@/lib/pusher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AutoAssignmentCriteria {
  maxDistance?: number; // km from booking location
  minRating?: number;
  maxCurrentJobs?: number;
  preferredVehicleType?: string;
  requireOnlineStatus?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { bookingId, criteria, forceAuto } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Check dispatch mode (unless forceAuto is true)
    if (!forceAuto) {
      const dispatchSettings = await prisma.dispatchSettings.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      if (dispatchSettings && dispatchSettings.mode === 'manual') {
        return NextResponse.json({
          success: false,
          error: 'Auto-assignment is disabled',
          message: 'Dispatch mode is set to MANUAL. Please assign drivers manually or switch to AUTO mode.',
          currentMode: 'manual'
        }, { status: 400 });
      }
    }

    // Default assignment criteria
    const assignmentCriteria: AutoAssignmentCriteria = {
      maxDistance: 50, // 50km radius
      minRating: 4.0,
      maxCurrentJobs: 2, // Leave room for one more job
      requireOnlineStatus: true,
      ...criteria
    };

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pickupAddress: true,
        dropoffAddress: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status !== 'CONFIRMED' || booking.driverId) {
      return NextResponse.json(
        { error: 'Booking is not available for assignment' },
        { status: 400 }
      );
    }

    // Find suitable drivers
    const suitableDrivers = await findSuitableDrivers(booking, assignmentCriteria);

    if (suitableDrivers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No suitable drivers available',
        criteria: assignmentCriteria,
        availableDriversCount: 0
      });
    }

    // Auto-assign to best driver (highest rated with lowest current load)
    const bestDriver = suitableDrivers[0];

    // Perform assignment
    const assignmentResult = await assignBookingToDriver(bookingId, bestDriver.id, session.user.id);

    // Send notifications
    try {
      // Notify driver
      await getPusherServer().trigger(`driver-${bestDriver.id}`, 'job-assigned', {
        bookingId,
        bookingReference: booking.reference,
        assignmentId: assignmentResult.assignmentId,
        message: 'New job assigned to you!'
      });

      // Notify admin channels
      await getPusherServer().trigger('admin-channel', 'auto-assignment-completed', {
        bookingId,
        bookingReference: booking.reference,
        driverId: bestDriver.id,
        driverName: bestDriver.name,
        assignedAt: new Date()
      });

    } catch (notificationError) {
      console.error('❌ Error sending auto-assignment notifications:', notificationError);
    }

    console.log(`✅ Auto-assignment completed:`, {
      bookingId,
      bookingReference: booking.reference,
      assignedTo: bestDriver.name,
      driverId: bestDriver.id
    });

    return NextResponse.json({
      success: true,
      message: 'Booking automatically assigned successfully',
      data: {
        booking: {
          id: booking.id,
          reference: booking.reference
        },
        driver: {
          id: bestDriver.id,
          name: bestDriver.name,
          rating: bestDriver.rating,
          currentJobs: bestDriver.currentJobs
        },
        assignment: {
          id: assignmentResult.assignmentId,
          assignedAt: assignmentResult.assignedAt
        },
        alternatives: suitableDrivers.slice(1, 3).map(d => ({
          id: d.id,
          name: d.name,
          rating: d.rating
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error in auto-assignment:', error);
    return NextResponse.json(
      {
        error: 'Auto-assignment failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Find suitable drivers for a booking
 */
async function findSuitableDrivers(
  booking: any, 
  criteria: AutoAssignmentCriteria
) {
  // Get all active drivers
  const drivers = await prisma.driver.findMany({
    where: {
      status: 'active',
      onboardingStatus: 'approved',
      ...(criteria.requireOnlineStatus && {
        availability: {
          status: 'online'
        }
      })
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      },
      availability: true,
      // ratings: {
      //   select: { overall: true }
      // },
      Booking: {
        where: {
          status: { in: ['CONFIRMED'] }
        }
      }
    }
  });

  // Filter and score drivers
  const suitableDrivers = drivers
    .filter(driver => {
      // Check current job load
      if ((driver as any).Booking?.length >= (criteria.maxCurrentJobs || 2)) {
        return false;
      }

      // Check rating
      const avgRating = driver.rating || 0;
      
      if (avgRating < (criteria.minRating || 4.0) && avgRating > 0) {
        return false;
      }

      return true;
    })
    .map(driver => {
      // Calculate score for ranking
      const avgRating = driver.rating || 5.0; // Default rating for new drivers

      const jobLoadScore = (3 - ((driver as any).Booking?.length || 0)) / 3; // Higher score for less loaded drivers
      const ratingScore = avgRating / 5; // Normalize rating to 0-1
      const availabilityScore = (driver as any).availability?.status === 'online' ? 1 : 0.5;

      const totalScore = (ratingScore * 0.4) + (jobLoadScore * 0.4) + (availabilityScore * 0.2);

      return {
        id: driver.id,
        userId: (driver as any).user?.id || driver.userId,
        name: (driver as any).user?.name || 'Unknown Driver',
        email: (driver as any).user?.email || '',
        rating: avgRating,
        currentJobs: (driver as any).Booking?.length || 0,
        isOnline: (driver as any).availability?.status === 'online',
        score: totalScore
      };
    })
    .sort((a, b) => b.score - a.score); // Sort by score descending

  return suitableDrivers;
}

/**
 * Assign booking to driver
 */
async function assignBookingToDriver(
  bookingId: string, 
  driverId: string, 
  adminId: string
) {
  const assignedAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // Update booking
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        driverId,
        updatedAt: assignedAt
      }
    });

    // Create assignment
    const assignment = await tx.assignment.upsert({
      where: { bookingId },
      update: {
        driverId,
        status: 'invited',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes to accept
        updatedAt: assignedAt
      },
      create: {
        id: `assignment_${bookingId}_${driverId}`,
        bookingId,
        driverId,
        status: 'invited',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes to accept
        updatedAt: assignedAt
      }
    });

    // Create audit log
    await tx.auditLog.create({
      data: {
        actorId: adminId,
        actorRole: 'admin',
        action: 'auto_assignment_completed',
        targetType: 'booking',
        targetId: bookingId,
        details: {
          driverId,
          assignmentId: assignment.id,
          method: 'auto_assignment',
          assignedAt: assignedAt.toISOString()
        }
      }
    });

    return {
      assignmentId: assignment.id,
      assignedAt
    };
  });

  return result;
}
