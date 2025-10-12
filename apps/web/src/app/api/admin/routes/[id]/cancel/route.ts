import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routeId = params.id;

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        drops: true,
        bookings: true,
      },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Cannot cancel completed routes
    if (route.status === 'completed' || route.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed or closed route' },
        { status: 400 }
      );
    }

    // Update route status to closed
    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: {
        status: 'closed',
        endTime: new Date(),
        adminNotes: `Route cancelled by admin on ${new Date().toISOString()}`,
        isModifiedByAdmin: true,
      },
      include: {
        driver: true,
        drops: true,
        bookings: true,
      },
    });

    // Update all bookings to remove route assignment
    await prisma.booking.updateMany({
      where: {
        routeId: routeId,
      },
      data: {
        routeId: null,
        status: 'CONFIRMED', // Reset to confirmed so they can be reassigned
      },
    });

    // Update all drops status
    await prisma.drop.updateMany({
      where: {
        routeId: routeId,
      },
      data: {
        status: 'cancelled',
      },
    });

    return NextResponse.json({
      route: updatedRoute,
      message: 'Route cancelled successfully. Bookings have been reset to pending.',
    });
  } catch (error) {
    console.error('Cancel route error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel route' },
      { status: 500 }
    );
  }
}
