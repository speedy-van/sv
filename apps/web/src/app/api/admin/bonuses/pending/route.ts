import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bonuses/pending
 * 
 * Returns list of bonus requests awaiting admin approval
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

    // Query pending bonus requests
    const prismaWithBonusRequest = prisma as any;
    
    if (!prismaWithBonusRequest.bonusRequest) {
      logger.warn('BonusRequest model not available in Prisma client');
      return NextResponse.json({
        success: true,
        count: 0,
        pendingBonuses: [],
        message: 'BonusRequest model not yet available. Run prisma generate.',
      });
    }

    const pendingBonuses = await prismaWithBonusRequest.bonusRequest.findMany({
      where: {
        status: 'pending',
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        assignment: {
          include: {
            Booking: {
              select: {
                id: true,
                reference: true,
                customerName: true,
                totalGBP: true,
              },
            },
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
      take: 100,
    });

    // Get driver performance context
    const driverIds = [...new Set(pendingBonuses.map((b: any) => b.driverId))] as string[];
    
    // Use findMany instead of groupBy to avoid circular reference errors
    const allDriverEarnings = await prisma.driverEarnings.findMany({
      where: {
        driverId: { in: driverIds },
        calculatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      select: {
        driverId: true,
        netAmountPence: true,
      },
    });

    // Calculate stats manually
    const driverStatsMap = new Map<string, { completedJobs: number; totalEarnings: number; avgEarnings: number }>();
    for (const earning of allDriverEarnings) {
      const existing = driverStatsMap.get(earning.driverId) || { 
        completedJobs: 0, 
        totalEarnings: 0, 
        avgEarnings: 0 
      };
      existing.completedJobs += 1;
      existing.totalEarnings += earning.netAmountPence;
      driverStatsMap.set(earning.driverId, existing);
    }
    
    // Calculate averages
    for (const [driverId, stats] of driverStatsMap.entries()) {
      stats.avgEarnings = Math.floor(stats.totalEarnings / stats.completedJobs);
    }

    // Format response
    const bonusList = pendingBonuses.map((bonus: any) => {
      const stats = driverStatsMap.get(bonus.driverId) || {
        completedJobs: 0,
        totalEarnings: 0,
        avgEarnings: 0,
      } as { completedJobs: number; totalEarnings: number; avgEarnings: number };

      return {
        bonusRequestId: bonus.id,
        driver: {
          id: bonus.driver.id,
          name: bonus.driver.user.name,
          email: bonus.driver.user.email,
          performance: {
            completedJobs30d: stats.completedJobs,
            totalEarnings30d: stats.totalEarnings,
            avgEarnings30d: stats.avgEarnings,
            totalEarnings30dGBP: (stats.totalEarnings / 100).toFixed(2),
            avgEarnings30dGBP: (stats.avgEarnings / 100).toFixed(2),
          },
        },
        assignment: {
          id: bonus.assignmentId,
          bookingId: bonus.assignment.Booking?.id,
          bookingReference: bonus.assignment.Booking?.reference,
          customerName: bonus.assignment.Booking?.customerName,
          customerPaid: bonus.assignment.Booking?.totalGBP,
        },
        bonusDetails: {
          type: bonus.bonusType,
          requestedAmount: bonus.requestedAmountPence,
          requestedAmountGBP: (bonus.requestedAmountPence / 100).toFixed(2),
          reason: bonus.reason,
          requestedBy: bonus.requestedBy,
          requestedAt: bonus.requestedAt,
        },
        timing: {
          waitingTime: Math.floor(
            (Date.now() - new Date(bonus.requestedAt).getTime()) / 1000 / 60
          ), // Minutes waiting
        },
      };
    });

    logger.info('Admin retrieved pending bonuses list', {
      adminId,
      count: bonusList.length,
      driverCount: driverIds.length,
    });

    return NextResponse.json({
      success: true,
      count: bonusList.length,
      pendingBonuses: bonusList,
      metadata: {
        retrievedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Error retrieving pending bonuses', error as Error, {
      service: 'admin-pending-bonuses',
    });
    
    return NextResponse.json(
      {
        error: 'Failed to retrieve pending bonuses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
