import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

// GET /api/admin/staff/attendance/stats - Get attendance statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let statsStartDate: Date;
    let statsEndDate: Date = new Date();

    if (startDate && endDate) {
      statsStartDate = new Date(startDate);
      statsEndDate = new Date(endDate);
    } else {
      // Default to last 30 days
      statsEndDate = new Date();
      statsEndDate.setHours(23, 59, 59, 999);
      statsStartDate = new Date(statsEndDate);
      statsStartDate.setDate(statsStartDate.getDate() - 30);
    }

    statsStartDate.setHours(0, 0, 0, 0);

    // Get overall stats
    const [totalStaff, activeStaff, totalAttendances, todayAttendances] = await Promise.all([
      prisma.staff.count(),
      prisma.staff.count({ where: { status: 'active' } }),
      prisma.staffAttendance.count({
        where: {
          date: {
            gte: statsStartDate,
            lte: statsEndDate,
          },
        },
      }),
      prisma.staffAttendance.count({
        where: {
          date: new Date(),
        },
      }),
    ]);

    // Get status breakdown
    const statusBreakdown = await prisma.staffAttendance.groupBy({
      by: ['status'],
      where: {
        date: {
          gte: statsStartDate,
          lte: statsEndDate,
        },
      },
      _count: true,
    });

    // Get department breakdown
    const departmentStats = await prisma.staff.groupBy({
      by: ['department'],
      where: {
        status: 'active',
      },
      _count: true,
    });

    // Get daily attendance trend (last 7 days)
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const count = await prisma.staffAttendance.count({
        where: {
          date: {
            gte: date,
            lte: endOfDay,
          },
          status: {
            in: ['present', 'late', 'early_leave', 'half_day'],
          },
        },
      });

      dailyTrend.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalStaff,
        activeStaff,
        totalAttendances,
        todayAttendances,
        statusBreakdown: statusBreakdown.map((s) => ({
          status: s.status,
          count: s._count,
        })),
        departmentStats: departmentStats.map((d) => ({
          department: d.department || 'Unassigned',
          count: d._count,
        })),
        dailyTrend,
        period: {
          startDate: statsStartDate,
          endDate: statsEndDate,
        },
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

