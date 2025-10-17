import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixConstraint() {
  try {
    console.log('🔧 Fixing Route_driverId_fkey constraint...\n');
    
    // Drop the incorrect constraint
    console.log('1. Dropping incorrect constraint...');
    await prisma.$executeRaw`ALTER TABLE "Route" DROP CONSTRAINT IF EXISTS "Route_driverId_fkey"`;
    console.log('✅ Dropped old constraint');
    
    // Add the correct constraint
    console.log('\n2. Adding correct constraint (Driver.id)...');
    await prisma.$executeRaw`
      ALTER TABLE "Route" 
      ADD CONSTRAINT "Route_driverId_fkey" 
      FOREIGN KEY ("driverId") 
      REFERENCES "Driver"("id") 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `;
    console.log('✅ Added correct constraint');
    
    // Verify the fix
    console.log('\n3. Verifying the fix...');
    const constraints = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'Route'
        AND tc.constraint_name = 'Route_driverId_fkey'
    `;
    
    console.log('\n✅ Constraint fixed successfully:');
    console.log(JSON.stringify(constraints, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixConstraint();

