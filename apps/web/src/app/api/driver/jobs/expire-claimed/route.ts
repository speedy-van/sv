import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const now = new Date();

    // Find all claimed AND invited assignments that have expired
    const expiredAssignments = await prisma.assignment.findMany({
      where: {
        status: { in: ['claimed', 'invited'] }, // Check both statuses
        expiresAt: {
          lt: now,
        },
      },
      include: {
        Booking: true,
        Driver: {
          include: {
            User: true,
            DriverPerformance: true,
          }
        }
      },
    });

    if (expiredAssignments.length === 0) {
      return NextResponse.json({
        message: 'No expired assignments found',
        expiredCount: 0,
      });
    }

    // Import Pusher for real-time notifications
    const Pusher = (await import('pusher')).default;
    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID || '',
      key: process.env.PUSHER_KEY || '',
      secret: process.env.PUSHER_SECRET || '',
      cluster: process.env.PUSHER_CLUSTER || 'eu',
      useTLS: true,
    });

    // Update expired assignments to declined status with acceptance rate penalty
    const updatePromises = expiredAssignments.map(async assignment => {
      console.log(`⏰ Expiring assignment ${assignment.id} for driver ${assignment.driverId}`);
      
      let newAcceptanceRate = 100;
      
      await prisma.$transaction(async tx => {
        // Update assignment status to declined
        await tx.assignment.update({
          where: { id: assignment.id },
          data: { 
            status: 'declined',
            declinedAt: now,
          },
        });

        // Reset booking to make it available again
        await tx.booking.update({
          where: { id: assignment.bookingId },
          data: {
            driverId: null,
            status: 'CONFIRMED',
          },
        });

        // Apply acceptance rate penalty (same as manual decline)
        const performance = await tx.driverPerformance.findUnique({
          where: { driverId: assignment.driverId }
        });

        if (performance) {
          const currentRate = performance.acceptanceRate || 100;
          newAcceptanceRate = Math.max(0, currentRate - 5); // Decrease by 5%

          await tx.driverPerformance.update({
            where: { driverId: assignment.driverId },
            data: {
              acceptanceRate: newAcceptanceRate,
              lastCalculated: now
            }
          });

          console.log(`📉 Decreased acceptance rate for driver ${assignment.driverId} from ${currentRate}% to ${newAcceptanceRate}%`);
        }
      });

      // Send real-time notifications to driver
      try {
        await pusher.trigger(`driver-${assignment.driverId}`, 'job-removed', {
          jobId: assignment.bookingId,
          assignmentId: assignment.id,
          reason: 'expired',
          message: 'Assignment expired - You did not accept within 30 minutes',
          timestamp: now.toISOString()
        });

        await pusher.trigger(`driver-${assignment.driverId}`, 'acceptance-rate-updated', {
          acceptanceRate: newAcceptanceRate,
          change: -5,
          reason: 'assignment_expired',
          jobId: assignment.bookingId,
          timestamp: now.toISOString()
        });

        // Notify admin dashboard
        await pusher.trigger('admin-orders', 'order-status-changed', {
          jobId: assignment.bookingId,
          status: 'available',
          previousDriver: assignment.driverId,
          driverName: assignment.Driver?.User?.name,
          reason: 'expired',
          timestamp: now.toISOString()
        });
      } catch (pusherError) {
        console.error('⚠️ Failed to send Pusher notifications:', pusherError);
      }

      // Auto-reassign to next available driver
      try {
        const availableDrivers = await prisma.driver.findMany({
          where: {
            id: { not: assignment.driverId },
            status: 'active',
            onboardingStatus: 'approved',
            DriverAvailability: {
              status: { in: ['online', 'available'] }
            }
          },
          include: {
            User: { select: { name: true, email: true } },
            DriverAvailability: true,
            DriverPerformance: true
          },
          orderBy: {
            DriverPerformance: {
              acceptanceRate: 'desc'
            }
          },
          take: 5
        });

        if (availableDrivers.length > 0) {
          const nextDriver = availableDrivers[0];
          
          // Create new assignment for next driver
          await prisma.assignment.create({
            data: {
              id: `assign_${assignment.bookingId}_${nextDriver.id}_${Date.now()}`,
              bookingId: assignment.bookingId,
              driverId: nextDriver.id,
              status: 'invited',
              round: (assignment.round || 1) + 1,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
              updatedAt: now
            }
          });

          // Notify next driver
          await pusher.trigger(`driver-${nextDriver.id}`, 'route-matched', {
            type: 'single-order',
            matchType: 'order',
            jobCount: 1,
            bookingId: assignment.Booking?.id,
            bookingReference: assignment.Booking?.reference,
            assignmentId: assignment.id,
            message: 'New job offer (auto-reassigned)',
            expiresInSeconds: 1800,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            timestamp: now.toISOString()
          });

          console.log(`✅ Job auto-reassigned to driver: ${nextDriver.User?.name}`);
        } else {
          console.log('⚠️ No available drivers for auto-reassignment');
        }
      } catch (reassignError) {
        console.error('❌ Failed to auto-reassign job:', reassignError);
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: `Expired ${expiredAssignments.length} claimed assignments`,
      expiredCount: expiredAssignments.length,
      expiredAssignments: expiredAssignments.map(assignment => ({
        id: assignment.id,
        bookingId: assignment.bookingId,
        driverId: assignment.driverId,
        expiresAt: assignment.expiresAt,
      })),
    });
  } catch (error) {
    console.error('Error expiring claimed Assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
