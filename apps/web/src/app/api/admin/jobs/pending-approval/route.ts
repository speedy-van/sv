import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Define the type for our query result
type AssignmentWithRelations = Prisma.AssignmentGetPayload<{
  include: {
    Driver: {
      include: {
        User: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
    Booking: {
      include: {
        BookingItem: true;
        pickupAddress: true;
      };
    };
    DriverEarnings: true;
  };
}>;

/**
 * GET /api/admin/jobs/pending-approval
 * 
 * Returns list of jobs that require admin approval due to:
 * - Daily cap breach (£500 exceeded)
 * - Bonus approval pending
 * 
 * Only accessible by admin users
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin-only authentication
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const adminId = (session.user as any).id;

    // Query assignments that are completed but waiting for approval
    // We look for assignments where:
    // 1. Status is 'completed' (job was finished)
    // 2. No DriverEarnings record exists yet (payment not created)
    // This indicates the completion API returned 403 due to cap breach

    const completedAssignments = await prisma.assignment.findMany({
      where: {
        status: 'completed',
        claimedAt: { not: null },
      },
      include: {
        Driver: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        Booking: {
          include: {
            BookingItem: true,
            pickupAddress: true,
          },
        },
        DriverEarnings: true,
      },
      orderBy: {
        claimedAt: 'desc',
      },
      take: 100, // Limit to recent 100
    }) as AssignmentWithRelations[];

    // Filter to only those without earnings OR with earnings requiring approval
    const pendingApprovals = completedAssignments.filter(assignment => {
      const hasNoEarnings = assignment.DriverEarnings.length === 0;
      const hasEarningsNeedingApproval = assignment.DriverEarnings.some(
        (e: any) => e.requiresAdminApproval === true
      );
      return hasNoEarnings || hasEarningsNeedingApproval;
    });

    // Get current daily earnings for each driver to calculate cap context
    const driverIds = [...new Set(pendingApprovals.map(a => a.driverId))];
    
    if (driverIds.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        pendingApprovals: [],
        metadata: {
          dailyCapPence: 50000,
          dailyCapGBP: '500.00',
          retrievedAt: new Date().toISOString(),
        },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get daily totals using aggregate instead of groupBy to avoid circular reference errors
    const dailyEarningsData = await prisma.driverEarnings.findMany({
      where: {
        driverId: { in: driverIds },
        calculatedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        driverId: true,
        cappedNetEarningsPence: true,
        requiresAdminApproval: true,
      } as any,
    }) as any[];

    // Calculate totals manually
    const dailyEarningsMap = new Map<string, number>();
    for (const earning of dailyEarningsData) {
      // Only count approved earnings
      if (!(earning as any).requiresAdminApproval) {
        const current = dailyEarningsMap.get(earning.driverId) || 0;
        dailyEarningsMap.set(earning.driverId, current + (earning.cappedNetEarningsPence || 0));
      }
    }

    // Format response
    const pendingList = pendingApprovals.map(assignment => {
      const currentDailyTotal = dailyEarningsMap.get(assignment.driverId) || 0;
      const remainingAllowance = Math.max(0, 50000 - currentDailyTotal); // £500 cap

      return {
        assignmentId: assignment.id,
        bookingId: assignment.Booking.id,
        bookingReference: assignment.Booking.reference,
        driver: {
          id: assignment.Driver.id,
          name: assignment.Driver.User.name,
          email: assignment.Driver.User.email,
        },
        jobDetails: {
          customerName: assignment.Booking.customerName,
          pickupAddress: assignment.Booking.pickupAddress,
          distance: assignment.Booking.baseDistanceMiles,
          duration: assignment.Booking.estimatedDurationMinutes,
          urgency: assignment.Booking.urgency,
          customerPaid: assignment.Booking.totalGBP,
          items: assignment.Booking.BookingItem,
        },
        timing: {
          completedAt: assignment.claimedAt,
          waitingTime: Math.floor(
            (Date.now() - new Date(assignment.claimedAt!).getTime()) / 1000 / 60
          ), // Minutes waiting
        },
        capContext: {
          currentDailyTotal: currentDailyTotal,
          remainingAllowance: remainingAllowance,
          dailyCapPence: 50000,
          currentDailyTotalGBP: (currentDailyTotal / 100).toFixed(2),
          remainingAllowanceGBP: (remainingAllowance / 100).toFixed(2),
        },
        existingEarnings: assignment.DriverEarnings.length > 0 ? {
          id: assignment.DriverEarnings[0].id,
          requiresApproval: (assignment.DriverEarnings[0] as any).requiresAdminApproval,
          rawNet: (assignment.DriverEarnings[0] as any).rawNetEarningsPence,
          capped: (assignment.DriverEarnings[0] as any).cappedNetEarningsPence,
        } : null,
        status: assignment.DriverEarnings.length === 0 
          ? 'pending_calculation' 
          : 'pending_approval',
      };
    });

    logger.info('Admin retrieved pending approvals list', {
      adminId,
      count: pendingList.length,
      driverCount: driverIds.length,
    });

    return NextResponse.json({
      success: true,
      count: pendingList.length,
      pendingApprovals: pendingList,
      metadata: {
        dailyCapPence: 50000,
        dailyCapGBP: '500.00',
        retrievedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Error retrieving pending approvals', error as Error, {
      service: 'admin-pending-approvals',
    });
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve pending approvals',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
