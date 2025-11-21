/**
 * Create a simple test paid booking
 * Usage: npx tsx scripts/create-simple-test-booking.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating test paid booking SV-000017...\n');

  // Update existing booking or create new one
  const booking = await prisma.booking.upsert({
    where: { reference: 'SV-000017' },
    update: {
      customerName: 'segs gsdrh',
      totalGBP: 52650, // £526.50
      amountPaidGBP: 52650,
      status: 'CONFIRMED',
      paidAt: new Date(),
    },
    create: {
      reference: 'SV-000017',
      customerName: 'segs gsdrh',
      customerEmail: 'test@speedyvan.co.uk',
      customerPhone: '+447700900000',
      
      // Required IDs - using dummy values
      pickupAddressId: 'addr_pickup_test',
      dropoffAddressId: 'addr_dropoff_test',
      pickupPropertyId: 'prop_pickup_test',
      dropoffPropertyId: 'prop_dropoff_test',
      
      // Coordinates
      pickupLat: 51.5074,
      pickupLng: -0.1278,
      dropoffLat: 53.4808,
      dropoffLng: -2.2426,
      
      // Pricing (in pence)
      totalGBP: 52650,
      amountPaidGBP: 52650,
      distanceCostGBP: 35000,
      accessSurchargeGBP: 4000,
      itemsSurchargeGBP: 12650,
      weatherSurchargeGBP: 0,
      
      // Distance/Duration
      baseDistanceMiles: 200,
      distanceMeters: 322000,
      estimatedDurationMinutes: 240,
      durationSeconds: 14400,
      
      // Multipliers
      availabilityMultiplierPercent: 100,
      crewMultiplierPercent: 100,
      
      // Dates
      scheduledAt: new Date('2025-11-25T10:00:00Z'),
      paidAt: new Date(),
      
      // Status
      status: 'CONFIRMED',
      crewSize: 'TWO',
      currentStep: 'STEP_1_WHERE_AND_WHAT',
      isStepCompleted: true,
    },
  });

  console.log('✅ Booking created/updated successfully!\n');
  console.log('📋 Details:');
  console.log('   Reference:', booking.reference);
  console.log('   Customer:', booking.customerName);
  console.log('   Amount: £' + (booking.totalGBP / 100).toFixed(2));
  console.log('   Status:', booking.status);
  console.log('   Paid:', booking.paidAt ? 'Yes' : 'No');
  console.log('\n🎉 Done!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
