import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestRatings() {
  try {
    // Get a test driver
    const driver = await prisma.driver.findFirst({
      include: {
        Assignment: {
          include: {
            Booking: true,
          },
          where: {
            status: 'completed',
          },
        },
      },
    });

    if (!driver) {
      console.log('No driver found with completed assignments');
      return;
    }

    console.log(`Creating test ratings for driver: ${driver.id}`);

    // Create some test ratings
    const ratings = [
      {
        rating: 5,
        review:
          'Excellent service! Driver was very professional and careful with my items.',
        category: 'overall' as const,
        assignmentId: driver.Assignment[0]?.id,
      },
      {
        rating: 4,
        review: 'Good communication and arrived on time.',
        category: 'communication' as const,
        assignmentId: driver.Assignment[0]?.id,
      },
      {
        rating: 5,
        review: 'Very careful with fragile items. Highly recommend!',
        category: 'care' as const,
        assignmentId: driver.Assignment[0]?.id,
      },
      {
        rating: 4,
        review: 'Professional and efficient service.',
        category: 'professionalism' as const,
        assignmentId: driver.Assignment[0]?.id,
      },
      {
        rating: 5,
        review: 'Arrived exactly when promised. Great experience!',
        category: 'punctuality' as const,
        assignmentId: driver.Assignment[0]?.id,
      },
    ];

    for (const ratingData of ratings) {
      if (ratingData.assignmentId) {
        await prisma.driverRating.create({
          data: {
            driverId: driver.id,
            assignmentId: ratingData.assignmentId,
            rating: ratingData.rating,
            review: ratingData.review,
            category: ratingData.category,
            status: 'active',
          },
        });
      }
    }

    // Create some test incidents
    const incidents = [
      {
        type: 'vehicle_breakdown' as const,
        severity: 'medium' as const,
        title: 'Van engine warning light',
        description:
          'Engine warning light came on during delivery. Had to pull over and call roadside assistance.',
        location: 'M25 Motorway, Junction 15',
        customerImpact: true,
        propertyDamage: false,
        injuryInvolved: false,
      },
      {
        type: 'weather_related' as const,
        severity: 'low' as const,
        title: 'Heavy rain delay',
        description:
          'Heavy rain caused traffic delays and made loading more difficult.',
        location: 'London Bridge area',
        customerImpact: true,
        propertyDamage: false,
        injuryInvolved: false,
      },
    ];

    for (const incidentData of incidents) {
      await prisma.driverIncident.create({
        data: {
          driverId: driver.id,
          assignmentId: driver.Assignment[0]?.id || null,
          type: incidentData.type,
          severity: incidentData.severity,
          title: incidentData.title,
          description: incidentData.description,
          location: incidentData.location,
          customerImpact: incidentData.customerImpact,
          propertyDamage: incidentData.propertyDamage,
          injuryInvolved: incidentData.injuryInvolved,
          status: 'reported',
        },
      });
    }

    console.log('Test ratings and incidents created successfully!');
    console.log(
      `Created ${ratings.length} ratings and ${incidents.length} incidents`
    );
  } catch (error) {
    console.error('Error creating test ratings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRatings();
