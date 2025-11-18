import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's attendance
    const attendance = await prisma.staffAttendance.findUnique({
      where: {
        staffId_date: {
          staffId: staff.id,
          date: today,
        },
      },
    });

    return NextResponse.json({
      success: true,
      attendance: attendance || null,
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

