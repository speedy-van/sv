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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routeId } = await params;
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
    const routeAnalysis = await intelligentRouteOptimizer.analyzeMultiDropEligibility({
      pickup: { coordinates: { lat: bookings[0]?.pickupAddress.lat || 0, lng: bookings[0]?.pickupAddress.lng || 0 } },
      dropoff: { coordinates: { lat: bookings.at(-1)?.dropoffAddress.lat || 0, lng: bookings.at(-1)?.dropoffAddress.lng || 0 } },
      items: [],
      floorLevel: 0,
      hasLift: false,
    } as any);

    // Update route
    await prisma.route.update({
      where: { id: routeId },
      data: {
        optimizedDistanceKm: (routeAnalysis as any).route.distance * 1.609,
        estimatedDuration: Math.round((routeAnalysis as any).route.totalTime),
        totalOutcome: bookings.reduce((sum, b) => {
          const value = Number(b.totalGBP || 0);
          return (Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER) ? sum + value : sum;
        }, 0),
        updatedAt: new Date(),
      },
    });

    // Update bookings in transaction
    await prisma.$transaction(async (tx) => {
      // First, remove old bookings from route
      await tx.booking.updateMany({
        where: { routeId },
        data: { routeId: null, deliverySequence: null },
      });

      // Then, add updated bookings in parallel
      const updatePromises = updatedBookingIds.map((bookingId, i) =>
        tx.booking.update({
          where: { id: bookingId },
          data: {
            routeId,
            deliverySequence: i + 1,
            orderType: updatedBookingIds.length > 1 ? 'multi-drop' : 'single',
          },
        })
      );
      await Promise.all(updatePromises);

      // Update drops
      await tx.drop.deleteMany({
        where: { routeId },
      });

      const dropsData = bookings.map((booking) => {
        const scheduledAt = booking.scheduledAt ?? new Date();
        return {
          id: `drop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          routeId,
          bookingId: booking.id,
          customerId: booking.customerId || '',
          pickupAddress: booking.pickupAddress
            ? `${booking.pickupAddress.label}${booking.pickupAddress.postcode ? `, ${booking.pickupAddress.postcode}` : ''}`
            : 'Unknown pickup',
          deliveryAddress: booking.dropoffAddress
            ? `${booking.dropoffAddress.label}${booking.dropoffAddress.postcode ? `, ${booking.dropoffAddress.postcode}` : ''}`
            : 'Unknown dropoff',
          timeWindowStart: scheduledAt,
          timeWindowEnd: new Date(scheduledAt.getTime() + 4 * 60 * 60 * 1000),
          quotedPrice: Number(booking.totalGBP || 0),
          status: 'booked' as const,
        };
      });

      await tx.drop.createMany({ data: dropsData });
    });

    console.log(`✅ [Edit Route] Updated route ${existingRoute.reference} with ${action} action`);

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

