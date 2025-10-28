import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { assertDriver } from '@/lib/guards';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
} from 'date-fns';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('📅 Driver Schedule API - Starting request');
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let session: any;
    
    if (bearerAuth.success) {
      session = { user: bearerAuth.user };
      console.log('🔑 Bearer token authenticated for user:', bearerAuth.user.id);
    } else {
      // Fallback to NextAuth session (for web app)
      session = await getServerSession(authOptions);
      if (!session?.user) {
        console.log('❌ Driver Schedule API - No session found');
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        );
      }
      console.log('🌐 NextAuth session authenticated for user:', session.user.id);
    }

    try {
      assertDriver(session);
    } catch (e) {
      const msg = (e as Error).message;
      const status = msg === 'UNAUTHORIZED' ? 401 : 403;
      console.log('❌ Driver Schedule API - Auth failed:', msg);
      return NextResponse.json({ error: msg }, { status });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'month'; // month, week, day
    const date = searchParams.get('date') || new Date().toISOString();

    const userId = session.user.id;

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

    // Calculate date range based on view
    const targetDate = new Date(date);
    let startDate: Date;
    let endDate: Date;

    switch (view) {
      case 'week':
        startDate = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday start
        endDate = endOfWeek(targetDate, { weekStartsOn: 1 });
        break;
      case 'day':
        startDate = targetDate;
        endDate = addDays(targetDate, 1);
        break;
      default: // month
        startDate = startOfMonth(targetDate);
        endDate = endOfMonth(targetDate);
    }

    // Get upcoming jobs in the date range
    const upcomingJobs = driver.Assignment.filter(assignment => {
      const jobDate = assignment.Booking.scheduledAt;
      return jobDate && jobDate >= startDate && jobDate <= endDate;
    }).map(assignment => ({
      id: assignment.id,
      bookingId: assignment.Booking.id, // ✅ Add booking ID for mobile navigation
      type: 'job',
      title: `Job #${assignment.Booking.reference}`,
      reference: assignment.Booking.reference, // ✅ Add reference
      start: assignment.Booking.scheduledAt,
      end: assignment.Booking.scheduledAt
        ? addDays(assignment.Booking.scheduledAt, 1)
        : null,
      pickup: assignment.Booking.pickupAddress,
      dropoff: assignment.Booking.dropoffAddress,
      amount: assignment.Booking.totalGBP,
      status: assignment.status,
      bookingStatus: assignment.Booking.status, // ✅ Add booking status
    }));

    // Get shifts in the date range
    const shifts = driver.DriverShift
      .filter(shift => {
        // For recurring shifts, check if they fall in the date range
        if (shift.isRecurring) {
          const dayNames = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
          ];
          const currentDate = new Date(startDate);

          while (currentDate <= endDate) {
            const dayName = dayNames[currentDate.getDay()];
            if (shift.recurringDays.includes(dayName)) {
              return true;
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
          return false;
        } else {
          return shift.startTime >= startDate && shift.startTime <= endDate;
        }
      })
      .map(shift => ({
        id: shift.id,
        type: 'shift',
        title: 'Scheduled Shift',
        start: shift.startTime,
        end: shift.endTime,
        isRecurring: shift.isRecurring,
        recurringDays: shift.recurringDays,
      }));

    // Generate calendar events for recurring shifts
    const recurringShiftEvents = shifts
      .filter(shift => shift.isRecurring)
      .flatMap(shift => {
        const events = [];
        const dayNames = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ];
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          const dayName = dayNames[currentDate.getDay()];
          if (shift.recurringDays.includes(dayName)) {
            const startTime = new Date(shift.start);
            const endTime = new Date(shift.end);

            const eventStart = new Date(currentDate);
            eventStart.setHours(
              startTime.getHours(),
              startTime.getMinutes(),
              0,
              0
            );

            const eventEnd = new Date(currentDate);
            eventEnd.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

            events.push({
              ...shift,
              start: eventStart,
              end: eventEnd,
              isRecurringInstance: true,
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return events;
      });

    // Combine all events
    const allEvents = [
      ...upcomingJobs,
      ...shifts.filter(shift => !shift.isRecurring),
      ...recurringShiftEvents,
    ].sort((a, b) => {
      const aStart = a.start ? new Date(a.start).getTime() : 0;
      const bStart = b.start ? new Date(b.start).getTime() : 0;
      return aStart - bStart;
    });

    // Check for conflicts (overlapping events)
    const conflicts = [];
    for (let i = 0; i < allEvents.length; i++) {
      for (let j = i + 1; j < allEvents.length; j++) {
        const event1 = allEvents[i];
        const event2 = allEvents[j];

        if (
          event1.start &&
          event2.start &&
          event1.end &&
          event2.end &&
          event1.start < event2.end &&
          event2.start < event1.end
        ) {
          conflicts.push({
            event1: event1.title,
            event2: event2.title,
            overlap: {
              start: new Date(
                Math.max(event1.start.getTime(), event2.start.getTime())
              ),
              end: new Date(
                Math.min(event1.end.getTime(), event2.end.getTime())
              ),
            },
          });
        }
      }
    }

    return NextResponse.json({
      events: allEvents,
      conflicts,
      dateRange: {
        start: startDate,
        end: endDate,
        view,
      },
      summary: {
        totalJobs: upcomingJobs.length,
        totalShifts: shifts.length,
        conflicts: conflicts.length,
      },
    });
  } catch (error) {
    console.error('❌ Driver Schedule API - Error:', error);
    return NextResponse.json(
      { error: 'Failed to load schedule' },
      { status: 500 }
    );
  }
}

