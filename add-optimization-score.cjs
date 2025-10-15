const { PrismaClient } = require('./node_modules/.prisma/client');

const prisma = new PrismaClient();

async function addOptimizationScoreColumn() {
  try {
    console.log('Adding optimizationScore column to Route table...');

    // Add the optimizationScore column to the Route table
    await prisma.$executeRaw`ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "optimizationScore" FLOAT;`;

    console.log('✅ Successfully added optimizationScore column');

    // Verify the column was added
    const result = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Route' AND table_schema = 'public' AND column_name = 'optimizationScore';`;

    if (result.length > 0) {
      console.log('✅ Column verification successful: optimizationScore exists');
    } else {
      console.log('❌ Column verification failed: optimizationScore not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addOptimizationScoreColumn();
