import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚗 Creating test driver...');

  // Create user for driver
  const hashedPassword = await bcrypt.hash('driver123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'driver@speedyvan.co.uk' },
    update: {},
    create: {
      email: 'driver@speedyvan.co.uk',
      name: 'Test Driver',
      password: hashedPassword,
      role: 'driver',
      emailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ User created/found:', user.id);

  // Create driver profile
  const driver = await prisma.driver.upsert({
    where: { userId: user.id },
    update: {
      status: 'active',
      onboardingStatus: 'approved',
    },
    create: {
      userId: user.id,
      status: 'active',
      onboardingStatus: 'approved',
    },
  });

  console.log('✅ Driver created/updated:', driver.id);

  // Create driver availability
  await prisma.driverAvailability.upsert({
    where: { driverId: driver.id },
    update: {
      status: 'online',
      lastSeenAt: new Date(),
    },
    create: {
      driverId: driver.id,
      status: 'online',
      lastSeenAt: new Date(),
      lastLat: 51.5074,
      lastLng: -0.1278,
    },
  });

  console.log('✅ Driver availability set to online');

  console.log('\n📋 Test Driver Details:');
  console.log('   Email: driver@speedyvan.co.uk');
  console.log('   Password: driver123');
  console.log('   Status: active');
  console.log('   Onboarding: approved');
  console.log('   Availability: online');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
