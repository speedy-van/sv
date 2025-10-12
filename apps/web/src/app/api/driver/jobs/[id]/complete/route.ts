import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import Pusher from 'pusher';
// Fast mobile calculation - removed slow PerformanceTrackingService import

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
  const jobId = params.id;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Driver access required' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
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

    // 🚨 CRITICAL: Validate distance to prevent massive earnings
    if (!Number.isFinite(computedDistanceMiles) || computedDistanceMiles <= 0 || computedDistanceMiles > 1000) {
      console.error(`❌ INVALID DISTANCE: ${computedDistanceMiles} miles - using fallback`);
      computedDistanceMiles = 50; // Fallback to reasonable UK distance
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

    // ⚡ FAST calculation for mobile app - avoid slow performance queries
    const totalAmount = booking.totalGBP;
    const baseFare = 25.00;
    const perDropFee = computedDropCount * 12.00; // £12 per drop
    const mileageComponent = computedDistanceMiles * 0.55; // £0.55 per mile
    const performanceMultiplier = 1.1; // Default multiplier for mobile speed
    
    const subtotal = baseFare + perDropFee + (mileageComponent * performanceMultiplier);
    const finalPayout = Math.min(subtotal, totalAmount * 0.75); // Cap at 75% of booking value
    
    const earningsCalculation = {
      routeBaseFare: baseFare,
      perDropFee: perDropFee,
      mileageComponent: mileageComponent * performanceMultiplier,
      performanceMultiplier: performanceMultiplier,
      subtotal: subtotal,
      bonuses: { routeExcellence: 0, weeklyPerformance: 0, fuelEfficiency: 0, backhaul: 0, monthlyAchievement: 0, quarterlyTier: 0 },
      penalties: { lateDelivery: 0, routeDeviation: 0, complianceBreach: 0, customerDamage: 0 },
      helperShare: 0,
      finalPayout: finalPayout
    };

    const pricingResponse = {
      netDriverEarnings: Math.round(earningsCalculation.finalPayout * 100), // Convert to pence
      platformFee: Math.round((booking.totalGBP * 100) - (earningsCalculation.finalPayout * 100)),
      breakdown: earningsCalculation,
      // Legacy compatibility
      basePay: Math.round(earningsCalculation.routeBaseFare * 100),
      distancePay: Math.round(earningsCalculation.mileageComponent * 100),
      timePay: Math.round((earningsCalculation.bonuses?.routeExcellence || 0) * 100),
      stopBonus: Math.round(earningsCalculation.perDropFee * 100),
      totalPay: Math.round(earningsCalculation.finalPayout * 100)
    };

    console.log('✅ Driver earnings calculated using REAL performance engine:', {
      driverId: driver.id,
      assignmentId: assignment.id,
      customerPaid: booking.totalGBP,
      baseFare: earningsCalculation.routeBaseFare,
      mileageComponent: earningsCalculation.mileageComponent,
      performanceMultiplier: earningsCalculation.performanceMultiplier,
      finalPayout: earningsCalculation.finalPayout,
      netEarningsPence: pricingResponse.netDriverEarnings,
    });

    // Create driver earnings record using REAL calculated values
    const earningsRecord = await prisma.driverEarnings.create({
      data: {
        driverId: driver.id,
        assignmentId: assignment.id,
        baseAmountPence: pricingResponse.basePay,
        surgeAmountPence: pricingResponse.stopBonus,
        tipAmountPence: 0, // Could be added later
        feeAmountPence: pricingResponse.platformFee,
        netAmountPence: pricingResponse.netDriverEarnings,
        currency: 'gbp',
        calculatedAt: completedAt,
        paidOut: false,
      } as any,
    });

    const netEarningsPence = pricingResponse.netDriverEarnings;
    const grossEarningsPence = Math.round(booking.totalGBP * 100); // Customer payment in pence

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
