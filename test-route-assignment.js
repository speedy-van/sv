/**
 * Test Script: Assign a new route to the test driver account
 * This will trigger the notification sound in the mobile app
 * 
 * Usage: node test-route-assignment.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
});

async function assignTestRoute() {
  try {
    console.log('🔍 Looking for test driver account (deloalo99)...');

    // Find the test driver - try different search methods
    let user = await prisma.user.findFirst({
      where: { email: 'deloalo99' },
      include: { Driver: true },
    });

    if (!user) {
      // Try searching with email pattern
      user = await prisma.user.findFirst({
        where: { 
          OR: [
            { email: { contains: 'delo' } },
            { name: { contains: 'delo' } },
          ]
        },
        include: { Driver: true },
      });
    }

    if (!user) {
      // List all drivers to help debug
      console.log('🔍 Searching all users...');
      const allUsers = await prisma.user.findMany({
        where: { role: 'driver' },
        select: { id: true, email: true, name: true },
        take: 10,
      });
      console.log('Found users:', allUsers);
      console.error('❌ Test driver not found');
      return;
    }

    if (!user.Driver) {
      console.error('❌ User found but no driver profile exists');
      console.log('Creating driver profile...');
      
      const driver = await prisma.driver.create({
        data: {
          id: `driver_${user.id}_${Date.now()}`,
          userId: user.id,
          status: 'active',
          onboardingStatus: 'approved',
          basePostcode: 'G1 1AA',
          vehicleType: 'Van',
          updatedAt: new Date(),
        },
      });
      
      user.Driver = driver;
      console.log(`✅ Driver profile created: ${driver.id}`);
    }

    const driver = user.Driver;
    console.log(`✅ Found driver: ${user.email} (ID: ${driver.id})`);

    // Create a new route with multiple drops
    const routeId = `route_test_${Date.now()}`;
    
    console.log('📍 Creating new route with 3 drops...');

    const route = await prisma.route.create({
      data: {
        id: routeId,
        driverId: user.id, // Use user.id not driver.id (foreign key is to User table)
        status: 'planned',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        optimizedDistanceKm: 25.0,
        estimatedDuration: 120, // 2 hours
        totalDrops: 3,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Route created: ${route.id}`);

    // Create 3 drops for this route
    const drops = [
      {
        id: `drop_${routeId}_1`,
        routeId: route.id,
        customerId: user.id,
        deliveryAddress: '123 High Street, Glasgow, G1 1AA',
        pickupAddress: 'Warehouse A, London, E1 6AN',
        timeWindowStart: new Date(Date.now() + 2 * 60 * 60 * 1000),
        timeWindowEnd: new Date(Date.now() + 4 * 60 * 60 * 1000),
        status: 'pending',
        serviceTier: 'standard',
        specialInstructions: 'Ring doorbell twice',
        quotedPrice: 45.50,
      },
      {
        id: `drop_${routeId}_2`,
        routeId: route.id,
        customerId: user.id,
        deliveryAddress: '456 Park Avenue, Glasgow, G2 2BB',
        pickupAddress: 'Warehouse A, London, E1 6AN',
        timeWindowStart: new Date(Date.now() + 4 * 60 * 60 * 1000),
        timeWindowEnd: new Date(Date.now() + 6 * 60 * 60 * 1000),
        status: 'pending',
        serviceTier: 'premium',
        specialInstructions: 'Fragile items, handle with care',
        quotedPrice: 52.75,
      },
      {
        id: `drop_${routeId}_3`,
        routeId: route.id,
        customerId: user.id,
        deliveryAddress: '789 Queen Street, Glasgow, G3 3CC',
        pickupAddress: 'Warehouse A, London, E1 6AN',
        timeWindowStart: new Date(Date.now() + 6 * 60 * 60 * 1000),
        timeWindowEnd: new Date(Date.now() + 8 * 60 * 60 * 1000),
        status: 'pending',
        serviceTier: 'economy',
        quotedPrice: 38.00,
      },
    ];

    let dropNumber = 1;
    for (const drop of drops) {
      await prisma.drop.create({ data: drop });
      console.log(`  ✅ Drop ${dropNumber} created`);
      dropNumber++;
    }

    console.log('\n🎉 SUCCESS! New route assigned to driver.');
    console.log('📱 The mobile app should now:');
    console.log('   1. Play notification sound 🔊');
    console.log('   2. Show "MATCHED" indicator (green) 🟢');
    console.log('   3. Display alert: "New Route Matched!" 🎉');
    console.log('   4. Show the route in Routes tab');
    console.log('\n✅ Route Details:');
    console.log(`   - Route ID: ${route.id}`);
    console.log(`   - Drops: ${drops.length}`);
    console.log(`   - Distance: ${route.totalDistance} miles`);
    console.log(`   - Duration: ${route.estimatedDuration} minutes`);
    console.log(`   - Status: ${route.status}`);

  } catch (error) {
    console.error('❌ Error assigning route:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignTestRoute();

