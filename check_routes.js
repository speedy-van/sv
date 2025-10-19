const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoutes() {
  try {
    const routes = await prisma.route.findMany({
      include: {
        drops: true,
        _count: {
          select: { drops: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('\n=== ROUTE CHECK ===\n');
    routes.forEach(route => {
      console.log(`Route ID: ${route.id}`);
      console.log(`  Status: ${route.status}`);
      console.log(`  Total Drops (field): ${route.totalDrops}`);
      console.log(`  Actual Drops Count: ${route._count.drops}`);
      console.log(`  Drops in array: ${route.drops.length}`);
      console.log(`  Created: ${route.createdAt}`);
      console.log('---');
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkRoutes();
