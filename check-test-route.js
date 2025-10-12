import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_qNFE0IHpk1vT@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    },
  },
});

async function checkRoutes() {
  try {
    console.log('🔍 Checking test routes in database...\n');
    
    const routes = await prisma.route.findMany({
      where: {
        id: { startsWith: 'route_test_' }
      },
      select: {
        id: true,
        driverId: true,
        status: true,
        startTime: true,
        totalDrops: true,
      }
    });

    console.log(`Found ${routes.length} test route(s):`);
    routes.forEach(r => {
      console.log(`  - ${r.id}`);
      console.log(`    Driver: ${r.driverId}`);
      console.log(`    Status: ${r.status}`);
      console.log(`    Drops: ${r.totalDrops}`);
    });

    console.log('\n🔍 Checking what the API returns...\n');
    
    const apiRoutes = await prisma.route.findMany({
      where: {
        driverId: 'cmgec92800000w2ywm70h5vbs',
        status: { in: ['planned', 'assigned', 'in_progress'] }
      },
      select: {
        id: true,
        status: true,
        totalDrops: true,
      }
    });

    console.log(`API query would return ${apiRoutes.length} route(s):`);
    apiRoutes.forEach(r => {
      console.log(`  - ${r.id} (${r.status}, ${r.totalDrops} drops)`);
    });

    console.log('\n🔍 Checking driver status...\n');
    
    const driver = await prisma.driver.findFirst({
      where: { userId: 'cmgec92800000w2ywm70h5vbs' },
      select: { id: true, status: true, onboardingStatus: true }
    });

    if (driver) {
      console.log('Driver found:');
      console.log(`  Status: ${driver.status}`);
      console.log(`  Onboarding: ${driver.onboardingStatus}`);
      
      if (driver.status !== 'active') {
        console.log('\n⚠️  WARNING: Driver status is not "active"!');
        console.log('   This will prevent routes from being returned by the API.');
      }
      if (driver.onboardingStatus !== 'approved') {
        console.log('\n⚠️  WARNING: Driver onboarding status is not "approved"!');
        console.log('   This will prevent routes from being returned by the API.');
      }
    } else {
      console.log('❌ Driver profile not found!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoutes();

