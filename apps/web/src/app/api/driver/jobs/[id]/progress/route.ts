import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticateBearerToken } from '@/lib/bearer-auth';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate - support both bearer token and session
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('✅ Authenticated via bearer token for user:', userId);
    } else {
      console.log('❌ Bearer auth failed, trying session auth');
      const session = await getServerSession(authOptions);
      if (!session?.user || (session.user as any).role !== 'driver') {
        console.log('❌ Session auth failed or not driver role');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = (session.user as any).id;
      console.log('✅ Authenticated via session for user:', userId);
    }

    const { id: assignmentId } = await params;

    // Get driver
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Verify assignment belongs to driver and is active
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        driverId: driver.id,
        status: 'accepted',
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or not active' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { step, payload, mediaUrls, notes } = body;

    // Validate step
    const validSteps = [
      'navigate_to_pickup',
      'arrived_at_pickup',
      'loading_started',
      'loading_completed',
      'en_route_to_dropoff',
      'arrived_at_dropoff',
      'unloading_started',
      'unloading_completed',
      'job_completed',
      'customer_signature',
      'damage_notes',
      'item_count_verification',
    ];

    if (!validSteps.includes(step)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    // Get the latest event to check sequence
    const latestEvent = await prisma.jobEvent.findFirst({
      where: {
        assignmentId,
      },
      orderBy: {
        createdAt: 'desc'
      },
    });
    
    // Define step sequence
    const stepSequence = [
      'navigate_to_pickup',
      'arrived_at_pickup',
      'loading_started',
      'loading_completed',
      'en_route_to_dropoff',
      'arrived_at_dropoff',
      'unloading_started',
      'unloading_completed',
      'job_completed'
    ];

    // Check if step is already completed
    const existingEvent = await prisma.jobEvent.findFirst({
      where: {
        assignmentId,
        step,
      },
    });

    if (existingEvent) {
      return NextResponse.json(
        { error: 'Step already completed' },
        { status: 400 }
      );
    }

    // Check step sequence
    if (latestEvent) {
      const currentIndex = stepSequence.indexOf(latestEvent.step);
      const nextIndex = stepSequence.indexOf(step);

      // Verify this is the next step in sequence
      if (nextIndex !== currentIndex + 1) {
        return NextResponse.json(
          { 
            error: 'Invalid step sequence',
            details: `Expected step ${stepSequence[currentIndex + 1]}, got ${step}`
          },
          { status: 400 }
        );
      }
    } else {
      // If no events yet, only allow first step
      if (step !== stepSequence[0]) {
        return NextResponse.json(
          { 
            error: 'Invalid initial step',
            details: `First step must be ${stepSequence[0]}, got ${step}`
          },
          { status: 400 }
        );
      }
    }

    // Create job event
    const jobEvent = await prisma.jobEvent.create({
      data: {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assignmentId,
        step,
        payload: payload || null,
        mediaUrls: mediaUrls || [],
        notes: notes || null,
        createdBy: driver.id,
      },
    });

    // Get booking details for notifications
    const booking = await prisma.booking.findUnique({
      where: { id: assignment.bookingId },
      select: { 
        id: true, 
        reference: true, 
        customerName: true,
        customerPhone: true 
      }
    });

    // Send real-time notifications to customer
    if (booking) {
      try {
        // Notify customer about progress update
        await pusher.trigger(`tracking-${booking.reference}`, 'progress-update', {
          step: step,
          stepLabel: getStepLabel(step),
          timestamp: new Date().toISOString(),
          driverId: driver.id,
          bookingId: booking.id,
          bookingReference: booking.reference,
          progress: getProgressPercentage(step),
          message: getStepMessage(step),
        });

        // Notify customer about job status change
        await pusher.trigger(`booking-${booking.reference}`, 'job-status-update', {
          step: step,
          stepLabel: getStepLabel(step),
          timestamp: new Date().toISOString(),
          driverId: driver.id,
          bookingId: booking.id,
          bookingReference: booking.reference,
          status: getStatusFromStep(step),
          message: getStepMessage(step),
        });

        // Notify admin dashboard
        await pusher.trigger('admin-tracking', 'progress-update', {
          step: step,
          stepLabel: getStepLabel(step),
          timestamp: new Date().toISOString(),
          driverId: driver.id,
          bookingId: booking.id,
          bookingReference: booking.reference,
          customerName: booking.customerName,
          progress: getProgressPercentage(step),
        });

        console.log('✅ Real-time progress notifications sent:', {
          step,
          bookingReference: booking.reference,
          driverId: driver.id
        });
      } catch (notificationError) {
        console.error('❌ Error sending progress notifications:', notificationError);
        // Don't fail the request if notifications fail
      }
    }

    // If job is completed, update assignment status and booking status
    if (step === 'job_completed') {
      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { status: 'completed' },
      });

      // Update booking status to COMPLETED
      const booking = await prisma.booking.findUnique({
        where: { id: assignment.bookingId },
        select: { id: true, reference: true, customerName: true }
      });

      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { 
            status: 'COMPLETED',
            updatedAt: new Date()
          }
        });

        console.log('✅ Booking marked as COMPLETED via progress API:', {
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

          console.log('✅ Admin notification sent for order completion via progress API:', {
            bookingId: booking.id,
            bookingReference: booking.reference,
            driverName: driverDetails?.User?.name
          });
        } catch (notificationError) {
          console.error('❌ Error sending admin notification for order completion via progress API:', notificationError);
          // Don't fail the request if notification fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      event: {
        id: jobEvent.id,
        step: jobEvent.step,
        payload: jobEvent.payload,
        mediaUrls: jobEvent.mediaUrls,
        notes: jobEvent.notes,
        createdAt: jobEvent.createdAt,
      },
    });
  } catch (error) {
    console.error('Job progress API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for progress tracking
function getStepLabel(step: string): string {
  const stepLabels: Record<string, string> = {
    navigate_to_pickup: 'En Route to Pickup',
    arrived_at_pickup: 'Arrived at Pickup',
    loading_started: 'Loading Started',
    loading_completed: 'Loading Completed',
    en_route_to_dropoff: 'En Route to Delivery',
    arrived_at_dropoff: 'Arrived at Delivery',
    unloading_started: 'Unloading Started',
    unloading_completed: 'Unloading Completed',
    job_completed: 'Job Completed',
    customer_signature: 'Customer Signature',
    damage_notes: 'Damage Notes',
    item_count_verification: 'Item Count Verification',
  };

  return stepLabels[step] || step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getProgressPercentage(step: string): number {
  const stepProgress: Record<string, number> = {
    navigate_to_pickup: 20,
    arrived_at_pickup: 30,
    loading_started: 40,
    loading_completed: 50,
    en_route_to_dropoff: 70,
    arrived_at_dropoff: 80,
    unloading_started: 90,
    unloading_completed: 95,
    job_completed: 100,
  };

  return stepProgress[step] || 0;
}

function getStatusFromStep(step: string): string {
  const statusMap: Record<string, string> = {
    navigate_to_pickup: 'in_progress',
    arrived_at_pickup: 'in_progress',
    loading_started: 'in_progress',
    loading_completed: 'in_progress',
    en_route_to_dropoff: 'in_progress',
    arrived_at_dropoff: 'in_progress',
    unloading_started: 'in_progress',
    unloading_completed: 'in_progress',
    job_completed: 'completed',
  };

  return statusMap[step] || 'in_progress';
}

function getStepMessage(step: string): string {
  const messages: Record<string, string> = {
    navigate_to_pickup: 'Your driver is on the way to pickup location',
    arrived_at_pickup: 'Your driver has arrived at pickup location',
    loading_started: 'Loading has started',
    loading_completed: 'Loading completed, heading to delivery location',
    en_route_to_dropoff: 'Your driver is on the way to delivery location',
    arrived_at_dropoff: 'Your driver has arrived at delivery location',
    unloading_started: 'Unloading has started',
    unloading_completed: 'Unloading completed',
    job_completed: 'Your delivery has been completed successfully',
  };

  return messages[step] || 'Progress update received';
}
