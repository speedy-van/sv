import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAttendanceStatus, getTodayShift } from '@/lib/staffAttendance';
import { notifyLateCheckIn } from '@/lib/staffNotifications';
import { z } from 'zod';

const checkInSchema = z.object({
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user as { id?: string; role?: string } | undefined;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id as string;
    const role = user.role;

    // Check if user is staff
    if (role !== 'staff' && role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Staff access required' }, { status: 403 });
    }

    // Find staff record
    const staff = await prisma.staff.findUnique({
      where: { userId },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff record not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { notes } = checkInSchema.parse(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await prisma.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: today,
        },
      },
    });

    if (existingAttendance?.checkIn) {
      return NextResponse.json(
        { error: 'Already checked in today' },
        { status: 400 }
      );
    }

    const checkInTime = new Date();

    // Get today's shift
    const shift = await getTodayShift(staff.id);

    // Calculate attendance status
    const attendanceData = await generateAttendanceStatus(
      staff.id,
      checkInTime,
      null,
      today
    );

    // Create or update attendance record
    const attendance = await prisma.staffAttendance.upsert({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: today,
        },
      },
      create: {
        staffId: staff.id,
        date: today,
        checkIn: checkInTime,
        status: attendanceData.status,
        lateMinutes: attendanceData.lateMinutes,
        earlyLeaveMinutes: 0,
        totalHours: 0,
        breakMinutes: shift?.breakMinutes || 0,
        notes: notes || null,
      },
      update: {
        checkIn: checkInTime,
        status: attendanceData.status,
        lateMinutes: attendanceData.lateMinutes,
        notes: notes || null,
      },
    });

    // Send notification if late
    if (attendanceData.lateMinutes > 15 && role !== 'admin') {
      await notifyLateCheckIn(staff.id, attendanceData.lateMinutes);
    }

    return NextResponse.json({
      success: true,
      attendance: {
        id: attendance.id,
        checkIn: attendance.checkIn,
        status: attendance.status,
        lateMinutes: attendance.lateMinutes,
      },
    });
  } catch (error) {
    console.error('Check-in error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

