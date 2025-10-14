// Create test account for Apple testing
const { execSync } = require('child_process');

try {
  console.log('🔧 Creating test account for Apple...\n');

  // Use existing script to create the account
  const result = execSync('node create-apple-test-driver.mjs', { encoding: 'utf8' });
  console.log('✅ Account created successfully!');
  console.log(result);

} catch (error) {
  console.log('❌ Script failed, trying direct database creation...\n');

  // Alternative: Create account directly
  try {
    const bcrypt = require('bcryptjs');
    const { PrismaClient } = require('./node_modules/.prisma/client');

    async function createAccount() {
      const prisma = new PrismaClient();

      try {
        const hash = await bcrypt.hash('112233', 12);

        const user = await prisma.user.upsert({
          where: { email: 'zadfad41@gmail.com' },
          update: { password: hash },
          create: {
            id: 'user_apple_' + Date.now(),
            email: 'zadfad41@gmail.com',
            name: 'Apple Test Driver',
            role: 'driver',
            password: hash,
          }
        });

        const driver = await prisma.driver.upsert({
          where: { userId: user.id },
          update: { onboardingStatus: 'approved' },
          create: {
            id: 'driver_apple_' + Date.now(),
            userId: user.id,
            status: 'active',
            onboardingStatus: 'approved',
            basePostcode: 'G21 2QB',
            vehicleType: 'van',
            rating: 5.0,
          }
        });

        console.log('✅ Test account created!');
        console.log('📧 Email: zadfad41@gmail.com');
        console.log('🔑 Password: 112233');
        console.log('👤 User ID:', user.id);
        console.log('🚗 Driver ID:', driver.id);

      } catch (dbError) {
        console.error('❌ Database error:', dbError.message);
      } finally {
        await prisma.$disconnect();
      }
    }

    createAccount();

  } catch (altError) {
    console.error('❌ Alternative method also failed:', altError.message);
  }
}





