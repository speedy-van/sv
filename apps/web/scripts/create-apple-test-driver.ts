import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAppleTestDriver() {
  try {
    console.log('🔧 Creating Apple test driver account...\n');

    const testEmail = 'zadfad41@gmail.com';
    const testPassword = '112233';

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { driver: true },
    });

    if (!user) {
      // Create a test user with driver role
      const hashedPassword = await bcrypt.hash(testPassword, 12);

      user = await prisma.user.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: testEmail,
          name: 'Apple Test Driver',
          role: 'driver',
          password: hashedPassword,
        },
        include: { driver: true },
      });

      console.log('✅ Test driver user created:', user.email);
    } else {
      console.log('✅ Test driver user already exists:', user.email);
      
      // Update password to ensure it matches
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log('✅ Password updated to:', testPassword);
    }

    // Create or update driver record
    if (!user.driver) {
      const driver = await prisma.driver.create({
        data: {
          id: `driver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          onboardingStatus: 'approved',
          basePostcode: 'G21 2QB',
          vehicleType: 'medium_van',
          status: 'active',
          rating: 5.0,
        },
      });

      console.log('✅ Test driver record created:', driver.id);

      // Create driver availability record
      await prisma.driverAvailability.create({
        data: {
          id: `availability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          driverId: driver.id,
          status: 'offline',
          locationConsent: false,
          updatedAt: new Date(),
        },
      });

      console.log('✅ Driver availability record created');

      // Add required documents with future expiry dates
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2); // 2 years from now

      // Right to Work document
      await prisma.document.create({
        data: {
          id: `rtw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          driverId: driver.id,
          category: 'rtw',
          status: 'verified',
          expiresAt: futureDate,
          fileUrl: 'https://example.com/apple-test-rtw.pdf',
        },
      });

      // Driving License
      await prisma.document.create({
        data: {
          id: `licence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          driverId: driver.id,
          category: 'licence',
          status: 'verified',
          expiresAt: futureDate,
          fileUrl: 'https://example.com/apple-test-license.pdf',
        },
      });

      // Insurance
      await prisma.document.create({
        data: {
          id: `insurance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          driverId: driver.id,
          category: 'insurance',
          status: 'verified',
          expiresAt: futureDate,
          fileUrl: 'https://example.com/apple-test-insurance.pdf',
        },
      });

      console.log('✅ Required documents created with verified status');

      // Create driver checks
      await prisma.driverChecks.create({
        data: {
          driverId: driver.id,
          licenceExpiry: futureDate,
          policyEnd: futureDate,
        },
      });

      console.log('✅ Driver checks created');
    } else {
      // Update existing driver to approved status
      await prisma.driver.update({
        where: { id: user.driver.id },
        data: {
          onboardingStatus: 'approved',
          status: 'active',
          rating: 5.0,
        },
      });

      console.log('✅ Test driver record updated to approved status');

      // Ensure driver availability exists
      const availability = await prisma.driverAvailability.findUnique({
        where: { driverId: user.driver.id },
      });

      if (!availability) {
        await prisma.driverAvailability.create({
          data: {
            id: `availability_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            driverId: user.driver.id,
            status: 'offline',
            locationConsent: false,
            updatedAt: new Date(),
          },
        });
        console.log('✅ Driver availability record created');
      }
    }

    console.log('\n🎉 Apple test driver account ready!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: zadfad41@gmail.com');
    console.log('🔑 Password: 112233');
    console.log('📱 Phone: +447901846297');
    console.log('📍 Location: Glasgow (G21 2QB)');
    console.log('⭐ Rating: 5.0');
    console.log('📱 Use these credentials in the iOS app');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error creating Apple test driver:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAppleTestDriver()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

