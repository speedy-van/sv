import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { assertDriver } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  try {
    assertDriver(session!);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }

  const userId = session.user.id;

  try {
    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        shifts: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({
      shifts: driver.shifts,
    });
  } catch (error) {
    console.error('Shifts GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  try {
    assertDriver(session!);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }

  const userId = session.user.id;

  try {
    const { startTime, endTime, isRecurring, recurringDays } =
      await request.json();

    // Validate required fields
    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Start time and end time are required' },
        { status: 400 }
      );
    }

    // Validate time format
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Validate recurring days if recurring shift
    if (
      isRecurring &&
      (!recurringDays ||
        !Array.isArray(recurringDays) ||
        recurringDays.length === 0)
    ) {
      return NextResponse.json(
        { error: 'Recurring days are required for recurring shifts' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const shift = await prisma.driverShift.create({
      data: {
        driverId: driver.id,
        startTime: start,
        endTime: end,
        isRecurring: isRecurring || false,
        recurringDays: recurringDays || [],
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      shift,
    });
  } catch (error) {
    console.error('Shifts POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

