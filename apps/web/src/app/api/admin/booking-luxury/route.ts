import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/admin/booking-luxury - List all bookings for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get bookings with pagination
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          pickupAddress: true,
          dropoffAddress: true,
          pickupProperty: true,
          dropoffProperty: true,
          BookingItem: true,
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
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching admin bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/booking-luxury - Create booking on behalf of customer (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For admin-created bookings, redirect to the main booking-luxury endpoint
    // but with admin context
    const bookingData = await request.json();
    
    // Add admin context to the booking data
    const adminBookingData = {
      ...bookingData,
      adminCreated: true,
      adminId: session.user.id,
    };

    // Forward to the main booking-luxury endpoint
    const response = await fetch(`${request.nextUrl.origin}/api/booking-luxury`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the session cookie for authentication
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify(adminBookingData),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    // Log admin action
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: 'admin',
        action: 'admin_booking_created',
        targetType: 'booking',
        targetId: result.booking.id,
        userId: session.user.id,
        details: {
          bookingReference: result.booking.reference,
          customerName: bookingData.customer.name,
          customerEmail: bookingData.customer.email,
          totalAmount: result.booking.pricing.total,
          createdVia: 'admin_panel',
        },
      },
    });

    return NextResponse.json({
      ...result,
      adminCreated: true,
    });
  } catch (error) {
    console.error('❌ Error creating admin booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
