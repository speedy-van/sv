import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateAttendanceStatus } from '@/lib/staffAttendance';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

const updateAttendanceSchema = z.object({
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  status: z.enum(['present', 'absent', 'late', 'early_leave', 'half_day', 'pending', 'approved', 'rejected']).optional(),
  notes: z.string().optional(),
});

// PUT /api/admin/staff/attendance/:id - Update attendance
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const data = updateAttendanceSchema.parse(body);

    // Check if attendance exists
    const attendance = await prisma.staffAttendance.findUnique({
      where: { id: params.id },
      include: { Staff: true },
    });

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (data.checkIn !== undefined) {
      updateData.checkIn = new Date(data.checkIn);
    }

    if (data.checkOut !== undefined) {
      updateData.checkOut = new Date(data.checkOut);
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    // Recalculate if times changed
    if (data.checkIn || data.checkOut) {
      const checkIn = updateData.checkIn || attendance.checkIn;
      const checkOut = updateData.checkOut || attendance.checkOut;

      if (checkIn) {
        const attendanceData = await generateAttendanceStatus(
          attendance.staffId,
          checkIn,
          checkOut,
          attendance.date
        );

        updateData.status = attendanceData.status;
        updateData.lateMinutes = attendanceData.lateMinutes;
        updateData.earlyLeaveMinutes = attendanceData.earlyLeaveMinutes;
        updateData.totalHours = attendanceData.totalHours;
      }
    }

    // Update attendance
    const updatedAttendance = await prisma.staffAttendance.update({
      where: { id: params.id },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.error('Update attendance error:', error);

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

