const { PrismaClient } = require('@prisma/client');

// Set DATABASE_URL manually
process.env.DATABASE_URL = 'postgresql://neondb_owner:password@ep-dry-glitter-aftvvy9d-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const prisma = new PrismaClient();

async function checkBooking() {
  try {
    // Check if booking exists with the reference
    const booking = await prisma.booking.findFirst({
      where: { 
        reference: 'SVMG3YFW3DLUPQ'
      },
      include: {
        Assignment: true,
        driver: {
          include: {
            user: true
          }
        },
        pickupAddress: true,
        dropoffAddress: true
      }
    });

    if (!booking) {
      console.log('❌ Booking not found with reference: SVMG3YFW3DLUPQ');
      return;
    }

    console.log('📋 Booking Details:');
    console.log('Reference:', booking.reference);
    console.log('Status:', booking.status);
    console.log('Driver ID:', booking.driverId);
    console.log('Driver Name:', booking.driver?.user?.name || 'None');
    console.log('Scheduled At:', booking.scheduledAt);
    console.log('Created At:', booking.createdAt);
    console.log('Has Assignment:', !!booking.Assignment);
    
    if (booking.Assignment) {
      console.log('Assignment Status:', booking.Assignment.status);
    }

    // Check why it might not appear in driver jobs
    const now = new Date();
    const isInFuture = booking.scheduledAt > now;
    const isConfirmed = booking.status === 'CONFIRMED';
    const hasNoDriver = booking.driverId === null;

    console.log('\n🔍 Driver Jobs Criteria Check:');
    console.log('Is Confirmed:', isConfirmed);
    console.log('Has No Driver:', hasNoDriver);
    console.log('Is In Future:', isInFuture);
    console.log('Should Appear in Jobs:', isConfirmed && hasNoDriver && isInFuture);

    // Also check for any other unassigned confirmed bookings
    const unassignedConfirmed = await prisma.booking.count({
      where: {
        status: 'CONFIRMED',
        driverId: null,
        scheduledAt: {
          gte: new Date()
        }
      }
    });

    console.log('\n📊 Total Unassigned Confirmed Bookings:', unassignedConfirmed);

  } catch (error) {
    console.error('❌ Error checking booking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBooking();