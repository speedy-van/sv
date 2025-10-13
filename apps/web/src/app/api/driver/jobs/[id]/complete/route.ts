import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pusher from 'pusher';

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Driver access required' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const { id: jobId } = params;
    const body = await request.json();
    const { completionNotes, customerSignature, photos } = body;

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      select: { id: true },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver record not found' },
        { status: 404 }
      );
    }

    // Get the assignment
    const assignment = await prisma.assignment.findFirst({
      where: {
        bookingId: jobId,
        driverId: driver.id,
        status: 'accepted', // Use accepted since in_progress doesn't exist
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or not in accepted status' },
        { status: 404 }
      );
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: jobId },
      select: {
        reference: true,
        customerName: true,
        customerPhone: true,
        totalGBP: true,
        baseDistanceMiles: true,
        estimatedDurationMinutes: true,
        scheduledAt: true,
      }
    });

    const completedAt = new Date();

    // Update assignment status to completed
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignment.id },
      data: { 
        status: 'completed',
        updatedAt: completedAt,
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: jobId },
      data: { status: 'COMPLETED' }, // Using correct enum value
    });

    // Create job completion event
    await prisma.jobEvent.create({
      data: {
        id: `event-${Date.now()}-complete`,
        assignmentId: assignment.id,
        step: 'job_completed', // Using correct enum value
        payload: {
          completedAt: completedAt.toISOString(),
          notes: completionNotes || 'Job completed successfully',
          customerSignature: customerSignature || null,
          photos: photos || [],
        },
        notes: completionNotes || 'Job completed successfully',
        createdAt: completedAt,
        createdBy: driver.id,
      },
    });

    // Calculate driver earnings using comprehensive pricing engine
    const { DriverPricingEngine } = await import('@/lib/pricing/driver-pricing-engine');
    
    const bookingItems = await prisma.bookingItem.findMany({
      where: { bookingId: jobId },
    });
    
    const earnings = DriverPricingEngine.calculateFromBooking({
      baseDistanceMiles: booking?.baseDistanceMiles || 0,
      estimatedDurationMinutes: booking?.estimatedDurationMinutes || 60,
      vehicleType: 'medium_van',
      itemsCount: bookingItems.length,
      hasStairs: false,
      floorCount: 0,
      scheduledAt: booking?.scheduledAt || new Date(),
      isUrgent: false,
    });
    
    const baseEarnings = earnings.totalEarnings;
    const surgeMultiplier = 1.0;
    const finalEarnings = Math.floor(baseEarnings * surgeMultiplier);
    
    const totalAmount = booking?.totalGBP || 0;
    const platformFee = Math.max(0, totalAmount - finalEarnings);

    // Create driver earnings record
    await prisma.driverEarnings.create({
      data: {
        driverId: driver.id,
        assignmentId: assignment.id,
        baseAmountPence: baseEarnings,
        surgeAmountPence: Math.floor(baseEarnings * (surgeMultiplier - 1)),
        tipAmountPence: 0, // Tips can be added later
        feeAmountPence: platformFee,
        netAmountPence: finalEarnings,
        currency: 'gbp',
        calculatedAt: completedAt,
        paidOut: false,
      },
    });

    // Create driver notification
    await prisma.driverNotification.create({
      data: {
        driverId: driver.id,
        type: 'job_completed', // Using correct enum value
        title: 'Job Completed! 🎉',
        message: `You have completed job ${booking?.reference} and earned £${(finalEarnings / 100).toFixed(2)}!`,
        read: false,
      },
    });

    console.log('✅ Job completed:', {
      jobId,
      driverId: driver.id,
      assignmentId: assignment.id,
      bookingReference: booking?.reference,
      earnings: finalEarnings,
    });

    // Send real-time notifications
    try {
      // Notify customer that job is completed
      await pusher.trigger(`booking-${booking?.reference}`, 'job-completed', {
        driverId: driver.id,
        assignmentId: assignment.id,
        message: 'Your job has been completed successfully',
        timestamp: completedAt.toISOString(),
        completionNotes: completionNotes,
      });

      // Notify admin dashboard
      await pusher.trigger('admin-notifications', 'job-completed', {
        jobId,
        driverId: driver.id,
        bookingReference: booking?.reference,
        earnings: finalEarnings,
        timestamp: completedAt.toISOString(),
      });

      // Stop live tracking
      await pusher.trigger(`tracking-${booking?.reference}`, 'tracking-completed', {
        driverId: driver.id,
        assignmentId: assignment.id,
        status: 'completed',
        timestamp: completedAt.toISOString(),
      });

      console.log('📡 Real-time notifications sent for job completion');
    } catch (pusherError) {
      console.error('⚠️ Failed to send real-time notifications:', pusherError);
    }

    return NextResponse.json({
      success: true,
      message: 'Job completed successfully',
      data: {
        assignmentId: assignment.id,
        status: 'completed',
        bookingReference: booking?.reference,
        earnings: {
          base: baseEarnings,
          surge: Math.floor(baseEarnings * (surgeMultiplier - 1)),
          total: finalEarnings,
          currency: 'gbp',
        },
        completedAt: completedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Error completing job:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
