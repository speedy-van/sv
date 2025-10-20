import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import Pusher from 'pusher';
// Fast mobile calculation - removed slow PerformanceTrackingService import

export const dynamic = 'force-dynamic';

// CORS headers for mobile app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  try {
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      if (bearerAuth.user.role !== 'driver') {
        return NextResponse.json(
          { error: 'Forbidden - Driver access required' },
          { status: 403, headers: corsHeaders }
        );
      }
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      
      if (!session?.user || (session.user as any).role !== 'driver') {
        return NextResponse.json(
          { error: 'Unauthorized - Driver access required' },
          { status: 401, headers: corsHeaders }
        );
      }

      userId = (session.user as any).id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }
    const body = await request.json();
    const {
      completionNotes,
      customerSignature,
      photos,
      waitingDurationMinutes = 0,
      loadingDurationMinutes = 0,
      unloadingDurationMinutes = 0,
      slaDelayMinutes = 0,
      tollCostsPence = 0,
      parkingCostsPence = 0,
      dropCount,
      perLegDistanceMiles,
      usedCapacityCubicMeters,
      vehicleCapacityCubicMeters,
      adminApprovedBonusPence = 0,
      adminApprovalId,
      drivingDurationMinutes,
    } = body;

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
        id: true,
        reference: true,
        customerName: true,
        customerPhone: true,
        totalGBP: true,
        baseDistanceMiles: true,
        estimatedDurationMinutes: true,
        urgency: true,
        BookingItem: {
          select: {
            id: true,
            name: true,
            quantity: true,
            volumeM3: true,
          }
        }
      }
    });

    const completedAt = new Date();

    // Update assignment status to completed
    await prisma.assignment.update({
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

    const fallbackDistanceMiles = booking?.baseDistanceMiles ?? 0;
    const perLegMilesArray = Array.isArray(perLegDistanceMiles)
      ? perLegDistanceMiles.map((m: number) => (Number.isFinite(Number(m)) ? Number(m) : 0))
      : undefined;
    const aggregatedPerLegMiles = perLegMilesArray && perLegMilesArray.length > 0
      ? perLegMilesArray.reduce((sum, leg) => sum + leg, 0)
      : undefined;
    let computedDistanceMiles = aggregatedPerLegMiles && aggregatedPerLegMiles > 0
      ? aggregatedPerLegMiles
      : (typeof fallbackDistanceMiles === 'number' ? fallbackDistanceMiles : 0);

    // FIXED: Validate distance - reject if invalid (no fallback)
    if (!Number.isFinite(computedDistanceMiles) || computedDistanceMiles <= 0) {
      logger.error('Invalid distance data for job completion', undefined, {
        assignmentId: assignment.id,
        driverId: driver.id,
        computedDistanceMiles,
        perLegDistanceMiles,
        fallbackDistanceMiles,
      });
      return NextResponse.json(
        { 
          error: 'Invalid distance data. Please ensure GPS tracking is enabled and retry.',
          code: 'INVALID_DISTANCE',
          details: {
            receivedDistance: computedDistanceMiles,
            suggestion: 'Check GPS permissions and location services'
          }
        },
        { status: 400 }
      );
    }
    
    // Sanity check: reject unreasonably long distances (>500 miles for UK)
    if (computedDistanceMiles > 500) {
      logger.warn('Unusually long distance detected', {
        jobId,
        driverId: driver.id,
        distance: computedDistanceMiles,
      });
      return NextResponse.json(
        { 
          error: 'Distance exceeds maximum allowed (500 miles). Please contact support.',
          code: 'DISTANCE_TOO_LONG',
          details: { distance: computedDistanceMiles }
        },
        { status: 400 }
      );
    }
    const computedDrivingMinutes = Math.max(0, Number(drivingDurationMinutes) || booking?.estimatedDurationMinutes || 0);
    let computedLoadingMinutes = Math.max(0, Number(loadingDurationMinutes) || 0);
    let computedUnloadingMinutes = Math.max(0, Number(unloadingDurationMinutes) || 0);
    if (computedLoadingMinutes === 0 && computedUnloadingMinutes === 0 && booking?.estimatedDurationMinutes) {
      const handlingEstimate = Math.max(20, Math.round(booking.estimatedDurationMinutes * 0.3));
      computedLoadingMinutes = Math.ceil(handlingEstimate / 2);
      computedUnloadingMinutes = handlingEstimate - computedLoadingMinutes;
    }

    const computedWaitingMinutes = Math.max(0, Number(waitingDurationMinutes) || 0);
    const computedSlaDelayMinutes = Math.max(0, Number(slaDelayMinutes) || 0);
    const computedDropCount = Math.max(1, Number(dropCount) || 1);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // ============================================================================
    // UNIFIED EARNINGS CALCULATION - SINGLE SOURCE OF TRUTH
    // Used by: Web Portal, iOS App, Android App
    // ============================================================================
    
    const { driverEarningsService } = await import('@/lib/services/driver-earnings-service');
    
    // Prepare input for unified earnings service
    const earningsInput = {
      assignmentId: assignment.id,
      driverId: driver.id,
      bookingId: jobId,
      distanceMiles: computedDistanceMiles,
      durationMinutes: computedDrivingMinutes + computedLoadingMinutes + computedUnloadingMinutes,
      dropCount: computedDropCount,
      loadingMinutes: computedLoadingMinutes,
      unloadingMinutes: computedUnloadingMinutes,
      drivingMinutes: computedDrivingMinutes,
      waitingMinutes: computedWaitingMinutes,
      customerPaymentPence: booking.totalGBP, // FIXED: totalGBP is already in pence
      urgencyLevel: (booking.urgency as 'standard' | 'express' | 'premium') || 'standard',
      serviceType: 'standard' as const,
      onTimeDelivery: computedSlaDelayMinutes === 0,
      tollCostsPence: tollCostsPence,
      parkingCostsPence: parkingCostsPence,
      adminApprovedBonusPence: adminApprovedBonusPence,
      adminApprovalId: adminApprovalId,
    };
    
    // Calculate earnings using unified service
    const earningsResult = await driverEarningsService.calculateEarnings(earningsInput);
    
    if (!earningsResult.success) {
      throw new Error('Failed to calculate driver earnings');
    }
    
    const breakdown = earningsResult.breakdown;
    
    console.log('✅ Driver earnings calculated using UNIFIED service:', {
      driverId: driver.id,
      assignmentId: assignment.id,
      customerPaid: booking.totalGBP,
      baseFare: breakdown.baseFare / 100,
      perDropFee: breakdown.perDropFee / 100,
      mileageFee: breakdown.mileageFee / 100,
      netEarnings: breakdown.netEarnings / 100,
      warnings: earningsResult.warnings,
    });
    
    // Create driver earnings record using unified calculation
    const earningsRecord = await prisma.driverEarnings.create({
      data: {
        driverId: driver.id,
        assignmentId: assignment.id,
        baseAmountPence: breakdown.baseFare,
        surgeAmountPence: breakdown.perDropFee + breakdown.mileageFee,
        tipAmountPence: 0,
        feeAmountPence: 0, // No platform fee - driver gets full calculated amount
        netAmountPence: breakdown.netEarnings,
        grossEarningsPence: breakdown.grossEarnings,
        platformFeePence: 0, // No platform fee or percentage deduction
        rawNetEarningsPence: breakdown.netEarnings,
        currency: 'gbp',
        calculatedAt: completedAt,
        paidOut: false,
        requiresAdminApproval: earningsResult.requiresAdminApproval,
        adminApprovalId: adminApprovalId,
      } as any,
    });
    
    const netEarningsPence = breakdown.netEarnings;
    const grossEarningsPence = breakdown.grossEarnings;
    
    // Prepare response with detailed breakdown for mobile apps
    const pricingResponse = {
      netDriverEarnings: netEarningsPence,
      platformFee: 0, // No platform fee - driver gets full calculated earnings
      breakdown: {
        baseFare: breakdown.baseFare,
        perDropFee: breakdown.perDropFee,
        mileageFee: breakdown.mileageFee,
        timeFee: breakdown.timeFee,
        bonuses: breakdown.bonuses,
        penalties: breakdown.penalties,
        reimbursements: breakdown.reimbursements,
        subtotal: breakdown.subtotal,
        grossEarnings: breakdown.grossEarnings,
        helperShare: breakdown.helperShare,
        netEarnings: breakdown.netEarnings,
      },
      // Legacy compatibility for older app versions
      basePay: breakdown.baseFare,
      distancePay: breakdown.mileageFee,
      timePay: breakdown.timeFee,
      stopBonus: breakdown.perDropFee,
      totalPay: breakdown.netEarnings,
      warnings: earningsResult.warnings,
      recommendations: earningsResult.recommendations,
    };

    // Stage 2: Create driver notification (FINAL confirmation)
    await prisma.driverNotification.create({
      data: {
        driverId: driver.id,
        type: 'payout_processed',
        title: 'Payment Confirmed! 💰',
        message: `Your payment for ${booking?.reference} has been confirmed! You earned £${(netEarningsPence / 100).toFixed(2)}.`,
        read: false,
      },
    });

    logger.info('Driver job completed', {
      jobId,
      driverId: driver.id,
      assignmentId: assignment.id,
      bookingReference: booking?.reference,
      earningsPence: netEarningsPence,
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
        earnings: netEarningsPence,
        timestamp: completedAt.toISOString(),
      });

      // Stop live tracking
      await pusher.trigger(`tracking-${booking?.reference}`, 'tracking-completed', {
        driverId: driver.id,
        assignmentId: assignment.id,
        status: 'completed',
        timestamp: completedAt.toISOString(),
      });

      logger.info('Real-time notifications sent for job completion', {
        bookingReference: booking?.reference,
        driverId: driver.id,
        assignmentId: assignment.id,
      });
    } catch (pusherError) {
      logger.error('Failed to send real-time notifications', pusherError as Error, {
        service: 'driver-job-complete',
        userId: driver.id,
        requestId: jobId,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Job completed successfully',
      data: {
        assignmentId: assignment.id,
        status: 'completed',
        bookingReference: booking?.reference,
        earnings: {
          gross: grossEarningsPence,
          net: netEarningsPence,
          platformFee: pricingResponse.platformFee,
          currency: 'gbp',
        },
        pricing: pricingResponse,
        completedAt: completedAt.toISOString(),
      },
    });

  } catch (error) {
    logger.error('Error completing driver job', error as Error, {
      service: 'driver-job-complete',
      requestId: jobId,
    });
    return NextResponse.json(
      {
        error: 'Failed to complete job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
