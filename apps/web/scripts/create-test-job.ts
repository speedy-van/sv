import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestJob() {
  try {
    console.log('🚀 Creating test job...');

    // Find a driver
    const driver = await prisma.driver.findFirst({
      where: { status: 'ACTIVE' },
      include: { User: true }
    });

    if (!driver) {
      console.log('❌ No active driver found. Please create a driver first.');
      return;
    }

    console.log('👤 Found driver:', driver.User.name);

    // Create test addresses
    const pickupAddress = await prisma.address.create({
      data: {
        label: '123 Test Street, London',
        line1: '123 Test Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        User: {
          connect: { id: driver.userId }
        }
      }
    });

    const dropoffAddress = await prisma.address.create({
      data: {
        label: '456 Destination Road, London',
        line1: '456 Destination Road',
        city: 'London',
        postcode: 'SW1A 2BB',
        User: {
          connect: { id: driver.userId }
        }
      }
    });

    // Create BookingAddress and PropertyDetails first
    const pickupBookingAddress = await prisma.bookingAddress.create({
      data: {
        id: `addr_pickup_${Date.now()}`,
        label: '123 Test Street, London',
        postcode: 'SW1A 1AA',
        lat: 51.5074,
        lng: -0.1278,
      }
    });

    const dropoffBookingAddress = await prisma.bookingAddress.create({
      data: {
        id: `addr_dropoff_${Date.now()}`,
        label: '456 Destination Road, London',
        postcode: 'SW1A 2BB',
        lat: 51.5074,
        lng: -0.1278,
      }
    });

    const pickupPropertyDetails = await prisma.propertyDetails.create({
      data: {
        id: `prop_pickup_${Date.now()}`,
        propertyType: 'DETACHED',
        accessType: 'WITHOUT_LIFT',
        floors: 0,
      }
    });

    const dropoffPropertyDetails = await prisma.propertyDetails.create({
      data: {
        id: `prop_dropoff_${Date.now()}`,
        propertyType: 'DETACHED',
        accessType: 'WITHOUT_LIFT',
        floors: 0,
      }
    });

    // Create test booking
    const booking = await prisma.booking.create({
      data: {
        id: `booking_${Date.now()}`,
        reference: `TEST${Date.now()}`,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '07901234567',
        totalGBP: 5000, // £50.00 in pence
        distanceCostGBP: 2000, // £20.00
        accessSurchargeGBP: 500, // £5.00
        weatherSurchargeGBP: 0,
        itemsSurchargeGBP: 1000, // £10.00
        baseDistanceMiles: 5.0,
        status: 'CONFIRMED',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        updatedAt: new Date(),
        pickupTimeSlot: 'morning',
        crewSize: 'TWO',
        pickupAddressId: pickupBookingAddress.id,
        dropoffAddressId: dropoffBookingAddress.id,
        pickupPropertyId: pickupPropertyDetails.id,
        dropoffPropertyId: dropoffPropertyDetails.id,
        availabilityMultiplierPercent: 100,
        crewMultiplierPercent: 100,
        estimatedDurationMinutes: 120,
        BookingItem: {
          create: [
            {
              id: `item_${Date.now()}_1`,
              name: 'Test Box 1',
              quantity: 2,
              volumeM3: 0.5
            },
            {
              id: `item_${Date.now()}_2`,
              name: 'Test Box 2',
              quantity: 1,
              volumeM3: 1.0
            }
          ]
        },
      }
    });

    console.log('📦 Created booking:', booking.reference);

    // Assign to driver
    const assignment = await prisma.assignment.create({
      data: {
        id: `assignment_${booking.id}_${driver.id}`,
        Booking: {
          connect: { id: booking.id }
        },
        Driver: {
          connect: { id: driver.id }
        },
        status: 'accepted',
        claimedAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      }
    });

    console.log('👨‍💼 Created assignment:', assignment.id);

    // Create job events to simulate completed job
    const events = [
      { step: 'navigate_to_pickup', notes: 'Started navigation to pickup' },
      { step: 'arrived_at_pickup', notes: 'Arrived at pickup location' },
      { step: 'loading_started', notes: 'Started loading items' },
      { step: 'loading_completed', notes: 'Loading completed' },
      { step: 'en_route_to_dropoff', notes: 'En route to dropoff' },
      { step: 'arrived_at_dropoff', notes: 'Arrived at dropoff location' },
      { step: 'unloading_started', notes: 'Started unloading items' },
      { step: 'unloading_completed', notes: 'Unloading completed' },
      { step: 'job_completed', notes: 'Job completed successfully' }
    ];

    for (const event of events) {
      await prisma.jobEvent.create({
        data: {
          id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          assignmentId: assignment.id,
          step: event.step as any, // Type assertion for step
          notes: event.notes,
          createdBy: driver.id,
          payload: {
            timestamp: new Date().toISOString(),
            driverId: driver.id,
            action: event.step
          }
        }
      });
    }

    console.log('📝 Created job events');

    // Update assignment status to completed
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: 'completed' }
    });

    // Create driver earnings
    const totalAmount = booking.totalGBP;
    const platformFee = Math.floor(totalAmount * 0.15);
    const driverEarnings = Math.floor(totalAmount * 0.85);

    const earnings = await prisma.driverEarnings.create({
      data: {
        driverId: driver.id,
        assignmentId: assignment.id,
        baseAmountPence: driverEarnings,
        surgeAmountPence: 0,
        tipAmountPence: 0,
        feeAmountPence: platformFee,
        netAmountPence: driverEarnings,
        currency: 'GBP',
        calculatedAt: new Date(),
        paidOut: false
      }
    });

    console.log('💰 Created driver earnings:', {
      earnings: driverEarnings,
      platformFee: platformFee,
      netAmount: driverEarnings
    });

    console.log('✅ Test job created successfully!');
    console.log('📊 Summary:');
    console.log(`  - Booking: ${booking.reference}`);
    console.log(`  - Driver: ${driver.User.name}`);
    console.log(`  - Total Amount: £${(totalAmount / 100).toFixed(2)}`);
    console.log(`  - Driver Earnings: £${(driverEarnings / 100).toFixed(2)}`);
    console.log(`  - Platform Fee: £${(platformFee / 100).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error creating test job:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestJob();
