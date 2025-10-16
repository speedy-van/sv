import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

/**
 * DELETE /api/admin/routes/[id]/drops/[dropId]
 * Remove drop from route (even if route is in progress!)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; dropId: string } }
): Promise<NextResponse> {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: routeId, dropId } = params;

    // Get route
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        drops: true
      }
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // Cannot modify completed or closed routes
    if (route.status === 'completed' || route.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot remove drops from completed or closed routes' },
        { status: 400 }
      );
    }

    // Get drop
    const drop = await prisma.drop.findUnique({
      where: { id: dropId }
    });

    if (!drop) {
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      );
    }

    // Check if drop belongs to this route
    if (drop.routeId !== routeId) {
      return NextResponse.json(
        { error: 'Drop does not belong to this route' },
        { status: 400 }
      );
    }

    // Cannot remove completed drops
    if (drop.status === 'delivered') {
      return NextResponse.json(
        { error: 'Cannot remove completed drops' },
        { status: 400 }
      );
    }

    // Remove drop from route (set routeId to null and mark as cancelled)
    const updatedDrop = await prisma.drop.update({
      where: { id: dropId },
      data: {
        routeId: null,
        status: 'cancelled'
      }
    });

    // Update route to mark as modified by admin
    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: {
        isModifiedByAdmin: true,
        adminNotes: route.adminNotes 
          ? `${route.adminNotes}\nDrop ${dropId} removed by admin on ${new Date().toISOString()}`
          : `Drop ${dropId} removed by admin on ${new Date().toISOString()}`
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        drops: {
          include: {
            User: { select: { id: true, name: true, email: true } },
            Booking: { select: { id: true } }
          }
        },
        Booking: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Send real-time notification to driver
    if (route.driverId) {
      try {
        const pusher = getPusherServer();
        
        await pusher.trigger(`driver-${route.driverId}`, 'drop-removed', {
          routeId: routeId,
          routeNumber: routeId, // Route ID is the route number
          dropId: dropId,
          message: `A drop has been removed from route ${routeId} by admin`,
          reason: 'Admin removed drop from route',
          remainingDrops: updatedRoute.drops.length,
          removedAt: new Date().toISOString(),
        });

        console.log(`✅ Drop removal notification sent to driver ${route.driverId}`);
      } catch (notificationError) {
        console.error('❌ Error sending drop removal notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({
      route: updatedRoute,
      removedDrop: updatedDrop,
      message: 'Drop removed from route successfully'
    });

  } catch (error) {
    console.error('Error removing drop from route:', error);
    return NextResponse.json(
      { error: 'Failed to remove drop from route' },
      { status: 500 }
    );
  }
}
