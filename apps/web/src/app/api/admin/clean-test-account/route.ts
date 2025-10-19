import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Clean Test Account Data
 * DELETE /api/admin/clean-test-account
 * Removes all data for test account: zadfad41@gmail.com
 */
export async function DELETE(request: NextRequest) {
  try {
    const testEmail = 'zadfad41@gmail.com';
    
    console.log(`🧹 Cleaning test account: ${testEmail}`);
    
    // Find the driver user
    const driver = await prisma.driver.findUnique({
      where: { email: testEmail },
      include: {
        user: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Test account not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Found driver: ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);

    // Delete related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete assignments
      const deletedAssignments = await tx.assignment.deleteMany({
        where: { driverId: driver.id },
      });
      console.log(`   ✓ Deleted ${deletedAssignments.count} assignments`);

      // Delete route assignments
      const deletedRouteAssignments = await tx.routeAssignment.deleteMany({
        where: { driverId: driver.id },
      });
      console.log(`   ✓ Deleted ${deletedRouteAssignments.count} route assignments`);

      // Delete driver location updates
      const deletedLocations = await tx.driverLocation.deleteMany({
        where: { driverId: driver.id },
      });
      console.log(`   ✓ Deleted ${deletedLocations.count} location updates`);

      // Delete earnings
      const deletedEarnings = await tx.earning.deleteMany({
        where: { driverId: driver.id },
      });
      console.log(`   ✓ Deleted ${deletedEarnings.count} earnings records`);

      // Delete notifications
      if (driver.userId) {
        const deletedNotifications = await tx.notification.deleteMany({
          where: { userId: driver.userId },
        });
        console.log(`   ✓ Deleted ${deletedNotifications.count} notifications`);
      }

      // Delete driver availability
      const deletedAvailability = await tx.driverAvailability.deleteMany({
        where: { driverId: driver.id },
      });
      console.log(`   ✓ Deleted ${deletedAvailability.count} availability records`);

      // Delete driver profile
      await tx.driver.delete({
        where: { id: driver.id },
      });
      console.log(`   ✓ Deleted driver profile`);

      // Delete user account
      if (driver.userId) {
        await tx.user.delete({
          where: { id: driver.userId },
        });
        console.log(`   ✓ Deleted user account`);
      }
    });

    console.log('✅ Test account cleaned successfully!');

    return NextResponse.json({
      success: true,
      message: 'Test account cleaned successfully',
      email: testEmail,
    });
  } catch (error: any) {
    console.error('❌ Error cleaning test account:', error);
    return NextResponse.json(
      { error: 'Failed to clean test account', details: error.message },
      { status: 500 }
    );
  }
}

