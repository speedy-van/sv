/**
 * Manual Economy Booking to Drop Converter
 * 
 * Use this script to manually convert Economy bookings to Drops
 * if the automatic webhook conversion fails.
 * 
 * Usage:
 *   node convert-economy-bookings.js [booking-id]
 *   node convert-economy-bookings.js --all
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function convertSingleBooking(bookingId) {
  console.log(`\n🔄 Converting booking ${bookingId} to Drop...`);

  try {
    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        BookingItem: true,
        customer: true,
      },
    });

    if (!booking) {
      console.error(`❌ Booking ${bookingId} not found`);
      return { success: false, error: 'Booking not found' };
    }

    console.log(`📦 Found booking: ${booking.reference}`);
    console.log(`   Service Type: ${booking.serviceType || 'Not set'}`);
    console.log(`   Status: ${booking.status}`);

    // Check if already has a Drop
    const existingDrop = await prisma.drop.findFirst({
      where: { id: bookingId },
    });

    if (existingDrop) {
      console.log(`✅ Drop already exists: ${existingDrop.id}`);
      return { success: true, dropId: existingDrop.id, isExisting: true };
    }

    // Calculate weight and volume from items
    let totalWeight = 0;
    let totalVolume = 0;
    
    for (const item of booking.BookingItem || []) {
      totalWeight += item.estimatedWeight || 0;
      totalVolume += item.volumeM3 || 0;
    }

    // Default if no items
    if (totalWeight === 0) totalWeight = 50; // kg
    if (totalVolume === 0) totalVolume = 0.5; // m³

    // Calculate time windows (next day, 8am-6pm)
    const scheduledDate = new Date(booking.scheduledAt);
    const timeWindowStart = new Date(scheduledDate);
    timeWindowStart.setHours(8, 0, 0, 0);
    
    const timeWindowEnd = new Date(scheduledDate);
    timeWindowEnd.setHours(18, 0, 0, 0);

    console.log(`   Creating Drop with:`);
    console.log(`   - Service Tier: economy`);
    console.log(`   - Weight: ${totalWeight}kg`);
    console.log(`   - Volume: ${totalVolume}m³`);
    console.log(`   - Time Window: ${timeWindowStart.toISOString()} to ${timeWindowEnd.toISOString()}`);

    // Create Drop
    const drop = await prisma.drop.create({
      data: {
        id: bookingId, // Use same ID as booking
        customerId: booking.customerId || booking.customer?.id || 'unknown',
        status: 'booked',
        pickupAddress: booking.pickupAddress?.label || booking.pickupAddress?.postcode || 'Unknown',
        deliveryAddress: booking.dropoffAddress?.label || booking.dropoffAddress?.postcode || 'Unknown',
        timeWindowStart: timeWindowStart,
        timeWindowEnd: timeWindowEnd,
        serviceTier: 'economy',
        weight: totalWeight,
        volume: totalVolume,
        quotedPrice: booking.totalGBP,
        specialInstructions: `Converted from booking ${booking.reference}`,
      },
    });

    console.log(`✅ Drop created: ${drop.id}`);

    // Update booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        orderType: 'multi-drop',
        isMultiDrop: true,
        serviceType: 'ECONOMY',
        isEconomyService: true,
        shouldBeMultiDrop: true,
      },
    });

    console.log(`✅ Booking updated: orderType = multi-drop`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: 'manual-script',
        actorRole: 'system',
        action: 'manual_economy_drop_conversion',
        targetType: 'booking',
        targetId: bookingId,
        details: {
          bookingReference: booking.reference,
          dropId: drop.id,
          convertedAt: new Date().toISOString(),
          reason: 'Manual conversion script',
        },
      },
    });

    console.log(`✅ Audit log created`);

    return { success: true, dropId: drop.id, bookingReference: booking.reference };

  } catch (error) {
    console.error(`❌ Error converting booking ${bookingId}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function convertAllEconomyBookings() {
  console.log(`\n🔍 Finding all Economy bookings that need conversion...\n`);

  try {
    // Find Economy bookings without routes
    const economyBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        routeId: null,
        OR: [
          { serviceType: 'ECONOMY' },
          { isEconomyService: true },
          { shouldBeMultiDrop: true },
        ],
        orderType: {
          not: 'multi-drop',
        },
      },
      select: {
        id: true,
        reference: true,
        serviceType: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(`📊 Found ${economyBookings.length} Economy bookings to convert\n`);

    if (economyBookings.length === 0) {
      console.log(`✅ No bookings need conversion!`);
      return;
    }

    let successCount = 0;
    let failCount = 0;
    let existingCount = 0;

    for (const booking of economyBookings) {
      console.log(`\n[${ economyBookings.indexOf(booking) + 1 }/${economyBookings.length}]`);
      
      const result = await convertSingleBooking(booking.id);
      
      if (result.success) {
        if (result.isExisting) {
          existingCount++;
        } else {
          successCount++;
        }
      } else {
        failCount++;
      }

      // Small delay to avoid overwhelming database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n\n📊 Conversion Summary:`);
    console.log(`   ✅ Converted: ${successCount}`);
    console.log(`   ℹ️  Already had Drops: ${existingCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📦 Total: ${economyBookings.length}`);

  } catch (error) {
    console.error(`❌ Error finding Economy bookings:`, error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);

  console.log(`\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  Economy Booking to Drop Converter                  ║`);
  console.log(`╚══════════════════════════════════════════════════════╝`);

  if (args.length === 0) {
    console.log(`\n❌ Usage:`);
    console.log(`   node convert-economy-bookings.js [booking-id]`);
    console.log(`   node convert-economy-bookings.js --all`);
    console.log(`\nExamples:`);
    console.log(`   node convert-economy-bookings.js clx123abc456`);
    console.log(`   node convert-economy-bookings.js --all\n`);
    process.exit(1);
  }

  if (args[0] === '--all') {
    await convertAllEconomyBookings();
  } else {
    const bookingId = args[0];
    const result = await convertSingleBooking(bookingId);
    
    if (result.success) {
      console.log(`\n✅ SUCCESS!`);
      console.log(`   Drop ID: ${result.dropId}`);
      if (result.bookingReference) {
        console.log(`   Booking: ${result.bookingReference}`);
      }
    } else {
      console.log(`\n❌ FAILED: ${result.error}`);
      process.exit(1);
    }
  }

  console.log(`\n✅ Script completed successfully\n`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
