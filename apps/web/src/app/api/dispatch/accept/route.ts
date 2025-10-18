import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { getPusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'driver')
    return new Response('Unauthorized', { status: 401 });
  const userId = (session.user as any).id;
  const driver = await prisma.driver.findUnique({ where: { userId } });
  if (!driver) return new Response('Driver not found', { status: 404 });

  const { bookingId } = await req.json();
  if (!bookingId)
    return NextResponse.json({ error: 'bookingId required' }, { status: 400 });

  try {
    const result = await prisma.$transaction(async tx => {
      // Ensure there's a live offer for this driver
      const offer = await tx.assignment.findFirst({ 
        where: { bookingId },
        orderBy: { createdAt: 'desc' }
      });
      if (
        !offer ||
        offer.driverId !== driver.id ||
        offer.status !== 'invited' ||
        (offer.expiresAt && offer.expiresAt < new Date())
      ) {
        throw new Error('offer_invalid');
      }

      // Claim booking if unassigned
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: {},
      });
      if (booking.driverId) throw new Error('already_assigned');

      await tx.booking.update({
        where: { id: bookingId },
        data: { driverId: driver.id, status: 'CONFIRMED' },
      });
      await tx.assignment.update({
        where: { id: offer.id },
        data: { status: 'accepted' },
      });
      return { bookingId, driverId: driver.id };
    });

    // Notify others to hide job
    await getPusherServer().trigger('drivers', 'job-removed', { bookingId });
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 409 });
  }
}
