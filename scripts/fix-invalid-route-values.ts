/**
 * Fix Invalid Route Values in Database
 * 
 * This script fixes routes with invalid totalOutcome values
 * (values larger than Number.MAX_SAFE_INTEGER or negative)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixInvalidRouteValues() {
  console.log('🔧 Starting fix for invalid route values...\n');

  try {
    // Find all routes
    const routes = await prisma.route.findMany({
      include: {
        Booking: {
          select: {
            id: true,
            totalGBP: true,
          },
        },
      },
    });

    console.log(`📊 Found ${routes.length} total routes\n`);

    let fixedCount = 0;
    let invalidCount = 0;

    for (const route of routes) {
      const currentValue = Number(route.totalOutcome || 0);
      
      // Check if value is invalid
      if (
        !Number.isFinite(currentValue) ||
        currentValue > Number.MAX_SAFE_INTEGER ||
        currentValue < 0 ||
        currentValue > 10000000 // £100,000 in pence (reasonable max)
      ) {
        invalidCount++;
        console.log(`❌ Invalid value found in route ${route.id}:`);
        console.log(`   Current: ${currentValue} (${(currentValue / 100).toFixed(2)} GBP)`);

        // Recalculate correct value from bookings
        const correctValue = route.Booking.reduce((sum, booking) => {
          const bookingValue = Number(booking.totalGBP || 0);
          if (Number.isFinite(bookingValue) && bookingValue >= 0 && bookingValue <= Number.MAX_SAFE_INTEGER) {
            return sum + bookingValue;
          }
          return sum;
        }, 0);

        console.log(`   Corrected: ${correctValue} (£${(correctValue / 100).toFixed(2)})`);

        // Update the route
        await prisma.route.update({
          where: { id: route.id },
          data: { totalOutcome: correctValue },
        });

        fixedCount++;
        console.log(`   ✅ Fixed!\n`);
      }
    }

    console.log('\n✅ Fix complete!');
    console.log(`📊 Statistics:`);
    console.log(`   Total routes: ${routes.length}`);
    console.log(`   Invalid routes found: ${invalidCount}`);
    console.log(`   Routes fixed: ${fixedCount}`);
    console.log(`   Routes OK: ${routes.length - invalidCount}`);

  } catch (error) {
    console.error('❌ Error fixing invalid route values:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixInvalidRouteValues()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

