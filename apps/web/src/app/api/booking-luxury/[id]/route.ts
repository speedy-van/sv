import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/booking-luxury/[id] - Get booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: bookingId } = await params;

    // Find the booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        pickupProperty: true,
        dropoffProperty: true,
        BookingItem: true,
        customer: true,
        driver: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check authorization - user can only access their own bookings unless admin
    if (session?.user?.role !== 'admin' && booking.customerId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        customer: {
          name: booking.customerName,
          email: booking.customerEmail,
          phone: booking.customerPhone,
        },
        addresses: {
          pickup: booking.pickupAddress,
          dropoff: booking.dropoffAddress,
        },
        properties: {
          pickup: booking.pickupProperty ? {
            ...booking.pickupProperty,
            hasElevator: booking.pickupProperty.accessType === 'WITH_LIFT',
            buildingTypeDisplay: booking.pickupProperty.propertyType?.toLowerCase().replace('_', ' ') || 'house'
          } : null,
          dropoff: booking.dropoffProperty ? {
            ...booking.dropoffProperty,
            hasElevator: booking.dropoffProperty.accessType === 'WITH_LIFT',
            buildingTypeDisplay: booking.dropoffProperty.propertyType?.toLowerCase().replace('_', ' ') || 'house'
          } : null,
        },
        items: booking.BookingItem,
        scheduledAt: booking.scheduledAt,
        pickupTimeSlot: booking.pickupTimeSlot,
        urgency: booking.urgency,
        estimatedDurationMinutes: booking.estimatedDurationMinutes,
        totalGBP: booking.totalGBP,
        driver: booking.driver ? {
          id: booking.driver.id,
          name: booking.driver.User?.name,
          phone: booking.driver.User?.email,
        } : null,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PUT /api/booking-luxury/[id] - Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: bookingId } = await params;
    const updates = await request.json();

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (session?.user?.role !== 'admin' && booking.customerId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Only allow certain fields to be updated
    const allowedUpdates: any = {};
    
    if (updates.scheduledAt) {
      allowedUpdates.scheduledAt = new Date(updates.scheduledAt);
    }
    
    if (updates.pickupTimeSlot) {
      allowedUpdates.pickupTimeSlot = updates.pickupTimeSlot;
    }
    
    if (updates.urgency) {
      allowedUpdates.urgency = updates.urgency;
    }
    
    if (updates.customerName) {
      allowedUpdates.customerName = updates.customerName;
    }
    
    if (updates.customerPhone) {
      allowedUpdates.customerPhone = updates.customerPhone;
    }

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...allowedUpdates,
        updatedAt: new Date(),
      },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        pickupProperty: true,
        dropoffProperty: true,
        BookingItem: true,
      },
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('❌ Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/booking-luxury/[id] - Cancel booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: bookingId } = await params;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (session?.user?.role !== 'admin' && booking.customerId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update booking status to cancelled instead of deleting
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: cancelledBooking.id,
        reference: cancelledBooking.reference,
        status: cancelledBooking.status,
      },
    });
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
