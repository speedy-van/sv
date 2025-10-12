import { NextResponse, NextRequest } from 'next/server';
import { requireRole } from '@/lib/api/guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const user = await requireRole(request, 'driver');

  const userId = user.id;

  try {
    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        shifts: {
          where: {
            isActive: true,
            isRecurring: true,
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({
      availabilityWindows: driver.shifts,
    });
  } catch (error) {
    console.error('Availability windows GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
    const user = await requireRole(request, 'driver');

  try {
    const { windows } = await request.json();

    if (!Array.isArray(windows)) {
      return NextResponse.json(
        { error: 'Windows must be an array' },
        { status: 400 }
      );
    }

    const userId = user.id;

    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        shifts: {
          where: { isRecurring: true },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Deactivate all existing recurring shifts
    await prisma.driverShift.updateMany({
      where: {
        driverId: driver.id,
        isRecurring: true,
      },
      data: {
        isActive: false,
      },
    });

    // Create new availability windows
    const newWindows = [];
    for (const window of windows) {
      const { startTime, endTime, recurringDays } = window;

      if (
        !startTime ||
        !endTime ||
        !recurringDays ||
        !Array.isArray(recurringDays)
      ) {
        continue;
      }

      const shift = await prisma.driverShift.create({
        data: {
          driverId: driver.id,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          isRecurring: true,
          recurringDays,
          isActive: true,
        },
      });

      newWindows.push(shift);
    }

    return NextResponse.json({
      success: true,
      availabilityWindows: newWindows,
    });
  } catch (error) {
    console.error('Availability windows PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
