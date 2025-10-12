import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
});

async function createTestRoute() {
  try {
    console.log('🔍 Step 1: Finding user deloalo99@gmail.com...');
    
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { email: 'deloalo99@gmail.com' },
          { email: 'deloalo99' },
        ]
      },
    });

    if (!user) {
      console.error('❌ User not found!');
      return;
    }

    console.log(`✅ User found: ${user.email} (ID: ${user.id})`);

    console.log('\n🗑️  Step 2: Cleaning old test routes...');
    
    // Delete old test routes
    await prisma.drop.deleteMany({
      where: {
        routeId: {
          startsWith: 'route_test_'
        }
      }
    });

    await prisma.route.deleteMany({
      where: {
        id: {
          startsWith: 'route_test_'
        }
      }
    });

    console.log('✅ Old test routes cleaned');

    console.log('\n📍 Step 3: Creating new test route...');
    
    const routeId = `route_test_${Date.now()}`;
    const route = await prisma.route.create({
      data: {
        id: routeId,
        driverId: user.id, // Important: Use user.id (foreign key to User table)
        status: 'planned',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        optimizedDistanceKm: 25.0,
        estimatedDuration: 120,
        totalDrops: 3,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Route created: ${route.id}`);

    console.log('\n📦 Step 4: Creating 3 drops...');

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
        specialInstructions: 'Fragile items',
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

    for (let i = 0; i < drops.length; i++) {
      try {
        await prisma.drop.create({ data: drops[i] });
        console.log(`  ✅ Drop ${i + 1}/3 created`);
      } catch (error) {
        console.error(`  ❌ Drop ${i + 1} failed:`, error.message);
      }
    }

    console.log('\n🎉 SUCCESS! Route created and assigned.');
    console.log('\n📊 Summary:');
    console.log(`   Route ID: ${route.id}`);
    console.log(`   Driver: ${user.email}`);
    console.log(`   Status: ${route.status}`);
    console.log(`   Drops: 3`);
    console.log(`   Distance: ${route.optimizedDistanceKm} km`);
    console.log('\n⏰ The mobile app will detect this within 15 seconds!');
    console.log('📱 Watch the console for:');
    console.log('   📊 Found 1 planned routes');
    console.log('   🎯 1 NEW ROUTE(S) MATCHED!');
    console.log('   🎵 PLAYING NOTIFICATION SOUND...');
    console.log('   💫 SHOWING MATCH MODAL...');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRoute();

