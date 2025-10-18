/**
 * Clean Invalid Routes from Database
 * 
 * This script:
 * 1. Removes routes with 0 drops
 * 2. Fixes routes with invalid totalOutcome values
 * 3. Removes routes with invalid data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanInvalidRoutes() {
  console.log('🔧 Starting cleanup of invalid routes...\n');

  try {
    // 1. Find routes with 0 drops
    const emptyRoutes = await prisma.route.findMany({
      where: {
        OR: [
          { totalDrops: 0 },
          { totalDrops: null },
        ],
      },
      include: {
        Booking: true,
      },
    });

    console.log(`📊 Found ${emptyRoutes.length} empty routes\n`);

    for (const route of emptyRoutes) {
      console.log(`🗑️ Deleting empty route: ${route.id}`);
      console.log(`   Status: ${route.status}`);
      console.log(`   Drops: ${route.totalDrops || 0}`);
      console.log(`   Bookings: ${route.Booking.length}`);
      
      await prisma.route.delete({
        where: { id: route.id },
      });
      
      console.log(`   ✅ Deleted!\n`);
    }

    // 2. Find routes with invalid totalOutcome
    const allRoutes = await prisma.route.findMany({
      include: {
        Booking: {
          select: {
            id: true,
            totalGBP: true,
          },
        },
      },
    });

    console.log(`\n📊 Checking ${allRoutes.length} routes for invalid values\n`);

    let fixedCount = 0;
    let invalidCount = 0;

    for (const route of allRoutes) {
      const currentValue = Number(route.totalOutcome || 0);
      
      // Check if value is invalid
      if (
        !Number.isFinite(currentValue) ||
        currentValue > Number.MAX_SAFE_INTEGER ||
        currentValue < 0 ||
        currentValue > 10000000 // £100,000 in pence (reasonable max)
      ) {
        invalidCount++;
        console.log(`❌ Invalid totalOutcome in route ${route.id}:`);
        console.log(`   Current: ${currentValue}`);
        console.log(`   Current (GBP): £${(currentValue / 100).toFixed(2)}`);

        // Recalculate correct value from bookings
        const correctValue = route.Booking.reduce((sum, booking) => {
          const bookingValue = Number(booking.totalGBP || 0);
          if (Number.isFinite(bookingValue) && bookingValue >= 0 && bookingValue <= Number.MAX_SAFE_INTEGER) {
            return sum + bookingValue;
          }
          return sum;
        }, 0);

        console.log(`   Corrected: ${correctValue}`);
        console.log(`   Corrected (GBP): £${(correctValue / 100).toFixed(2)}`);

        // Update the route
        await prisma.route.update({
          where: { id: route.id },
          data: { totalOutcome: correctValue },
        });

        fixedCount++;
        console.log(`   ✅ Fixed!\n`);
      }
    }

    console.log('\n✅ Cleanup complete!');
    console.log(`📊 Statistics:`);
    console.log(`   Empty routes deleted: ${emptyRoutes.length}`);
    console.log(`   Invalid values found: ${invalidCount}`);
    console.log(`   Routes fixed: ${fixedCount}`);
    console.log(`   Total routes remaining: ${allRoutes.length - emptyRoutes.length}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanInvalidRoutes()
  .then(() => {
    console.log('\n✅ All done! Database is clean.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

