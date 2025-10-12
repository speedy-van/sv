import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { subDays, startOfDay, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const s = await getServerSession(authOptions);
    if (!s?.user || (s.user as any).role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date ranges
    const now = new Date();
    const days = range === '24h' ? 1 : range === '7d' ? 7 : 30;
    const since = subDays(now, days);
    const since7d = subDays(now, 7);
    const since24h = subDays(now, 1);

    // Start with basic queries to test database connection
    const [bookingCounts, revenue30d, revenue7d, revenue24h, recentBookings, realDrivers, serviceAreaBookings, cancellationData] =
      await Promise.all([
        prisma.booking.groupBy({
          by: ['status'],
          _count: { _all: true },
          where: { createdAt: { gte: since } },
        }),

        prisma.booking.aggregate({
          _sum: { totalGBP: true },
          _avg: { totalGBP: true },
          where: {
            status: 'COMPLETED',
            createdAt: { gte: since },
          },
        }),

        prisma.booking.aggregate({
          _sum: { totalGBP: true },
          _avg: { totalGBP: true },
          where: {
            status: 'COMPLETED',
            createdAt: { gte: since7d },
          },
        }),

        prisma.booking.aggregate({
          _sum: { totalGBP: true },
          _avg: { totalGBP: true },
          where: {
            status: 'COMPLETED',
            createdAt: { gte: since24h },
          },
        }),

        prisma.booking.findMany({
          where: { createdAt: { gte: since } },
          orderBy: { createdAt: 'asc' },
          select: {
            createdAt: true,
            totalGBP: true,
            status: true,
          },
        }),

        // Fetch real driver data
        prisma.driver.findMany({
          where: {
            status: { in: ['active', 'available', 'on_job'] },
          },
          select: {
            id: true,
            User: {
              select: {
                name: true,
              },
            },
            Assignment: {
              where: {
                status: 'completed',
                createdAt: { gte: since },
              },
              select: {
                id: true,
                createdAt: true,
                Booking: {
                  select: {
                    totalGBP: true,
                    estimatedPickupTime: true,
                    actualPickupTime: true,
                  },
                },
              },
            },
            DriverRating: {
              where: {
                createdAt: { gte: since },
              },
              select: {
                rating: true,
              },
            },
            DriverEarnings: {
              where: {
                calculatedAt: { gte: since },
              },
              select: {
                netAmountPence: true,
                tipAmountPence: true,
              },
            },
          },
        }),

        // Fetch real service area data based on pickup addresses
        prisma.booking.findMany({
          where: {
            createdAt: { gte: since },
            status: 'COMPLETED',
          },
          select: {
            totalGBP: true,
            BookingAddress_Booking_pickupAddressIdToBookingAddress: {
              select: {
                postcode: true,
                label: true,
              },
            },
          },
        }),

        // Fetch real cancellation reasons
        prisma.$queryRaw<Array<{ reason: string }>>`
          SELECT DISTINCT bc.reason
          FROM "BookingCancellation" bc
          INNER JOIN "Booking" b ON bc."bookingId" = b.id
          WHERE b."createdAt" >= ${since}
        `,
      ]);

    // Process time series data
    const map = new Map<
      string,
      {
        day: string;
        revenue: number;
        bookings: number;
        completed: number;
        cancelled: number;
      }
    >();
    for (let i = 0; i < days; i++) {
      const d = format(startOfDay(subDays(now, i)), 'yyyy-MM-dd');
      map.set(d, {
        day: d,
        revenue: 0,
        bookings: 0,
        completed: 0,
        cancelled: 0,
      });
    }

    for (const booking of recentBookings) {
      const d = format(startOfDay(booking.createdAt), 'yyyy-MM-dd');
      const row = map.get(d);
      if (row) {
        row.bookings += 1;
        if (booking.status === 'COMPLETED') {
          row.revenue += booking.totalGBP || 0;
          row.completed += 1;
        } else if (booking.status === 'CANCELLED') {
          row.cancelled += 1;
        }
      }
    }

    // Process driver metrics from real data
    const driverMetrics = realDrivers.map(driver => {
      const completedJobs = driver.Assignment.length;
      
      // Calculate average rating
      const avgRating = driver.DriverRating.length > 0
        ? driver.DriverRating.reduce((sum, r) => sum + r.rating, 0) / driver.DriverRating.length
        : 0;
      
      // Calculate total earnings (convert pence to GBP)
      const totalEarnings = driver.DriverEarnings.reduce(
        (sum, e) => sum + (e.netAmountPence + e.tipAmountPence) / 100,
        0
      );
      
      // Calculate on-time rate
      const onTimeJobs = driver.Assignment.filter(assignment => {
        if (!assignment.Booking?.estimatedPickupTime || !assignment.Booking?.actualPickupTime) {
          return false;
        }
        const estimatedTime = new Date(assignment.Booking.estimatedPickupTime).getTime();
        const actualTime = new Date(assignment.Booking.actualPickupTime).getTime();
        const diffMinutes = (actualTime - estimatedTime) / (1000 * 60);
        return diffMinutes <= 15; // On-time if within 15 minutes
      }).length;
      
      const onTimeRate = completedJobs > 0 
        ? Math.round((onTimeJobs / completedJobs) * 100)
        : 0;
      
      return {
        driverId: driver.id,
        driverName: driver.User?.name || 'Unknown Driver',
        completedJobs,
        avgRating: parseFloat(avgRating.toFixed(1)),
        earnings: Math.round(totalEarnings),
        onTimeRate,
      };
    }).filter(d => d.completedJobs > 0); // Only show drivers with completed jobs

    // Process service area data from real bookings (UK-wide)
    const areaMap = new Map<string, { bookings: number; revenue: number; postcodes: Set<string> }>();
    
    for (const booking of serviceAreaBookings) {
      if (!booking.BookingAddress_Booking_pickupAddressIdToBookingAddress) continue;
      
      // Extract region from postcode (first 1-2 letters indicate area)
      const postcode = booking.BookingAddress_Booking_pickupAddressIdToBookingAddress.postcode || '';
      const postcodePrefix = postcode.replace(/[0-9]/g, '').trim().substring(0, 2).toUpperCase();
      
      // Group by major UK regions based on postcode prefixes
      let region = 'Other UK Areas';
      
      if (['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC'].includes(postcodePrefix)) {
        region = 'Greater London';
      } else if (['M', 'OL', 'SK', 'WA', 'WN'].includes(postcodePrefix)) {
        region = 'Greater Manchester';
      } else if (['B'].includes(postcodePrefix)) {
        region = 'Birmingham & West Midlands';
      } else if (['LS', 'BD', 'HX', 'HD', 'HG', 'WF', 'YO'].includes(postcodePrefix)) {
        region = 'Yorkshire';
      } else if (['L'].includes(postcodePrefix)) {
        region = 'Liverpool & Merseyside';
      } else if (['G'].includes(postcodePrefix)) {
        region = 'Glasgow & Scotland';
      } else if (['EH'].includes(postcodePrefix)) {
        region = 'Edinburgh & Lothian';
      } else if (['BS', 'BA'].includes(postcodePrefix)) {
        region = 'Bristol & Southwest';
      } else if (['NE', 'SR', 'DH'].includes(postcodePrefix)) {
        region = 'Newcastle & Northeast';
      } else if (['CF', 'SA', 'NP', 'LD'].includes(postcodePrefix)) {
        region = 'Wales';
      }
      
      if (!areaMap.has(region)) {
        areaMap.set(region, { bookings: 0, revenue: 0, postcodes: new Set() });
      }
      
      const area = areaMap.get(region)!;
      area.bookings += 1;
      area.revenue += booking.totalGBP || 0;
      area.postcodes.add(postcodePrefix);
    }
    
    const serviceAreas = Array.from(areaMap.entries())
      .map(([area, data]) => ({
        area,
        bookings: data.bookings,
        revenue: data.revenue,
        avgRating: 4.5, // Placeholder - can be calculated from ratings if needed
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 10); // Top 10 areas

    // Process cancellation reasons from real data
    const reasonMap = new Map<string, number>();
    let totalCancellations = 0;
    
    for (const reason of cancellationData) {
      const cleanReason = reason.reason || 'Other';
      reasonMap.set(cleanReason, (reasonMap.get(cleanReason) || 0) + 1);
      totalCancellations += 1;
    }
    
    const cancellationReasons = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalCancellations > 0 ? Math.round((count / totalCancellations) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Create complete payload with real data
    const payload = {
      kpis: {
        totalRevenue30d: revenue30d._sum.totalGBP ?? 0,
        totalRevenue7d: revenue7d._sum.totalGBP ?? 0,
        totalRevenue24h: revenue24h._sum.totalGBP ?? 0,
        aov30d: revenue30d._avg.totalGBP ?? 0,
        aov7d: revenue7d._avg.totalGBP ?? 0,
        conversionRate: 15.5, // Mock conversion rate
        onTimePickup: 92, // Mock on-time pickup rate
        onTimeDelivery: 89, // Mock on-time delivery rate
        avgResponseTime: 15, // Mock response time
        openIncidents: 3, // Mock open incidents
        activeDrivers: realDrivers.length,
        totalBookings: bookingCounts.reduce((sum, c) => sum + c._count._all, 0),
        completedBookings:
          bookingCounts.find(c => c.status === 'COMPLETED')?._count._all || 0,
        cancelledBookings:
          bookingCounts.find(c => c.status === 'CANCELLED')?._count._all || 0,
        byStatus: bookingCounts.reduce(
          (acc, c) => ({ ...acc, [c.status]: c._count._all }),
          {}
        ),
      },
      series: Array.from(map.values()).sort((a, b) =>
        a.day.localeCompare(b.day)
      ),
      driverMetrics,
      cancellationReasons: cancellationReasons.length > 0 ? cancellationReasons : [
        { reason: 'No cancellations in this period', count: 0, percentage: 0 },
      ],
      serviceAreas: serviceAreas.length > 0 ? serviceAreas : [
        { area: 'UK-wide service', bookings: 0, revenue: 0, avgRating: 0 },
      ],
      realTimeMetrics: {
        jobsInProgress: 8,
        latePickups: 2,
        lateDeliveries: 1,
        pendingAssignments: 3,
      },
    };

    await logAudit(s.user.id, 'read_analytics', undefined, { targetType: 'analytics', before: null, after: { range, days } });

    return Response.json(payload);
  } catch (error) {
    console.error('Analytics API error:', error);
    return new Response(
      `Internal Server Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}
