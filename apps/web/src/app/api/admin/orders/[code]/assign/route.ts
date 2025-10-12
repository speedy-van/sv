import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  const s = await getServerSession(authOptions);
  if (!s?.user || (s.user as any).role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { driverId } = await request.json();

    // Find booking by reference (not code)
    const booking = await prisma.booking.findUnique({
      where: { reference: params.code },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return new Response('Booking not found', { status: 404 });
    }

    if (booking.status !== 'CONFIRMED') {
      return new Response('Booking is not in confirmed status', {
        status: 400,
      });
    }

    let targetDriverId = driverId;

    // If no specific driver provided, find the best available driver
    if (!targetDriverId) {
      const availableDrivers = await prisma.driver.findMany({
        where: {
          status: 'active',
          onboardingStatus: 'approved',
        },
        include: {
          Booking: {
            where: {
              status: {
                in: ['CONFIRMED', 'COMPLETED'],
              },
            },
          },
        },
        orderBy: [{ rating: 'desc' }, { createdAt: 'asc' }],
        take: 10,
      });

      // Filter drivers by capacity and find the best match
      const suitableDrivers = availableDrivers.filter(driver => {
        const activeJobs = driver.Booking.length;
        return activeJobs < 3; // Max 3 active jobs per driver
      });

      if (suitableDrivers.length === 0) {
        return new Response('No suitable drivers available', { status: 404 });
      }

      targetDriverId = suitableDrivers[0].id;
    }

    // Atomic assignment using transaction
    const result = await prisma.$transaction(async tx => {
      // Check if driver is still available
      const driver = await tx.driver.findUnique({
        where: { id: targetDriverId },
        include: {
          Booking: {
            where: {
              status: {
                in: ['CONFIRMED', 'COMPLETED'],
              },
            },
          },
        },
      });

      if (!driver || driver.status !== 'active') {
        throw new Error('Driver not available');
      }

      if (driver.Booking.length >= 3) {
        throw new Error('Driver at capacity');
      }

      // Update booking
      const updatedBooking = await tx.booking.update({
        where: { reference: params.code },
        data: {
          driverId: targetDriverId,
          status: 'CONFIRMED',
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Create or update assignment
      await tx.assignment.upsert({
        where: { bookingId: booking.id },
        update: {
          driverId: targetDriverId,
          status: 'invited',
          round: 1,
          updatedAt: new Date(),
        },
        create: {
          id: `assignment_${booking.id}`,
          bookingId: booking.id,
          driverId: targetDriverId,
          status: 'invited',
          round: 1,
          updatedAt: new Date(),
        },
      });

      return updatedBooking;
    });

    // Log the audit
    await logAudit((s.user as any).id, 'assign_driver', booking.id, { targetType: 'booking', before: { driverId: booking.driverId, status: booking.status }, after: { driverId: targetDriverId, status: 'CONFIRMED' } });

    return Response.json({
      success: true,
      booking: result,
      message: 'Driver assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  const s = await getServerSession(authOptions);
  if (!s?.user || (s.user as any).role !== 'admin')
    return new Response('Unauthorized', { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { reference: params.code },
    select: {
      id: true,
      pickupAddress: true,
      dropoffAddress: true,
      scheduledAt: true,
      crewSize: true,
    },
  });

  if (!booking) return new Response('Not Found', { status: 404 });

  // Get available drivers with suggestions
  const availableDrivers = await prisma.driver.findMany({
    where: {
      status: 'active',
      onboardingStatus: 'approved',
      availability: {
        status: 'online',
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      Booking: {
        where: {
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
        },
      },
      vehicles: {
        take: 1,
      },
    },
    orderBy: [{ rating: 'desc' }, { createdAt: 'asc' }],
    take: 20,
  });

  // Score drivers based on various factors
  const scoredDrivers = availableDrivers
    .map(driver => {
      const activeJobs = driver.Booking.length;
      const capacityScore = Math.max(0, 3 - activeJobs); // Prefer drivers with fewer active jobs
      const ratingScore = (driver.rating || 0) * 10; // Higher rating = better score
      const experienceScore = Math.min(
        10,
        Math.floor(
          (Date.now() - driver.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
        )
      ); // Months of experience

      const totalScore = capacityScore * 5 + ratingScore + experienceScore;

      return {
        ...driver,
        score: totalScore,
        activeJobs,
        suitability: activeJobs < 3 ? 'available' : 'at_capacity',
      };
    })
    .sort((a, b) => b.score - a.score);

  return Response.json({
    booking,
    suggestions: scoredDrivers.slice(0, 10),
  });
}
