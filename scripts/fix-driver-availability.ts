import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDriverAvailability() {
  console.log('🔧 Fixing driver availability records...');

  // Get all active approved drivers without availability records
  const driversWithoutAvailability = await prisma.driver.findMany({
    where: {
      status: 'active',
      onboardingStatus: 'approved',
      DriverAvailability: null
    },
    select: {
      id: true,
      userId: true,
      User: {
        select: { name: true, email: true }
      }
    }
  });

  console.log(`📊 Found ${driversWithoutAvailability.length} drivers without availability records`);

  // Create availability records for them
  for (const driver of driversWithoutAvailability) {
    console.log(`🚗 Creating availability for driver: ${driver.User?.name} (${driver.id})`);

    await prisma.driverAvailability.create({
      data: {
        id: `availability_${driver.id}_${Date.now()}`,
        driverId: driver.id,
        status: 'available', // Default to available
        lastSeenAt: new Date(),
        lastLat: null,
        lastLng: null,
        updatedAt: new Date(),
      }
    });
  }

  console.log('✅ Driver availability fix completed');

  // Verify the fix
  const totalDrivers = await prisma.driver.count({
    where: {
      status: 'active',
      onboardingStatus: 'approved'
    }
  });

  const driversWithAvailability = await prisma.driver.count({
    where: {
      status: 'active',
      onboardingStatus: 'approved',
      DriverAvailability: { isNot: null }
    }
  });

  console.log(`📈 Results: ${driversWithAvailability}/${totalDrivers} drivers now have availability records`);
}

fixDriverAvailability()
  .catch(console.error)
  .finally(() => prisma.$disconnect());