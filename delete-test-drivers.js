import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTestDrivers() {
  try {
    console.log('🗑️  Deleting test drivers...');
    
    // Delete the 5 fake drivers we created
    const testEmails = [
      'driver1@test.com',
      'driver2@test.com', 
      'driver3@test.com',
      'driver4@test.com',
      'driver5@test.com'
    ];
    
    // Find users
    const testUsers = await prisma.user.findMany({
      where: {
        email: { in: testEmails }
      },
      select: { id: true, email: true }
    });
    
    if (testUsers.length === 0) {
      console.log('✅ No test drivers found - already deleted or never created');
      return;
    }
    
    const userIds = testUsers.map(u => u.id);
    
    // Delete DriverAvailability first (foreign key)
    const deletedAvailability = await prisma.driverAvailability.deleteMany({
      where: { driverId: { in: userIds } }
    });
    console.log(`✅ Deleted ${deletedAvailability.count} availability records`);
    
    // Delete Driver records
    const deletedDrivers = await prisma.driver.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log(`✅ Deleted ${deletedDrivers.count} driver records`);
    
    // Delete User records
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });
    console.log(`✅ Deleted ${deletedUsers.count} user records`);
    
    console.log('\n✅ Test drivers cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestDrivers();
