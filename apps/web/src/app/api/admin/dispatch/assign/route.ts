import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';
import { upsertAssignment } from '@/lib/utils/assignment-helpers';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, driverId }: { jobId: string; driverId: string } =
      await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // If driverId is 'auto', find the best available driver
    let finalDriverId: string = driverId;
    if (driverId === 'auto') {
      const job = await prisma.booking.findUnique({
        where: { id: jobId },
        include: {
          driver: true,
        },
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      // Find available drivers within radius (simplified logic)
      const availableDrivers = await prisma.driver.findMany({
        where: {
          status: 'active',
          onboardingStatus: 'approved',
          DriverAvailability: {
            status: 'AVAILABLE',
          },
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
              isActive: true
            }
          },
          DriverAvailability: true,
          Booking: {
            where: {
              status: {
                in: ['CONFIRMED'],
              },
            },
          },
        },
      });

      // Filter drivers by capacity and rating
      const eligibleDrivers = availableDrivers.filter(driver => {
        const activeJobs = driver.Booking.length;
        const rating = driver.rating || 0;
        return activeJobs < 3 && rating >= 4.0; // Basic filtering
      });

      if (eligibleDrivers.length === 0) {
        return NextResponse.json(
          {
            error: 'No eligible drivers available for auto-assignment',
          },
          { status: 400 }
        );
      }

      // Select the first eligible driver (in a real app, you'd use more sophisticated logic)
      finalDriverId = eligibleDrivers[0].id;
    }

    // Check if driver exists and is available
    const driver = await prisma.driver.findUnique({
      where: { id: finalDriverId },
      include: {
        DriverAvailability: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            isActive: true
          }
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    if (driver.onboardingStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Driver is not approved' },
        { status: 400 }
      );
    }

    // Check if job is already assigned
    const existingJob = await prisma.booking.findUnique({
      where: { id: jobId },
      include: {
        driver: true,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (existingJob.driverId) {
      return NextResponse.json(
        { error: 'Job is already assigned' },
        { status: 400 }
      );
    }

    // Assign the job to the driver
    const updatedJob = await prisma.booking.update({
      where: { id: jobId },
      data: {
        driverId: finalDriverId,
        status: 'CONFIRMED',
      },
      include: {
        driver: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                isActive: true
              }
            },
          },
        },
        pickupAddress: {
          select: {
            label: true,
            postcode: true
          }
        },
        dropoffAddress: {
          select: {
            label: true,
            postcode: true
          }
        },
      },
    });

    // Create or update assignment record
    const assignment = await upsertAssignment(prisma, jobId, {
      driverId: finalDriverId,
      status: 'accepted',
      claimedAt: new Date(),
    });
    const assignmentId = assignment.id;

    // Create job event
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await prisma.jobEvent.create({
      data: {
        id: eventId,
        assignmentId: assignmentId,
        step: 'navigate_to_pickup',
        payload: {
          assignedBy: 'admin',
          reason: 'Assigned via dispatch panel',
          assignedAt: new Date().toISOString(),
          action: 'job_assigned',
        },
        notes: `Job assigned to driver ${driver.User?.name || 'Unknown'} via dispatch panel`,
        createdBy: (session.user as any).id,
      }
    });

    console.log('✅ Job assigned successfully:', {
      jobId,
      driverId: finalDriverId,
      reference: updatedJob.reference,
      driverName: updatedJob.driver?.User.name
    });

    // ========================================
    // 🚨 CRITICAL: SEND REAL-TIME NOTIFICATIONS
    // ========================================
    try {
      const pusher = getPusherServer();

      // PRIMARY EVENT: Notify driver with "route-matched" event
      console.log('📡 Sending route-matched event to driver channel:', `driver-${finalDriverId}`);
      await pusher.trigger(`driver-${finalDriverId}`, 'route-matched', {
        type: 'single-order',
        bookingId: updatedJob.id,
        bookingReference: updatedJob.reference,
        orderNumber: updatedJob.reference,  // ✅ CRITICAL: Same ID as Admin/Customer sees
        customerName: updatedJob.customerName,
        assignmentId: assignmentId,
        jobCount: 1,
        assignedAt: new Date().toISOString(),
        message: `New order ${updatedJob.reference} assigned to you`,
        from: updatedJob.pickupAddress?.label || 'Pickup location',
        to: updatedJob.dropoffAddress?.label || 'Delivery location',
        scheduledAt: updatedJob.scheduledAt,
      });

      // BACKWARD COMPATIBILITY: Send job-assigned event
      console.log('📡 Sending job-assigned event to driver channel:', `driver-${finalDriverId}`);
      await pusher.trigger(`driver-${finalDriverId}`, 'job-assigned', {
        bookingId: updatedJob.id,
        bookingReference: updatedJob.reference,
        customerName: updatedJob.customerName,
        assignedAt: new Date().toISOString(),
        message: 'You have been assigned a new job',
      });

      // Notify other drivers that job is no longer available
      await pusher.trigger('drivers-channel', 'job-assigned-to-other', {
        bookingId: updatedJob.id,
        bookingReference: updatedJob.reference,
        assignedTo: driver.User?.name || 'Unknown',
        message: 'This job has been assigned to another driver',
      });

      // Notify customer about driver assignment
      await pusher.trigger(`booking-${updatedJob.reference}`, 'driver-assigned', {
        driverName: driver.User?.name || 'Unknown',
        assignedAt: new Date().toISOString(),
        message: 'Your driver has been assigned and will contact you soon',
      });

      // Notify admin dashboard
      await pusher.trigger('admin-notifications', 'driver-assigned', {
        bookingId: updatedJob.id,
        bookingReference: updatedJob.reference,
        driverName: driver.User?.name || 'Unknown',
        assignedAt: new Date().toISOString(),
      });

      console.log('✅ Real-time notifications sent successfully for dispatch assignment');
    } catch (notificationError) {
      console.error('❌ Error sending real-time notifications:', notificationError);
      // Don't fail the request if notifications fail, but log the error
    }
    // ========================================

    // Log the assignment for audit
    await prisma.auditLog.create({
      data: {
        actorId: (session.user as any).id,
        actorRole: (session.user as any).role || 'admin',
        action: 'job_assigned',
        targetType: 'booking',
        targetId: jobId,
        before: undefined,
        after: {
          driverId: finalDriverId,
          status: 'CONFIRMED',
        },
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job assigned successfully',
      data: {
        jobId,
        driverId: finalDriverId,
        driverName: updatedJob.driver?.User.name,
        bookingReference: updatedJob.reference,
        assignmentId: assignmentId,
      },
    });
  } catch (error) {
    console.error('Dispatch assignment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
