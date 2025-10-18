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

    if (!reason) {
      return NextResponse.json(
        { error: 'Suspension reason is required' },
        { status: 400 }
      );
    }

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

    if (driver.status === 'suspended') {
      return NextResponse.json(
        { error: 'Driver is already suspended' },
        { status: 400 }
      );
    }

    // Update driver status
    await prisma.driver.update({
      where: { id: driverId },
      data: {
        status: 'suspended',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: 'admin',
        action: 'driver_suspended',
        targetType: 'Driver',
        targetId: driverId,
        after: {
          previousStatus: driver.status,
          newStatus: 'suspended',
          reason: reason,
          suspendedBy: user.email,
          suspendedAt: new Date().toISOString(),
        },
        ip:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Send notification to driver (if notification system is implemented)
    // await sendDriverNotification(driver.userId, 'account_suspended', {
    //   driverName: driver.user.name,
    //   reason: reason,
    //   suspendedAt: new Date().toISOString(),
    // });

    return NextResponse.json({
      success: true,
      message: 'Driver suspended successfully',
      driver: {
        id: driver.id,
        name: driver.User.name,
        email: driver.User.email,
        status: 'suspended',
        suspendedAt: new Date().toISOString(),
        reason: reason,
      },
    });
  } catch (error) {
    console.error('Driver suspension error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
