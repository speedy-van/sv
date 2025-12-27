import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const normalizePostcode = (postcode: string) => postcode.trim().toUpperCase();

// UK postcode validation regex
const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}|GIR\s?0AA)$/i;

function buildBookingAddressUpdate(addressData: any) {
  if (!addressData || typeof addressData !== 'object') {
    return null;
  }

  const update: Record<string, unknown> = {};

  // Validate and update label
  if (typeof addressData.label === 'string' && addressData.label.trim().length > 0) {
    update.label = addressData.label.trim();
  }

  // Validate and update postcode (UK format)
  if (typeof addressData.postcode === 'string' && addressData.postcode.trim().length > 0) {
    const postcode = normalizePostcode(addressData.postcode);
    if (UK_POSTCODE_REGEX.test(postcode)) {
      update.postcode = postcode;
    } else {
      throw new Error(`Invalid UK postcode format: ${addressData.postcode}. Expected format: SW1A 1AA, M1 1AE, GIR 0AA`);
    }
  }

  // Validate and update lat (must be between -90 and 90)
  if (typeof addressData.lat === 'number') {
    if (addressData.lat >= -90 && addressData.lat <= 90) {
      update.lat = addressData.lat;
    } else {
      throw new Error(`Invalid latitude: ${addressData.lat}. Must be between -90 and 90.`);
    }
  }

  // Validate and update lng (must be between -180 and 180)
  if (typeof addressData.lng === 'number') {
    if (addressData.lng >= -180 && addressData.lng <= 180) {
      update.lng = addressData.lng;
    } else {
      throw new Error(`Invalid longitude: ${addressData.lng}. Must be between -180 and 180.`);
    }
  }

  return Object.keys(update).length > 0 ? update : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

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
        BookingSegment: {
          orderBy: {
            sequenceNumber: 'asc',
          },
          include: {
            pickupAddress: true,
            dropoffAddress: true,
            pickupProperty: true,
            dropoffProperty: true,
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
    await logAudit(user.id, 'read_order_details', order.id, { targetType: 'booking', before: null, after: { reference: order.reference } });

    // Extract flatNumber from customerPreferences
    const customerPreferences = order.customerPreferences as any;
    const pickupFlatNumber = customerPreferences?.pickupAddressMeta?.flatNumber || null;
    const dropoffFlatNumber = customerPreferences?.dropoffAddressMeta?.flatNumber || null;

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
        flatNumber: pickupFlatNumber,
      } : null,
      dropoffAddress: order.dropoffAddress ? {
        label: order.dropoffAddress.label,
        postcode: order.dropoffAddress.postcode,
        lat: order.dropoffAddress.lat,
        lng: order.dropoffAddress.lng,
        flatNumber: dropoffFlatNumber,
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
      crewSize: order.crewSize || 'TWO', // Number of helpers (ONE, TWO, THREE, FOUR)
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
      notes: order.notes || null, // Customer special instructions
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
      segments: order.BookingSegment?.map(segment => ({
        id: segment.id,
        segmentType: segment.segmentType,
        sequenceNumber: segment.sequenceNumber,
        scheduledAt: segment.scheduledAt.toISOString(),
        estimatedArrival: segment.estimatedArrival?.toISOString(),
        priceGBP: segment.priceGBP,
        distanceMeters: segment.distanceMeters,
        durationSeconds: segment.durationSeconds,
        notes: segment.notes,
        items: segment.items,
        pickupAddress: segment.pickupAddress ? {
          label: segment.pickupAddress.label,
          postcode: segment.pickupAddress.postcode,
          lat: segment.pickupAddress.lat,
          lng: segment.pickupAddress.lng,
        } : null,
        dropoffAddress: segment.dropoffAddress ? {
          label: segment.dropoffAddress.label,
          postcode: segment.dropoffAddress.postcode,
          lat: segment.dropoffAddress.lat,
          lng: segment.dropoffAddress.lng,
        } : null,
        pickupProperty: segment.pickupProperty ? {
          propertyType: segment.pickupProperty.propertyType,
          floors: segment.pickupProperty.floors,
          accessType: segment.pickupProperty.accessType,
        } : null,
        dropoffProperty: segment.dropoffProperty ? {
          propertyType: segment.dropoffProperty.propertyType,
          floors: segment.dropoffProperty.floors,
          accessType: segment.dropoffProperty.accessType,
        } : null,
      })) || [],
      hasReturnJourney: order.BookingSegment?.some(s => s.segmentType === 'return') || false,
      hasAdditionalJourney: order.BookingSegment?.some(s => s.segmentType === 'additional') || false,
      totalSegments: order.BookingSegment?.length || 0,
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
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

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
        customerPreferences: true,
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

    const existingPaidAmount = existingOrder.amountPaidGBP ?? 0;

    if (priceChanged && (existingOrder.paidAt || existingPaidAmount > 0)) {
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

    // Prepare customerPreferences update for flatNumber
    const existingPreferences = (existingOrder.customerPreferences as any) || {};
    const shouldUpdatePreferences = 
      updateData.pickupAddress?.flatNumber !== undefined ||
      updateData.dropoffAddress?.flatNumber !== undefined;

    const updatedPreferences = shouldUpdatePreferences ? {
      ...existingPreferences,
      pickupAddressMeta: {
        ...(existingPreferences.pickupAddressMeta || {}),
        ...(updateData.pickupAddress?.flatNumber !== undefined
          ? { flatNumber: typeof updateData.pickupAddress.flatNumber === 'string' && updateData.pickupAddress.flatNumber.trim().length > 0
              ? updateData.pickupAddress.flatNumber.trim()
              : undefined
          }
          : {}),
      },
      dropoffAddressMeta: {
        ...(existingPreferences.dropoffAddressMeta || {}),
        ...(updateData.dropoffAddress?.flatNumber !== undefined
          ? { flatNumber: typeof updateData.dropoffAddress.flatNumber === 'string' && updateData.dropoffAddress.flatNumber.trim().length > 0
              ? updateData.dropoffAddress.flatNumber.trim()
              : undefined
          }
          : {}),
      },
    } : undefined;

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
        ...(updatedPreferences && { customerPreferences: updatedPreferences }),
        ...(updateData.notes !== undefined && { notes: updateData.notes || null }),
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
        BookingSegment: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
            pickupProperty: true,
            dropoffProperty: true,
          },
        },
      },
    });

    // Update segments if provided
    if (updateData.segments && Array.isArray(updateData.segments)) {
      for (const segmentUpdate of updateData.segments) {
        if (!segmentUpdate.id) continue; // Skip segments without ID (new segments not supported yet)
        
        const segmentUpdateData: any = {};
        
        // Update scheduledAt if provided
        if (segmentUpdate.scheduledAt) {
          segmentUpdateData.scheduledAt = new Date(segmentUpdate.scheduledAt);
        }
        
        // Update notes if provided
        if (segmentUpdate.notes !== undefined) {
          segmentUpdateData.notes = segmentUpdate.notes || null;
        }
        
        // Update pickup address if provided
        if (segmentUpdate.pickupAddress) {
          const pickupAddrUpdate = buildBookingAddressUpdate(segmentUpdate.pickupAddress);
          if (pickupAddrUpdate) {
            segmentUpdateData.pickupAddress = {
              update: pickupAddrUpdate,
            };
          }
        }
        
        // Update dropoff address if provided
        if (segmentUpdate.dropoffAddress) {
          const dropoffAddrUpdate = buildBookingAddressUpdate(segmentUpdate.dropoffAddress);
          if (dropoffAddrUpdate) {
            segmentUpdateData.dropoffAddress = {
              update: dropoffAddrUpdate,
            };
          }
        }
        
        // Update pickup property if provided
        if (segmentUpdate.pickupProperty) {
          segmentUpdateData.pickupProperty = {
            update: {
              ...(typeof segmentUpdate.pickupProperty.floors === 'number'
                ? { floors: segmentUpdate.pickupProperty.floors }
                : {}),
              ...(segmentUpdate.pickupProperty.accessType
                ? { accessType: segmentUpdate.pickupProperty.accessType }
                : {}),
              ...(segmentUpdate.pickupProperty.propertyType
                ? { propertyType: segmentUpdate.pickupProperty.propertyType }
                : {}),
            },
          };
        }
        
        // Update dropoff property if provided
        if (segmentUpdate.dropoffProperty) {
          segmentUpdateData.dropoffProperty = {
            update: {
              ...(typeof segmentUpdate.dropoffProperty.floors === 'number'
                ? { floors: segmentUpdate.dropoffProperty.floors }
                : {}),
              ...(segmentUpdate.dropoffProperty.accessType
                ? { accessType: segmentUpdate.dropoffProperty.accessType }
                : {}),
              ...(segmentUpdate.dropoffProperty.propertyType
                ? { propertyType: segmentUpdate.dropoffProperty.propertyType }
                : {}),
            },
          };
        }
        
        // Only update if there's something to update
        if (Object.keys(segmentUpdateData).length > 0) {
          await prisma.bookingSegment.update({
            where: { id: segmentUpdate.id },
            data: segmentUpdateData,
          });
        }
      }
      
      // Reload segments after updates
      updatedOrder.BookingSegment = await prisma.bookingSegment.findMany({
        where: { bookingId: updatedOrder.id },
        include: {
          pickupAddress: true,
          dropoffAddress: true,
          pickupProperty: true,
          dropoffProperty: true,
        },
        orderBy: {
          sequenceNumber: 'asc',
        },
      });
    }

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
            user.id,
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
            user.id, 
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
          user.id, 
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
      user.id, 
      'update_order', 
      updatedOrder.id, 
      { 
        targetType: 'booking', 
        before: existingOrder, 
        after: auditAfterData,
        priceChanged: priceChanged ? priceChangeData : null,
      }
    );

    // Extract flatNumber from updated customerPreferences
    const orderPreferences = updatedOrder.customerPreferences as any;
    const pickupFlatNumber = orderPreferences?.pickupAddressMeta?.flatNumber || null;
    const dropoffFlatNumber = orderPreferences?.dropoffAddressMeta?.flatNumber || null;

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
        lat: updatedOrder.pickupAddress.lat,
        lng: updatedOrder.pickupAddress.lng,
        flatNumber: pickupFlatNumber,
      } : null,
      dropoffAddress: updatedOrder.dropoffAddress ? {
        label: updatedOrder.dropoffAddress.label,
        postcode: updatedOrder.dropoffAddress.postcode,
        lat: updatedOrder.dropoffAddress.lat,
        lng: updatedOrder.dropoffAddress.lng,
        flatNumber: dropoffFlatNumber,
      } : null,
      pickupProperty: updatedOrder.pickupProperty ? {
        propertyType: updatedOrder.pickupProperty.propertyType,
        floors: updatedOrder.pickupProperty.floors,
        accessType: updatedOrder.pickupProperty.accessType,
      } : null,
      dropoffProperty: updatedOrder.dropoffProperty ? {
        propertyType: updatedOrder.dropoffProperty.propertyType,
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
      notes: updatedOrder.notes || null,
      pickupTimeSlot: updatedOrder.pickupTimeSlot,
      items: updatedOrder.BookingItem?.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        volumeM3: item.volumeM3,
      })) || [],
      BookingItem: updatedOrder.BookingItem?.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        volumeM3: item.volumeM3,
      })) || [],
      amountPaidGBP: updatedOrder.amountPaidGBP,
      serviceType: (updatedOrder.customerPreferences as any)?.serviceType || (updatedOrder.customerPreferences as any)?.serviceLevel || 'standard',
      crewSize: updatedOrder.crewSize || 'TWO',
      orderType: updatedOrder.orderType || (updatedOrder.isMultiDrop ? 'multi-drop' : 'single'),
      isMultiDrop: updatedOrder.isMultiDrop || false,
      routeId: updatedOrder.routeId,
      segments: updatedOrder.BookingSegment?.map(segment => ({
        id: segment.id,
        segmentType: segment.segmentType,
        sequenceNumber: segment.sequenceNumber,
        scheduledAt: segment.scheduledAt.toISOString(),
        estimatedArrival: segment.estimatedArrival?.toISOString(),
        priceGBP: segment.priceGBP,
        distanceMeters: segment.distanceMeters,
        durationSeconds: segment.durationSeconds,
        notes: segment.notes,
        items: segment.items,
        pickupAddress: segment.pickupAddress ? {
          label: segment.pickupAddress.label,
          postcode: segment.pickupAddress.postcode,
          lat: segment.pickupAddress.lat,
          lng: segment.pickupAddress.lng,
        } : null,
        dropoffAddress: segment.dropoffAddress ? {
          label: segment.dropoffAddress.label,
          postcode: segment.dropoffAddress.postcode,
          lat: segment.dropoffAddress.lat,
          lng: segment.dropoffAddress.lng,
        } : null,
        pickupProperty: segment.pickupProperty ? {
          propertyType: segment.pickupProperty.propertyType,
          floors: segment.pickupProperty.floors,
          accessType: segment.pickupProperty.accessType,
        } : null,
        dropoffProperty: segment.dropoffProperty ? {
          propertyType: segment.dropoffProperty.propertyType,
          floors: segment.dropoffProperty.floors,
          accessType: segment.dropoffProperty.accessType,
        } : null,
      })) || [],
      hasReturnJourney: updatedOrder.BookingSegment?.some(s => s.segmentType === 'return') || false,
      hasAdditionalJourney: updatedOrder.BookingSegment?.some(s => s.segmentType === 'additional') || false,
      totalSegments: updatedOrder.BookingSegment?.length || 0,
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