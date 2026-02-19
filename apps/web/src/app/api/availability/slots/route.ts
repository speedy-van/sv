import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const availabilityQuerySchema = z.object({
  postcode: z.string().min(5).max(10),
  date: z.string(), // ISO date string
  serviceType: z.enum(['STANDARD', 'ECONOMY', 'PREMIUM']).optional().default('STANDARD'),
});

/**
 * Get available time slots for a given date and location
 * GET /api/availability/slots?postcode=SW1A1AA&date=2026-01-27&serviceType=STANDARD
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const validation = availabilityQuerySchema.safeParse({
      postcode: searchParams.get('postcode'),
      date: searchParams.get('date'),
      serviceType: searchParams.get('serviceType') || 'STANDARD',
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { postcode, date, serviceType } = validation.data;
    
    // Parse requested date
    const requestedDate = new Date(date);
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('[AVAILABILITY] Checking slots:', {
      postcode,
      date: requestedDate.toISOString(),
      serviceType,
    });

    // Define time slots (2-hour windows)
    const timeSlots = [
      { id: '08-10', label: '8:00 AM - 10:00 AM', start: 8, end: 10 },
      { id: '10-12', label: '10:00 AM - 12:00 PM', start: 10, end: 12 },
      { id: '12-14', label: '12:00 PM - 2:00 PM', start: 12, end: 14 },
      { id: '14-16', label: '2:00 PM - 4:00 PM', start: 14, end: 16 },
      { id: '16-18', label: '4:00 PM - 6:00 PM', start: 16, end: 18 },
      { id: '18-20', label: '6:00 PM - 8:00 PM', start: 18, end: 20 },
    ];

    // Get active drivers (for capacity calculation)
    const activeDrivers = await prisma.driver.findMany({
      where: {
        User: { isActive: true },
        DriverAvailability: { status: 'online' },
      },
      select: {
        id: true,
        User: { select: { name: true } },
      },
    });

    const totalDriverCapacity = activeDrivers.length;

    // Get existing bookings for this date
    const existingBookings = await prisma.booking.findMany({
      where: {
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING_PAYMENT', 'PENDING_MATCH', 'DRIVER_CONFIRMED', 'CONFIRMED'],
        },
      },
      select: {
        scheduledAt: true,
        pickupTimeSlot: true,
        status: true,
      },
    });

    console.log('[AVAILABILITY] Existing bookings:', existingBookings.length);

    // Calculate availability for each slot
    const availableSlots = timeSlots.map(slot => {
      // Count bookings in this time slot
      const bookingsInSlot = existingBookings.filter(booking => {
        const hour = booking.scheduledAt.getHours();
        return hour >= slot.start && hour < slot.end;
      });

      const bookedCount = bookingsInSlot.length;
      
      // Simple capacity rule: max 3 bookings per driver per 2-hour slot
      const maxCapacity = totalDriverCapacity * 3;
      const remainingCapacity = Math.max(0, maxCapacity - bookedCount);
      const isAvailable = remainingCapacity > 0;
      
      // Calculate utilization percentage
      const utilization = maxCapacity > 0 ? Math.round((bookedCount / maxCapacity) * 100) : 0;

      return {
        id: slot.id,
        label: slot.label,
        startHour: slot.start,
        endHour: slot.end,
        available: isAvailable,
        remainingCapacity,
        bookedCount,
        maxCapacity,
        utilization,
        urgencyLevel: utilization > 80 ? 'high' : utilization > 50 ? 'medium' : 'low',
      };
    });

    // Check if date is in the past
    const now = new Date();
    const isPast = requestedDate < now;

    return NextResponse.json({
      success: true,
      date: requestedDate.toISOString(),
      postcode,
      serviceType,
      isPast,
      totalDrivers: totalDriverCapacity,
      slots: availableSlots,
      recommendations: generateRecommendations(availableSlots, isPast),
    });

  } catch (error) {
    console.error('[AVAILABILITY] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check availability',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(slots: any[], isPast: boolean): string[] {
  const recommendations: string[] = [];

  if (isPast) {
    recommendations.push('Selected date is in the past. Please choose a future date.');
    return recommendations;
  }

  const fullyBookedSlots = slots.filter(s => !s.available);
  const highDemandSlots = slots.filter(s => s.utilization > 70 && s.available);

  if (fullyBookedSlots.length === slots.length) {
    recommendations.push('All slots are fully booked. Try selecting a different date or contact support.');
  } else if (fullyBookedSlots.length > 3) {
    recommendations.push('High demand day. Book early to secure your preferred time slot.');
  }

  if (highDemandSlots.length > 0) {
    recommendations.push('Some slots are filling up quickly. Consider booking soon to avoid missing out.');
  }

  const bestSlots = slots
    .filter(s => s.available)
    .sort((a, b) => a.utilization - b.utilization)
    .slice(0, 2);

  if (bestSlots.length > 0) {
    const labels = bestSlots.map(s => s.label).join(' or ');
    recommendations.push(`Best availability: ${labels}`);
  }

  return recommendations;
}
