/**
 * GET /api/admin/orders/pending
 * 
 * Get all pending orders (confirmed but not assigned to routes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'scheduledAt';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const filterEligible = searchParams.get('eligible'); // 'true', 'false', or null (all)
    const filterRegion = searchParams.get('region'); // Postcode prefix (e.g., "M1")
    const filterDate = searchParams.get('date'); // ISO date string

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: 'CONFIRMED',
      routeId: null,
    };

    if (filterEligible !== null) {
      where.eligibleForMultiDrop = filterEligible === 'true';
    }

    if (filterDate) {
      const date = new Date(filterDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.scheduledAt = {
        gte: date,
        lt: nextDay,
      };
    }

    // Get pending bookings
    const bookings = await prisma.booking.findMany({
      where,
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
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Filter by region if specified
    let filteredBookings = bookings;
    if (filterRegion) {
      filteredBookings = bookings.filter(b => 
        b.pickupAddress.postcode.startsWith(filterRegion)
      );
    }

    // Get total count
    const total = await prisma.booking.count({ where });

    // Group by region and time window
    const groupedByRegion = new Map<string, any[]>();
    const groupedByTimeWindow = new Map<string, any[]>();

    for (const booking of filteredBookings) {
      const region = booking.pickupAddress.postcode.split(' ')[0];
      const hour = booking.scheduledAt.getHours();
      const timeWindow = 
        hour < 10 ? 'morning' :
        hour < 14 ? 'midday' :
        hour < 18 ? 'afternoon' : 'evening';

      if (!groupedByRegion.has(region)) {
        groupedByRegion.set(region, []);
      }
      groupedByRegion.get(region)!.push(booking);

      if (!groupedByTimeWindow.has(timeWindow)) {
        groupedByTimeWindow.set(timeWindow, []);
      }
      groupedByTimeWindow.get(timeWindow)!.push(booking);
    }

    // Calculate statistics
    const stats = {
      total,
      eligible: filteredBookings.filter(b => b.eligibleForMultiDrop).length,
      ineligible: filteredBookings.filter(b => !b.eligibleForMultiDrop).length,
      byRegion: Array.from(groupedByRegion.entries()).map(([region, bookings]) => ({
        region,
        count: bookings.length,
        eligible: bookings.filter(b => b.eligibleForMultiDrop).length,
      })),
      byTimeWindow: Array.from(groupedByTimeWindow.entries()).map(([window, bookings]) => ({
        window,
        count: bookings.length,
        eligible: bookings.filter(b => b.eligibleForMultiDrop).length,
      })),
      potentialSavings: filteredBookings
        .filter(b => b.potentialSavings)
        .reduce((sum, b) => sum + (b.potentialSavings || 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        bookings: filteredBookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending orders' },
      { status: 500 }
    );
  }
}

