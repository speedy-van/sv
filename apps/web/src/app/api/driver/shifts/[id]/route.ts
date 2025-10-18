import { NextRequest, NextResponse } from 'next/server';
import { requireDriver } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ Await params first (Next.js 15 requirement)
  const { id } = await params;
  
  const authResult = await requireDriver(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const user = authResult;

  try {
    const { startTime, endTime, isRecurring, recurringDays, isActive } =
      await request.json();

    const userId = user.id;

    // Verify the shift belongs to this driver
    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        DriverShift: {
          where: { id: id },
        },
      },
    });

    if (!driver || driver.DriverShift.length === 0) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (startTime !== undefined) {
      const start = new Date(startTime);
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start time format' },
          { status: 400 }
        );
      }
      updateData.startTime = start;
    }

    if (endTime !== undefined) {
      const end = new Date(endTime);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end time format' },
          { status: 400 }
        );
      }
      updateData.endTime = end;
    }

    if (isRecurring !== undefined) {
      updateData.isRecurring = isRecurring;
    }

    if (recurringDays !== undefined) {
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
      updateData.recurringDays = recurringDays;
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    // Validate that end time is after start time if both are provided
    if (
      updateData.startTime &&
      updateData.endTime &&
      updateData.startTime >= updateData.endTime
    ) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    const shift = await prisma.driverShift.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      shift,
    });
  } catch (error) {
    console.error('Shift PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ Await params first (Next.js 15 requirement)
  const { id } = await params;
  
  const authResult = await requireDriver(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const user = authResult;

  try {
    const userId = user.id;

    // Verify the shift belongs to this driver
    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        DriverShift: {
          where: { id: id },
        },
      },
    });

    if (!driver || driver.DriverShift.length === 0) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await prisma.driverShift.update({
      where: { id: id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Shift DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
