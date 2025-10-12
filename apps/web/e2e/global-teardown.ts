import { FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');

  const testDriverEmail = 'test-driver@speedy-van.co.uk';
  const testCustomerEmail = 'test-customer@speedy-van.co.uk';
  const testAdminEmail = 'admin@speedy-van.co.uk';

  // Initialize Prisma client
  const prisma = new PrismaClient();

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection established for cleanup');

    // Clean up test data in reverse order of dependencies
    await prisma.assignment.deleteMany({
      where: {
        Driver: {
          user: {
            email: testDriverEmail,
          },
        },
      },
    });

    await prisma.jobEvent.deleteMany({
      where: {
        Assignment: {
          Booking: {
            customer: {
              email: testCustomerEmail,
            },
          },
        },
      },
    });

    await prisma.booking.deleteMany({
      where: {
        customer: {
          email: testCustomerEmail,
        },
      },
    });

    await prisma.driverAvailability.deleteMany({
      where: {
        driver: {
          user: {
            email: testDriverEmail,
          },
        },
      },
    });

    await prisma.driverVehicle.deleteMany({
      where: {
        driver: {
          user: {
            email: testDriverEmail,
          },
        },
      },
    });

    await prisma.driverProfile.deleteMany({
      where: {
        driver: {
          user: {
            email: testDriverEmail,
          },
        },
      },
    });

    await prisma.driver.deleteMany({
      where: {
        user: {
          email: testDriverEmail,
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testDriverEmail, testCustomerEmail, testAdminEmail],
        },
      },
    });

    console.log('✅ Test environment cleanup complete');
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw error during teardown to avoid masking test failures
  } finally {
    await prisma.$disconnect();
  }
}

export default globalTeardown;
