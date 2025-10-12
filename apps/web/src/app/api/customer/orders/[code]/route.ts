import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _: Request,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'customer') {
    return new Response('Unauthorized', { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { reference: params.code },
    include: {
      customer: true,
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
              isActive: true
            }
          },
        },
      },
      chatSessions: {
        include: {
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      },
    },
  });

  if (!booking || booking.customerId !== (session.user as any).id) {
    return new Response('Not found', { status: 404 });
  }

  // Generate timeline events based on booking status and data
  const timeline = generateTimeline(booking);

  return Response.json({
    booking,
    timeline,
    canReschedule: ['open', 'pending_dispatch', 'confirmed'].includes(
      booking.status
    ),
    canCancel: ['open', 'pending_dispatch', 'confirmed'].includes(
      booking.status
    ),
    canTrack: [
      'assigned',
      'en_route_pickup',
      'arrived',
      'loaded',
      'en_route_dropoff',
    ].includes(booking.status),
    trackingUrl: `/tracking/${booking.reference}`,
  });
}

function generateTimeline(booking: any) {
  const timeline = [
    {
      id: 'created',
      status: 'completed',
      title: 'Booking Created',
      description: 'Your booking has been created successfully',
      timestamp: booking.createdAt,
      icon: '📝',
    },
  ];

  if (booking.status !== 'open') {
    timeline.push({
      id: 'pending_dispatch',
      status: 'completed',
      title: 'Pending Dispatch',
      description: "We're finding the best crew for your job",
      timestamp: booking.createdAt, // Would be actual timestamp in real implementation
      icon: '🔍',
    });
  }

  if (
    [
      'confirmed',
      'assigned',
      'en_route_pickup',
      'arrived',
      'loaded',
      'en_route_dropoff',
      'completed',
    ].includes(booking.status)
  ) {
    timeline.push({
      id: 'confirmed',
      status: 'completed',
      title: 'Booking Confirmed',
      description: 'Your booking has been confirmed',
      timestamp: booking.createdAt, // Would be actual timestamp
      icon: '✅',
    });
  }

  if (
    [
      'assigned',
      'en_route_pickup',
      'arrived',
      'loaded',
      'en_route_dropoff',
      'completed',
    ].includes(booking.status)
  ) {
    timeline.push({
      id: 'assigned',
      status: 'completed',
      title: 'Crew Assigned',
      description: booking.driver
        ? `Your crew has been assigned: ${booking.driver.user.name}`
        : 'Your crew has been assigned',
      timestamp: booking.createdAt, // Would be actual timestamp
      icon: '👥',
    });
  }

  if (
    [
      'en_route_pickup',
      'arrived',
      'loaded',
      'en_route_dropoff',
      'completed',
    ].includes(booking.status)
  ) {
    timeline.push({
      id: 'en_route_pickup',
      status: 'completed',
      title: 'En Route to Pickup',
      description: 'Your crew is on the way to pickup location',
      timestamp: booking.createdAt, // Would be actual timestamp
      icon: '🚚',
    });
  }

  if (
    ['arrived', 'loaded', 'en_route_dropoff', 'completed'].includes(
      booking.status
    )
  ) {
    timeline.push({
      id: 'arrived',
      status: 'completed',
      title: 'Arrived at Pickup',
      description: 'Your crew has arrived at pickup location',
      timestamp: booking.createdAt, // Would be actual timestamp
      icon: '📍',
    });
  }

  if (['loaded', 'en_route_dropoff', 'completed'].includes(booking.status)) {
    timeline.push({
      id: 'loaded',
      status: 'completed',
      title: 'Loaded & En Route',
      description: 'Items loaded and heading to destination',
      timestamp: booking.createdAt, // Would be actual timestamp
      icon: '📦',
    });
  }

  if (['en_route_dropoff', 'completed'].includes(booking.status)) {
    timeline.push({
      id: 'en_route_dropoff',
      status: 'completed',
      title: 'En Route to Dropoff',
      description: 'Your crew is on the way to dropoff location',
      timestamp: booking.createdAt, // Would be actual timestamp
      icon: '🚚',
    });
  }

  if (booking.status === 'completed') {
    timeline.push({
      id: 'completed',
      status: 'completed',
      title: 'Completed',
      description: 'Your move has been completed successfully',
      timestamp: booking.createdAt, // Would be actual timestamp
      icon: '🎉',
    });
  }

  if (booking.status === 'cancelled') {
    timeline.push({
      id: 'cancelled',
      status: 'cancelled',
      title: 'Cancelled',
      description: 'This booking has been cancelled',
      timestamp: booking.createdAt, // Would be actual timestamp
      icon: '❌',
    });
  }

  return timeline;
}
