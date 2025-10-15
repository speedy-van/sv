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

    // Get current date and week boundaries
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)

    // Get today's jobs count
    const todayJobs = await prisma.assignment.count({
      where: {
        driverId,
        Booking: {
          scheduledAt: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
          status: {
            in: ['CONFIRMED'],
          },
        },
      },
    });

    // Get this week's jobs count
    const weekJobs = await prisma.assignment.count({
      where: {
        driverId,
        Booking: {
          scheduledAt: {
            gte: weekStart,
            lte: weekEnd,
          },
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
        },
      },
    });

    // Get total earnings this week
    const weekEarnings = await prisma.booking.aggregate({
      _sum: {
        totalGBP: true,
      },
      where: {
        driverId,
        scheduledAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: 'COMPLETED',
      },
    });

    // Get next upcoming job
    const nextJob = await prisma.booking.findFirst({
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
          },
        },
        dropoffAddress: {
          select: {
            label: true,
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
    });

    // Get declined jobs count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const declinedJobsCount = await prisma.assignment.count({
      where: {
        driverId,
        status: 'declined',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get total assignments (accepted + declined) for acceptance rate calculation
    const totalAssignments = await prisma.assignment.count({
      where: {
        driverId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calculate acceptance rate (accepted assignments / total assignments)
    const acceptedAssignments = totalAssignments - declinedJobsCount;
    const acceptanceRate = totalAssignments > 0 ? (acceptedAssignments / totalAssignments) * 100 : 100;

    const scheduleStats = {
      todayJobs,
      weekJobs,
      totalEarnings: weekEarnings._sum.totalGBP || 0,
      declinedJobsCount,
      acceptanceRate,
      nextJob: nextJob ? {
        id: nextJob.id,
        reference: nextJob.reference,
        scheduledAt: nextJob.scheduledAt.toISOString(),
        status: nextJob.status.toLowerCase(),
        customerName: nextJob.customerName || 'Customer',
        customerPhone: nextJob.customerPhone || '',
        pickupAddress: nextJob.pickupAddress?.label || 'Pickup Location',
        dropoffAddress: nextJob.dropoffAddress?.label || 'Dropoff Location',
        items: nextJob.BookingItem || [],
        // Hide customer payment amount from driver
        // Driver will see their earnings separately
        duration: nextJob.estimatedDurationMinutes || 60,
        priority: nextJob.urgency || 'medium',
      } : null,
    };

    return NextResponse.json({
      success: true,
      data: scheduleStats,
    });

  } catch (error) {
    console.error('Driver schedule stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
