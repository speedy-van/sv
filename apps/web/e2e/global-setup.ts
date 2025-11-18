import { chromium, FullConfig } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function globalSetup(config: FullConfig) {
  console.log('🧪 Setting up E2E test environment...');

  // Create test driver account
  const testDriverEmail = 'test-driver@speedy-van.co.uk';
  const testPassword = 'TestPassword123!';

  // Create test admin account
  const testAdminEmail = 'admin@speedy-van.co.uk';
  const testAdminPassword = 'AdminPassword123!';

  // Initialize Prisma client
  const prisma = new PrismaClient();

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Verify database schema
    try {
      await prisma.user.findFirst();
      console.log('✅ Database schema verified');
    } catch (error) {
      console.error('❌ Database schema error:', error);
      throw new Error('Database schema not ready');
    }

    // Clean up any existing test data in correct order (child records first)
    console.log('🧹 Cleaning up existing test data...');

    await prisma.assignment.deleteMany({
      where: {
        Driver: {
          User: {
            email: testDriverEmail,
          },
        },
      },
    });

    await prisma.driverAvailability.deleteMany({
      where: {
        Driver: {
          User: {
            email: testDriverEmail,
          },
        },
      },
    });

    await prisma.driverVehicle.deleteMany({
      where: {
        driverId: {
          in: await prisma.driver.findMany({
            where: {
              User: {
                email: testDriverEmail,
              },
            },
            select: { id: true },
          }).then(drivers => drivers.map(d => d.id)),
        },
      },
    });

    await prisma.driverProfile.deleteMany({
      where: {
        driverId: {
          in: await prisma.driver.findMany({
            where: {
              User: {
                email: testDriverEmail,
              },
            },
            select: { id: true },
          }).then(drivers => drivers.map(d => d.id)),
        },
      },
    });

    await prisma.driver.deleteMany({
      where: {
        User: {
          email: testDriverEmail,
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testDriverEmail, testAdminEmail],
        },
      },
    });

    console.log('✅ Test data cleanup complete');

    // Hash passwords
    const hashedAdminPassword = await bcrypt.hash(testAdminPassword, 10);
    const hashedDriverPassword = await bcrypt.hash(testPassword, 10);

    // Create test admin user
    console.log('👤 Creating test admin user...');
    const adminUser = await prisma.user.create({
      data: {
        email: testAdminEmail,
        name: 'Test Admin',
        role: 'admin',
        adminRole: 'superadmin',
        password: hashedAdminPassword,
      } as any, // Type assertion to bypass strict type checking for fields with defaults
    });
    console.log('✅ Admin user created:', {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
      adminRole: (adminUser as any).adminRole,
    });

    // Create test user and driver
    console.log('👤 Creating test driver user...');
    const user = await prisma.user.create({
      data: {
        email: testDriverEmail,
        name: 'Test Driver',
        role: 'driver',
        password: hashedDriverPassword,
      } as any, // Type assertion to bypass strict type checking for fields with defaults
    });

    const driver = await prisma.driver.create({
      data: {
        userId: user.id,
        status: 'active',
        onboardingStatus: 'approved',
        rating: 4.5,
        vehicleType: 'van',
        approvedAt: new Date(),
        DriverProfile: {
          create: {
            phone: '+447700900000',
            address: '123 Test Street, London, UK',
            dob: new Date('1990-01-01'),
          } as any, // Type assertion to bypass strict type checking for fields with defaults
        },
        DriverVehicle: {
          create: {
            make: 'Ford',
            model: 'Transit',
            reg: 'TEST123',
            weightClass: '3500kg',
          } as any, // Type assertion to bypass strict type checking for fields with defaults
        },
        DriverAvailability: {
          create: {
            status: 'online',
            lastSeenAt: new Date(),
            lastLat: 51.5074,
            lastLng: -0.1278,
          } as any, // Type assertion to bypass strict type checking for fields with defaults
        },
      },
    });

    // Create test customer user
    const testCustomerEmail = 'test-customer@speedy-van.co.uk';
    const hashedCustomerPassword = await bcrypt.hash('TestPassword123!', 10);
    const customerUser = await prisma.user.create({
      data: {
        email: testCustomerEmail,
        name: 'Test Customer',
        role: 'customer',
        password: hashedCustomerPassword,
      } as any, // Type assertion to bypass strict type checking for fields with defaults
    });

    // Create booking addresses and property details first
    const pickupAddress1 = await prisma.bookingAddress.create({
      data: {
        id: `addr_pickup_test001_${Date.now()}`,
        label: '123 Pickup Street, London, UK',
        postcode: 'SW1A 1AA',
        lat: 51.5074,
        lng: -0.1278,
      },
    });

    const dropoffAddress1 = await prisma.bookingAddress.create({
      data: {
        id: `addr_dropoff_test001_${Date.now()}`,
        label: '456 Dropoff Street, London, UK',
        postcode: 'SW1A 1AA',
        lat: 51.5074,
        lng: -0.1278,
      },
    });

    const pickupProperty1 = await prisma.propertyDetails.create({
      data: {
        id: `prop_pickup_test001_${Date.now()}`,
        propertyType: 'FLAT',
        accessType: 'WITH_LIFT',
        floors: 0,
      },
    });

    const dropoffProperty1 = await prisma.propertyDetails.create({
      data: {
        id: `prop_dropoff_test001_${Date.now()}`,
        propertyType: 'FLAT',
        accessType: 'WITH_LIFT',
        floors: 0,
      },
    });

    const pickupAddress2 = await prisma.bookingAddress.create({
      data: {
        id: `addr_pickup_test002_${Date.now()}`,
        label: '789 Another Pickup, London, UK',
        postcode: 'SW1A 1AA',
        lat: 51.5074,
        lng: -0.1278,
      },
    });

    const dropoffAddress2 = await prisma.bookingAddress.create({
      data: {
        id: `addr_dropoff_test002_${Date.now()}`,
        label: '321 Another Dropoff, London, UK',
        postcode: 'SW1A 1AA',
        lat: 51.5074,
        lng: -0.1278,
      },
    });

    const pickupProperty2 = await prisma.propertyDetails.create({
      data: {
        id: `prop_pickup_test002_${Date.now()}`,
        propertyType: 'FLAT',
        accessType: 'WITH_LIFT',
        floors: 0,
      },
    });

    const dropoffProperty2 = await prisma.propertyDetails.create({
      data: {
        id: `prop_dropoff_test002_${Date.now()}`,
        propertyType: 'FLAT',
        accessType: 'WITH_LIFT',
        floors: 0,
      },
    });

    // Create test bookings
    const testBookings = await Promise.all([
      prisma.booking.create({
        data: {
          id: `booking_test001_${Date.now()}`,
          reference: 'TEST001',
          customerId: customerUser.id,
          status: 'DRAFT',
          updatedAt: new Date(),
          pickupAddressId: pickupAddress1.id,
          dropoffAddressId: dropoffAddress1.id,
          pickupPropertyId: pickupProperty1.id,
          dropoffPropertyId: dropoffProperty1.id,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          estimatedDurationMinutes: 120,
          crewSize: 'TWO',
          baseDistanceMiles: 5.0,
          distanceCostGBP: 5000,
          accessSurchargeGBP: 0,
          weatherSurchargeGBP: 0,
          itemsSurchargeGBP: 0,
          crewMultiplierPercent: 0,
          availabilityMultiplierPercent: 0,
          totalGBP: 5000,
          customerName: 'Test Customer',
          customerPhone: '+447700900001',
          customerEmail: testCustomerEmail,
        },
      }),
      prisma.booking.create({
        data: {
          id: `booking_test002_${Date.now()}`,
          reference: 'TEST002',
          customerId: customerUser.id,
          status: 'DRAFT',
          updatedAt: new Date(),
          pickupAddressId: pickupAddress2.id,
          dropoffAddressId: dropoffAddress2.id,
          pickupPropertyId: pickupProperty2.id,
          dropoffPropertyId: dropoffProperty2.id,
          scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
          estimatedDurationMinutes: 120,
          crewSize: 'TWO',
          baseDistanceMiles: 7.5,
          distanceCostGBP: 7500,
          accessSurchargeGBP: 0,
          weatherSurchargeGBP: 0,
          itemsSurchargeGBP: 0,
          crewMultiplierPercent: 0,
          availabilityMultiplierPercent: 0,
          totalGBP: 7500,
          customerName: 'Test Customer',
          customerPhone: '+447700900001',
          customerEmail: testCustomerEmail,
        },
      }),
    ]);

    console.log('✅ Test environment setup complete');
    console.log(`📧 Test admin email: ${testAdminEmail}`);
    console.log(`🔑 Test admin password: ${testAdminPassword}`);
    console.log(`📧 Test driver email: ${testDriverEmail}`);
    console.log(`🔑 Test driver password: ${testPassword}`);
    console.log(`📧 Test customer email: ${testCustomerEmail}`);
    console.log(`🔑 Test customer password: TestPassword123!`);
    console.log(`🚗 Driver ID: ${driver.id}`);
    console.log(`📦 Created ${testBookings.length} test bookings`);

    // Verify admin user was created correctly
    const verifyAdmin = await prisma.user.findUnique({
      where: { email: testAdminEmail },
      select: { id: true, email: true, role: true, adminRole: true },
    });
    console.log('🔍 Verification - Admin user:', verifyAdmin);
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
