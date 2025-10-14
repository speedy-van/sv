import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestDriver() {
  try {
    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: 'deloalo99' },
      include: { driver: true },
    });

    if (!user) {
      // Create a test user with driver role
      const hashedPassword = await bcrypt.hash('Aa234311Aa', 12);

      user = await prisma.user.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: 'deloalo99',
          name: 'Deloalo Driver',
          role: 'driver',
          password: hashedPassword,
        },
        include: { driver: true },
      });

      console.log('✅ Test driver user created:', user.email);
    } else {
      console.log('✅ Test driver user already exists:', user.email);
    }

    // Create or update driver record
    if (!user.driver) {
      const driver = await prisma.driver.create({
        data: {
          id: `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          onboardingStatus: 'approved',
          basePostcode: 'SW1A 1AA',
          vehicleType: 'medium_van',
          updatedAt: new Date(),
        },
      });

      // Create driver availability record - Default to online
      await prisma.driverAvailability.create({
        data: {
          id: `availability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          driverId: driver.id,
          status: 'online',
          locationConsent: false,
          updatedAt: new Date(),
        },
      });

      console.log('✅ Test driver record created:', driver.id);
    } else {
      console.log('✅ Test driver record already exists:', user.driver.id);
    }

    console.log('\n🎉 Deloalo99 driver account ready!');
    console.log('Username: deloalo99');
    console.log('Password: Aa234311Aa');
    console.log('Login URL: https://speedy-van.co.uk/driver/login');
  } catch (error) {
    console.error('❌ Error creating test driver:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDriver();
