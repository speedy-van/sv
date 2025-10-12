import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';
import Pusher from 'pusher';

export const dynamic = 'force-dynamic';

// Initialize Pusher for real-time updates
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to session auth (for web)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Login required' },
          { status: 401 }
        );
      }
      userId = (session.user as any).id;
    }

    const jobId = params.id;
    // Get driver data
    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        User: {
          select: { name: true, email: true }
        }
      }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    let newAcceptanceRate = 100;

    // Use a transaction to handle the decline
    const result = await prisma.$transaction(async tx => {
      // Find the assignment for this job and driver
      const assignment = await tx.assignment.findFirst({
        where: {
          bookingId: jobId,
          driverId: driver.id,
          status: { in: ['invited', 'claimed'] }, // Accept both invited and claimed
        },
      });

      if (!assignment) {
        throw new Error('No assignment found for this job');
      }

      // Check if assignment has expired
      if (assignment.expiresAt && assignment.expiresAt < new Date()) {
        throw new Error('Assignment has expired');
      }

      // Update assignment status to declined
      const updatedAssignment = await tx.assignment.update({
        where: { id: assignment.id },
        data: {
          status: 'declined',
        },
      });

      // Reset the booking to make it available again
      await tx.booking.update({
        where: { id: jobId },
        data: {
          driverId: null,
          status: 'CONFIRMED',
        },
      });

      // Update driver performance - decrease acceptance rate by 5%
      const performance = await tx.driverPerformance.findUnique({
        where: { driverId: driver.id }
      });

      if (performance) {
        // Decrease acceptance rate by 5%, but never below 0%
        const currentRate = performance.acceptanceRate || 100;
        newAcceptanceRate = Math.max(0, currentRate - 5);

        await tx.driverPerformance.update({
          where: { driverId: driver.id },
          data: {
            acceptanceRate: newAcceptanceRate,
            lastCalculated: new Date()
          }
        });
      }

      return updatedAssignment;
    });

    // Send real-time notifications
    try {
      // 1. Remove job from driver's UI instantly
      await pusher.trigger(`driver-${driver.id}`, 'job-removed', {
        jobId,
        reason: 'declined',
        message: 'Job declined and removed from your schedule',
        timestamp: new Date().toISOString()
      });

      // 2. Update acceptance rate
      await pusher.trigger(`driver-${driver.id}`, 'acceptance-rate-updated', {
        acceptanceRate: newAcceptanceRate,
        change: -5,
        reason: 'job_declined',
        jobId,
        timestamp: new Date().toISOString()
      });

      // 3. Notify admin channel
      await pusher.trigger('admin-drivers', 'driver-acceptance-rate-updated', {
        driverId: driver.id,
        driverName: driver.User?.name || 'Unknown',
        acceptanceRate: newAcceptanceRate,
        change: -5,
        reason: 'job_declined',
        jobId,
        timestamp: new Date().toISOString()
      });

      // 4. Update driver schedule
      await pusher.trigger(`driver-${driver.id}`, 'schedule-updated', {
        type: 'job_removed',
        jobId,
        acceptanceRate: newAcceptanceRate,
        timestamp: new Date().toISOString()
      });

      // 5. Update admin schedule
      await pusher.trigger('admin-schedule', 'driver-performance-updated', {
        driverId: driver.id,
        acceptanceRate: newAcceptanceRate,
        type: 'acceptance_rate_decreased',
        timestamp: new Date().toISOString()
      });

      // 6. Update admin/orders panel
      await pusher.trigger('admin-orders', 'order-status-changed', {
        jobId,
        status: 'available',
        previousDriver: driver.id,
        driverName: driver.User?.name,
        reason: 'declined',
        timestamp: new Date().toISOString()
      });

      console.log('📡 Real-time notifications sent successfully');
    } catch (pusherError) {
      console.error('⚠️ Failed to send Pusher notifications:', pusherError);
      // Don't fail the request if Pusher fails
    }

    // Auto-reassign to next available driver
    try {
      const availableDrivers = await prisma.driver.findMany({
        where: {
          id: { not: driver.id },
          status: 'active',
          onboardingStatus: 'approved',
          DriverAvailability: {
            status: 'online'
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
        // Filter by capacity
        const eligibleDrivers = availableDrivers.filter(d => {
          const availability = d.DriverAvailability;
          return availability && availability.currentCapacityUsed < availability.maxConcurrentDrops;
        });

        if (eligibleDrivers.length > 0) {
          // Offer to the best available driver (highest acceptance rate)
          const nextDriver = eligibleDrivers[0];
          
          // Create new assignment
          await prisma.assignment.create({
            data: {
              id: `assign_${jobId}_${nextDriver.id}_${Date.now()}`,
              bookingId: jobId,
              driverId: nextDriver.id,
              status: 'invited',
              round: 1,
              expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
              updatedAt: new Date()
            }
          });

          // Notify next driver
          await pusher.trigger(`driver-${nextDriver.id}`, 'job-offer', {
            jobId,
            message: `New job offer (auto-reassigned)`,
            expiresIn: 600,
            timestamp: new Date().toISOString()
          });

          // Notify admin about reassignment
          await pusher.trigger('admin-orders', 'order-reassigned', {
            jobId,
            previousDriver: driver.id,
            previousDriverName: driver.User?.name,
            newDriver: nextDriver.id,
            newDriverName: nextDriver.User?.name,
            timestamp: new Date().toISOString()
          });

          console.log(`✅ Job auto-reassigned to driver: ${nextDriver.User?.name}`);
        } else {
          console.log('⚠️ No drivers with available capacity');
        }
      } else {
        console.log('⚠️ No available drivers for auto-reassignment');
      }
    } catch (reassignError) {
      console.error('❌ Failed to auto-reassign job:', reassignError);
      // Continue even if reassignment fails
    }

    return NextResponse.json({
      success: true,
      message: 'Job declined successfully',
      acceptanceRate: newAcceptanceRate,
      change: -5
    });
  } catch (error: any) {
    console.error('Job decline API error:', error);

    if (error.message === 'No assignment found for this job') {
      return NextResponse.json(
        { error: 'No assignment found for this job' },
        { status: 404 }
      );
    }

    if (error.message === 'Assignment has expired') {
      return NextResponse.json(
        { error: 'Assignment has expired' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
