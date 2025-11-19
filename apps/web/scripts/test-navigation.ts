import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNavigation() {
  console.log('🧪 Testing Navigation & Live Tracking Features...\n');

  try {
    // Test 1: Check if we have any active assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        status: 'accepted',
      },
      include: {
        Booking: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
          },
        },
        Driver: {
          include: {
            DriverAvailability: true,
          },
        },
      },
      take: 1,
    });

    if (assignments.length === 0) {
      console.log(
        '❌ No active assignments found. Please create a test assignment first.'
      );
      return;
    }

    const assignment = assignments[0];
    console.log('✅ Found active assignment:');
    console.log(`   Assignment ID: ${assignment.id}`);
    console.log(`   Booking Reference: ${assignment.Booking.reference}`);
    console.log(`   Status: ${assignment.status}`);
    console.log(`   Pickup: ${assignment.Booking.pickupAddress.label}`);
    console.log(`   Dropoff: ${assignment.Booking.dropoffAddress.label}`);
    console.log(`   Driver: ${assignment.Driver.userId}`);

    // Test 2: Check if coordinates are available
    if (
      assignment.Booking.pickupAddress.lat &&
      assignment.Booking.pickupAddress.lng &&
      assignment.Booking.dropoffAddress.lat &&
      assignment.Booking.dropoffAddress.lng
    ) {
      console.log('\n✅ Coordinates available for navigation:');
      console.log(
        `   Pickup: ${assignment.Booking.pickupAddress.lat}, ${assignment.Booking.pickupAddress.lng}`
      );
      console.log(
        `   Dropoff: ${assignment.Booking.dropoffAddress.lat}, ${assignment.Booking.dropoffAddress.lng}`
      );
      console.log(`   Scheduled: ${assignment.Booking.scheduledAt}`);
      console.log(
        `   Duration: ${assignment.Booking.estimatedDurationMinutes} minutes`
      );
    } else {
      console.log(
        '\n⚠️  Missing coordinates - navigation features may be limited'
      );
    }

    // Test 3: Check driver availability
    if (assignment.Driver.DriverAvailability) {
      console.log('\n✅ Driver availability found:');
      console.log(`   Status: ${assignment.Driver.DriverAvailability.status}`);
      console.log(
        `   Location Consent: ${assignment.Driver.DriverAvailability.locationConsent}`
      );
      console.log(`   Last Seen: ${assignment.Driver.DriverAvailability.lastSeenAt}`);

      if (
        assignment.Driver.DriverAvailability.lastLat &&
        assignment.Driver.DriverAvailability.lastLng
      ) {
        console.log(
          `   Last Location: ${assignment.Driver.DriverAvailability.lastLat}, ${assignment.Driver.DriverAvailability.lastLng}`
        );
      }
    } else {
      console.log('\n⚠️  No driver availability record found');
    }

    // Test 4: Check for job events
    const events = await prisma.jobEvent.findMany({
      where: {
        assignmentId: assignment.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    console.log(`\n📋 Recent job events (${events.length}):`);
    events.forEach((event, index) => {
      console.log(
        `   ${index + 1}. ${event.step} - ${event.createdAt.toISOString()}`
      );
    });

    // Test 5: Generate tracking URL
    const trackingUrl = `http://localhost:3000/track?code=${assignment.Booking.reference}`;
    console.log(`\n🔗 Tracking URL: ${trackingUrl}`);

    // Test 6: Check API endpoints
    console.log('\n🔌 API Endpoints to test:');
    console.log(`   GET /api/driver/jobs/${assignment.id}/route`);
    console.log(`   POST /api/driver/location`);
    console.log(`   GET /api/track/${assignment.Booking.reference}`);
    console.log(`   GET /api/track/eta?code=${assignment.Booking.reference}`);

    console.log('\n✅ Navigation & Live Tracking test completed!');
    console.log('\n📱 To test the features:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Login as a driver and navigate to an active job');
    console.log('   3. Test the navigation buttons and live map');
    console.log('   4. Share the tracking link with a customer');
    console.log('   5. Test the public tracking page');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNavigation();
