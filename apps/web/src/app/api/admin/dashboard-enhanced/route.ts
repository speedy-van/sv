import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { penceToPounds } from '@/lib/utils/currency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get date boundaries for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get unassigned bookings (need driver assignment)
    const unassignedBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        driverId: null,
        scheduledAt: { gte: new Date() } // Future bookings only
      },
      include: {
        BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
        BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
        BookingItem: true,
        User: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    // Calculate SLA for unassigned bookings
    const unassignedWithSLA = unassignedBookings.map(booking => {
      const confirmedAt = booking.paidAt || booking.updatedAt;
      const waitingMinutes = Math.floor((Date.now() - confirmedAt.getTime()) / (1000 * 60));
      const slaBreached = waitingMinutes > 30; // 30 minute SLA
      
      return {
        ...booking,
        waitingMinutes,
        slaBreached,
        priority: slaBreached ? 'high' : (waitingMinutes > 15 ? 'medium' : 'normal')
      };
    });

    // Get available drivers
    const availableDrivers = await prisma.driver.findMany({
      where: {
        status: 'active',
        onboardingStatus: 'approved'
      },
      include: {
        User: {
          select: { 
            id: true, 
            name: true, 
            email: true,
            role: true,
            createdAt: true,
            isActive: true
          }
        },
        DriverAvailability: true,
        Booking: {
          where: {
            status: { in: ['CONFIRMED'] }
          }
        }
      }
    });

    // Filter truly available drivers (not overloaded)
    const trulyAvailableDrivers = availableDrivers.filter(driver => 
      ((driver as any).Booking?.length || 0) < 3 && // Max 3 concurrent jobs
      (driver as any).DriverAvailability?.status === 'online'
    );

    // Get today's statistics
    const [
      todayRevenue,
      todayBookingsCount,
      activeJobsCount,
      completedTodayCount,
      pendingAssignmentCount
    ] = await Promise.all([
      // Today's revenue
      prisma.booking.aggregate({
        where: {
          paidAt: { gte: today, lt: tomorrow },
          status: 'CONFIRMED'
        },
        _sum: { totalGBP: true }
      }),
      
      // Today's bookings
      prisma.booking.count({
        where: {
          createdAt: { gte: today, lt: tomorrow }
        }
      }),
      
      // Active jobs
      prisma.booking.count({
        where: {
          status: { in: ['CONFIRMED'] }
        }
      }),
      
      // Completed today
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: today, lt: tomorrow }
        }
      }),
      
      // Pending assignments
      prisma.booking.count({
        where: {
          status: 'CONFIRMED',
          driverId: null
        }
      })
    ]);

    // Get recent activity
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        action: { in: ['booking_created', 'job_assigned', 'booking_completed'] },
        createdAt: { gte: today }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      // include: {
      //   actor: {
      //     select: { name: true, email: true }
      //   }
      // }
    });

    // Get admin users for team display
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        isActive: true,
        lastLogin: true
      },
      orderBy: { lastLogin: 'desc' },
      take: 5
    });

    // Calculate driver utilization
    const totalDrivers = availableDrivers.length;
    const busyDrivers = availableDrivers.filter(d => ((d as any).Booking?.length || 0) > 0).length;
    const driverUtilization = totalDrivers > 0 ? Math.round((busyDrivers / totalDrivers) * 100) : 0;

    // Format response
    const dashboardData = {
      alerts: {
        unassignedBookings: unassignedWithSLA.length,
        slaBreached: unassignedWithSLA.filter(b => b.slaBreached).length,
        urgentBookings: unassignedWithSLA.filter(b => b.priority === 'high').length
      },
      
      statistics: {
        todayRevenue: penceToPounds(todayRevenue._sum.totalGBP || 0),
        todayBookings: todayBookingsCount,
        activeJobs: activeJobsCount,
        completedToday: completedTodayCount,
        pendingAssignments: pendingAssignmentCount,
        driverUtilization
      },
      
      unassignedBookings: unassignedWithSLA.slice(0, 10).map(booking => ({
        id: booking.id,
        reference: booking.reference,
        customer: booking.User?.name || booking.customerName,
        customerPhone: booking.customerPhone,
        pickupAddress: booking.BookingAddress_Booking_pickupAddressIdToBookingAddress?.label || 'Pickup Address',
        dropoffAddress: booking.BookingAddress_Booking_dropoffAddressIdToBookingAddress?.label || 'Dropoff Address',
        scheduledAt: booking.scheduledAt,
        totalAmount: penceToPounds(booking.totalGBP),
        waitingMinutes: booking.waitingMinutes,
        priority: booking.priority,
        slaBreached: booking.slaBreached,
        itemsCount: booking.BookingItem.length,
        createdAt: booking.createdAt
      })),
      
      availableDrivers: trulyAvailableDrivers.map(driver => ({
        id: driver.id,
        name: (driver as any).user?.name || 'Unknown Driver',
        email: (driver as any).user?.email || '',
        status: driver.status,
        currentJobs: (driver as any).Booking?.length || 0,
        isOnline: (driver as any).availability?.status === 'online',
        lastSeen: (driver as any).availability?.lastSeenAt
      })),
      
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        actorName: activity.actorId || 'System',
        targetType: activity.targetType,
        targetId: activity.targetId,
        createdAt: activity.createdAt,
        details: activity.details
      })),
      
      adminUsers: adminUsers.map(admin => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        adminRole: admin.adminRole,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        isOnline: admin.lastLogin ? 
          (new Date().getTime() - new Date(admin.lastLogin).getTime()) < (15 * 60 * 1000) : false
      })),
      
      systemHealth: {
        database: 'healthy',
        queue: 'healthy',
        pusher: 'healthy',
        stripeWebhooks: 'healthy'
      }
    };

    console.log('✅ Admin dashboard data loaded:', {
      unassignedBookings: dashboardData.alerts.unassignedBookings,
      slaBreached: dashboardData.alerts.slaBreached,
      availableDrivers: dashboardData.availableDrivers.length,
      todayRevenue: dashboardData.statistics.todayRevenue
    });

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Error loading admin dashboard data:', error);
    return NextResponse.json(
      {
        error: 'Failed to load dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
