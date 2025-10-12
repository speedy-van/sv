require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database state...');

    // Check pending drops
    const pendingDrops = await prisma.drop.findMany({
      where: { status: 'pending' },
      include: { booking: true }
    });
    console.log(`📦 Found ${pendingDrops.length} pending drops`);

    // Check existing routes
    const routes = await prisma.route.findMany({
      include: { drops: true }
    });
    console.log(`🛣️  Found ${routes.length} routes`);

    // Check scheduler status
    const schedulerStatus = await prisma.systemSetting.findFirst({
      where: { key: 'auto_route_scheduler_enabled' }
    });
    console.log(`⚙️  Auto route scheduler enabled: ${schedulerStatus?.value || 'not set'}`);

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();