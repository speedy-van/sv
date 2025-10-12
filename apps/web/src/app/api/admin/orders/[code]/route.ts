import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { code } = params;

    // Fetch order with all related data
    const order = await prisma.booking.findUnique({
      where: { reference: code },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Driver: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
        BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
        BookingItem: {
          select: {
            id: true,
            name: true,
            quantity: true,
            volumeM3: true,
            // Add image field when available in schema
          },
        },
        Assignment: {
          include: {
            Driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            JobEvent: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
          },
        },
        TrackingPing: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Log audit trail
    await logAudit((session.user as any).id, 'read_order_details', order.id, { targetType: 'booking', before: null, after: { reference: order.reference } });

    // Transform the response to match the frontend interface
    const transformedOrder = {
      id: order.id,
      reference: order.reference,
      status: order.status,
      scheduledAt: order.scheduledAt.toISOString(),
      totalGBP: order.totalGBP,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      BookingAddress_Booking_pickupAddressIdToBookingAddress: order.BookingAddress_Booking_pickupAddressIdToBookingAddress ? {
        label: order.BookingAddress_Booking_pickupAddressIdToBookingAddress.label,
        postcode: order.BookingAddress_Booking_pickupAddressIdToBookingAddress.postcode,
        // Add flatNumber when available in schema
      } : null,
      BookingAddress_Booking_dropoffAddressIdToBookingAddress: order.BookingAddress_Booking_dropoffAddressIdToBookingAddress ? {
        label: order.BookingAddress_Booking_dropoffAddressIdToBookingAddress.label,
        postcode: order.BookingAddress_Booking_dropoffAddressIdToBookingAddress.postcode,
        // Add flatNumber when available in schema
      } : null,
      pickupProperty: null,
      dropoffProperty: null,
      driver: order.Driver ? {
        user: {
          name: order.Driver.User.name,
          email: order.Driver.User.email,
        },
      } : null,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString(),
      durationSeconds: order.estimatedDurationMinutes ? order.estimatedDurationMinutes * 60 : null,
      distanceMeters: null, // Will be calculated from baseDistanceMiles if available
      baseDistanceMiles: order.baseDistanceMiles,
      notes: null, // Add when customer notes field is available
      pickupTimeSlot: order.pickupTimeSlot,
      BookingItem: order.BookingItem?.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        volumeM3: item.volumeM3,
        // Add image when available
      })) || [],
    };

    console.log('✅ Order details fetched:', {
      reference: order.reference,
      status: order.status,
      itemsCount: order.BookingItem?.length || 0,
    });

    return NextResponse.json(transformedOrder);

  } catch (error) {
    console.error('❌ Error fetching order details:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch order details',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { code } = params;
    const updateData = await request.json();

    // Update the booking
    const updatedOrder = await prisma.booking.update({
      where: { reference: code },
      data: {
        ...(updateData.customerName && { customerName: updateData.customerName }),
        ...(updateData.customerEmail && { customerEmail: updateData.customerEmail }),
        ...(updateData.customerPhone && { customerPhone: updateData.customerPhone }),
        ...(updateData.scheduledAt && { scheduledAt: new Date(updateData.scheduledAt) }),
        ...(updateData.pickupTimeSlot && { pickupTimeSlot: updateData.pickupTimeSlot }),
        ...(updateData.notes !== undefined && { 
          // Handle notes update when available in schema
        }),
        // Update property details if provided
        ...(updateData.pickupProperty && {
          pickupProperty: {
            update: {
              floors: updateData.pickupProperty.floors,
              accessType: updateData.pickupProperty.accessType,
            }
          }
        }),
        ...(updateData.dropoffProperty && {
          dropoffProperty: {
            update: {
              floors: updateData.dropoffProperty.floors,
              accessType: updateData.dropoffProperty.accessType,
            }
          }
        }),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Driver: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
        BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
        BookingItem: {
          select: {
            id: true,
            name: true,
            quantity: true,
            volumeM3: true,
          },
        },
      },
    });

    // Log audit trail
    await logAudit((session.user as any).id, 'update_order', updatedOrder.id, { targetType: 'booking', before: null, after: updateData });

    console.log('✅ Order updated:', {
      reference: updatedOrder.reference,
      updatedFields: Object.keys(updateData),
    });

    // Transform response similar to GET
    const transformedOrder = {
      id: updatedOrder.id,
      reference: updatedOrder.reference,
      status: updatedOrder.status,
      scheduledAt: updatedOrder.scheduledAt.toISOString(),
      totalGBP: updatedOrder.totalGBP,
      customerName: updatedOrder.customerName,
      customerEmail: updatedOrder.customerEmail,
      customerPhone: updatedOrder.customerPhone,
      BookingAddress_Booking_pickupAddressIdToBookingAddress: updatedOrder.BookingAddress_Booking_pickupAddressIdToBookingAddress ? {
        label: updatedOrder.BookingAddress_Booking_pickupAddressIdToBookingAddress.label,
        postcode: updatedOrder.BookingAddress_Booking_pickupAddressIdToBookingAddress.postcode,
      } : null,
      BookingAddress_Booking_dropoffAddressIdToBookingAddress: updatedOrder.BookingAddress_Booking_dropoffAddressIdToBookingAddress ? {
        label: updatedOrder.BookingAddress_Booking_dropoffAddressIdToBookingAddress.label,
        postcode: updatedOrder.BookingAddress_Booking_dropoffAddressIdToBookingAddress.postcode,
      } : null,
      pickupProperty: null,
      dropoffProperty: null,
      Driver: updatedOrder.Driver ? {
        User: {
          name: updatedOrder.Driver.User.name,
          email: updatedOrder.Driver.User.email,
        },
      } : null,
      createdAt: updatedOrder.createdAt.toISOString(),
      paidAt: updatedOrder.paidAt?.toISOString(),
      durationSeconds: updatedOrder.estimatedDurationMinutes ? updatedOrder.estimatedDurationMinutes * 60 : null,
      baseDistanceMiles: updatedOrder.baseDistanceMiles,
      notes: null, // Add when available
      pickupTimeSlot: updatedOrder.pickupTimeSlot,
      BookingItem: updatedOrder.BookingItem?.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        volumeM3: item.volumeM3,
      })) || [],
    };

    return NextResponse.json(transformedOrder);

  } catch (error) {
    console.error('❌ Error updating order:', error);
    return NextResponse.json(
      {
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}