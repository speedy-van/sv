import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAttendanceSummary } from '@/lib/staffAttendance';
import { requireAdmin } from '@/lib/auth';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

// GET /api/admin/staff/attendance/reports - Get attendance reports
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const department = searchParams.get('department');
    const period = searchParams.get('period') || 'month'; // month, week, day
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let reportStartDate: Date;
    let reportEndDate: Date = new Date();

    if (startDate && endDate) {
      reportStartDate = new Date(startDate);
      reportEndDate = new Date(endDate);
    } else {
      // Calculate based on period
      reportEndDate = new Date();
      reportEndDate.setHours(23, 59, 59, 999);

      switch (period) {
        case 'day':
          reportStartDate = new Date(reportEndDate);
          reportStartDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          reportStartDate = new Date(reportEndDate);
          reportStartDate.setDate(reportStartDate.getDate() - 7);
          break;
        case 'month':
        default:
          reportStartDate = new Date(reportEndDate);
          reportStartDate.setMonth(reportStartDate.getMonth() - 1);
          break;
      }
    }

    reportStartDate.setHours(0, 0, 0, 0);

    // Build where clause
    const where: any = {
      date: {
        gte: reportStartDate,
        lte: reportEndDate,
      },
    };

    if (staffId) {
      where.staffId = staffId;
    }

    if (department) {
      where.Staff = {
        department: department,
      };
    }

    // Get attendance records
    const attendances = await prisma.staffAttendance.findMany({
      where,
      include: {
        Staff: {
          include: {
            User: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate aggregates
    const totalDays = attendances.length;
    const presentDays = attendances.filter((a) => a.status === 'present').length;
    const absentDays = attendances.filter((a) => a.status === 'absent').length;
    const lateDays = attendances.filter((a) => a.status === 'late').length;
    const earlyLeaveDays = attendances.filter((a) => a.status === 'early_leave').length;
    const halfDays = attendances.filter((a) => a.status === 'half_day').length;
    const totalHours = attendances.reduce((sum, a) => sum + (a.totalHours || 0), 0);
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Group by staff if no specific staffId
    const byStaff: Record<string, any> = {};

    if (!staffId) {
      for (const attendance of attendances) {
        const id = attendance.staffId;
        if (!byStaff[id]) {
          byStaff[id] = {
            staff: attendance.Staff,
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            lateDays: 0,
            earlyLeaveDays: 0,
            halfDays: 0,
            totalHours: 0,
          };
        }

        byStaff[id].totalDays++;
        if (attendance.status === 'present') byStaff[id].presentDays++;
        if (attendance.status === 'absent') byStaff[id].absentDays++;
        if (attendance.status === 'late') byStaff[id].lateDays++;
        if (attendance.status === 'early_leave') byStaff[id].earlyLeaveDays++;
        if (attendance.status === 'half_day') byStaff[id].halfDays++;
        byStaff[id].totalHours += attendance.totalHours || 0;
      }

      // Calculate rates
      for (const id in byStaff) {
        byStaff[id].attendanceRate =
          byStaff[id].totalDays > 0
            ? (byStaff[id].presentDays / byStaff[id].totalDays) * 100
            : 0;
      }
    }

    return NextResponse.json({
      success: true,
      report: {
        period,
        startDate: reportStartDate,
        endDate: reportEndDate,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          earlyLeaveDays,
          halfDays,
          totalHours,
          attendanceRate,
        },
        byStaff: Object.values(byStaff),
        attendances,
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

