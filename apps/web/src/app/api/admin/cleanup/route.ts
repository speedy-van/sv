import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/admin/cleanup
 * Deletes all bookings, routes, and related data
 * ⚠️ USE WITH CAUTION - This is irreversible!
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { role: true },
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    console.log('🗑️  Admin cleanup initiated by:', session.user.email);

    // Delete in correct order to respect foreign key constraints
    
    // 0. Delete Job Events (has FK to Assignment)
    const jobEvents = await prisma.jobEvent.deleteMany({});
    console.log(`✅ Deleted ${jobEvents.count} job events`);

    // 0.5. Delete Driver Earnings (has FK to Assignment)
    const driverEarnings = await prisma.driverEarnings.deleteMany({});
    console.log(`✅ Deleted ${driverEarnings.count} driver earnings`);

    // 1. Delete Assignments
    const assignments = await prisma.assignment.deleteMany({});
    console.log(`✅ Deleted ${assignments.count} assignments`);

    // 2. Delete Booking Items
    const bookingItems = await prisma.bookingItem.deleteMany({});
    console.log(`✅ Deleted ${bookingItems.count} booking items`);

    // 3. Delete Booking Progress
    const bookingProgress = await prisma.bookingProgress.deleteMany({});
    console.log(`✅ Deleted ${bookingProgress.count} booking progress records`);

    // 3.5. Delete Tracking Pings (has FK to Booking)
    const trackingPings = await prisma.trackingPing.deleteMany({});
    console.log(`✅ Deleted ${trackingPings.count} tracking pings`);

    // 4. Delete Bookings
    const bookings = await prisma.booking.deleteMany({});
    console.log(`✅ Deleted ${bookings.count} bookings`);

    // 5. Delete Routes
    const routes = await prisma.route.deleteMany({});
    console.log(`✅ Deleted ${routes.count} routes`);

    // 6. Clean up orphaned addresses
    let deletedAddresses = 0;
    try {
      deletedAddresses = await prisma.$executeRaw`
        DELETE FROM "Address" WHERE id NOT IN (
          SELECT DISTINCT "pickupAddressId" FROM "Booking" WHERE "pickupAddressId" IS NOT NULL
          UNION
          SELECT DISTINCT "dropoffAddressId" FROM "Booking" WHERE "dropoffAddressId" IS NOT NULL
        )
      `;
      console.log(`✅ Deleted ${deletedAddresses} orphaned addresses`);
    } catch (err) {
      console.log('ℹ️  Address cleanup skipped');
    }

    console.log('✅ Cleanup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      deleted: {
        jobEvents: jobEvents.count,
        driverEarnings: driverEarnings.count,
        assignments: assignments.count,
        bookingItems: bookingItems.count,
        bookingProgress: bookingProgress.count,
        trackingPings: trackingPings.count,
        bookings: bookings.count,
        routes: routes.count,
        addresses: deletedAddresses,
      },
    });
  } catch (error: any) {
    console.error('❌ Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cleanup failed' },
      { status: 500 }
    );
  }
}


