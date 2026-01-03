// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try custom session first
    const customSession = await getCustomSession();
    let isAdmin = customSession?.user?.role === 'admin';
    let userId = customSession?.user?.id;
    
    if (!customSession?.user) {
      // Fallback to NextAuth
      const session = await getServerSession(authOptions);
      isAdmin = (session?.user as any)?.role === 'admin';
      userId = (session?.user as any)?.id;
      
      if (!session?.user || !isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: routeId } = await params;
    const body = await request.json();
    const { reason } = body;

    console.log('🚗 [Remove Driver] Removing driver from route:', { routeId, reason });

    // Get the route with current assignment
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        driver: {
          select: { id: true, name: true, email: true }
        },
        Booking: {
          select: { id: true }
        },
        drops: {
          select: { id: true }
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    if (!route.driverId) {
      return NextResponse.json(
        { error: 'No driver assigned to this route' },
        { status: 400 }
      );
    }

    const driverName = route.driver?.name || 'Unknown Driver';
    const driverId = route.driverId;
    const bookingsCount = route.Booking?.length || 0;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update route - remove driver and set to pending
      const updatedRoute = await tx.route.update({
        where: { id: routeId },
        data: {
          driverId: null,
          status: 'pending_assignment',
          acceptanceStatus: 'pending',
          adminNotes: route.adminNotes 
            ? `${route.adminNotes}\n\n[${new Date().toISOString()}] Driver removed by admin. Reason: ${reason || 'Not specified'}`
            : `Driver removed by admin. Reason: ${reason || 'Not specified'}`,
          isModifiedByAdmin: true,
          updatedAt: new Date(),
        },
      });

      // Update all bookings in route to unassigned status
      await tx.booking.updateMany({
        where: { routeId: routeId },
        data: {
          driverId: null,
          status: 'CONFIRMED', // Reset to confirmed
        },
      });

      console.log(`✅ [Remove Driver] Route ${route.reference} unassigned from driver ${driverName}`);

      return {
        route: updatedRoute,
        driverName,
        bookingsUpdated: bookingsCount,
      };
    });

    // Notify driver about removal
    try {
      const pusher = getPusherServer();
      
      await pusher.trigger(`driver-${driverId}`, 'route-removed', {
        routeId: route.id,
        routeReference: route.reference,
        reason: reason || 'Route reassignment by admin',
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ [Remove Driver] Driver ${driverId} notified about route removal`);
    } catch (pusherError) {
      console.error('❌ [Remove Driver] Error notifying driver:', pusherError);
      // Continue even if notification fails
    }

    // Notify admin about successful removal
    try {
      const pusher = getPusherServer();
      
      await pusher.trigger('admin-notifications', 'route-driver-removed', {
        routeId: route.id,
        routeReference: route.reference,
        driverName,
        bookingsCount: result.bookingsUpdated,
        reason: reason || 'Not specified',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ [Remove Driver] Error notifying admin:', error);
    }

    return NextResponse.json({
      success: true,
      message: `Driver ${driverName} removed from route ${route.reference}`,
      data: {
        route: result.route,
        driverName: result.driverName,
        bookingsUpdated: result.bookingsUpdated,
      },
    });

  } catch (error) {
    console.error('❌ [Remove Driver] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to remove driver from route',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
