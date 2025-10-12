import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const earningId = searchParams.get('id');

    if (!earningId) {
      return NextResponse.json({ error: 'Earning ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { adjustedAmountGBP, adminNotes } = body;

    if (!adjustedAmountGBP || typeof adjustedAmountGBP !== 'number') {
      return NextResponse.json({ error: 'Valid adjusted amount is required' }, { status: 400 });
    }

    // Get current earning record
    const currentEarning = await prisma.driverEarnings.findUnique({
      where: { id: earningId },
      include: { Driver: true }
    });

    if (!currentEarning) {
      return NextResponse.json({ error: 'Earning record not found' }, { status: 404 });
    }

    // FIXED: Get old value before update (Audit Trail)
    const currentEarning = await prisma.driverEarnings.findUnique({
      where: { id: earningId },
      select: { netAmountPence: true, driverId: true },
    });
    
    if (!currentEarning) {
      return NextResponse.json(
        { error: 'Earning record not found' },
        { status: 404 }
      );
    }
    
    const oldValuePence = currentEarning.netAmountPence;
    const newValuePence = Math.round(adjustedAmountGBP * 100);
    
    // Update the earning with admin adjustment
    const updatedEarning = await prisma.driverEarnings.update({
      where: { id: earningId },
      data: {
        netAmountPence: newValuePence,
      },
    });
    
    // FIXED: Create audit log entry
    await prisma.auditLog.create({
      data: {
        actorId: (session.user as any).id,
        actorRole: 'admin',
        action: 'earnings_adjusted',
        targetType: 'DriverEarnings',
        targetId: earningId,
        before: { 
          netAmountPence: oldValuePence,
          netAmountGBP: (oldValuePence / 100).toFixed(2)
        },
        after: { 
          netAmountPence: newValuePence,
          netAmountGBP: (newValuePence / 100).toFixed(2)
        },
        details: { 
          reason: body.adminNotes || 'No reason provided',
          difference: newValuePence - oldValuePence,
          driverId: currentEarning.driverId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedEarning,
        adjustedAmountGBP: (updatedEarning.netAmountPence / 100).toFixed(2),
      },
      message: 'Driver earnings adjusted successfully by admin'
    });

  } catch (error) {
    console.error('Error adjusting driver earnings:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today'; // today, week, month
    const driverId = searchParams.get('driverId'); // Optional: filter by specific driver

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

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
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // Build where clause
    const whereClause: any = {
      calculatedAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (driverId) {
      whereClause.driverId = driverId;
    }

    // Get driver earnings with driver and assignment details
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
        Driver: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        calculatedAt: 'desc',
      },
    });

    // Calculate summary statistics
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.netAmountPence, 0);
    const totalJobs = earnings.length;
    const totalPlatformFees = earnings.reduce((sum, earning) => sum + earning.feeAmountPence, 0);

    // Group by driver for driver-specific stats
    const driverStats = earnings.reduce((acc, earning) => {
      const driverId = earning.driverId;
      const driverName = earning.Driver.User.name || 'Unknown Driver';
      
      if (!acc[driverId]) {
        acc[driverId] = {
          driverId,
          driverName,
          driverEmail: earning.Driver.User.email,
          totalEarnings: 0,
          totalJobs: 0,
          jobs: [],
        };
      }
      
      acc[driverId].totalEarnings += earning.netAmountPence;
      acc[driverId].totalJobs += 1;
      acc[driverId].jobs.push({
        assignmentId: earning.assignmentId,
        bookingReference: earning.assignmentId ? earning.Assignment.Booking.reference : 'Bonus Payment',
        customerName: earning.assignmentId ? earning.Assignment.Booking.customerName : 'Admin Bonus',
        earnings: earning.netAmountPence,
        bonusAmount: (earning as any).bonusAmountPence || 0,
        bonusType: (earning as any).bonusType || null,
        bonusReason: (earning as any).bonusReason || null,
        isBonus: !(earning as any).assignmentId,
        calculatedAt: earning.calculatedAt,
        paidOut: earning.paidOut,
      });
      
      return acc;
    }, {} as Record<string, any>);

    // Convert pence to pounds for display
    const formatCurrency = (pence: number) => (pence / 100).toFixed(2);

    const response = {
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        summary: {
          totalEarnings: formatCurrency(totalEarnings),
          totalJobs,
          totalPlatformFees: formatCurrency(totalPlatformFees),
          averageEarningsPerJob: totalJobs > 0 ? formatCurrency(totalEarnings / totalJobs) : '0.00',
        },
        driverStats: Object.values(driverStats).map((driver: any) => ({
          ...driver,
          totalEarnings: formatCurrency(driver.totalEarnings),
          jobs: driver.jobs.map((job: any) => ({
            ...job,
            earnings: formatCurrency(job.earnings),
          })),
        })),
        rawEarnings: earnings.map(earning => ({
          id: earning.id,
          driverId: earning.driverId,
          driverName: earning.Driver.User.name,
          assignmentId: earning.assignmentId,
          bookingReference: earning.Assignment.Booking.reference,
          customerName: earning.Assignment.Booking.customerName,
          baseAmount: formatCurrency(earning.baseAmountPence),
          surgeAmount: formatCurrency(earning.surgeAmountPence),
          tipAmount: formatCurrency(earning.tipAmountPence),
          feeAmount: formatCurrency(earning.feeAmountPence),
          netAmount: formatCurrency(earning.netAmountPence),
          currency: earning.currency,
          calculatedAt: earning.calculatedAt,
          paidOut: earning.paidOut,
        })),
      },
    };

    console.log(`📊 Admin earnings report generated for ${period}:`, {
      totalEarnings: response.data.summary.totalEarnings,
      totalJobs: response.data.summary.totalJobs,
      driversCount: Object.keys(driverStats).length,
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
