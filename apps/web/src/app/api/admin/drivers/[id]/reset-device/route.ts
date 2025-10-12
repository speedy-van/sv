import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const adminUser = authResult;
    const { reason } = await request.json();
    const driverId = params.id;

    // Get driver with current status
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
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

    // Clear push subscriptions and availability status
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: adminUser.id,
        actorRole: 'admin',
        action: 'driver_device_reset',
        targetType: 'Driver',
        targetId: driverId,
        after: {
          reason: reason || 'Device reset by admin',
          resetBy: adminUser.email,
          resetAt: new Date().toISOString(),
          actions: [
            'Cleared push subscriptions',
            'Set availability to offline',
            'Reset last seen timestamp',
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
    // await sendDriverNotification(driver.userId, 'device_reset', {
    //   driverName: driver.user.name,
    //   resetAt: new Date().toISOString(),
    //   reason: reason || 'Device reset by admin',
    // });

    return NextResponse.json({
      success: true,
      message: 'Driver device reset successfully',
      driver: {
        id: driver.id,
        name: driver.user.name,
        email: driver.user.email,
        deviceResetAt: new Date().toISOString(),
        reason: reason || 'Device reset by admin',
      },
    });
  } catch (error) {
    console.error('Driver device reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
