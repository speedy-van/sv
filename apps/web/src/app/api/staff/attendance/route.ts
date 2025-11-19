import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      staffId: staff.id,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Fetch attendance records
    const [attendances, total] = await Promise.all([
      prisma.staffAttendance.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.staffAttendance.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      attendances,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

