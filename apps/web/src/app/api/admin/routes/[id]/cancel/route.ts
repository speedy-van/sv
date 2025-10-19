import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: routeId } = await params;

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        drops: true,
        Booking: true,
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
        Booking: true,
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

    // Update all drops to remove route assignment and reset to pending
    // This allows drops to be re-assigned to new routes (blue circle indicator)
    await prisma.drop.updateMany({
      where: {
        routeId: routeId,
      },
      data: {
        routeId: null, // Remove route assignment
        status: 'pending', // Reset to pending so they show with blue circle
      },
    });

    // Send real-time notification to driver
    if (route.driverId) {
      try {
        const pusher = getPusherServer();
        
        await pusher.trigger(`driver-${route.driverId}`, 'route-cancelled', {
          routeId: routeId,
          routeNumber: routeId, // Route ID is the route number
          message: `Route ${routeId} has been cancelled by admin`,
          reason: 'Admin cancelled the route',
          bookingsCount: route.Booking?.length || 0,
          dropsCount: route.drops?.length || 0,
          cancelledAt: new Date().toISOString(),
          // Signal to iOS app to remove route immediately
          action: 'remove_route',
          shouldRemoveFromApp: true,
        });

        console.log(`✅ Route cancellation notification sent to driver ${route.driverId}`);
      } catch (notificationError) {
        console.error('❌ Error sending route cancellation notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

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
