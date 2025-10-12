import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 Job step update API called:', {
      jobId: params.id,
      url: request.url
    });

    // Check driver authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'driver') {
      console.log('❌ User is not a driver:', { userRole, userId: session.user.id });
      return NextResponse.json(
        { error: 'Forbidden - Driver access required' },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const bookingId = params.id;

    console.log('✅ Driver authenticated:', { userId, userRole, bookingId });

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!driver) {
      console.log('❌ Driver profile not found for user:', userId);
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404 }
      );
    }

    // Get booking to verify access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        Assignment: true
      }
    });

    if (!booking) {
      console.log('❌ Booking not found:', bookingId);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if driver has access to this job
    const isAssignedToDriver = booking.driverId === driver.id;
    const hasAssignment = booking.Assignment && booking.Assignment.driverId === driver.id;

    if (!isAssignedToDriver && !hasAssignment) {
      console.log('❌ Access denied for job:', bookingId);
      return NextResponse.json(
        { error: 'You do not have access to this job' },
        { status: 403 }
      );
    }

    // Parse JSON body
    const body = await request.json();
    const { step, notes = '' } = body;

    if (!step) {
      return NextResponse.json(
        { error: 'Step is required' },
        { status: 400 }
      );
    }

    console.log('📝 Updating job step:', {
      bookingId,
      driverId: driver.id,
      step,
      notes: notes.substring(0, 50) + (notes.length > 50 ? '...' : '')
    });

    // Get or create assignment
    let assignment = booking.Assignment;
    
    if (!assignment) {
      // Create assignment if it doesn't exist
      assignment = await prisma.assignment.create({
        data: {
          id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          bookingId: bookingId,
          driverId: driver.id,
          status: 'accepted',
          claimedAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        }
      });
    }

    // Create job event
    const jobEvent = await prisma.jobEvent.create({
      data: {
        id: `je_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assignmentId: assignment.id,
        step: step as any, // Cast to JobStep enum
        notes: notes,
        createdBy: driver.id,
        payload: {
          timestamp: new Date().toISOString(),
          driverId: driver.id
        }
      }
    });

    // Update assignment status based on step
    let newStatus = assignment.status;
    if (step === 'job_completed') {
      newStatus = 'completed';
      
      // ✅ Create driver earnings when job is completed using REAL pricing engine
      const booking = await prisma.booking.findUnique({
        where: { id: assignment.bookingId },
        include: {
          BookingItem: true,
          BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
          BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
        }
      });
      
      if (booking) {
        try {
          // ✅ Use unified driver earnings service (100% to driver, daily cap £500)
          const { driverEarningsService } = await import('@/lib/services/driver-earnings-service');
          
          const earningsResult = await driverEarningsService.calculateEarnings({
            driverId: driver.id,
            bookingId: booking.id,
            assignmentId: assignment.id,
            bookingAmount: booking.totalGBP,
            distanceMiles: booking.baseDistanceMiles || 0,
            durationMinutes: booking.estimatedDurationMinutes || 0,
            dropCount: 1,
            hasHelper: false,
            urgencyLevel: 'standard',
            isOnTime: true,
          });

          // Save to database
          await driverEarningsService.saveToDatabase(earningsResult);
          
          console.log('✅ Driver earnings created using REAL engine:', {
            driverId: driver.id,
            assignmentId: assignment.id,
            bookingReference: booking.reference,
            customerPaid: booking.totalGBP,
            baseFare: earningsCalculation.routeBaseFare,
            mileageComponent: earningsCalculation.mileageComponent,
            performanceMultiplier: earningsCalculation.performanceMultiplier,
            finalPayout: earningsCalculation.finalPayout,
            netEarningsPence: driverEarnings,
          });
        } catch (earningsError) {
          console.error('❌ Failed to calculate driver earnings on job completion:', earningsError);
          // Don't fail the completion, just log the error
          // Admin will need to manually calculate earnings
        }

        // Update booking status to COMPLETED when driver completes the job
        await prisma.booking.update({
          where: { id: booking.id },
          data: { 
            status: 'COMPLETED',
            updatedAt: new Date()
          }
        });

        console.log('✅ Booking marked as COMPLETED:', {
          bookingId: booking.id,
          bookingReference: booking.reference,
          driverId: driver.id
        });

        // Send admin notification about order completion
        try {
          const { getPusherServer } = await import('@/lib/pusher');
          const pusher = getPusherServer();

          // Get driver details for notification
          const driverDetails = await prisma.driver.findUnique({
            where: { id: driver.id },
            include: { User: { select: { name: true } } }
          });

          // Notify admin dashboard about order completion
          await pusher.trigger('admin-notifications', 'order-completed', {
            bookingId: booking.id,
            bookingReference: booking.reference,
            customerName: booking.customerName,
            driverName: driverDetails?.User?.name || 'Unknown Driver',
            completedAt: new Date().toISOString(),
            message: `Order ${booking.reference} has been completed by driver ${driverDetails?.User?.name || 'Unknown'}`,
          });

          console.log('✅ Admin notification sent for order completion:', {
            bookingId: booking.id,
            bookingReference: booking.reference,
            driverName: driverDetails?.User?.name
          });
        } catch (notificationError) {
          console.error('❌ Error sending admin notification for order completion:', notificationError);
          // Don't fail the request if notification fails
        }
      }
    } else if (step === 'navigate_to_pickup' && assignment.status === 'invited') {
      newStatus = 'accepted';
    }

    if (newStatus !== assignment.status) {
      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { status: newStatus }
      });
    }

    console.log('✅ Job step updated successfully:', {
      bookingId,
      step,
      eventId: jobEvent.id,
      newStatus
    });

    return NextResponse.json({
      success: true,
      data: {
        eventId: jobEvent.id,
        step: jobEvent.step,
        notes: jobEvent.notes,
        createdAt: jobEvent.createdAt,
        assignmentStatus: newStatus
      }
    });

  } catch (error) {
    console.error('❌ Error updating job step:', error);
    return NextResponse.json(
      {
        error: 'Failed to update job step',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}