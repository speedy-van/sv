const { PrismaClient } = require('./packages/shared/prisma/client');
const bcrypt = require('bcryptjs');

async function checkUser() {
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: 'zadfad41@gmail.com',
        role: 'driver'
      },
      include: {
        driver: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      hasDriver: !!user.driver,
      driverStatus: user.driver?.onboardingStatus,
      passwordHash: user.password.substring(0, 20) + '...'
    });

    // Check password
    const isValid = await bcrypt.compare('112233', user.password);
    console.log('🔐 Password valid:', isValid);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
