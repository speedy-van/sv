// Quick create test account
const { PrismaClient } = require('./node_modules/.prisma/client');

async function create() {
  const prisma = new PrismaClient();

  try {
    // Pre-hashed password for '112233' with bcrypt cost 12
    const hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfBPjYXC2wU1E2';

    const user = await prisma.user.upsert({
      where: { email: 'zadfad41@gmail.com' },
      update: {
        password: hash,
        name: 'Apple Test Driver'
      },
      create: {
        id: 'user_apple_test_' + Date.now(),
        email: 'zadfad41@gmail.com',
        name: 'Apple Test Driver',
        role: 'driver',
        password: hash,
      }
    });

    const driver = await prisma.driver.upsert({
      where: { userId: user.id },
      update: {
        status: 'active',
        onboardingStatus: 'approved'
      },
      create: {
        id: 'driver_apple_test_' + Date.now(),
        userId: user.id,
        status: 'active',
        onboardingStatus: 'approved',
        basePostcode: 'G21 2QB',
        vehicleType: 'van',
        rating: 5.0,
      }
    });

    console.log('✅ Test account created for Apple!');
    console.log('📧 Email: zadfad41@gmail.com');
    console.log('🔑 Password: 112233');
    console.log('👤 User ID:', user.id);
    console.log('🚗 Driver ID:', driver.id);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

create();





