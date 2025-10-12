import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestJobs() {
  try {
    console.log('Creating test jobs...');

    // Create test jobs with different characteristics
    const testJobs = [
      {
        code: 'TEST001',
        customerId: 'test-customer-1',
        status: 'confirmed',
        pickupAddress: '123 Oxford Street, London W1D 1BS',
        dropoffAddress: '456 Regent Street, London W1B 4DA',
        pickupLat: 51.5154,
        pickupLng: -0.1419,
        dropoffLat: 51.5136,
        dropoffLng: -0.1366,
        preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        timeSlot: 'am',
        vanSize: 'small',
        crewSize: 1,
        amountPence: 4500, // £45.00
        distanceMeters: 1200,
        durationSeconds: 1800, // 30 minutes
        stairsFloors: 2,
        assembly: false,
        packingMaterials: true,
        heavyItems: false,
      },
      {
        code: 'TEST002',
        customerId: 'test-customer-2',
        status: 'confirmed',
        pickupAddress: '789 High Street, Manchester M1 1AA',
        dropoffAddress: '321 Deansgate, Manchester M3 2FN',
        pickupLat: 53.4808,
        pickupLng: -2.2426,
        dropoffLat: 53.4814,
        dropoffLng: -2.2458,
        preferredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        timeSlot: 'pm',
        vanSize: 'luton',
        crewSize: 2,
        amountPence: 7500, // £75.00
        distanceMeters: 2500,
        durationSeconds: 2700, // 45 minutes
        stairsFloors: 0,
        assembly: true,
        packingMaterials: false,
        heavyItems: true,
      },
      {
        code: 'TEST003',
        customerId: 'test-customer-3',
        status: 'confirmed',
        pickupAddress: '555 Queen Street, Birmingham B1 1AA',
        dropoffAddress: '777 New Street, Birmingham B2 4BA',
        pickupLat: 52.4862,
        pickupLng: -1.8904,
        dropoffLat: 52.4797,
        dropoffLng: -1.8986,
        preferredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        timeSlot: 'evening',
        vanSize: 'large',
        crewSize: 3,
        amountPence: 12000, // £120.00
        distanceMeters: 3500,
        durationSeconds: 3600, // 1 hour
        stairsFloors: 3,
        assembly: true,
        packingMaterials: true,
        heavyItems: true,
      },
      {
        code: 'TEST004',
        customerId: 'test-customer-4',
        status: 'confirmed',
        pickupAddress: '999 Princes Street, Edinburgh EH2 2AA',
        dropoffAddress: '111 Royal Mile, Edinburgh EH1 1AA',
        pickupLat: 55.9533,
        pickupLng: -3.1883,
        dropoffLat: 55.9497,
        dropoffLng: -3.1905,
        preferredDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        timeSlot: 'am',
        vanSize: 'small',
        crewSize: 1,
        amountPence: 3500, // £35.00
        distanceMeters: 800,
        durationSeconds: 1200, // 20 minutes
        stairsFloors: 1,
        assembly: false,
        packingMaterials: false,
        heavyItems: false,
      },
      {
        code: 'TEST005',
        customerId: 'test-customer-5',
        status: 'confirmed',
        pickupAddress: '222 Cardiff Bay, Cardiff CF10 5AA',
        dropoffAddress: '444 St Mary Street, Cardiff CF10 1AA',
        pickupLat: 51.4816,
        pickupLng: -3.1791,
        dropoffLat: 51.4816,
        dropoffLng: -3.1791,
        preferredDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        timeSlot: 'pm',
        vanSize: 'luton',
        crewSize: 2,
        amountPence: 6000, // £60.00
        distanceMeters: 1800,
        durationSeconds: 2400, // 40 minutes
        stairsFloors: 0,
        assembly: false,
        packingMaterials: true,
        heavyItems: false,
      },
    ];

    // Create test customers first (if they don't exist)
    for (let i = 1; i <= 5; i++) {
      await prisma.user.upsert({
        where: { email: `test-customer-${i}@example.com` },
        update: {},
        create: {
          email: `test-customer-${i}@example.com`,
          name: `Test Customer ${i}`,
          role: 'customer',
          password: 'hashedpassword123', // In real app, this would be properly hashed
        },
      });
    }

    // Create the test jobs
    // TODO: This script needs to be updated to match the current Booking schema
    // for (const jobData of testJobs) {
    //   const customer = await prisma.user.findUnique({
    //     where: { email: `${jobData.customerId}@example.com` }
    //   });

    //   if (customer) {
    //     await prisma.booking.create({
    //       data: {
    //         ...jobData,
    //         customerId: customer.id
    //       }
    //     });
    //   }
    // }

    console.log('✅ Test jobs created successfully!');
    console.log(
      `Created ${testJobs.length} test jobs with codes: ${testJobs.map(j => j.code).join(', ')}`
    );
  } catch (error) {
    console.error('Error creating test jobs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestJobs();
