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
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;
    const body: CompleteJobRequest = await request.json();

    // 1. Get assignment details
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        Booking: {
          include: {
            route: {
              include: {
                stops: true,
              },
            },
          },
        },
        driver: true,
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
    const isMultiDrop = assignment.Booking.route?.stops?.length > 1;
    const dropCount = assignment.Booking.route?.stops?.length || 1;

    // 3. Calculate distance and duration
    const distanceMiles = body.actualDistance || assignment.Booking.estimatedDistance || 10;
    const durationMinutes = body.actualDuration || assignment.Booking.estimatedDuration || 60;

    // 4. Break down time components
    const timeBreakdown = calculateTimeBreakdown(durationMinutes, dropCount);

    // 5. Prepare pricing input
    const pricingInput = {
      assignmentId: assignment.id,
      driverId: assignment.driverId,
      bookingId: assignment.bookingId,
      distanceMiles,
      durationMinutes,
      dropCount,
      loadingMinutes: timeBreakdown.loading,
      unloadingMinutes: timeBreakdown.unloading,
      drivingMinutes: timeBreakdown.driving,
      waitingMinutes: timeBreakdown.waiting,
      customerPaymentPence: assignment.Booking.totalPricePence || 0,
      urgencyLevel: assignment.Booking.urgencyLevel || 'standard',
      serviceType: assignment.Booking.serviceType || 'standard',
      onTimeDelivery: isOnTime(assignment),
      customerRating: body.customerRating,
      tollCostsPence: body.tollCosts ? Math.round(body.tollCosts * 100) : 0,
      parkingCostsPence: body.parkingCosts ? Math.round(body.parkingCosts * 100) : 0,
      fuelUsedLitres: body.fuelUsed,
      hasHelper: assignment.hasHelper || false,
      helperHours: assignment.hasHelper ? durationMinutes / 60 : 0,
      jobDate: new Date(),
    };

    // 6. Calculate UK-compliant earnings
    const earningsResult = await driverEarningsService.calculateEarnings(pricingInput);

    if (!earningsResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to calculate earnings',
          details: earningsResult.errors,
          warnings: earningsResult.warnings,
        },
        { status: 400 }
      );
    }

    const { breakdown, warnings, complianceStatus } = earningsResult;

    // 7. Update assignment status
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: 'completed',
      },
    });

    // 8. Create driver earnings record
    const earningsRecord = await prisma.driverEarnings.create({
      data: {
        driverId: assignment.driverId,
        assignmentId: assignment.id,
        
        // Base earnings
        baseFare: breakdown.baseFare,
        perDropFee: breakdown.perDropFee,
        mileageFee: breakdown.mileageFee,
        
        // Time-based fees
        drivingFee: breakdown.timeFees.driving,
        loadingFee: breakdown.timeFees.loading,
        unloadingFee: breakdown.timeFees.unloading,
        waitingFee: breakdown.timeFees.waiting,
        
        // Multipliers
        urgencyMultiplier: breakdown.urgencyMultiplier,
        performanceMultiplier: breakdown.tierMultiplier,
        
        // Bonuses
        onTimeBonus: breakdown.bonuses.onTimeBonus,
        ratingBonus: breakdown.bonuses.ratingBonus,
        multiDropBonus: breakdown.bonuses.multiDropBonus,
        longDistanceBonus: breakdown.bonuses.longDistanceBonus,
        
        // Deductions
        vatAmount: breakdown.ukDeductions.vatAmount,
        nationalInsurance: breakdown.ukDeductions.nationalInsurance,
        insuranceLevy: breakdown.ukDeductions.insuranceLevy,
        
        // Reimbursements
        tollReimbursement: breakdown.reimbursements.tollCosts,
        parkingReimbursement: breakdown.reimbursements.parkingCosts,
        fuelReimbursement: breakdown.reimbursements.fuelCosts,
        
        // Helper
        helperPayment: breakdown.helperPayment,
        
        // Totals
        grossEarnings: breakdown.grossEarnings,
        netEarnings: breakdown.netEarningsAfterTax,
        
        // Compliance
        complianceStatus,
        effectiveHourlyRate: breakdown.compliance.effectiveHourlyRate,
        hoursWorked: breakdown.compliance.hoursWorked,
        
        // Metadata
        metadata: {
          isMultiDrop,
          dropCount,
          driverTier: breakdown.driverTier,
          warnings,
          breakdown: breakdown,
        },
      },
    });

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
        net: breakdown.netEarningsAfterTax / 100,
        currency: 'GBP',
        breakdown: {
          baseFare: breakdown.baseFare / 100,
          perDropFee: breakdown.perDropFee / 100,
          mileageFee: breakdown.mileageFee / 100,
          timeFees: {
            driving: breakdown.timeFees.driving / 100,
            loading: breakdown.timeFees.loading / 100,
            unloading: breakdown.timeFees.unloading / 100,
            waiting: breakdown.timeFees.waiting / 100,
          },
          bonuses: {
            onTime: breakdown.bonuses.onTimeBonus / 100,
            rating: breakdown.bonuses.ratingBonus / 100,
            multiDrop: breakdown.bonuses.multiDropBonus / 100,
            longDistance: breakdown.bonuses.longDistanceBonus / 100,
          },
          deductions: {
            vat: breakdown.ukDeductions.vatAmount / 100,
            nationalInsurance: breakdown.ukDeductions.nationalInsurance / 100,
            insuranceLevy: breakdown.ukDeductions.insuranceLevy / 100,
          },
          reimbursements: {
            toll: breakdown.reimbursements.tollCosts / 100,
            parking: breakdown.reimbursements.parkingCosts / 100,
            fuel: breakdown.reimbursements.fuelCosts / 100,
          },
          helper: breakdown.helperPayment / 100,
        },
        compliance: {
          status: complianceStatus,
          meetsMinimumWage: breakdown.compliance.meetsMinimumWage,
          withinDailyHoursLimit: breakdown.compliance.withinDailyHoursLimit,
          withinDailyCap: breakdown.compliance.withinDailyCap,
          effectiveHourlyRate: breakdown.compliance.effectiveHourlyRate,
          hoursWorked: breakdown.compliance.hoursWorked,
          remainingDailyCapacity: breakdown.compliance.remainingDailyCapacity / 100,
        },
        driverTier: breakdown.driverTier,
      },
      warnings,
      earningsRecordId: earningsRecord.id,
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

