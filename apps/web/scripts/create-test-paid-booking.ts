/**
 * Create a test paid booking in production database
 * Usage: tsx scripts/create-test-paid-booking.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestPaidBooking() {
  try {
    console.log('🚀 Creating test paid booking...\n');

    // Create or find test customer
    const customer = await prisma.user.upsert({
      where: { email: 'segs.gsdrh@test.com' },
      update: {},
      create: {
        email: 'segs.gsdrh@test.com',
        name: 'segs gsdrh',
        phone: '+44 7700 900000',
        password: '$2a$10$test.hashed.password.for.test.user.only',
        role: 'customer',
        emailVerified: true,
      },
    });

    console.log('✅ Customer created/found:', customer.email);

    // Create addresses
    const pickupAddress = await prisma.address.create({
      data: {
        street: '10 Downing Street',
        city: 'London',
        county: 'Greater London',
        postcode: 'SW1A 2AA',
        country: 'United Kingdom',
        latitude: 51.5034,
        longitude: -0.1276,
        addressType: 'PICKUP',
        userId: customer.id,
      },
    });

    const dropoffAddress = await prisma.address.create({
      data: {
        street: 'Manchester Piccadilly',
        city: 'Manchester',
        county: 'Greater Manchester',
        postcode: 'M1 2GH',
        country: 'United Kingdom',
        latitude: 53.4776,
        longitude: -2.2309,
        addressType: 'DELIVERY',
        userId: customer.id,
      },
    });

    // Create properties
    const pickupProperty = await prisma.property.create({
      data: {
        propertyType: 'HOUSE',
        bedrooms: 3,
        parkingAvailable: true,
        hasLift: false,
        floorLevel: 0,
        accessNotes: 'Ground floor',
        userId: customer.id,
      },
    });

    const dropoffProperty = await prisma.property.create({
      data: {
        propertyType: 'APARTMENT',
        bedrooms: 2,
        parkingAvailable: true,
        hasLift: true,
        floorLevel: 3,
        accessNotes: 'Lift available',
        userId: customer.id,
      },
    });

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        reference: 'SV-000017',
        customerId: customer.id,
        customerName: 'segs gsdrh',
        customerEmail: 'segs.gsdrh@test.com',
        customerPhone: '+44 7700 900000',
        
        // Addresses and properties
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
        
        // Location coordinates
        pickupLat: 51.5034,
        pickupLng: -0.1276,
        dropoffLat: 53.4776,
        dropoffLng: -2.2309,
        
        // Scheduling
        scheduledAt: new Date('2025-11-25T10:00:00Z'),
        
        // Service details
        serviceType: 'LUXURY',
        crewSize: 'TWO',
        
        // Distance and duration (in meters and seconds)
        distanceMeters: 322000, // ~200 miles
        durationSeconds: 14400, // ~4 hours
        baseDistanceMiles: 200.0,
        estimatedDurationMinutes: 240,
        
        // Pricing (in pence for GBP fields)
        distanceCostGBP: 35000, // £350.00
        accessSurchargeGBP: 4000, // £40.00
        itemsSurchargeGBP: 12050, // £120.50
        weatherSurchargeGBP: 0,
        totalGBP: 52650, // £526.50
        amountPaidGBP: 52650,
        
        // Multipliers
        availabilityMultiplierPercent: 100,
        crewMultiplierPercent: 100,
        
        // Payment
        status: 'CONFIRMED',
        stripePaymentIntentId: 'pi_test_' + Date.now(),
        paidAt: new Date(),
        
        // Booking step
        currentStep: 'STEP_6_CONFIRMATION',
        isStepCompleted: true,
        stepCompletedAt: new Date(),
      },
      include: {
        customer: true,
        pickupAddress: true,
        dropoffAddress: true,
      },
    });

    console.log('\n✅ Booking created successfully!');
    console.log('📋 Booking Details:');
    console.log('   Reference:', booking.reference);
    console.log('   Customer:', booking.customerName);
    console.log('   Amount: £' + (booking.totalGBP / 100).toFixed(2));
    console.log('   Status:', booking.status);
    console.log('   Paid At:', booking.paidAt?.toISOString());
    console.log('   Scheduled:', booking.scheduledAt.toISOString());
    console.log('   From:', booking.pickupAddress.city);
    console.log('   To:', booking.dropoffAddress.city);
    console.log('\n🎉 Done!');

    return booking;
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestPaidBooking()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
