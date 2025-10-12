import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOrdersHub() {
  console.log('🧪 Testing Orders Hub functionality...\n');

  try {
    // 1. Create test customer
    console.log('1. Creating test customer...');
    const customer = await prisma.user.upsert({
      where: { email: 'test-customer@example.com' },
      update: {},
      create: {
        email: 'test-customer@example.com',
        name: 'Test Customer',
        password: 'hashedpassword',
        role: 'customer',
      },
    });
    console.log(`✅ Customer created: ${customer.name} (${customer.email})`);

    // 2. Create test driver
    console.log('\n2. Creating test driver...');
    const driverUser = await prisma.user.upsert({
      where: { email: 'test-driver@example.com' },
      update: {},
      create: {
        email: 'test-driver@example.com',
        name: 'Test Driver',
        password: 'hashedpassword',
        role: 'driver',
      },
    });

    const driver = await prisma.driver.upsert({
      where: { userId: driverUser.id },
      update: {},
      create: {
        userId: driverUser.id,
        status: 'active',
        onboardingStatus: 'approved',
        rating: 4.8,
      },
    });

    // Create driver availability
    await prisma.driverAvailability.upsert({
      where: { driverId: driver.id },
      update: { status: 'online' },
      create: {
        driverId: driver.id,
        status: 'online',
      },
    });

    console.log(`✅ Driver created: ${driverUser.name} (${driverUser.email})`);

    // 3. Create test orders
    console.log('\n3. Creating test orders...');
    // TODO: This script needs to be updated to match the current Booking schema
    const orders = [];

    // for (let i = 1; i <= 5; i++) {
    //   const order = await prisma.booking.create({
    //     data: {
    //       code: `TEST-${Date.now()}-${i}`,
    //       customerId: customer.id,
    //       status: i === 1 ? 'open' : i === 2 ? 'assigned' : i === 3 ? 'in_progress' : i === 4 ? 'completed' : 'cancelled',
    //       pickupAddress: `${100 + i} Test Street, London`,
    //       dropoffAddress: `${200 + i} Test Avenue, London`,
    //       amountPence: 5000 + (i * 1000), // £50-£90
    //       paymentStatus: i === 4 ? 'paid' : i === 5 ? 'refunded' : 'unpaid',
    //       preferredDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)), // Next few days
    //       timeSlot: i % 2 === 0 ? 'am' : 'pm',
    //       distanceMeters: 5000 + (i * 1000),
    //       durationSeconds: 1800 + (i * 300), // 30-45 minutes
    //       vanSize: 'luton',
    //       crewSize: 2,
    //       stairsFloors: i,
    //       assembly: i % 2 === 0,
    //       packingMaterials: i % 3 === 0,
    //       heavyItems: i % 2 === 1,
    //       buildingType: 'residential',
    //       hasElevator: i % 2 === 0,
    //       specialInstructions: i % 2 === 0 ? 'Please call on arrival' : null,
    //       ...(i === 2 && { driverId: driver.id }) // Assign driver to second order
    //     }
    //   });
    //   orders.push(order);
    //   console.log(`✅ Order created: ${order.code} (${order.status})`);
    // }

    // 4. Create assignment for assigned order
    // TODO: This script needs to be updated to match the current schema
    // if (orders[1]) {
    //   await prisma.assignment.create({
    //     data: {
    //       bookingId: orders[1].id,
    //       driverId: driver.id,
    //       status: 'invited',
    //       round: 1
    //     }
    //   });
    //   console.log(`✅ Assignment created for order ${orders[1].code}`);
    // }

    // 5. Create some job events for the in-progress order
    // if (orders[2]) {
    //   const assignment = await prisma.assignment.create({
    //     data: {
    //       bookingId: orders[2].id,
    //       driverId: driver.id,
    //       status: 'claimed',
    //       round: 1,
    //       claimedAt: new Date()
    //     }
    //   });

    //   // Create job events
    //   const events = [
    //     'navigate_to_pickup',
    //     'arrived_at_pickup',
    //     'loading_started',
    //     'loading_completed',
    //     'en_route_to_dropoff'
    //   ];

    //   for (let i = 0; i < events.length; i++) {
    //     await prisma.jobEvent.create({
    //       data: {
    //         assignmentId: assignment.id,
    //         step: events[i] as any,
    //         notes: `Test event ${i + 1}`,
    //         createdBy: driver.id
    //       }
    //     });
    //   }
    //   console.log(`✅ Job events created for order ${orders[2].code}`);
    // }

    // 6. Create some messages
    // for (const order of orders.slice(0, 3)) {
    //   await prisma.message.create({
    //     data: {
    //       bookingId: order.id,
    //       senderId: customer.id,
    //       content: `Test message for order ${order.code}`
    //       }
    //     });
    //   }
    //   console.log('✅ Test messages created');

    // 7. Create tracking pings for active orders
    // for (const order of orders.slice(0, 3)) {
    //   await prisma.trackingPing.create({
    //     data: {
    //       bookingId: order.id,
    //       driverId: driver.id,
    //       lat: 51.5074 + (Math.random() - 0.5) * 0.1,
    //       lng: -0.1278 + (Math.random() - 0.5) * 0.1
    //     }
    //   });
    // }
    // console.log('✅ Tracking pings created');

    console.log('\n🎉 Orders Hub test data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Customer: ${customer.name}`);
    console.log(`- Driver: ${driverUser.name}`);
    console.log(`- Orders: 0 (script temporarily disabled)`);
    console.log(`- Assigned orders: 0`);
    console.log(`- Orders with events: 0`);
    console.log(`- Orders with messages: 0`);
    console.log(`- Orders with tracking: 0`);

    console.log(
      '\n🔗 Test the Orders Hub at: http://localhost:3000/admin/orders'
    );
    console.log(
      '🔗 Test order detail at: http://localhost:3000/admin/orders/[order-code]'
    );
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrdersHub();
