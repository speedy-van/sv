import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';
import Pusher from 'pusher';
import { DriverEarningsService } from '@/lib/services/driver-earnings-service';

export const dynamic = 'force-dynamic';

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

/**
 * POST /api/driver/jobs/[id]/update-progress
 * Update job progress step (for driver tracking)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate driver
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401, headers: corsHeaders }
        );
      }
      userId = (session.user as any).id;
    }

    const { id: bookingId } = await params;
    const { step, payload } = await request.json();

    console.log('📊 Updating job progress:', { bookingId, step, userId });

    // Get driver
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get booking with assignment
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        Assignment: {
          where: { driverId: driver.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        pickupAddress: true,
        dropoffAddress: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if driver is assigned to this job
    const assignment = booking.Assignment[0];
    if (!assignment || assignment.driverId !== driver.id) {
      return NextResponse.json(
        { success: false, error: 'Not assigned to this job' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Create job event
    const jobEvent = await prisma.jobEvent.create({
      data: {
        assignmentId: assignment.id,
        step: step,
        payload: payload || {},
        createdBy: userId, // ✅ Required field
        createdAt: new Date(),
      },
    });

    console.log('✅ Job event created:', { step, eventId: jobEvent.id });

    // Update booking status based on step
    // Don't update status - it's managed by accept/complete actions
    // Progress tracking is separate from booking status
    // The booking stays CONFIRMED until driver completes it
    
    // Only update to COMPLETED when job is finished
    if (step === 'job_completed' && booking.status !== 'COMPLETED') {
      // Update both booking and assignment status
      await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          status: 'COMPLETED',
          actualDeliveryTime: new Date(),
        },
      });

      await prisma.assignment.update({
        where: { id: assignment.id },
        data: {
          status: 'completed',
          // ✅ Remove completedAt - not in schema
        },
      });

      console.log('✅ Booking and Assignment marked as COMPLETED');

      // Calculate and save driver earnings
      console.log('💰 Starting earnings calculation for completed job...');
      try {
        const driverEarningsService = new DriverEarningsService();
        
        const earningsInput = {
          driverId: driver.id,
          bookingId: booking.id,
          assignmentId: assignment.id,
          customerPaymentPence: booking.totalGBP,
          distanceMiles: booking.baseDistanceMiles || 0,
          durationMinutes: booking.estimatedDurationMinutes || 60,
          dropCount: 1,
          urgencyLevel: (booking.urgency as 'standard' | 'express' | 'premium') || 'standard',
          onTimeDelivery: true,
        };

        console.log('📊 Earnings input:', earningsInput);

        const earningsResult = await driverEarningsService.calculateEarnings(earningsInput);
        
        console.log('📊 Earnings calculated:', {
          grossEarnings: earningsResult.breakdown.grossEarnings,
          netEarnings: earningsResult.breakdown.netEarnings,
          netEarningsPounds: (earningsResult.breakdown.netEarnings / 100).toFixed(2),
        });

        // Save earnings to database (needs both input and result)
        const savedEarningsId = await driverEarningsService.saveEarnings(earningsInput, earningsResult);
        
        console.log('✅ Driver earnings SAVED to database:', {
          earningsId: savedEarningsId,
          driverId: driver.id,
          assignmentId: assignment.id,
          netEarnings: earningsResult.breakdown.netEarnings,
          netEarningsPounds: (earningsResult.breakdown.netEarnings / 100).toFixed(2),
        });

      } catch (earningsError: any) {
        console.error('❌ CRITICAL ERROR calculating/saving driver earnings:', {
          error: earningsError.message,
          stack: earningsError.stack,
          driverId: driver.id,
          bookingId: booking.id,
        });
        // Don't fail the entire request - earnings can be recalculated later
      }
    }

    // Send real-time update to customer tracking
    await pusher.trigger(`tracking-${booking.reference}`, 'job-progress-updated', {
      bookingReference: booking.reference,
      step: step,
      timestamp: new Date().toISOString(),
      message: getStepMessage(step),
    });

    console.log('📡 Customer tracking notified:', `tracking-${booking.reference}`);

    return NextResponse.json({
      success: true,
      step: step,
      timestamp: new Date().toISOString(),
      message: getStepMessage(step),
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('❌ Error updating job progress:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update progress' },
      { status: 500, headers: corsHeaders }
    );
  }
}

function getStepMessage(step: string): string {
  const messages: Record<string, string> = {
    'navigate_to_pickup': 'Driver is heading to pickup location',
    'arrived_at_pickup': 'Driver has arrived at pickup location',
    'loading_started': 'Loading items into vehicle',
    'loading_completed': 'Items loaded - en route to delivery',
    'en_route_to_dropoff': 'On the way to delivery location',
    'arrived_at_dropoff': 'Driver has arrived at delivery location',
    'unloading_started': 'Unloading items',
    'unloading_completed': 'Items unloaded successfully',
    'job_completed': 'Delivery completed successfully',
  };
  return messages[step] || 'Status updated';
}

