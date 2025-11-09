import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const normalizePostcode = (postcode: string) => postcode.trim().toUpperCase();

function buildBookingAddressUpdate(addressData: any) {
  if (!addressData || typeof addressData !== 'object') {
    return null;
  }

  const update: Record<string, unknown> = {};

  if (typeof addressData.label === 'string' && addressData.label.trim().length > 0) {
    update.label = addressData.label.trim();
  }

  if (typeof addressData.postcode === 'string' && addressData.postcode.trim().length > 0) {
    update.postcode = normalizePostcode(addressData.postcode);
  }

  if (typeof addressData.lat === 'number') {
    update.lat = addressData.lat;
  }

  if (typeof addressData.lng === 'number') {
    update.lng = addressData.lng;
  }

  return Object.keys(update).length > 0 ? update : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
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

    const { code } = await params;

    // Fetch order with all related data
    const order = await prisma.booking.findUnique({
      where: { reference: code },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        driver: {
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
        pickupAddress: true,
        dropoffAddress: true,
        pickupProperty: true,
        dropoffProperty: true,
        route: {
          select: {
            id: true,
            reference: true,
            status: true,
            totalDrops: true,
          },
        },
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
      pickupAddress: order.pickupAddress ? {
        label: order.pickupAddress.label,
        postcode: order.pickupAddress.postcode,
        lat: order.pickupAddress.lat,
        lng: order.pickupAddress.lng,
      } : null,
      dropoffAddress: order.dropoffAddress ? {
        label: order.dropoffAddress.label,
        postcode: order.dropoffAddress.postcode,
        lat: order.dropoffAddress.lat,
        lng: order.dropoffAddress.lng,
      } : null,
      pickupProperty: order.pickupProperty ? {
        propertyType: order.pickupProperty.propertyType,
        floors: order.pickupProperty.floors,
        accessType: order.pickupProperty.accessType,
      } : null,
      dropoffProperty: order.dropoffProperty ? {
        propertyType: order.dropoffProperty.propertyType,
        floors: order.dropoffProperty.floors,
        accessType: order.dropoffProperty.accessType,
      } : null,
      serviceType: (order.customerPreferences as any)?.serviceType || (order.customerPreferences as any)?.serviceLevel || 'standard',
      orderType: order.orderType || (order.isMultiDrop ? 'multi-drop' : 'single'),
      isMultiDrop: order.isMultiDrop || false,
      routeId: order.routeId,
      capacityCheck: (order.customerPreferences as any)?.capacityCheck || null, // Extract capacity check
      route: order.route ? {
        id: order.route.id,
        reference: order.route.reference,
        status: order.route.status,
        totalDrops: order.route.totalDrops,
      } : null,
      driver: order.driver ? {
        User: {
          name: order.driver.User.name,
          email: order.driver.User.email,
        },
      } : null,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString(),
      durationSeconds: order.estimatedDurationMinutes ? order.estimatedDurationMinutes * 60 : null,
      distanceMeters: null, // Will be calculated from baseDistanceMiles if available
      baseDistanceMiles: order.baseDistanceMiles,
      notes: null, // Add when customer notes field is available
      pickupTimeSlot: order.pickupTimeSlot,
      items: order.BookingItem?.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        volumeM3: item.volumeM3,
      })) || [],
      BookingItem: order.BookingItem?.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        volumeM3: item.volumeM3,
      })) || [],
      amountPaidGBP: order.amountPaidGBP,
      additionalPaymentStatus: order.additionalPaymentStatus,
      additionalPaymentAmountGBP: order.additionalPaymentAmountGBP,
      additionalPaymentRequestedAt: order.additionalPaymentRequestedAt?.toISOString(),
      additionalPaymentPaidAt: order.additionalPaymentPaidAt?.toISOString(),
      additionalPaymentStripeIntent: order.additionalPaymentStripeIntent,
      lastPaymentDate: order.lastPaymentDate?.toISOString(),
      lastRefundDate: order.lastRefundDate?.toISOString(),
    };

    console.log('✅ Order details fetched:', {
      reference: order.reference,
      status: order.status,
      itemsCount: order.BookingItem?.length || 0,
      hasItems: (order.BookingItem?.length || 0) > 0,
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
  { params }: { params: Promise<{ code: string }> }
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

    const { code } = await params;
    const updateData = await request.json();

    // Get existing order for comparison and audit
    const existingOrder = await prisma.booking.findUnique({
      where: { reference: code },
      select: {
        id: true,
        totalGBP: true,
        stripePaymentIntentId: true,
        status: true,
        paidAt: true,
        pickupAddress: {
          select: {
            id: true,
            label: true,
            postcode: true,
            lat: true,
            lng: true,
          },
        },
        dropoffAddress: {
          select: {
            id: true,
            label: true,
            postcode: true,
            lat: true,
            lng: true,
          },
        },
        amountPaidGBP: true,
        additionalPaymentStatus: true,
        additionalPaymentAmountGBP: true,
        additionalPaymentStripeIntent: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const nextTotalGBP = typeof updateData.totalGBP === 'number' ? Math.round(updateData.totalGBP) : undefined;
    const priceChanged = typeof nextTotalGBP === 'number' && nextTotalGBP !== existingOrder.totalGBP;
    const priceChangeData = priceChanged
      ? {
          oldPrice: existingOrder.totalGBP,
          newPrice: nextTotalGBP,
          difference: nextTotalGBP - existingOrder.totalGBP,
        }
      : null;

    if (priceChanged && (existingOrder.paidAt || existingOrder.amountPaidGBP > 0)) {
      return NextResponse.json(
        {
          error: 'Paid orders cannot be repriced via direct update. Use the payment adjustment actions for additional charges or refunds.',
          code: 'PAID_ORDER_PRICE_CHANGE_BLOCKED',
        },
        { status: 400 }
      );
    }

    const pickupAddressUpdate = buildBookingAddressUpdate(updateData.pickupAddress);
    const dropoffAddressUpdate = buildBookingAddressUpdate(updateData.dropoffAddress);

    // Update the booking
    const updatedOrder = await prisma.booking.update({
      where: { reference: code },
      data: {
        ...(updateData.customerName && { customerName: updateData.customerName }),
        ...(updateData.customerEmail && { customerEmail: updateData.customerEmail }),
        ...(updateData.customerPhone && { customerPhone: updateData.customerPhone }),
        ...(updateData.scheduledAt && { scheduledAt: new Date(updateData.scheduledAt) }),
        ...(updateData.pickupTimeSlot && { pickupTimeSlot: updateData.pickupTimeSlot }),
        ...(typeof nextTotalGBP === 'number' ? { totalGBP: nextTotalGBP } : {}),
        ...(updateData.notes !== undefined && {
          // Handle notes update when available in schema
        }),
        ...(pickupAddressUpdate
          ? {
              pickupAddress: {
                update: pickupAddressUpdate,
              },
            }
          : {}),
        ...(dropoffAddressUpdate
          ? {
              dropoffAddress: {
                update: dropoffAddressUpdate,
              },
            }
          : {}),
        ...(updateData.pickupProperty && {
          pickupProperty: {
            update: {
              ...(typeof updateData.pickupProperty.floors === 'number'
                ? { floors: updateData.pickupProperty.floors }
                : {}),
              ...(updateData.pickupProperty.accessType
                ? { accessType: updateData.pickupProperty.accessType }
                : {}),
            },
          },
        }),
        ...(updateData.dropoffProperty && {
          dropoffProperty: {
            update: {
              ...(typeof updateData.dropoffProperty.floors === 'number'
                ? { floors: updateData.dropoffProperty.floors }
                : {}),
              ...(updateData.dropoffProperty.accessType
                ? { accessType: updateData.dropoffProperty.accessType }
                : {}),
            },
          },
        }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        driver: {
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
        pickupAddress: true,
        dropoffAddress: true,
        pickupProperty: true,
        dropoffProperty: true,
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

    // CRITICAL: Synchronize with Stripe if price changed
    if (priceChanged && existingOrder.stripePaymentIntentId) {
      try {
        const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2024-04-10',
        }));

        // Check if payment intent is still modifiable
        const paymentIntent = await stripe.paymentIntents.retrieve(existingOrder.stripePaymentIntentId);
        
        if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'requires_confirmation') {
          // Update the payment intent amount
          await stripe.paymentIntents.update(existingOrder.stripePaymentIntentId, {
            amount: nextTotalGBP!, // totalGBP is in pence
            metadata: {
              ...paymentIntent.metadata,
              priceUpdatedBy: 'admin',
              priceUpdatedAt: new Date().toISOString(),
              oldAmount: existingOrder.totalGBP.toString(),
              newAmount: nextTotalGBP!.toString(),
            },
          });

          // Log successful Stripe sync
          await logAudit(
            (session.user as any).id,
            'stripe_payment_updated',
            updatedOrder.id,
            {
              targetType: 'booking',
              before: { totalGBP: existingOrder.totalGBP },
              after: { totalGBP: nextTotalGBP, stripePaymentIntentId: existingOrder.stripePaymentIntentId },
            }
          );
        } else {
          // Payment intent cannot be modified (already paid or processing)
          // Log a warning for manual review
          await logAudit(
            (session.user as any).id, 
            'price_change_after_payment', 
            updatedOrder.id, 
            { 
              targetType: 'booking', 
              before: { totalGBP: existingOrder.totalGBP }, 
              after: { totalGBP: nextTotalGBP },
              warning: `Payment intent ${paymentIntent.status} - requires manual Stripe adjustment (refund/credit)`,
              paymentIntentStatus: paymentIntent.status,
            }
          );
        }
      } catch (stripeError) {
        // Log Stripe sync failure
        await logAudit(
          (session.user as any).id, 
          'stripe_sync_failed', 
          updatedOrder.id, 
          { 
            targetType: 'booking', 
            error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
            priceChange: priceChangeData,
          }
        );
      }
    }

    const auditAfterData = {
      ...updateData,
      ...(typeof nextTotalGBP === 'number' ? { totalGBP: nextTotalGBP } : {}),
    };

    // Log audit trail for order update
    await logAudit(
      (session.user as any).id, 
      'update_order', 
      updatedOrder.id, 
      { 
        targetType: 'booking', 
        before: existingOrder, 
        after: auditAfterData,
        priceChanged: priceChanged ? priceChangeData : null,
      }
    );

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
      pickupAddress: updatedOrder.pickupAddress ? {
        label: updatedOrder.pickupAddress.label,
        postcode: updatedOrder.pickupAddress.postcode,
      } : null,
      dropoffAddress: updatedOrder.dropoffAddress ? {
        label: updatedOrder.dropoffAddress.label,
        postcode: updatedOrder.dropoffAddress.postcode,
      } : null,
      pickupProperty: updatedOrder.pickupProperty ? {
        floors: updatedOrder.pickupProperty.floors,
        accessType: updatedOrder.pickupProperty.accessType,
      } : null,
      dropoffProperty: updatedOrder.dropoffProperty ? {
        floors: updatedOrder.dropoffProperty.floors,
        accessType: updatedOrder.dropoffProperty.accessType,
      } : null,
      driver: updatedOrder.driver ? {
        User: {
          name: updatedOrder.driver.User.name,
          email: updatedOrder.driver.User.email,
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
      amountPaidGBP: updatedOrder.amountPaidGBP,
      additionalPaymentStatus: updatedOrder.additionalPaymentStatus,
      additionalPaymentAmountGBP: updatedOrder.additionalPaymentAmountGBP,
      additionalPaymentRequestedAt: updatedOrder.additionalPaymentRequestedAt?.toISOString(),
      additionalPaymentPaidAt: updatedOrder.additionalPaymentPaidAt?.toISOString(),
      additionalPaymentStripeIntent: updatedOrder.additionalPaymentStripeIntent,
      lastPaymentDate: updatedOrder.lastPaymentDate?.toISOString(),
      lastRefundDate: updatedOrder.lastRefundDate?.toISOString(),
    };

    // Add warnings for price changes requiring manual action
    const response: any = { ...transformedOrder };
    if (priceChanged && existingOrder.paidAt) {
      response.warning = {
        type: 'PRICE_CHANGE_AFTER_PAYMENT',
        message: 'Price changed after payment. Manual Stripe adjustment (refund/credit) may be required.',
        oldPrice: existingOrder.totalGBP,
        newPrice: nextTotalGBP ?? existingOrder.totalGBP,
        difference: priceChangeData?.difference,
      };
    }
    if (priceChangeData) {
      response.priceChange = priceChangeData;
    }

    return NextResponse.json(response);

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