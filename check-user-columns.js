import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserColumns() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      ORDER BY ordinal_position
    `;
    
    console.log('User table columns in production database:');
    console.log(JSON.stringify(columns, null, 2));
    
    const hasMetadata = columns.some(col => col.column_name === 'metadata');
    console.log('\nHas metadata column:', hasMetadata);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserColumns();
