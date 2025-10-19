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
    
    // Find the user first
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: {
        driver: true,
      },
    });

    if (!user || !user.driver) {
      return NextResponse.json(
        { error: 'Test account or driver not found' },
        { status: 404 }
      );
    }

    const driver = user.driver;

    console.log(`✅ Found driver: ${user.name || user.email} (Driver ID: ${driver.id}, User ID: ${user.id})`);

    // Delete related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete assignments
      const deletedAssignments = await tx.assignment.deleteMany({
        where: { driverId: driver.id },
      });
      console.log(`   ✓ Deleted ${deletedAssignments.count} assignments`);

      // Delete tracking pings (location updates)
      const deletedPings = await tx.trackingPing.deleteMany({
        where: { driverId: driver.id },
      });
      console.log(`   ✓ Deleted ${deletedPings.count} tracking pings`);

      // Delete driver earnings
      const deletedEarnings = await tx.driverEarnings.deleteMany({
        where: { driverId: driver.id },
      });
      console.log(`   ✓ Deleted ${deletedEarnings.count} earnings records`);

      // Delete driver notifications
      const deletedNotifications = await tx.driverNotification.deleteMany({
        where: { driverId: driver.id },
      });
      console.log(`   ✓ Deleted ${deletedNotifications.count} notifications`);

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

