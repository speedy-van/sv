import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

const userId = 'cmgec92800000w2ywm70h5vbs';

async function debugQuery() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🔍 DEEP DIAGNOSTIC - ROUTE QUERY DEBUG');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📋 User ID: ${userId}\n`);

    console.log('🔍 Test 1: Find routes with simple query\n');
    const simpleRoutes = await prisma.route.findMany({
      where: { driverId: userId },
      select: { id: true, status: true, driverId: true }
    });
    console.log(`Result: ${simpleRoutes.length} route(s)`);
    simpleRoutes.forEach(r => console.log(`  - ${r.id} (${r.status})`));

    console.log('\n🔍 Test 2: Find routes with status filter\n');
    const filteredRoutes = await prisma.route.findMany({
      where: {
        driverId: userId,
        status: { in: ['planned', 'assigned', 'in_progress'] }
      },
      select: { id: true, status: true }
    });
    console.log(`Result: ${filteredRoutes.length} route(s)`);
    filteredRoutes.forEach(r => console.log(`  - ${r.id} (${r.status})`));

    console.log('\n🔍 Test 3: Find routes with Drop include (like API)\n');
    try {
      const routesWithDrops = await prisma.route.findMany({
        where: {
          driverId: userId,
          status: { in: ['planned', 'assigned', 'in_progress'] }
        },
        include: {
          Drop: true
        }
      });
      console.log(`Result: ${routesWithDrops.length} route(s)`);
      routesWithDrops.forEach(r => console.log(`  - ${r.id} (${r.Drop.length} drops)`));
    } catch (error) {
      console.error('❌ Query with Drop include failed:', error.message);
    }

    console.log('\n🔍 Test 4: Check all routes in DB\n');
    const allRoutes = await prisma.route.findMany({
      select: { id: true, driverId: true, status: true },
      take: 5
    });
    console.log(`Total routes in DB: ${allRoutes.length}`);
    allRoutes.forEach(r => console.log(`  - ${r.id} → Driver: ${r.driverId} (${r.status})`));

    console.log('\n═══════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugQuery();

