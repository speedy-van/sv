import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkConstraint() {
  try {
    console.log('🔍 Checking Route table foreign key constraints...\n');
    
    // Try to get constraint information using Prisma's raw query
    const constraints = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'Route'
    `;
    
    console.log('Foreign Key Constraints on Route table:');
    console.log(JSON.stringify(constraints, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConstraint();

