/**
 * GET /api/admin/routes/suggested
 * 
 * Get AI-suggested optimized routes from pending bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { intelligentRouteOptimizer } from '@/lib/services/intelligent-route-optimizer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // ISO date string
    const region = searchParams.get('region'); // Postcode prefix

    // Get eligible bookings
    const where: any = {
      status: 'CONFIRMED',
      routeId: null,
      eligibleForMultiDrop: true,
    };

    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.scheduledAt = {
        gte: targetDate,
        lt: nextDay,
      };
    } else {
      // Default: next 24 hours
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      where.scheduledAt = {
        gte: now,
        lt: tomorrow,
      };
    }

    const eligibleBookings = await prisma.booking.findMany({
      where,
      include: {
        BookingItem: true,
        pickupAddress: true,
        dropoffAddress: true,
        customer: {
          select: { id: true, name: true, email: true }
        },
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledAt: 'asc' },
      ],
    });

    if (eligibleBookings.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          routes: [],
          message: 'Not enough eligible bookings to create multi-drop routes',
          eligibleCount: eligibleBookings.length,
        },
      });
    }

    // Filter by region if specified
    let filteredBookings = eligibleBookings;
    if (region) {
      filteredBookings = eligibleBookings.filter(b => 
        (b as any).pickupAddress?.postcode?.startsWith(region)
      );
    }

    console.log(`Creating suggested routes for ${filteredBookings.length} eligible bookings`);

    // Use intelligent route optimizer to create optimal routes
    const suggestedRoutes = await intelligentRouteOptimizer.createOptimalRoutes(
      filteredBookings.map(b => ({
        bookingId: b.id,
        pickupLat: (b as any).pickupAddress?.lat || 0,
        pickupLng: (b as any).pickupAddress?.lng || 0,
        dropoffLat: (b as any).dropoffAddress?.lat || 0,
        dropoffLng: (b as any).dropoffAddress?.lng || 0,
        scheduledAt: b.scheduledAt,
        loadPercentage: b.estimatedLoadPercentage || 0,
        priority: b.priority || 5,
        value: b.totalGBP / 100,
      }))
    );

    // Enrich routes with booking details
    const enrichedRoutes = await Promise.all(
      suggestedRoutes.map(async (route) => {
        const routeBookings = await prisma.booking.findMany({
          where: {
            id: { in: route.bookingIds },
          },
          include: {
            BookingItem: true,
            pickupAddress: true,
            dropoffAddress: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return {
          ...route,
          bookings: routeBookings,
          stops: route.bookingIds.length,
          estimatedRevenue: route.totalValue,
          estimatedCost: route.totalValue * 0.65, // 65% goes to driver + costs
          estimatedProfit: route.totalValue * 0.35,
          profitMargin: 35,
        };
      })
    );

    // Calculate overall statistics
    const stats = {
      totalBookings: filteredBookings.length,
      routesCreated: enrichedRoutes.length,
      bookingsAssigned: enrichedRoutes.reduce((sum, r) => sum + r.stops, 0),
      bookingsUnassigned: filteredBookings.length - enrichedRoutes.reduce((sum, r) => sum + r.stops, 0),
      totalDistance: enrichedRoutes.reduce((sum, r) => sum + r.totalDistance, 0),
      totalDuration: enrichedRoutes.reduce((sum, r) => sum + r.totalDuration, 0),
      totalRevenue: enrichedRoutes.reduce((sum, r) => sum + r.estimatedRevenue, 0),
      totalProfit: enrichedRoutes.reduce((sum, r) => sum + r.estimatedProfit, 0),
      averageOptimizationScore: enrichedRoutes.reduce((sum, r) => sum + r.optimizationScore, 0) / enrichedRoutes.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        routes: enrichedRoutes,
        stats,
      },
    });
  } catch (error) {
    console.error('Error creating suggested routes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create suggested routes' },
      { status: 500 }
    );
  }
}

