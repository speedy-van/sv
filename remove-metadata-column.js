import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeMetadataColumn() {
  try {
    console.log('Removing metadata column from User table in production database...');
    
    await prisma.$executeRaw`
      ALTER TABLE "User" DROP COLUMN IF EXISTS "metadata"
    `;
    
    console.log('✅ Successfully removed metadata column from User table');
    console.log('\nVerifying...');
    
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      ORDER BY ordinal_position
    `;
    
    const hasMetadata = columns.some(col => col.column_name === 'metadata');
    
    if (hasMetadata) {
      console.log('❌ metadata column still exists!');
    } else {
      console.log('✅ metadata column has been successfully removed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

removeMetadataColumn();
