import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAttendanceStatus, getTodayShift } from '@/lib/staffAttendance';
import { notifyEarlyCheckOut } from '@/lib/staffNotifications';
import { z } from 'zod';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

const checkOutSchema = z.object({
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
    const { notes } = checkOutSchema.parse(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if checked in today
    const attendance = await prisma.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: today,
        },
      },
    });

    if (!attendance || !attendance.checkIn) {
      return NextResponse.json(
        { error: 'Must check in before checking out' },
        { status: 400 }
      );
    }

    if (attendance.checkOut) {
      return NextResponse.json(
        { error: 'Already checked out today' },
        { status: 400 }
      );
    }

    const checkOutTime = new Date();

    // Recalculate attendance status with check-out
    const attendanceData = await generateAttendanceStatus(
      staff.id,
      attendance.checkIn,
      checkOutTime,
      today
    );

    // Update attendance record
    const updatedAttendance = await prisma.staffAttendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: checkOutTime,
        status: attendanceData.status,
        lateMinutes: attendanceData.lateMinutes,
        earlyLeaveMinutes: attendanceData.earlyLeaveMinutes,
        totalHours: attendanceData.totalHours,
        notes: notes || attendance.notes,
      },
    });

    // Send notification if early leave
    if (attendanceData.earlyLeaveMinutes > 60 && role !== 'admin') {
      await notifyEarlyCheckOut(staff.id, attendanceData.earlyLeaveMinutes);
    }

    return NextResponse.json({
      success: true,
      attendance: {
        id: updatedAttendance.id,
        checkIn: updatedAttendance.checkIn,
        checkOut: updatedAttendance.checkOut,
        status: updatedAttendance.status,
        lateMinutes: updatedAttendance.lateMinutes,
        earlyLeaveMinutes: updatedAttendance.earlyLeaveMinutes,
        totalHours: updatedAttendance.totalHours,
      },
    });
  } catch (error) {
    console.error('Check-out error:', error);

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

