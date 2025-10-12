import { NextResponse, NextRequest } from 'next/server';
import { requireDriver } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const authResult = await requireDriver(request);
    if (authResult instanceof NextResponse) {
        return authResult;
    }
    const user = authResult;

  const userId = user.id;

  try {
    // Get driver
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Get active assignment (accepted status)
    const activeAssignment = await prisma.assignment.findFirst({
      where: {
        driverId: driver.id,
        status: 'accepted',
      },
      include: {
        Booking: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
          },
        },
        JobEvent: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!activeAssignment) {
      return NextResponse.json({ activeJob: null });
    }

    // Determine current step based on events
    const events = activeAssignment.JobEvent;
    let currentStep = 'navigate_to_pickup';
    let completedSteps: string[] = [];

    if (events.length > 0) {
      const lastEvent = events[events.length - 1];
      currentStep = lastEvent.step;

      // Build completed steps array
      completedSteps = events.map(event => event.step);
    }

    // Define step order for the stepper
    const stepOrder = [
      'navigate_to_pickup',
      'arrived_at_pickup',
      'loading_started',
      'loading_completed',
      'en_route_to_dropoff',
      'arrived_at_dropoff',
      'unloading_started',
      'unloading_completed',
      'job_completed',
    ];

    // Calculate progress percentage
    const currentStepIndex = stepOrder.indexOf(currentStep);
    const progressPercentage = Math.max(
      0,
      Math.min(100, (currentStepIndex / (stepOrder.length - 1)) * 100)
    );

    return NextResponse.json({
      activeJob: {
        id: activeAssignment.id,
        jobId: activeAssignment.bookingId,
        status: activeAssignment.status,
        currentStep,
        completedSteps,
        progressPercentage,
        stepOrder,
        events: events.map(event => ({
          id: event.id,
          step: event.step,
          payload: event.payload,
          mediaUrls: event.mediaUrls,
          notes: event.notes,
          createdAt: event.createdAt,
        })),
        job: {
          id: activeAssignment.Booking.id,
          reference: activeAssignment.Booking.reference,
          pickupAddress: activeAssignment.Booking.pickupAddress?.label || '',
          dropoffAddress: activeAssignment.Booking.dropoffAddress?.label || '',
          pickupLat: activeAssignment.Booking.pickupAddress?.lat || 0,
          pickupLng: activeAssignment.Booking.pickupAddress?.lng || 0,
          dropoffLat: activeAssignment.Booking.dropoffAddress?.lat || 0,
          dropoffLng: activeAssignment.Booking.dropoffAddress?.lng || 0,
          scheduledAt: activeAssignment.Booking.scheduledAt,
          totalGBP: activeAssignment.Booking.totalGBP,
          customerName: activeAssignment.Booking.customerName,
          customerPhone: activeAssignment.Booking.customerPhone,
          customerEmail: activeAssignment.Booking.customerEmail,
        },
      },
    });
  } catch (error) {
    console.error('Active job API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

