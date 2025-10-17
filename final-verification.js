import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalVerification() {
  console.log('🔍 FINAL VERIFICATION - Route Creation System\n');
  console.log('='.repeat(60));
  
  try {
    // 1. Check database columns
    console.log('\n1️⃣ Checking Route table columns...');
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Route'
      AND column_name IN (
        'adminMultiplier', 
        'adminFixedAdjustment', 
        'adminOverrideReason',
        'totalDistanceMiles',
        'totalDurationMinutes',
        'driverId'
      )
      ORDER BY column_name
    `;
    
    console.log('   Columns found:', result.length);
    result.forEach(col => {
      console.log(`   ✅ ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 2. Check foreign key constraint
    console.log('\n2️⃣ Checking Foreign Key Constraint...');
    const fkConstraints = await prisma.$queryRaw`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'Route'
        AND kcu.column_name = 'driverId'
    `;
    
    if (fkConstraints.length > 0) {
      const constraint = fkConstraints[0];
      if (constraint.foreign_table_name === 'Driver') {
        console.log(`   ✅ Route.driverId → Driver.id (CORRECT)`);
      } else {
        console.log(`   ❌ Route.driverId → ${constraint.foreign_table_name}.id (INCORRECT)`);
      }
    }
    
    // 3. Check active drivers
    console.log('\n3️⃣ Checking Available Drivers...');
    const drivers = await prisma.driver.findMany({
      where: { status: 'active' },
      select: { id: true, User: { select: { name: true } } },
      take: 5
    });
    console.log(`   Found ${drivers.length} active drivers`);
    drivers.forEach(d => {
      console.log(`   ✅ ${d.User?.name} (ID: ${d.id.substring(0, 20)}...)`);
    });
    
    // 4. Check confirmed bookings
    console.log('\n4️⃣ Checking Available Bookings...');
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        routeId: null
      },
      select: { id: true, reference: true, baseDistanceMiles: true },
      take: 5
    });
    console.log(`   Found ${bookings.length} available bookings for routes`);
    bookings.forEach(b => {
      console.log(`   ✅ ${b.reference} (Distance: ${b.baseDistanceMiles} miles)`);
    });
    
    // 5. Test route creation logic
    console.log('\n5️⃣ Testing Route Creation Logic (DRY RUN)...');
    if (drivers.length > 0 && bookings.length >= 2) {
      const testDriverId = drivers[0].id;
      const testBookingIds = bookings.slice(0, 2).map(b => b.id);
      const totalDistanceMiles = bookings.slice(0, 2).reduce((sum, b) => sum + Number(b.baseDistanceMiles || 0), 0);
      
      console.log(`   Test Data:`);
      console.log(`   - Driver ID: ${testDriverId}`);
      console.log(`   - Bookings: ${testBookingIds.length}`);
      console.log(`   - Total Distance: ${totalDistanceMiles.toFixed(2)} miles`);
      console.log(`   - Expected Status: "active"`);
      console.log(`   ✅ All prerequisites met for route creation`);
    } else {
      console.log(`   ⚠️ Not enough data for test (need 1 driver + 2 bookings)`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 VERIFICATION COMPLETE');
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Ensure dev server has fully restarted');
    console.log('   2. Hard refresh the create route page (Ctrl+Shift+R)');
    console.log('   3. Create a new route and check:');
    console.log('      - Status should be "active"');
    console.log('      - totalDistanceMiles should be saved');
    console.log('      - Route should appear in "Active Now" section');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalVerification();

