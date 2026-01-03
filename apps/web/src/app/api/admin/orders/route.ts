import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { deriveServiceMetadata } from '@/lib/bookings/serviceType';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Parse parameters outside try block for error logging
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const status = searchParams.get('status') as any;
  const payment = searchParams.get('payment');
  const driver = searchParams.get('driver');
  const area = searchParams.get('area');
  const dateRange = searchParams.get('dateRange');
  const includeTracking = searchParams.get('includeTracking') === 'true';
  const take = Math.min(parseInt(searchParams.get('take') || '50'), 500); // Limit to max 500
  const cursor = searchParams.get('cursor');

  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof Response) {
      return authResult;
    }
    const sessionUser = authResult;
    const userId = sessionUser.id;
    
    console.log('🔐 /api/admin/orders - Authenticated user:', sessionUser.email || 'Unknown admin');
    console.log('🔍 API Filters received:', {
      q: q || 'none',
      status: status || 'none',
      payment: payment || 'none',
      driver: driver || 'none',
      area: area || 'none',
      dateRange: dateRange || 'none',
      take,
    });
    
    // Log filter building
    console.log('🔧 Building filters...');

  // Build date filter
  let dateFilter = {};
  if (dateRange) {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0, 0, 0, 0 // Start of day
        );
        const todayEnd = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23, 59, 59, 999 // End of day
        );
        dateFilter = {
          scheduledAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        };
        break;
      case 'urgent':
        // Urgent = orders scheduled within 48 hours from now
        const urgentEnd = new Date(now);
        urgentEnd.setHours(urgentEnd.getHours() + 48);
        dateFilter = {
          scheduledAt: {
            gte: now,
            lte: urgentEnd,
          },
        };
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = {
          scheduledAt: {
            gte: weekStart,
          },
        };
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        dateFilter = {
          scheduledAt: {
            gte: monthStart,
          },
        };
        break;
      case 'custom':
        // Custom date range - would need start/end parameters
        // For now, ignore custom filter
        dateFilter = {};
        break;
      default:
        dateFilter = {};
        break;
    }
    console.log('📅 Date filter built:', { dateRange, dateFilter });
  }

  // Map status parameter to valid BookingStatus values
  let statusFilter = {};
  if (status) {
    switch (status.toLowerCase()) {
      case 'open':
        statusFilter = {
          status: {
            in: ['DRAFT', 'PENDING_PAYMENT', 'CONFIRMED'], // Open means active bookings
          },
        };
        break;
      case 'assigned':
        // Assigned = CONFIRMED with a driver
        statusFilter = {
          status: 'CONFIRMED',
          driverId: { not: null }, // Must have a driver assigned
        };
        break;
      case 'in_progress':
        // In Progress = CONFIRMED with a driver AND has active assignment with job events
        // This means the driver has started working on the order
        statusFilter = {
          status: 'CONFIRMED',
          driverId: { not: null },
          Assignment: {
            some: {
              status: 'accepted',
              JobEvent: {
                some: {} // Has at least one job event (driver has started)
              }
            }
          }
        };
        break;
      case 'unassigned':
        // Unassigned = CONFIRMED without a driver
        statusFilter = {
          status: 'CONFIRMED',
          driverId: null,
        };
        break;
      case 'completed':
        statusFilter = { status: 'COMPLETED' };
        break;
      case 'cancelled':
        statusFilter = { status: 'CANCELLED' };
        break;
      case 'active':
        statusFilter = {
          status: {
            in: ['CONFIRMED'], // Active means confirmed bookings
          },
        };
        break;
      case 'pending':
        statusFilter = {
          status: {
            in: ['DRAFT', 'PENDING_PAYMENT'],
          },
        };
        break;
      default:
        // Invalid status, ignore filter
        statusFilter = {};
        break;
    }
  }

  // Build payment filter
  let paymentFilter = {};
  if (payment) {
    switch (payment.toLowerCase()) {
      case 'unpaid':
        paymentFilter = { paidAt: null };
        break;
      case 'paid':
        paymentFilter = { paidAt: { not: null } };
        break;
      case 'requires_action':
        // Orders that require payment action (unpaid but confirmed or pending payment)
        paymentFilter = {
          paidAt: null,
          status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
        };
        break;
      case 'refunded':
        // Refunded orders have lastRefundDate set
        paymentFilter = { lastRefundDate: { not: null } };
        break;
      default:
        paymentFilter = {};
        break;
    }
    console.log('💳 Payment filter built:', { payment, paymentFilter });
  }

  // Build final where clause
  const whereClause: any = {
    ...statusFilter,
    ...paymentFilter,
    ...(driver
      ? {
          Driver: {
            User: {
              name: { contains: driver, mode: 'insensitive' },
            },
          },
        }
      : {}),
    ...(area
      ? {
          OR: [
            {
              BookingAddress_Booking_pickupAddressIdToBookingAddress: {
                label: { contains: area, mode: 'insensitive' as any },
              },
            },
            {
              BookingAddress_Booking_dropoffAddressIdToBookingAddress: {
                label: { contains: area, mode: 'insensitive' as any },
              },
            },
          ],
        }
      : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: 'insensitive' as any } },
            {
              BookingAddress_Booking_pickupAddressIdToBookingAddress: { label: { contains: q, mode: 'insensitive' as any } },
            },
            {
              BookingAddress_Booking_dropoffAddressIdToBookingAddress: { label: { contains: q, mode: 'insensitive' as any } },
            },
            { customerName: { contains: q, mode: 'insensitive' as any } },
            { customerEmail: { contains: q, mode: 'insensitive' as any } },
          ],
        }
      : {}),
    ...dateFilter,
  };

  console.log('📋 Final where clause:', JSON.stringify(whereClause, null, 2));

  const orders = await prisma.booking.findMany({
    where: whereClause,
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
          ...(includeTracking && {
            JobEvent: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
          }),
        },
      },
      ...(includeTracking && {
        TrackingPing: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      }),
      BookingItem: true, // Include booking items to show in order details
    },
    orderBy: [
      { scheduledAt: 'desc' }, // Most urgent first
      { createdAt: 'desc' }, // Then by creation date
    ],
    take: take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  // ✅ CRITICAL FIX: Check Stripe payment status for orders without paidAt but with stripePaymentIntentId
  // This handles cases where webhook didn't fire (e.g., localhost development)
  const ordersNeedingPaymentCheck = orders.filter(
    order => !order.paidAt && order.stripePaymentIntentId
  );

  if (ordersNeedingPaymentCheck.length > 0) {
    console.log(`💳 Checking payment status for ${ordersNeedingPaymentCheck.length} orders...`);
    
    try {
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-04-10',
      });

      // Check payment status for each order
      const paymentChecks = await Promise.allSettled(
        ordersNeedingPaymentCheck.map(async (order) => {
          if (!order.stripePaymentIntentId) return null;

          try {
            const paymentIntent = await stripeClient.paymentIntents.retrieve(
              order.stripePaymentIntentId
            );

            // If payment succeeded but paidAt is null, update it
            if (paymentIntent.status === 'succeeded' && !order.paidAt) {
              console.log(`✅ Payment found for order ${order.reference}, updating paidAt...`);
              
              await prisma.booking.update({
                where: { id: order.id },
                data: {
                  paidAt: new Date(paymentIntent.created * 1000), // Use payment creation time
                  status: 'CONFIRMED',
                  amountPaidGBP: paymentIntent.amount,
                  lastPaymentDate: new Date(paymentIntent.created * 1000),
                },
              });

              // Update the order object in memory
              order.paidAt = new Date(paymentIntent.created * 1000);
              order.status = 'CONFIRMED';
              order.amountPaidGBP = paymentIntent.amount;
              
              return { orderId: order.id, updated: true };
            }
            
            return { orderId: order.id, updated: false, status: paymentIntent.status };
          } catch (error) {
            console.error(`❌ Error checking payment for order ${order.reference}:`, error);
            return null;
          }
        })
      );

      const updatedCount = paymentChecks.filter(
        result => result.status === 'fulfilled' && result.value?.updated
      ).length;
      
      if (updatedCount > 0) {
        console.log(`✅ Updated payment status for ${updatedCount} orders`);
      }
    } catch (error) {
      console.error('❌ Error in payment status check:', error);
      // Don't fail the request if payment check fails
    }
  }

  // ✅ Fetch booking segments to show multi-leg journeys (return/additional trips)
  const bookingIds = orders.map(o => o.id);
  
  const bookingSegments = await prisma.bookingSegment.findMany({
    where: {
      bookingId: { in: bookingIds },
    },
    select: {
      id: true,
      bookingId: true,
      segmentType: true,
      sequenceNumber: true,
      pickupAddress: {
        select: {
          label: true,
          postcode: true,
        },
      },
      dropoffAddress: {
        select: {
          label: true,
          postcode: true,
        },
      },
      priceGBP: true,
      scheduledAt: true,
      items: true,
      notes: true,
    },
    orderBy: {
      sequenceNumber: 'asc',
    },
  });

  // Transform segment data (no transformation needed - already using correct names)
  const transformedSegments = bookingSegments;

  // Create map of booking ID to segments
  const segmentMap = new Map<string, any[]>();
  transformedSegments.forEach(segment => {
    if (!segmentMap.has(segment.bookingId)) {
      segmentMap.set(segment.bookingId, []);
    }
    segmentMap.get(segment.bookingId)!.push(segment);
  });

  // Transform orders to use short relation names  
  const transformedOrdersData = orders.map(order => ({
    ...order,
    // Relations already use correct names from Prisma include
  }));

  // ✅ FIX: Detect return journeys by checking if this booking's addresses match another booking's reversed addresses
  // This handles cases where return journeys are created as separate bookings (SV-000080, SV-000079, etc.)
  const detectReturnJourney = async (order: any): Promise<boolean> => {
    // Check 1: Reference contains '-R'
    if (order.reference?.includes('-R')) return true;
    
    // Check 2: Check segments
    const segments = segmentMap.get(order.id) || [];
    if (segments.some((s: any) => s.segmentType?.toLowerCase().includes('return') && s.sequenceNumber === 1)) {
      return true;
    }
    
    // Check 3: Check if this booking's pickup/dropoff match another booking's dropoff/pickup (reversed)
    // This means it's a return journey
    if (order.pickupAddress?.id && order.dropoffAddress?.id) {
      const matchingParentBooking = transformedOrdersData.find((otherOrder: any) => {
        // Skip same booking
        if (otherOrder.id === order.id) return false;
        
        // Check if addresses are reversed (this pickup = other dropoff, this dropoff = other pickup)
        const isReversedAddresses = 
          otherOrder.dropoffAddressId === order.pickupAddressId &&
          otherOrder.pickupAddressId === order.dropoffAddressId;
        
        // Also check if same customer (optional but helps confirm)
        const isSameCustomer = 
          otherOrder.customerEmail === order.customerEmail ||
          otherOrder.customerId === order.customerId;
        
        // Check if scheduled dates are close (return journey usually happens after original)
        const dateDiff = otherOrder.scheduledAt && order.scheduledAt 
          ? Math.abs(new Date(order.scheduledAt).getTime() - new Date(otherOrder.scheduledAt).getTime())
          : Infinity;
        const isCloseDate = dateDiff < 7 * 24 * 60 * 60 * 1000; // Within 7 days
        
        return isReversedAddresses && (isSameCustomer || isCloseDate);
      });
      
      if (matchingParentBooking) {
        console.log(`✅ Detected return journey: ${order.reference} is return of ${matchingParentBooking.reference}`);
        return true;
      }
    }
    
    return false;
  };

  // Process all orders and detect return journeys
  const ordersWithMeta = await Promise.all(transformedOrdersData.map(async (order) => {
    const segments = segmentMap.get(order.id) || [];
    const hasMultipleSegments = segments.length > 1;
    const returnSegments = segments.filter((s: any) => s.segmentType?.toLowerCase().includes('return'));
    const additionalSegments = segments.filter((s: any) => 
      s.segmentType && 
      !s.segmentType.toLowerCase().includes('return') && 
      !s.segmentType.toLowerCase().includes('main') &&
      !s.segmentType.toLowerCase().includes('primary')
    );
    
    // Detect if this is a return journey
    const isReturnJourneyDetected = await detectReturnJourney(order);
    
    return {
      raw: order,
      meta: deriveServiceMetadata(order),
      segments: segments,
      hasReturnJourney: returnSegments.length > 0,
      hasNewJourney: additionalSegments.length > 0,
      isReturnJourney: isReturnJourneyDetected,
      relatedJourneys: segments.map((s: any) => ({
        type: s.segmentType,
        sequence: s.sequenceNumber,
        pickupAddress: s.pickupAddress?.label,
        dropoffAddress: s.dropoffAddress?.label,
        price: s.priceGBP / 100, // Convert pence to pounds
        scheduledDate: s.scheduledAt,
        items: s.items,
      })),
    };
  }));

  // ✅ SHOW ALL ORDERS - Admin needs to see everything for management
  // Note: Only booking-luxury flow is allowed for new bookings, but admin must see all orders
  const filteredOrders = ordersWithMeta; // No filtering - show all orders

  // Log audit action (non-blocking)
  try {
    await logAudit({
      userId,
      action: 'read_orders',
      entityType: 'booking',
      details: {
        count: orders.length,
        q,
        status,
        driver,
        area,
        dateRange,
        take,
      },
    });
  } catch (auditError) {
    // Don't fail the request if audit logging fails
    console.error('Failed to log audit:', auditError);
  }

    const nextCursor =
      orders.length === take ? orders[orders.length - 1].id : null;
    
    console.log('✅ Orders fetched successfully:', {
      count: filteredOrders.length,
      status,
      includeTracking,
      hasNextCursor: !!nextCursor,
    });

    // Transform orders to include serviceType and orderType
    const transformedOrders = filteredOrders.map(({ raw, meta, relatedJourneys, isReturnJourney, hasReturnJourney, hasNewJourney }) => ({
      ...raw,
      serviceType:
        meta.serviceType ||
        (raw.customerPreferences as any)?.serviceType ||
        (raw.customerPreferences as any)?.serviceLevel ||
        'standard',
      orderType: raw.orderType || (raw.isMultiDrop ? 'multi-drop' : 'single'),
      isMultiDrop: raw.isMultiDrop || false,
      // ✅ Add journey opportunities info
      relatedJourneys: relatedJourneys || [],
      hasReturnJourney: hasReturnJourney || relatedJourneys?.some((j: any) => j.type === 'return-journey') || false,
      hasNewJourney: hasNewJourney || relatedJourneys?.some((j: any) => j.type === 'new-journey') || false,
      // ✅ Use detected isReturnJourney from ordersWithMeta (includes address matching detection)
      isReturnJourney: isReturnJourney || false,
    }));

    return Response.json({ items: transformedOrders, nextCursor });
  } catch (error) {
    console.error('❌ Error fetching admin orders:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      params: { status, includeTracking, q, driver, area, dateRange, take }
    });
    
    // Return more detailed error in development
    const isDev = process.env.NODE_ENV === 'development';
    return Response.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error',
        ...(isDev && error instanceof Error ? { stack: error.stack } : {})
      },
      { status: 500 }
    );
  }
}
