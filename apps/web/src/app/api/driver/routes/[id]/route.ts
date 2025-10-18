import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params first (Next.js 15 requirement)
    const { id } = await params;
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      if (bearerAuth.user.role !== 'driver') {
        return NextResponse.json(
          { error: 'Forbidden - Driver access required' },
          { status: 403 }
        );
      }
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      
      if (!session?.user || (session.user as any).role !== 'driver') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      userId = session.user.id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    // Get driver record to find driverId
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const route = await prisma.route.findUnique({
      where: { id: id },
      include: {
        drops: {
          include: {
            Booking: {
              select: {
                id: true,
                reference: true,
                customerName: true,
                crewSize: true,
                BookingItem: {
                  select: {
                    id: true,
                    name: true,
                    quantity: true,
                  }
                }
              }
            }
          },
          orderBy: {
            timeWindowStart: 'asc',
          },
        },
      },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // route.driverId is User.id, not Driver.id - compare with userId
    if (route.driverId !== userId) {
      return NextResponse.json({ error: 'Not authorized for this route' }, { status: 403 });
    }

    const drops = route.drops || [];
    const totalDistance = drops.reduce((sum: number, drop: any) => sum + (drop.distance || 0), 0);
    const totalEarnings = Number(route.driverPayout || route.totalOutcome || 0) / 100;
    const completedDrops = drops.filter((d: any) => d.status === 'delivered').length;

    return NextResponse.json({
      route: {
        id: route.id,
        status: route.status,
        estimatedDuration: route.estimatedDuration || 0,
        estimatedDistance: route.optimizedDistanceKm || totalDistance,
        estimatedEarnings: totalEarnings,
        completedDrops: completedDrops,
        currentDropIndex: completedDrops,
        drops: drops.map((drop: any) => ({
          id: drop.id,
          status: drop.status,
          pickupAddress: drop.pickupAddress,
          deliveryAddress: drop.deliveryAddress,
          timeWindowStart: drop.timeWindowStart,
          timeWindowEnd: drop.timeWindowEnd,
          serviceTier: drop.serviceTier,
          customerName: drop.Booking?.customerName || 'Unknown',
          items: drop.Booking?.BookingItem || [],
        })),
      }
    });

  } catch (error) {
    console.error('Error fetching route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route' },
      { status: 500 }
    );
  }
}

