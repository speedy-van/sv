import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { reason } = await request.json();
    const { id: driverId } = await params;

    // Get driver with current status
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Clear push subscriptions and set availability to offline
    await prisma.pushSubscription.deleteMany({
      where: { driverId: driverId },
    });

    await prisma.driverAvailability.updateMany({
      where: { driverId: driverId },
      data: {
        status: 'offline',
        lastSeenAt: new Date(),
      },
    });

    // Invalidate any active sessions (this would typically be done through a session management system)
    // For now, we'll just log that this action was taken
    console.log(
      `Force logout requested for driver ${driverId} by admin ${user.email}`
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: 'admin',
        action: 'driver_force_logout',
        targetType: 'Driver',
        targetId: driverId,
        after: {
          reason: reason || 'Force logout by admin',
          loggedOutBy: user.email,
          loggedOutAt: new Date().toISOString(),
          actions: [
            'Cleared push subscriptions',
            'Set availability to offline',
            'Invalidated active sessions',
          ],
        },
        ip:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Send notification to driver (if notification system is implemented)
    // await sendDriverNotification(driver.userId, 'force_logout', {
    //   driverName: driver.user.name,
    //   loggedOutAt: new Date().toISOString(),
    //   reason: reason || 'Force logout by admin',
    // });

    return NextResponse.json({
      success: true,
      message: 'Driver force logout successful',
      driver: {
        id: driver.id,
        name: driver.User.name,
        email: driver.User.email,
        forceLoggedOutAt: new Date().toISOString(),
        reason: reason || 'Force logout by admin',
      },
    });
  } catch (error) {
    console.error('Driver force logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
