/**
 * UK-Compliant Job Completion API
 * 
 * Handles both single orders and multiple drops routes
 * Fully compliant with UK regulations
 * Daily cap enforcement: £500
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { driverEarningsService } from '@/lib/services/driver-earnings-service';

export const dynamic = 'force-dynamic';

interface CompleteJobRequest {
  assignmentId: string;
  completionNotes?: string;
  customerSignature?: string;
  proofOfDelivery?: string[];
  actualDistance?: number;
  actualDuration?: number;
  tollCosts?: number;
  parkingCosts?: number;
  fuelUsed?: number;
  customerRating?: number;
}

/**
 * POST /api/driver/jobs/[id]/complete-uk
 * Complete a job with UK-compliant earnings calculation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assignmentId } = await params;
    const body: CompleteJobRequest = await request.json();

    // 1. Get assignment details
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        Booking: {
          include: {
            Drop: true,
          },
        },
        Driver: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.status === 'completed') {
      return NextResponse.json(
        { error: 'Assignment already completed' },
        { status: 400 }
      );
    }

    // 2. Determine if single order or multiple drops
    const isMultiDrop = assignment.Booking?.Drop?.length > 1;
    const dropCount = assignment.Booking?.Drop?.length || 1;

    // 3. Calculate distance and duration
    const distanceMiles = body.actualDistance || assignment.Booking?.baseDistanceMiles || 0;
    const durationMinutes = body.actualDuration || assignment.Booking?.estimatedDurationMinutes || 60;

    // 4. Break down time components
    const timeBreakdown = calculateTimeBreakdown(durationMinutes, dropCount);

    // 5. Prepare pricing input
    const pricingInput = {
      assignmentId: assignment.id,
      driverId: assignment.Driver ? assignment.Driver.id : assignment.driverId,
      bookingId: assignment.bookingId,
      distanceMiles,
      durationMinutes,
      dropCount,
      loadingMinutes: timeBreakdown.loading,
      unloadingMinutes: timeBreakdown.unloading,
      drivingMinutes: timeBreakdown.driving,
      waitingMinutes: timeBreakdown.waiting,
      customerPaymentPence: assignment.Booking?.totalGBP || 0,
      urgencyLevel: (assignment.Booking?.urgency as any) || 'standard',
      onTimeDelivery: isOnTime(assignment),
      customerRating: body.customerRating,
      tollCostsPence: body.tollCosts ? Math.round(body.tollCosts * 100) : 0,
      parkingCostsPence: body.parkingCosts ? Math.round(body.parkingCosts * 100) : 0,
      hasHelper: false,
      serviceType: (assignment.Booking?.Drop?.[0]?.serviceTier === 'priority' || assignment.Booking?.Drop?.[0]?.serviceTier === 'economy' || assignment.Booking?.Drop?.[0]?.serviceTier === 'standard')
        ? assignment.Booking.Drop[0].serviceTier
        : 'standard',
    };

    // 6. Calculate UK-compliant earnings
    const earningsResult = await driverEarningsService.calculateEarnings(pricingInput);

    if (!earningsResult.success) {
      return NextResponse.json({ error: 'Failed to calculate earnings' }, { status: 400 });
    }

    const { breakdown, warnings } = earningsResult;

    // 7. Update assignment status
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: 'completed',
      },
    });

    // 8. Save earnings using service
    const earningsRecordId = await driverEarningsService.saveEarnings(pricingInput, earningsResult);

    // 9. Update booking status if all assignments completed
    const allAssignments = await prisma.assignment.findMany({
      where: { bookingId: assignment.bookingId },
    });

    const allCompleted = allAssignments.every((a) => a.status === 'completed');

    if (allCompleted) {
      await prisma.booking.update({
        where: { id: assignment.bookingId },
        data: {
          status: 'COMPLETED',
        },
      });
    }

    // 10. Send notifications (if warnings exist)
    const complianceStatus = warnings.length > 0 ? 'warnings' : 'compliant';
    if (warnings.length > 0) {
      logger.warn('Job completed with compliance warnings', {
        assignmentId,
        warnings,
        complianceStatus,
      });
    }

    // 11. Return response
    return NextResponse.json({
      success: true,
      message: 'Job completed successfully',
      earnings: {
        gross: breakdown.grossEarnings / 100,
        net: breakdown.netEarnings / 100,
        currency: 'GBP',
        breakdown: undefined,
        compliance: null,
        driverTier: 'standard',
      },
      warnings,
      earningsRecordId,
    });

  } catch (error) {
    logger.error('Failed to complete job', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to complete job',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate time breakdown for different activities
 */
function calculateTimeBreakdown(totalMinutes: number, dropCount: number) {
  // Estimate time allocation
  const loadingPerDrop = 15; // 15 minutes per pickup
  const unloadingPerDrop = 15; // 15 minutes per delivery
  const waitingPerDrop = 5; // 5 minutes waiting per stop
  
  const loading = loadingPerDrop;
  const unloading = unloadingPerDrop * dropCount;
  const waiting = waitingPerDrop * dropCount;
  const driving = Math.max(0, totalMinutes - loading - unloading - waiting);

  return {
    loading,
    unloading,
    waiting,
    driving,
  };
}

/**
 * Check if delivery was on time
 */
function isOnTime(assignment: any): boolean {
  if (!assignment.completedAt || !assignment.booking.scheduledFor) {
    return true; // Assume on time if no schedule
  }

  const scheduled = new Date(assignment.booking.scheduledFor);
  const completed = new Date(assignment.completedAt);
  const delayMinutes = (completed.getTime() - scheduled.getTime()) / (1000 * 60);

  // Allow 15 minutes grace period
  return delayMinutes <= 15;
}

