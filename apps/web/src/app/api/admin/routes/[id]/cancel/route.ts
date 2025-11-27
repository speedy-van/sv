import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try custom session first
    const customSession = await getCustomSession();
    let isAdmin = customSession?.user?.role === 'admin';
    
    if (!customSession?.user) {
      // Fallback to NextAuth
      const session = await getServerSession(authOptions);
      isAdmin = (session?.user as any)?.role === 'admin';
      
      if (!session?.user || !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    if (!isAdmin) {
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

    const body = await request.json();
    const { reason } = body || {};

    // Update route status to closed with transaction
    const updatedRoute = await prisma.$transaction(async (tx) => {
      // First, fetch the current route to get existing adminNotes
      const currentRoute = await tx.route.findUnique({
        where: { id: routeId },
        select: { 
          adminNotes: true, 
          reference: true,
          driverId: true,
        },
      });

      if (!currentRoute) {
        throw new Error('Route not found');
      }

      // Update the route
      const route = await tx.route.update({
        where: { id: routeId },
        data: {
          status: 'closed',
          endTime: new Date(),
          adminNotes: currentRoute.adminNotes 
            ? `${currentRoute.adminNotes}\n\n[${new Date().toISOString()}] Route cancelled by admin. Reason: ${reason || 'Not specified'}`
            : `Route cancelled by admin. Reason: ${reason || 'Not specified'}`,
          isModifiedByAdmin: true,
        },
        include: {
          driver: {
            select: { id: true, name: true, email: true }
          },
          drops: {
            select: { id: true }
          },
          Booking: {
            include: {
              customer: {
                select: { id: true, name: true, email: true }
              },
            },
          },
        },
      });

      // Update all bookings to remove route assignment
      await tx.booking.updateMany({
        where: { routeId: routeId },
        data: {
          routeId: null,
          status: 'CONFIRMED', // Reset to confirmed so they can be reassigned
          deliverySequence: null,
          orderType: 'single',
        },
      });

      // Delete all drops
      await tx.drop.deleteMany({
        where: { routeId: routeId },
      });

      return route;
    });

    console.log(`✅ [Cancel Route] Route ${updatedRoute.reference} cancelled - ${updatedRoute.Booking?.length || 0} bookings reset`);

    // Send real-time notification to driver
    if (updatedRoute.driverId) {
      try {
        const pusher = getPusherServer();
        
        await pusher.trigger(`driver-${updatedRoute.driverId}`, 'route-cancelled', {
          routeId: routeId,
          routeReference: updatedRoute.reference,
          message: `Route ${updatedRoute.reference} has been cancelled by admin`,
          reason: reason || 'Admin cancelled the route',
          bookingsCount: updatedRoute.Booking?.length || 0,
          dropsCount: updatedRoute.drops?.length || 0,
          cancelledAt: new Date().toISOString(),
          action: 'remove_route',
          shouldRemoveFromApp: true,
        });

        console.log(`✅ [Cancel Route] Notification sent to driver ${updatedRoute.driverId}`);
      } catch (notificationError) {
        console.error('❌ [Cancel Route] Error sending driver notification:', notificationError);
      }
    }

    // Notify admin about cancellation
    try {
      const pusher = getPusherServer();
      
      await pusher.trigger('admin-notifications', 'route-cancelled', {
        routeId: routeId,
        routeReference: updatedRoute.reference,
        driverName: updatedRoute.driver?.name || 'Unassigned',
        bookingsCount: updatedRoute.Booking?.length || 0,
        dropsCount: updatedRoute.drops?.length || 0,
        reason: reason || 'Not specified',
        cancelledAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ [Cancel Route] Error notifying admin:', error);
    }

    // Send cancellation emails to customers if needed
    if (updatedRoute.Booking && updatedRoute.Booking.length > 0) {
      try {
        const { unifiedEmailService } = await import('@/lib/email/UnifiedEmailService');
        
        for (const booking of updatedRoute.Booking) {
          if (booking.customer?.email) {
            await unifiedEmailService.sendOrderCancellation({
              customerEmail: booking.customer.email,
              orderNumber: booking.reference,
              customerName: booking.customer.name || booking.customerName,
              reason: reason || 'Route cancelled by admin',
              refundAmount: booking.paidAt ? Number(booking.totalGBP) / 100 : undefined,
              currency: 'GBP',
            });
          }
        }
        console.log(`✅ [Cancel Route] Sent ${updatedRoute.Booking.length} cancellation emails`);
      } catch (emailError) {
        console.error('❌ [Cancel Route] Error sending emails:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      route: updatedRoute,
      message: `Route ${updatedRoute.reference} cancelled successfully. ${updatedRoute.Booking?.length || 0} bookings reset to pending.`,
      data: {
        routeReference: updatedRoute.reference,
        bookingsReset: updatedRoute.Booking?.length || 0,
        dropsDeleted: updatedRoute.drops?.length || 0,
      },
    });
  } catch (error) {
    console.error('❌ [Cancel Route] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to cancel route',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
