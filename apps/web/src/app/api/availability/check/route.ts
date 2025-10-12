import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // This would check against your database for crew and van availability
    // For demo purposes, we'll return mock availability data

    const availabilityData = generateMockAvailabilityData(date);

    return NextResponse.json(availabilityData);
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}

function generateMockAvailabilityData(date: string): any {
  const moveDate = new Date(date);
  const today = new Date();
  const daysDifference = Math.floor(
    (moveDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Generate realistic availability based on day of week and time
  const dayOfWeek = moveDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isPeakDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday

  // Base availability (higher on weekdays, lower on weekends)
  let baseAvailability = isPeakDay ? 0.9 : isWeekend ? 0.7 : 0.8;

  // Reduce availability for very short notice (same day or next day)
  if (daysDifference <= 1) {
    baseAvailability *= 0.6;
  } else if (daysDifference <= 3) {
    baseAvailability *= 0.8;
  }

  // Generate time slots with availability
  const timeSlots = [
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
  ];

  const availableSlots: string[] = [];
  const unavailableReasons: Record<string, string> = {};

  timeSlots.forEach(time => {
    const hour = parseInt(time.split(':')[0]);

    // Peak hours (7-9 AM, 4-6 PM) have lower availability
    const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
    let slotAvailability = baseAvailability;

    if (isPeakHour) {
      slotAvailability *= 0.8; // 20% reduction for peak hours
    }

    // Early morning and late evening have lower availability
    if (hour <= 7 || hour >= 19) {
      slotAvailability *= 0.7;
    }

    // Random variation
    const randomFactor = Math.random();

    if (randomFactor <= slotAvailability) {
      availableSlots.push(time);
    } else {
      // Generate realistic reasons for unavailability
      const reasons = [
        'Fully Booked',
        'Crew Unavailable',
        'Van Maintenance',
        'Driver Off Duty',
        'Route Congestion',
      ];

      const randomReason = reasons[Math.floor(Math.random() * reasons.length)];
      unavailableReasons[time] = randomReason;
    }
  });

  return {
    date: date,
    availableSlots: availableSlots,
    unavailableReasons: unavailableReasons,
    totalSlots: timeSlots.length,
    availableCount: availableSlots.length,
    availabilityPercentage: Math.round(
      (availableSlots.length / timeSlots.length) * 100
    ),
    recommendations: {
      bestTimes: availableSlots.slice(0, 3), // Top 3 available times
      alternativeDates: generateAlternativeDates(moveDate),
      peakHourWarning: isPeakDay,
    },
  };
}

function generateAlternativeDates(moveDate: Date): string[] {
  const alternatives: string[] = [];
  const today = new Date();

  // Suggest next 3 available dates
  for (let i = 1; i <= 7; i++) {
    const alternativeDate = new Date(moveDate);
    alternativeDate.setDate(alternativeDate.getDate() + i);

    if (alternativeDate > today) {
      alternatives.push(alternativeDate.toISOString().split('T')[0]);

      if (alternatives.length >= 3) {
        break;
      }
    }
  }

  return alternatives;
}
