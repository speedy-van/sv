const { PrismaClient } = require('./node_modules/.prisma/client');
const bcrypt = require('bcryptjs');

async function createTestDriver() {
  const prisma = new PrismaClient();

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: 'zadfad41@gmail.com',
        role: 'driver'
      }
    });

    if (existingUser) {
      console.log('✅ User already exists:', existingUser.id);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('112233', 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: `user_${Date.now()}`,
        email: 'zadfad41@gmail.com',
        password: hashedPassword,
        name: 'Test Driver',
        role: 'driver',
        emailVerified: new Date(),
        lastLogin: new Date(),
      }
    });

    // Create driver
    const driver = await prisma.driver.create({
      data: {
        id: `driver_${Date.now()}`,
        userId: user.id,
        status: 'active',
        onboardingStatus: 'approved',
        basePostcode: 'G21 2QB',
        vehicleType: 'van',
        rating: 4.8,
        strikes: 0,
      }
    });

    console.log('✅ Test driver created successfully!');
    console.log('📧 Email:', user.email);
    console.log('🔑 Password:', '112233');
    console.log('👤 User ID:', user.id);
    console.log('🚗 Driver ID:', driver.id);

  } catch (error) {
    console.error('❌ Error creating test driver:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDriver();
