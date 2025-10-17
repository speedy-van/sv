import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';
import { calculateRouteEarnings } from '@/lib/services/driver-earnings-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * GET /api/driver/routes/[id]/earnings
 * Calculate and preview earnings for a route before driver accepts it
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routeId = params.id;
    const userId = session.user.id;

    console.log('💰 Calculating route earnings:', { routeId, userId });

    return await withPrisma(async (prisma) => {
      // Get driver record
      const driver = await prisma.driver.findUnique({
        where: { userId },
        select: { id: true, userId: true }
      });

      if (!driver) {
        return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
      }

      // Get route details
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
          Booking: {
            include: {
              BookingItem: true,
            },
          },
          drops: {
            orderBy: { createdAt: 'asc' }
          }
        },
      });

      if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }

      // Calculate earnings using the driver earnings service
      const earningsResult = await calculateRouteEarnings(routeId);

      // Get route statistics
      const totalDistance = route.optimizedDistanceKm || route.actualDistanceKm || 0;
      const totalDuration = route.estimatedDuration || 0;
      const numberOfStops = (route as any).Booking?.length || 0;

      // Calculate metrics
      const earningsPerStop = earningsResult.totalEarnings / numberOfStops;
      const earningsPerMile = totalDistance > 0 ? earningsResult.totalEarnings / totalDistance : 0;
      const earningsPerHour = totalDuration > 0 ? (earningsResult.totalEarnings / totalDuration) * 60 : 0;

      // Format response for driver
      const response = {
        success: true,
        routeId,
        earnings: {
          total: earningsResult.totalEarnings,
          formatted: earningsResult.formattedEarnings,
          currency: 'GBP',
          breakdown: earningsResult.breakdowns,
        },
        route: {
          numberOfStops,
          totalDistance,
          totalDuration,
          routeType: numberOfStops > 1 ? 'multi-drop' : 'single',
        },
        metrics: {
          earningsPerStop,
          earningsPerMile,
          earningsPerHour,
          formattedPerStop: `£${(earningsPerStop / 100).toFixed(2)}`,
          formattedPerMile: `£${(earningsPerMile / 100).toFixed(2)}`,
          formattedPerHour: `£${(earningsPerHour / 100).toFixed(2)}`,
        },
        drops: (route as any).drops?.map((drop: any) => ({
          id: drop.id,
          sequence: drop.sequence,
          pickupAddress: drop.pickupAddress,
          deliveryAddress: drop.deliveryAddress,
          estimatedDuration: drop.estimatedDuration,
        })),
        calculatedAt: new Date().toISOString(),
      };

      console.log('✅ Route earnings calculated:', {
        routeId,
        totalEarnings: earningsResult.formattedEarnings,
        numberOfStops,
        earningsPerStop: response.metrics.formattedPerStop,
      });

      return NextResponse.json(response);
    });
  } catch (error) {
    console.error('❌ Error calculating route earnings:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate route earnings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

