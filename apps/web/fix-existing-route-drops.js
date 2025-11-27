/**
 * Fix script to add drops to existing routes that have bookings but no drops
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRouteDrops() {
  try {
    console.log('🔧 Starting to fix routes with missing drops...\n');

    // Find all routes that have bookings
    const routes = await prisma.route.findMany({
      where: {
        totalDrops: { gt: 0 },
      },
      include: {
        drops: true,
        Booking: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
            customer: true,
          },
        },
      },
    });

    console.log(`📊 Found ${routes.length} routes to check\n`);

    let fixedCount = 0;

    for (const route of routes) {
      const expectedDrops = route.Booking?.length || 0;
      const actualDrops = route.drops?.length || 0;

      if (expectedDrops > 0 && actualDrops === 0) {
        console.log(`❌ Route ${route.reference} (${route.id}): Has ${expectedDrops} bookings but 0 drops`);
        console.log(`   Fixing...`);

        // Create drops for this route
        const baseTimestamp = Date.now();
        const dropsData = route.Booking.map((booking, index) => {
          const scheduledAt = booking.scheduledAt || new Date();
          return {
            id: `drop_${route.id}_${index}_${baseTimestamp}_${Math.random().toString(36).substr(2, 9)}`,
            routeId: route.id,
            bookingId: booking.id,
            customerId: booking.customerId || booking.customer?.id,
            pickupAddress: booking.pickupAddress
              ? `${booking.pickupAddress.label}${booking.pickupAddress.postcode ? `, ${booking.pickupAddress.postcode}` : ''}`
              : 'Unknown pickup',
            deliveryAddress: booking.dropoffAddress
              ? `${booking.dropoffAddress.label}${booking.dropoffAddress.postcode ? `, ${booking.dropoffAddress.postcode}` : ''}`
              : 'Unknown dropoff',
            timeWindowStart: scheduledAt,
            timeWindowEnd: new Date(scheduledAt.getTime() + 4 * 60 * 60 * 1000),
            quotedPrice: Number(booking.totalGBP || 0),
            status: 'booked',
          };
        });

        await prisma.drop.createMany({ data: dropsData });

        console.log(`   ✅ Created ${dropsData.length} drops for route ${route.reference}\n`);
        fixedCount++;
      } else if (actualDrops > 0) {
        console.log(`✅ Route ${route.reference}: OK (${actualDrops} drops)`);
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} routes`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRouteDrops();
