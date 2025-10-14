// Create Apple Review Test Driver Account
// Email: zadfad41@gmail.com
// Password: 112233

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAppleReviewDriver() {
  console.log('🍎 Creating Apple Review Test Driver Account...\n');

  const testEmail = 'zadfad41@gmail.com';
  const testPassword = '112233';
  const testName = 'Apple Test Driver';

  try {
    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    console.log('✅ Password hashed\n');

    // Check if user exists
    console.log('🔍 Checking if user exists...');
    let user = await prisma.user.findFirst({
      where: { email: testEmail },
      include: { driver: true }
    });

    if (user) {
      console.log('📝 User already exists, updating...');
      // Update user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          name: testName,
          role: 'driver',
          isActive: true
        },
        include: { driver: true }
      });
      console.log('✅ User updated\n');
    } else {
      console.log('➕ Creating new user...');
      // Create user
      user = await prisma.user.create({
        data: {
          email: testEmail,
          password: hashedPassword,
          name: testName,
          role: 'driver',
          isActive: true
        },
        include: { driver: true }
      });
      console.log('✅ User created\n');
    }

    // Check if driver record exists
    console.log('🚗 Checking driver record...');
    let driver = await prisma.driver.findUnique({
      where: { userId: user.id }
    });

    if (driver) {
      console.log('📝 Driver record exists, updating...');
      // Update driver
      driver = await prisma.driver.update({
        where: { id: driver.id },
        data: {
          onboardingStatus: 'approved',
          status: 'active',
          vehicleType: 'van',
          basePostcode: 'G1 1AA',
          licenseNumber: 'TEST123456',
          rating: 5.0,
          strikes: 0
        }
      });
      console.log('✅ Driver record updated\n');
    } else {
      console.log('➕ Creating driver record...');
      // Create driver
      driver = await prisma.driver.create({
        data: {
          userId: user.id,
          onboardingStatus: 'approved',
          status: 'active',
          vehicleType: 'van',
          basePostcode: 'G1 1AA',
          licenseNumber: 'TEST123456',
          rating: 5.0,
          strikes: 0
        }
      });
      console.log('✅ Driver record created\n');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 Apple Review Test Driver Account Ready!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📧 Email:    ', testEmail);
    console.log('🔑 Password: ', testPassword);
    console.log('👤 User ID:  ', user.id);
    console.log('🚗 Driver ID:', driver.id);
    console.log('📋 Status:   ', driver.status);
    console.log('✅ Onboarding:', driver.onboardingStatus);
    console.log('⭐ Rating:   ', driver.rating);
    console.log('🚐 Vehicle:  ', driver.vehicleType);
    console.log('📍 Base:     ', driver.basePostcode);
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Ready for Apple App Review!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('📱 Test Login on iOS:');
    console.log('   Email:    zadfad41@gmail.com');
    console.log('   Password: 112233');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating Apple review driver:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAppleReviewDriver()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

