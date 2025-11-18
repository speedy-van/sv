import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTestDriverStatus() {
  try {
    // Find the test driver
    const user = await prisma.user.findUnique({
      where: { email: 'driver@test.com' },
      include: { driver: true },
    });

    if (!user || !user.driver) {
      console.log('❌ Test driver not found');
      return;
    }

    // Update driver status to approved
    await prisma.driver.update({
      where: { id: user.driver.id },
      data: {
        onboardingStatus: 'approved',
        status: 'active',
      },
    });

    // Add required documents
    const now = new Date();
    const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

    // Add RTW document
    await prisma.document.upsert({
      where: {
        id: `rtw-${user.driver.id}`,
      },
      update: {
        expiresAt: futureDate,
        status: 'verified',
      },
      create: {
        id: `rtw-${user.driver.id}`,
        driverId: user.driver.id,
        category: 'rtw',
        status: 'verified',
        expiresAt: futureDate,
        fileUrl: 'https://example.com/rtw.pdf',
      },
    });

    // Add license document
    await prisma.document.upsert({
      where: {
        id: `licence-${user.driver.id}`,
      },
      update: {
        expiresAt: futureDate,
        status: 'verified',
      },
      create: {
        id: `licence-${user.driver.id}`,
        driverId: user.driver.id,
        category: 'licence',
        status: 'verified',
        expiresAt: futureDate,
        fileUrl: 'https://example.com/license.pdf',
      },
    });

    // Add insurance document
    await prisma.document.upsert({
      where: {
        id: `insurance-${user.driver.id}`,
      },
      update: {
        expiresAt: futureDate,
        status: 'verified',
      },
      create: {
        id: `insurance-${user.driver.id}`,
        driverId: user.driver.id,
        category: 'insurance',
        status: 'verified',
        expiresAt: futureDate,
        fileUrl: 'https://example.com/insurance.pdf',
      },
    });

    // Add driver checks with valid dates
    await prisma.driverChecks.upsert({
      where: { driverId: user.driver.id },
      update: {
        licenceExpiry: futureDate,
        policyEnd: futureDate,
      },
      create: {
        driverId: user.driver.id,
        licenceExpiry: futureDate,
        policyEnd: futureDate,
      },
    });

    console.log('✅ Test driver status updated to approved');
    console.log('✅ Required documents added with future expiry dates');
    console.log('✅ Driver checks updated with valid dates');
  } catch (error) {
    console.error('❌ Error updating test driver status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestDriverStatus();
