const { PrismaClient } = require('./node_modules/.prisma/client');

const prisma = new PrismaClient();

async function checkRouteColumns() {
  try {
    // Get a sample route to see what columns exist
    const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Route' AND table_schema = 'public' ORDER BY column_name;`;

    console.log('Route table columns:');
    result.forEach(col => {
      console.log(`- ${col.column_name}`);
    });

    // Check if optimizationScore exists
    const hasOptimizationScore = result.some(col => col.column_name === 'optimizationScore');
    console.log(`\noptimizationScore column exists: ${hasOptimizationScore}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRouteColumns();