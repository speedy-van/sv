import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating test driver account...\n');

    const testEmail = 'zadfad41@gmail.com';
    const testPassword = '112233';

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { Driver: true },
    });

    if (user) {
      console.log('✅ User exists, updating password...');
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log('✅ Password updated');
    } else {
      // Create user
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      user = await prisma.user.create({
        data: {
          id: `user_${Date.now()}`,
          email: testEmail,
          name: 'Apple Test Driver',
          role: 'driver',
          password: hashedPassword,
        },
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
          rating: 5.0,
        },
      });

      console.log('✅ Test driver created:', driver.id);
    }

    console.log('🎉 Test account ready!');
    console.log('📧 Email: zadfad41@gmail.com');
    console.log('🔑 Password: 112233');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
