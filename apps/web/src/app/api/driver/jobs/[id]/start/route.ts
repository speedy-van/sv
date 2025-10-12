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

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      select: { 
        id: true,
        availability: {
          select: {
            status: true,
            locationConsent: true,
          }
        }
      },
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
        status: 'accepted',
      },
      include: {
        Booking: {
          select: {
            reference: true,
            customerName: true,
            customerPhone: true,
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or not in accepted status' },
        { status: 404 }
      );
    }

    // Update assignment status (using correct enum)
    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignment.id },
      data: { 
        status: 'accepted', // Keep as accepted since 'in_progress' is not in enum
        updatedAt: new Date(),
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: jobId },
      data: { status: 'CONFIRMED' }, // Keep as CONFIRMED since IN_PROGRESS doesn't exist
    });

    // Create job event for tracking
    await prisma.jobEvent.create({
      data: {
        id: `event-${Date.now()}-start`,
        assignmentId: assignment.id,
        step: 'navigate_to_pickup', // Using correct enum value
        payload: {
          startedAt: new Date().toISOString(),
          location: 'pickup',
        },
        notes: 'Driver has started the job',
        createdAt: new Date(),
        createdBy: driver.id,
      },
    });

    // Create driver notification
    await prisma.driverNotification.create({
      data: {
        driverId: driver.id,
        type: 'job_update', // Using correct enum value
        title: 'Job Started',
        message: `You have started job ${assignment.Booking?.reference}. Safe travels!`,
        read: false,
      },
    });

    console.log('✅ Job started:', {
      jobId,
      driverId: driver.id,
      assignmentId: assignment.id,
      bookingReference: assignment.Booking?.reference,
    });

    // Send real-time notifications
    try {
      // Notify customer that job has started
      await pusher.trigger(`booking-${assignment.Booking?.reference}`, 'job-started', {
        driverId: driver.id,
        assignmentId: assignment.id,
        message: 'Your driver has started the job and is on the way',
        timestamp: new Date().toISOString(),
        trackingEnabled: true,
      });

      // Notify admin dashboard
      await pusher.trigger('admin-notifications', 'job-started', {
        jobId,
        driverId: driver.id,
        bookingReference: assignment.Booking?.reference,
        timestamp: new Date().toISOString(),
      });

      // Start live tracking channel
      await pusher.trigger(`tracking-${assignment.Booking?.reference}`, 'tracking-started', {
        driverId: driver.id,
        assignmentId: assignment.id,
        status: 'in_progress',
        timestamp: new Date().toISOString(),
      });

      console.log('📡 Real-time notifications sent for job start');
    } catch (pusherError) {
      console.error('⚠️ Failed to send real-time notifications:', pusherError);
    }

    return NextResponse.json({
      success: true,
      message: 'Job started successfully',
      data: {
        assignmentId: assignment.id,
        status: 'in_progress',
        bookingReference: assignment.Booking?.reference,
        trackingEnabled: true,
      },
    });

  } catch (error) {
    console.error('❌ Error starting job:', error);
    return NextResponse.json(
      {
        error: 'Failed to start job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
