// Test script to verify driver settings fix
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDriverSettings() {
  try {
    console.log('🔍 Testing Driver Settings Fix...\n');

    // Find a test driver
    const driver = await prisma.driver.findFirst({
      include: {
        user: true,
        DriverProfile: true
      }
    });

    if (!driver) {
      console.log('❌ No driver found in database');
      return;
    }

    console.log('📋 Found Driver:', {
      id: driver.id,
      name: driver.user.name,
      email: driver.user.email,
      hasProfile: !!driver.DriverProfile
    });

    if (driver.DriverProfile) {
      console.log('📄 Current DriverProfile:', {
        phone: driver.DriverProfile.phone,
        address: driver.DriverProfile.address,
        emergencyContact: driver.DriverProfile.emergencyContact,
        drivingLicense: driver.DriverProfile.drivingLicense,
        updatedAt: driver.DriverProfile.updatedAt
      });
    }

    // Test upsert with new data
    const testData = {
      phone: '+44 7901 846297',
      address: 'Test Address 123',
      emergencyContact: '+44 7901 846298',
      drivingLicense: 'TEST123456'
    };

    console.log('\n🧪 Testing upsert with data:', testData);

    const result = await prisma.driverProfile.upsert({
      where: { driverId: driver.id },
      update: testData,
      create: {
        driverId: driver.id,
        ...testData,
      },
    });

    console.log('✅ Upsert result:', result);

    // Verify immediately
    const verification = await prisma.driverProfile.findUnique({
      where: { driverId: driver.id },
    });

    console.log('🔍 Verification read:', verification);

    // Check if data matches
    const matches = Object.keys(testData).every(key =>
      verification[key] === testData[key]
    );

    console.log('\n🎯 Test Result:', matches ? '✅ SUCCESS' : '❌ FAILED');

    if (matches) {
      console.log('📝 All fields updated correctly!');
    } else {
      console.log('❌ Some fields did not update:');
      Object.keys(testData).forEach(key => {
        if (verification[key] !== testData[key]) {
          console.log(`  ${key}: expected "${testData[key]}", got "${verification[key]}"`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDriverSettings();
