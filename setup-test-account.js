import { PrismaClient } from './node_modules/.prisma/client/index.js';
import bcrypt from 'bcryptjs';

async function setup() {
  const prisma = new PrismaClient();
  try {
    console.log('🔧 Setting up test account for Apple...\n');

    // Hash password
    const hash = await bcrypt.hash('112233', 12);
    console.log('✅ Password hashed');

    // Create/update user
    const user = await prisma.user.upsert({
      where: { email: 'zadfad41@gmail.com' },
      update: {
        password: hash,
        name: 'Apple Test Driver'
      },
      create: {
        id: 'user_' + Date.now(),
        email: 'zadfad41@gmail.com',
        name: 'Apple Test Driver',
        role: 'driver',
        password: hash,
      }
    });
    console.log('✅ User ready:', user.email);

    // Create/update driver
    const driver = await prisma.driver.upsert({
      where: { userId: user.id },
      update: {
        status: 'active',
        onboardingStatus: 'approved',
        rating: 5.0
      },
      create: {
        id: 'driver_' + Date.now(),
        userId: user.id,
        status: 'active',
        onboardingStatus: 'approved',
        basePostcode: 'G21 2QB',
        vehicleType: 'van',
        rating: 5.0,
      }
    });
    console.log('✅ Driver ready:', driver.id);

    console.log('\n🎉 Test account configured!');
    console.log('📧 Email: zadfad41@gmail.com');
    console.log('🔑 Password: 112233');
    console.log('✅ Onboarding: approved');
    console.log('✅ Status: active');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setup();
