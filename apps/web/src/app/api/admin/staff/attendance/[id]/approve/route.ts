import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

// POST /api/admin/staff/attendance/:id/approve - Approve attendance
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = (session as any)?.user as { role?: string; id?: string } | undefined;

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const adminId = user.id as string;

    // Check if attendance exists
    const attendance = await prisma.staffAttendance.findUnique({
      where: { id: params.id },
    });

    if (!attendance) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 });
    }

    // Update attendance
    const updatedAttendance = await prisma.staffAttendance.update({
      where: { id: params.id },
      data: {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
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
    console.error('Approve attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

