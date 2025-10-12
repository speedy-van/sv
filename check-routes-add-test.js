// Script to check routes and add test data if needed
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndAddTestRoutes() {
  try {
    console.log('🔍 Checking existing routes and drops...');

    // Check existing routes
    const routeCount = await prisma.route.count();
    console.log(`📊 Found ${routeCount} routes`);

    // Check pending drops
    const pendingDrops = await prisma.drop.count({
      where: { status: 'pending' }
    });
    console.log(`📦 Found ${pendingDrops} pending drops`);

    // If no routes and few pending drops, add some test data
    if (routeCount === 0 && pendingDrops < 5) {
      console.log('🛠️ Adding test routes and drops for testing...');

      // Get some users (assuming they exist)
      const customers = await prisma.user.findMany({
        where: { role: 'customer' },
        take: 3
      });

      const drivers = await prisma.user.findMany({
        where: { role: 'driver' },
        take: 2
      });

      if (customers.length === 0 || drivers.length === 0) {
        console.log('⚠️ Not enough users to create test data');
        return;
      }

      // Create some test drops
      const testDrops = [];
      for (let i = 0; i < 6; i++) {
        const drop = await prisma.drop.create({
          data: {
            customerId: customers[i % customers.length].id,
            pickupAddress: `123 Test Street ${i + 1}, London`,
            deliveryAddress: `456 Destination Road ${i + 1}, London`,
            timeWindowStart: new Date(Date.now() + (i + 1) * 60 * 60 * 1000), // 1-6 hours from now
            timeWindowEnd: new Date(Date.now() + (i + 2) * 60 * 60 * 1000),
            quotedPrice: 50 + (i * 10),
            weight: 10 + (i * 5),
            volume: 0.5 + (i * 0.2),
            status: 'pending'
          }
        });
        testDrops.push(drop);
        console.log(`✅ Created test drop ${i + 1}`);
      }

      // Create a test route
      const route = await prisma.route.create({
        data: {
          driverId: drivers[0].id,
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          totalDrops: 3,
          status: 'planned',
          serviceTier: 'standard',
          totalOutcome: 150,
          optimizedSequence: [0, 1, 2]
        }
      });

      // Assign some drops to the route
      for (let i = 0; i < 3; i++) {
        await prisma.drop.update({
          where: { id: testDrops[i].id },
          data: {
            routeId: route.id,
            status: 'assigned'
          }
        });
      }

      console.log('✅ Created test route with 3 assigned drops');
      console.log('🎯 Test data ready for auto route scheduler testing');
    } else {
      console.log('ℹ️ Sufficient data already exists for testing');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndAddTestRoutes();