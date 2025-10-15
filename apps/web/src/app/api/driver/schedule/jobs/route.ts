import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const driverId = session.user.id;
    const now = new Date();

    // Get upcoming jobs (next 30 days)
    const upcomingJobs = await prisma.booking.findMany({
      where: {
        driverId,
        scheduledAt: {
          gte: now,
        },
        status: {
          in: ['CONFIRMED'],
        },
      },
      select: {
        id: true,
        reference: true,
        scheduledAt: true,
        status: true,
        customerName: true,
        customerPhone: true,
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
        BookingItem: {
          select: {
            name: true,
            quantity: true,
          },
        },
        totalGBP: true,
        estimatedDurationMinutes: true,
        urgency: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: 20, // Limit to 20 upcoming jobs
    });

    // Get past jobs (last 30 days, completed and declined)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const pastJobs = await prisma.booking.findMany({
      where: {
        driverId,
        scheduledAt: {
          gte: thirtyDaysAgo,
          lt: now,
        },
        status: {
          in: ['COMPLETED', 'CANCELLED'],
        },
      },
      select: {
        id: true,
        reference: true,
        scheduledAt: true,
        status: true,
        customerName: true,
        customerPhone: true,
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
        BookingItem: {
          select: {
            name: true,
            quantity: true,
          },
        },
        totalGBP: true,
        estimatedDurationMinutes: true,
        urgency: true,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      take: 20, // Limit to 20 past jobs
    });

    // Get declined assignments with details
    const declinedAssignments = await prisma.assignment.findMany({
      where: {
        driverId,
        status: 'declined',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        Booking: {
          select: {
            id: true,
            reference: true,
            scheduledAt: true,
            customerName: true,
            customerPhone: true,
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
            BookingItem: {
              select: {
                name: true,
                quantity: true,
              },
            },
            totalGBP: true,
            estimatedDurationMinutes: true,
            urgency: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to 10 declined jobs
    });

    const formatJob = (booking: any) => ({
      id: booking.id,
      reference: booking.reference,
      scheduledAt: booking.scheduledAt.toISOString(),
      status: booking.status.toLowerCase(),
      customerName: booking.customerName || 'Customer',
      customerPhone: booking.customerPhone || '',
      pickupAddress: booking.pickupAddress?.label || 'Pickup Location',
      dropoffAddress: booking.dropoffAddress?.label || 'Dropoff Location',
      items: booking.BookingItem || [],
      // Hide customer payment amount from driver
      // Driver will see their earnings separately
      duration: booking.estimatedDurationMinutes || 60,
      priority: booking.urgency || 'medium',
    });

    const formatDeclinedJob = (assignment: any) => ({
      id: assignment.bookingId,
      reference: assignment.Booking.reference,
      scheduledAt: assignment.Booking.scheduledAt.toISOString(),
      declinedAt: assignment.createdAt.toISOString(),
      customerName: assignment.Booking.customerName || 'Customer',
      customerPhone: assignment.Booking.customerPhone || '',
      pickupAddress: assignment.Booking.pickupAddress?.label || 'Pickup Location',
      dropoffAddress: assignment.Booking.dropoffAddress?.label || 'Dropoff Location',
      items: assignment.Booking.BookingItem || [],
      // Hide customer payment amount from driver
      // Driver will see their earnings separately
      duration: assignment.Booking.estimatedDurationMinutes || 60,
      priority: assignment.Booking.urgency || 'medium',
      reason: assignment.declinedReason || 'No reason provided',
    });

    return NextResponse.json({
      success: true,
      data: {
        upcoming: upcomingJobs.map(formatJob),
        past: pastJobs.map(formatJob),
        declined: declinedAssignments.map(formatDeclinedJob),
      },
    });

  } catch (error) {
    console.error('Driver schedule jobs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
