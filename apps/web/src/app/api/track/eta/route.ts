import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response('Booking code required', { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { reference: code },
    select: {
      id: true,
      pickupAddress: true,
      dropoffAddress: true,
    },
  });

  if (!booking) {
    return new Response('Booking not found', { status: 404 });
  }

  // Extract coordinates from address objects
  const origin =
    booking.pickupAddress.lng != null && booking.pickupAddress.lat != null
      ? [booking.pickupAddress.lng, booking.pickupAddress.lat]
      : null;
  const dest =
    booking.dropoffAddress.lng != null && booking.dropoffAddress.lat != null
      ? [booking.dropoffAddress.lng, booking.dropoffAddress.lat]
      : null;

  if (!origin || !dest) {
    return new Response('Invalid coordinates', { status: 400 });
  }

  // Mock ETA calculation (replace with actual routing service)
  const distance =
    Math.sqrt(
      Math.pow(dest[0] - origin[0], 2) + Math.pow(dest[1] - origin[1], 2)
    ) * 111; // Rough conversion to km

  const etaMinutes = Math.round(distance * 2); // Rough estimate: 2 min per km

  return Response.json({
    eta: etaMinutes,
    distance: Math.round(distance * 10) / 10,
    origin,
    destination: dest,
  });
}
