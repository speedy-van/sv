import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('💰 Driver Earnings API - Starting request');
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user || (session.user as any).role !== 'driver') {
        console.log('❌ Driver Earnings API - Unauthorized access');
        return NextResponse.json(
          { error: 'Unauthorized - Driver access required' },
          { status: 401 }
        );
      }
      userId = (session.user as any).id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month, all

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

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date = now;

    if (period !== 'all') {
      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          startDate = startOfWeek;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
      }
    }

    // Build where clause
    const whereClause: any = {
      driverId: driver.id,
    };

    if (startDate) {
      whereClause.calculatedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Get driver earnings (including bonuses which may not have assignments)
    const earnings = await prisma.driverEarnings.findMany({
      where: whereClause,
      include: {
        Assignment: {
          include: {
            Booking: {
              select: {
                id: true,
                reference: true,
                customerName: true,
                totalGBP: true,
                scheduledAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Calculate summary statistics (excluding fees from driver view)
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.netAmountPence, 0);
    const totalJobs = earnings.length;
    const totalTips = earnings.reduce((sum, earning) => sum + earning.tipAmountPence, 0);
    // Note: totalFees removed from driver view for privacy
    const paidOutEarnings = earnings
      .filter(earning => earning.paidOut)
      .reduce((sum, earning) => sum + earning.netAmountPence, 0);
    const pendingEarnings = totalEarnings - paidOutEarnings;

    // Convert pence to pounds for display
    const formatCurrency = (pence: number) => (pence / 100).toFixed(2);

    const response = {
      success: true,
      data: {
        period,
        dateRange: startDate ? {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        } : null,
        summary: {
          totalEarnings: formatCurrency(totalEarnings),
          totalJobs,
          totalTips: formatCurrency(totalTips),
          // totalFees removed from driver view for privacy
          paidOutEarnings: formatCurrency(paidOutEarnings),
          pendingEarnings: formatCurrency(pendingEarnings),
          averageEarningsPerJob: totalJobs > 0 ? formatCurrency(totalEarnings / totalJobs) : '0.00',
        },
        earnings: earnings.map(earning => ({
          // Unified field names for mobile apps
          id: earning.id,
          assignmentId: earning.assignmentId,
          bookingReference: earning.assignmentId ? earning.Assignment.Booking.reference : 'Bonus Payment',
          customerName: earning.assignmentId ? earning.Assignment.Booking.customerName : 'Admin Bonus',
          
          // Mobile app expects these field names (in pence)
          baseEarningsPence: earning.baseAmountPence,
          tipsPence: earning.tipAmountPence,
          bonusesPence: earning.surgeAmountPence,
          deductionsPence: earning.feeAmountPence,
          grossEarningsPence: earning.grossEarningsPence || earning.netAmountPence,
          netEarningsPence: earning.netAmountPence,
          platformFeePence: earning.platformFeePence || earning.feeAmountPence,
          
          // Display amounts (in GBP)
          baseAmount: formatCurrency(earning.baseAmountPence),
          surgeAmount: formatCurrency(earning.surgeAmountPence),
          tipAmount: formatCurrency(earning.tipAmountPence),
          bonusAmount: formatCurrency((earning as any).bonusAmountPence || 0),
          netAmount: formatCurrency(earning.netAmountPence),
          
          // Additional fields
          bonusType: (earning as any).bonusType || null,
          bonusReason: (earning as any).bonusReason || null,
          isBonus: !(earning as any).assignmentId,
          currency: earning.currency,
          calculatedAt: earning.calculatedAt,
          paidOut: earning.paidOut,
          payoutId: earning.payoutId,
          requiresAdminApproval: earning.requiresAdminApproval || false,
          
          // Legacy compatibility (old field names)
          baseAmountPence: earning.baseAmountPence,
          tipAmountPence: earning.tipAmountPence,
          surgeAmountPence: earning.surgeAmountPence,
          feeAmountPence: earning.feeAmountPence,
        })),
      },
    };

    console.log(`💰 Driver earnings fetched for driver ${driver.id} (${period}):`, {
      totalEarnings: response.data.summary.totalEarnings,
      totalJobs: response.data.summary.totalJobs,
      pendingEarnings: response.data.summary.pendingEarnings,
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching driver earnings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch driver earnings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}