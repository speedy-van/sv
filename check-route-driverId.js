const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDriverIdConstraint() {
  try {
    console.log('🔍 Checking Route.driverId constraint in database...\n');
    
    const result = await prisma.$queryRaw`
      SELECT column_name, is_nullable, column_default, data_type
      FROM information_schema.columns 
      WHERE table_name = 'Route' AND column_name = 'driverId'
    `;
    
    console.log('📊 Database Column Info:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.length > 0) {
      const col = result[0];
      console.log(`\n✅ Column: ${col.column_name}`);
      console.log(`   Type: ${col.data_type}`);
      console.log(`   Nullable: ${col.is_nullable}`);
      console.log(`   Default: ${col.column_default || 'None'}`);
      
      if (col.is_nullable === 'NO') {
        console.log('\n⚠️  ISSUE FOUND: driverId is NOT NULL in database but nullable in Prisma schema!');
        console.log('   Fix: Run migration to alter column to allow NULL');
      } else {
        console.log('\n✅ Column allows NULL as expected');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDriverIdConstraint();



