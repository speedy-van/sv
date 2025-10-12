/**
 * GET /api/admin/analytics/performance
 * 
 * Get performance analytics for routes and multi-drop optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7'; // days
    const days = parseInt(period);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all bookings in period
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      include: {
        route: true,
      },
    });

    // Separate single vs multi-drop
    const singleOrders = bookings.filter(b => b.orderType === 'single');
    const multiDropOrders = bookings.filter(b => b.orderType === 'multi-drop');

    // Calculate statistics
    const totalOrders = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalGBP, 0) / 100;

    const singleOrderRevenue = singleOrders.reduce((sum, b) => sum + b.totalGBP, 0) / 100;
    const multiDropRevenue = multiDropOrders.reduce((sum, b) => sum + b.totalGBP, 0) / 100;

    const totalSavings = multiDropOrders
      .filter(b => b.potentialSavings)
      .reduce((sum, b) => sum + (b.potentialSavings || 0), 0);

    // Get routes statistics
    const routes = await prisma.route.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        Booking: true,
      },
    });

    const totalRoutes = routes.length;
    const multiDropRoutes = routes.filter(r => r.Booking.length > 1);
    const singleRoutes = routes.filter(r => r.Booking.length === 1);

    const averageStopsPerRoute = routes.length > 0
      ? routes.reduce((sum, r) => sum + r.Booking.length, 0) / routes.length
      : 0;

    const averageOptimizationScore = routes.length > 0
      ? routes.reduce((sum, r) => sum + (r.optimizationScore || 0), 0) / routes.length
      : 0;

    // Calculate efficiency metrics
    const totalDistance = routes.reduce((sum, r) => sum + r.totalDistanceMiles, 0);
    const totalDuration = routes.reduce((sum, r) => sum + r.totalDurationMinutes, 0);

    // Calculate CO2 savings (rough estimate: 0.4 kg CO2 per mile saved)
    const estimatedMilesSaved = multiDropOrders.length * 15; // Assume 15 miles saved per multi-drop order
    const co2Saved = estimatedMilesSaved * 0.4; // kg

    // Daily breakdown
    const dailyStats = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayBookings = bookings.filter(b => 
        b.createdAt >= date && b.createdAt < nextDay
      );

      const dayRoutes = routes.filter(r => 
        r.createdAt >= date && r.createdAt < nextDay
      );

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        orders: dayBookings.length,
        routes: dayRoutes.length,
        multiDropOrders: dayBookings.filter(b => b.orderType === 'multi-drop').length,
        revenue: dayBookings.reduce((sum, b) => sum + b.totalGBP, 0) / 100,
        averageStops: dayRoutes.length > 0
          ? dayRoutes.reduce((sum, r) => sum + r.Booking.length, 0) / dayRoutes.length
          : 0,
      });
    }

    // Multi-drop adoption rate
    const multiDropAdoptionRate = totalOrders > 0
      ? (multiDropOrders.length / totalOrders) * 100
      : 0;

    // Eligibility vs actual usage
    const eligibleForMultiDrop = bookings.filter(b => b.eligibleForMultiDrop).length;
    const actualMultiDrop = multiDropOrders.length;
    const conversionRate = eligibleForMultiDrop > 0
      ? (actualMultiDrop / eligibleForMultiDrop) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          period: `${days} days`,
          totalOrders,
          totalRoutes,
          totalRevenue,
          totalSavings,
          co2Saved,
        },
        orders: {
          total: totalOrders,
          single: singleOrders.length,
          multiDrop: multiDropOrders.length,
          multiDropPercentage: multiDropAdoptionRate,
        },
        routes: {
          total: totalRoutes,
          singleRoutes: singleRoutes.length,
          multiDropRoutes: multiDropRoutes.length,
          averageStopsPerRoute,
          averageOptimizationScore,
        },
        revenue: {
          total: totalRevenue,
          fromSingleOrders: singleOrderRevenue,
          fromMultiDrop: multiDropRevenue,
          multiDropPercentage: totalRevenue > 0
            ? (multiDropRevenue / totalRevenue) * 100
            : 0,
        },
        efficiency: {
          totalDistance,
          totalDuration,
          averageDistancePerRoute: totalRoutes > 0 ? totalDistance / totalRoutes : 0,
          averageDurationPerRoute: totalRoutes > 0 ? totalDuration / totalRoutes : 0,
          estimatedMilesSaved,
          co2Saved,
        },
        multiDropPerformance: {
          eligibleOrders: eligibleForMultiDrop,
          actualMultiDropOrders: actualMultiDrop,
          conversionRate,
          averageSavingsPerOrder: multiDropOrders.length > 0
            ? totalSavings / multiDropOrders.length
            : 0,
        },
        dailyStats: dailyStats.reverse(), // Oldest to newest
      },
    });
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance analytics' },
      { status: 500 }
    );
  }
}

