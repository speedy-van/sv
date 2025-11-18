import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const requestSchema = z.object({
  // Prefer explicit date range for accuracy; UI can build these for weekly/monthly
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  // Optional helpers (if provided, we derive from/to)
  period: z.enum(['weekly', 'monthly', 'custom']).default('custom').optional(),
  weekEnding: z.string().date().optional(), // ISO date (YYYY-MM-DD), inclusive week ending (Sun/Sat per config)
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2000).max(2100).optional(),
  staffIds: z.array(z.string()).optional(),
});

function getDateRange(input: z.infer<typeof requestSchema>): { from: Date; to: Date } {
  // Priority: explicit from/to
  if (input.from && input.to) {
    return { from: new Date(input.from), to: new Date(input.to) };
  }

  // Weekly by weekEnding (assume Sun as week end). We take 7 days ending on weekEnding inclusive.
  if (input.period === 'weekly' && input.weekEnding) {
    const end = new Date(input.weekEnding + 'T23:59:59.999Z');
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 6); // 7 days window
    start.setUTCHours(0, 0, 0, 0);
    return { from: start, to: end };
  }

  // Monthly by month/year
  if (input.period === 'monthly' && input.month && input.year) {
    const start = new Date(Date.UTC(input.year, input.month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(input.year, input.month, 0, 23, 59, 59, 999));
    return { from: start, to: end };
  }

  // Default: current month
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return { from: start, to: end };
}

function getUkMinimumWage(): number {
  const envRate = process.env.UK_MIN_WAGE_GBP || process.env.NEXT_PUBLIC_UK_MIN_WAGE_GBP;
  const parsed = envRate ? Number(envRate) : NaN;
  // Default to a safe placeholder rate; update via env for policy changes
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 11.44;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user as { role?: string } | undefined;
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const raw = await request.json();
    const input = requestSchema.parse(raw);
    const { from, to } = getDateRange(input);

    // Fetch staff to include
    const staffList = await prisma.staff.findMany({
      where: input.staffIds && input.staffIds.length > 0 ? { id: { in: input.staffIds } } : {},
      include: {
        User: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { employeeId: 'asc' },
    });

    if (staffList.length === 0) {
      return NextResponse.json({ success: true, payslips: [], from, to });
    }

    // Attendance statuses to include in payable hours
    const payableStatuses = ['present', 'approved', 'late', 'early_leave', 'half_day'] as const;
    const minWage = getUkMinimumWage();

    // Build payslips
    const payslips = await Promise.all(
      staffList.map(async (s) => {
        const attendance = await prisma.staffAttendance.findMany({
          where: {
            staffId: s.id,
            date: { gte: from, lte: to },
            status: { in: payableStatuses as any },
          },
          orderBy: { date: 'asc' },
        });

        // Compute total payable hours
        let totalHours = 0;
        attendance.forEach((a) => {
          if (a.totalHours != null) {
            totalHours += a.totalHours;
            return;
          }
          if (a.checkIn && a.checkOut) {
            const ms = new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime();
            const hours = Math.max(ms / (1000 * 60 * 60), 0);
            const breakHours = (a.breakMinutes || 0) / 60;
            totalHours += Math.max(hours - breakHours, 0);
          }
        });

        const hourlyRate = minWage; // For now default to minimum wage; can be overridden per-staff in future
        const grossPay = Number((totalHours * hourlyRate).toFixed(2));

        // Placeholder statutory deductions (set 0, owner can export and process in payroll system)
        const ni = 0;
        const paye = 0;
        const otherDeductions = 0;
        const netPay = Number((grossPay - ni - paye - otherDeductions).toFixed(2));

        return {
          staffId: s.id,
          employeeId: s.employeeId,
          name: s.User?.name || 'N/A',
          email: s.User?.email || 'N/A',
          period: { from, to },
          hours: Number(totalHours.toFixed(2)),
          hourlyRate,
          grossPay,
          deductions: {
            ni,
            paye,
            other: otherDeductions,
          },
          netPay,
          notes:
            'Calculated from approved attendance records. Hourly rate defaults to UK minimum wage. Verify NI/PAYE with your payroll provider.',
        };
      })
    );

    // Summary for owner
    const summary = {
      totalStaff: payslips.length,
      totalHours: Number(payslips.reduce((s, p) => s + p.hours, 0).toFixed(2)),
      totalGross: Number(payslips.reduce((s, p) => s + p.grossPay, 0).toFixed(2)),
      totalNet: Number(payslips.reduce((s, p) => s + p.netPay, 0).toFixed(2)),
    };

    return NextResponse.json({
      success: true,
      from,
      to,
      rateApplied: minWage,
      payslips,
      summary,
    });
  } catch (error) {
    console.error('Generate payslips error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


