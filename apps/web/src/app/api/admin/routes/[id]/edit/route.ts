/**
 * PUT /api/admin/routes/[id]/edit
 * 
 * Edit an existing route (add/remove bookings, reorder stops)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { intelligentRouteOptimizer } from '@/lib/services/intelligent-route-optimizer';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routeId = params.id;
    const body = await request.json();
    const { bookingIds, action } = body; // action: 'add', 'remove', 'reorder'

    // Get existing route
    const existingRoute = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        Booking: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
          },
        },
      },
    });

    if (!existingRoute) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      );
    }

    if (existingRoute.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Cannot edit completed route' },
        { status: 400 }
      );
    }

    let updatedBookingIds: string[];

    switch (action) {
      case 'add':
        // Add new bookings to route
        updatedBookingIds = [
          ...existingRoute.Booking.map(b => b.id),
          ...bookingIds.filter((id: string) => !existingRoute.Booking.find(b => b.id === id)),
        ];
        break;

      case 'remove':
        // Remove bookings from route
        updatedBookingIds = existingRoute.Booking
          .map(b => b.id)
          .filter(id => !bookingIds.includes(id));
        break;

      case 'reorder':
        // Reorder bookings
        updatedBookingIds = bookingIds;
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Must be add, remove, or reorder' },
          { status: 400 }
        );
    }

    if (updatedBookingIds.length === 0) {
      // Delete route if no bookings left
      await prisma.booking.updateMany({
        where: { routeId },
        data: { routeId: null, deliverySequence: null, orderType: 'single' },
      });

      await prisma.route.delete({
        where: { id: routeId },
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Route deleted (no bookings remaining)',
          routeId,
        },
      });
    }

    // Get all bookings
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: updatedBookingIds },
      },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
      },
    });

    // Re-analyze route
    const routeAnalysis = await intelligentRouteOptimizer.analyzeRoute({
      bookings: bookings.map(b => ({
        bookingId: b.id,
        pickupLat: b.pickupAddress.lat || 0,
        pickupLng: b.pickupAddress.lng || 0,
        dropoffLat: b.dropoffAddress.lat || 0,
        dropoffLng: b.dropoffAddress.lng || 0,
        scheduledAt: b.scheduledAt,
        loadPercentage: b.estimatedLoadPercentage || 0,
        priority: b.priority || 5,
        value: b.totalGBP / 100,
      })),
    });

    // Update route
    await prisma.route.update({
      where: { id: routeId },
      data: {
        totalDistanceMiles: routeAnalysis.totalDistance,
        totalDurationMinutes: routeAnalysis.totalDuration,
        totalOutcome: routeAnalysis.totalValue,
        optimizationScore: routeAnalysis.optimizationScore,
        updatedAt: new Date(),
      },
    });

    // Update bookings
    // First, remove old bookings from route
    await prisma.booking.updateMany({
      where: { routeId },
      data: { routeId: null, deliverySequence: null },
    });

    // Then, add updated bookings
    for (let i = 0; i < updatedBookingIds.length; i++) {
      await prisma.booking.update({
        where: { id: updatedBookingIds[i] },
        data: {
          routeId,
          deliverySequence: i + 1,
          orderType: updatedBookingIds.length > 1 ? 'multi-drop' : 'single',
        },
      });
    }

    // Get updated route
    const updatedRoute = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        Booking: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
            BookingItem: true,
          },
          orderBy: {
            deliverySequence: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        route: updatedRoute,
        analysis: routeAnalysis,
      },
    });
  } catch (error) {
    console.error('Error editing route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to edit route' },
      { status: 500 }
    );
  }
}

