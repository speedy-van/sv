import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { assertDriver } from '@/lib/guards';
import { format } from 'date-fns';
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

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start') || new Date().toISOString();
  const endDate =
    searchParams.get('end') ||
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

  const userId = session.user.id;

  try {
    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        DriverShift: {
          where: { isActive: true },
          orderBy: { startTime: 'asc' },
        },
        Assignment: {
          where: {
            status: { in: ['accepted'] },
          },
          include: {
            Booking: {
              select: {
                id: true,
                reference: true,
                pickupAddress: true,
                dropoffAddress: true,
                scheduledAt: true,
                totalGBP: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Generate ICS content
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Speedy Van//Driver Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    // Add shifts
    driver.DriverShift.forEach((shift, index) => {
      const start = format(new Date(shift.startTime), "yyyyMMdd'T'HHmmss");
      const end = format(new Date(shift.endTime), "yyyyMMdd'T'HHmmss");
      const created = format(new Date(shift.createdAt), "yyyyMMdd'T'HHmmss");

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:shift-${shift.id}@speedy-van.co.uk`,
        `DTSTAMP:${created}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:Scheduled Shift`,
        `DESCRIPTION:${shift.isRecurring ? 'Recurring shift' : 'One-time shift'}`,
        `STATUS:CONFIRMED`,
        'END:VEVENT'
      );
    });

    // Add jobs
    driver.Assignment.forEach((assignment, index) => {
      if (!assignment.Booking.scheduledAt) return;

      const start = format(
        new Date(assignment.Booking.scheduledAt),
        "yyyyMMdd'T'HHmmss"
      );
      const end = format(
        new Date(assignment.Booking.scheduledAt.getTime() + 2 * 60 * 60 * 1000),
        "yyyyMMdd'T'HHmmss"
      ); // 2 hours duration
      const created = format(
        new Date(assignment.createdAt),
        "yyyyMMdd'T'HHmmss"
      );

      const description = [
        `Job #${assignment.Booking.reference}`,
        `Pickup: ${assignment.Booking.pickupAddress || 'TBD'}`,
        `Dropoff: ${assignment.Booking.dropoffAddress || 'TBD'}`,
        `Amount: £${(assignment.Booking.totalGBP / 100).toFixed(2)}`,
        `Status: ${assignment.status}`,
      ].join('\\n');

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:job-${assignment.id}@speedy-van.co.uk`,
        `DTSTAMP:${created}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:Job #${assignment.Booking.reference}`,
        `DESCRIPTION:${description}`,
        `STATUS:CONFIRMED`,
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const icsString = icsContent.join('\r\n');

    return new Response(icsString, {
      headers: {
        'Content-Type': 'text/calendar',
        'Content-Disposition': `attachment; filename="driver-schedule-${format(new Date(), 'yyyy-MM-dd')}.ics"`,
      },
    });
  } catch (error) {
    console.error('Schedule export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

