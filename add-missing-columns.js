import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to Route table...\n');
    
    // Add totalDistanceMiles
    console.log('1. Adding totalDistanceMiles column...');
    await prisma.$executeRaw`ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "totalDistanceMiles" DOUBLE PRECISION`;
    console.log('✅ Added totalDistanceMiles');
    
    // Add totalDurationMinutes
    console.log('\n2. Adding totalDurationMinutes column...');
    await prisma.$executeRaw`ALTER TABLE "Route" ADD COLUMN IF NOT EXISTS "totalDurationMinutes" INTEGER`;
    console.log('✅ Added totalDurationMinutes');
    
    console.log('\n🎉 All missing columns added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingColumns();

