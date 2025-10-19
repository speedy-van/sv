/**
 * Clean Test Account Data
 * Removes all data for test account: zadfad41@gmail.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestAccount() {
  const testEmail = 'zadfad41@gmail.com';
  
  console.log(`🧹 Cleaning test account: ${testEmail}`);
  
  try {
    // Find the driver user
    const driver = await prisma.driver.findUnique({
      where: { email: testEmail },
      include: {
        user: true,
      },
    });

    if (!driver) {
      console.log('❌ Test account not found');
      return;
    }

    console.log(`✅ Found driver: ${driver.firstName} ${driver.lastName} (ID: ${driver.id})`);

    // Delete related data
    console.log('🗑️  Deleting related data...');

    // Delete assignments
    const deletedAssignments = await prisma.assignment.deleteMany({
      where: { driverId: driver.id },
    });
    console.log(`   ✓ Deleted ${deletedAssignments.count} assignments`);

    // Delete route assignments
    const deletedRouteAssignments = await prisma.routeAssignment.deleteMany({
      where: { driverId: driver.id },
    });
    console.log(`   ✓ Deleted ${deletedRouteAssignments.count} route assignments`);

    // Delete driver location updates
    const deletedLocations = await prisma.driverLocation.deleteMany({
      where: { driverId: driver.id },
    });
    console.log(`   ✓ Deleted ${deletedLocations.count} location updates`);

    // Delete earnings
    const deletedEarnings = await prisma.earning.deleteMany({
      where: { driverId: driver.id },
    });
    console.log(`   ✓ Deleted ${deletedEarnings.count} earnings records`);

    // Delete notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { userId: driver.userId },
    });
    console.log(`   ✓ Deleted ${deletedNotifications.count} notifications`);

    // Delete driver availability
    const deletedAvailability = await prisma.driverAvailability.deleteMany({
      where: { driverId: driver.id },
    });
    console.log(`   ✓ Deleted ${deletedAvailability.count} availability records`);

    // Delete driver profile
    await prisma.driver.delete({
      where: { id: driver.id },
    });
    console.log(`   ✓ Deleted driver profile`);

    // Delete user account
    if (driver.userId) {
      await prisma.user.delete({
        where: { id: driver.userId },
      });
      console.log(`   ✓ Deleted user account`);
    }

    console.log('✅ Test account cleaned successfully!');
  } catch (error) {
    console.error('❌ Error cleaning test account:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestAccount()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

