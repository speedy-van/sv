// Admin tracking diagnostics - check real-time connections and data flow
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting admin tracking diagnostics...');

    const diagnostics = {
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        activeBookings: 0,
        driversWithLocations: 0,
        recentTrackingPings: 0,
      },
      pusher: {
        configured: false,
        credentials: {},
        serverInstance: false,
        channels: {},
      },
      realTimeFlow: {
        driverToAdmin: false,
        lastLocationUpdate: null as any,
        testChannelWorking: false,
      },
      recommendations: [] as string[],
    };

    // 1. Check Database Connection and Active Bookings
    try {
      const activeBookingsCount = await prisma.booking.count({
        where: {
          status: { in: ['CONFIRMED'] }
        }
      });

      const driversWithAssignments = await prisma.assignment.count({
        where: {
          status: 'accepted',
          Booking: {
            status: { in: ['CONFIRMED'] }
          }
        }
      });

      const recentPings = await prisma.trackingPing.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 1000 * 60 * 15) // Last 15 minutes
          }
        }
      });

      diagnostics.database = {
        connected: true,
        activeBookings: activeBookingsCount,
        driversWithLocations: driversWithAssignments,
        recentTrackingPings: recentPings,
      };

      console.log('✅ Database checks completed:', diagnostics.database);
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      diagnostics.recommendations.push('Database connection failed - check DATABASE_URL');
    }

    // 2. Check Pusher Configuration
    try {
      const pusherConfig = {
        appId: !!process.env.PUSHER_APP_ID,
        key: !!process.env.PUSHER_KEY,
        secret: !!process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER,
        publicKey: !!process.env.NEXT_PUBLIC_PUSHER_KEY,
        publicCluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      };

      diagnostics.pusher.configured = !!(
        pusherConfig.appId &&
        pusherConfig.key &&
        pusherConfig.secret &&
        pusherConfig.cluster &&
        pusherConfig.publicKey &&
        pusherConfig.publicCluster
      );

      diagnostics.pusher.credentials = pusherConfig;

      if (!diagnostics.pusher.configured) {
        if (!pusherConfig.appId) diagnostics.recommendations.push('Missing PUSHER_APP_ID');
        if (!pusherConfig.key) diagnostics.recommendations.push('Missing PUSHER_KEY');
        if (!pusherConfig.secret) diagnostics.recommendations.push('Missing PUSHER_SECRET');
        if (!pusherConfig.cluster) diagnostics.recommendations.push('Missing PUSHER_CLUSTER');
        if (!pusherConfig.publicKey) diagnostics.recommendations.push('Missing NEXT_PUBLIC_PUSHER_KEY');
        if (!pusherConfig.publicCluster) diagnostics.recommendations.push('Missing NEXT_PUBLIC_PUSHER_CLUSTER');
      }

      console.log('🔑 Pusher configuration:', pusherConfig);
    } catch (pusherError) {
      console.error('❌ Pusher configuration check failed:', pusherError);
    }

    // 3. Test Pusher Server Instance
    try {
      const pusher = getPusherServer();
      diagnostics.pusher.serverInstance = !!pusher;

      // Test sending a diagnostic message to admin-tracking
      if (pusher && diagnostics.pusher.configured) {
        await pusher.trigger('admin-tracking', 'diagnostic-test', {
          timestamp: new Date().toISOString(),
          message: 'Admin tracking diagnostic test',
        });

        diagnostics.realTimeFlow.testChannelWorking = true;
        console.log('✅ Successfully sent test message to admin-tracking channel');
      }
    } catch (pusherServerError) {
      console.error('❌ Pusher server instance failed:', pusherServerError);
      diagnostics.recommendations.push('Pusher server instance failed - check server configuration');
    }

    // 4. Check Recent Location Updates
    try {
      const recentLocationUpdate = await prisma.trackingPing.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
          Booking: {
            select: {
              reference: true,
              status: true,
            }
          }
        }
      });

      if (recentLocationUpdate) {
        // Get driver info separately
        const driver = await prisma.driver.findUnique({
          where: { id: recentLocationUpdate.driverId },
          include: {
            User: {
              select: { name: true, email: true }
            }
          }
        });

        diagnostics.realTimeFlow.lastLocationUpdate = {
          timestamp: recentLocationUpdate.createdAt.toISOString(),
          bookingReference: recentLocationUpdate.Booking?.reference,
          driverName: driver?.User?.name,
          lat: recentLocationUpdate.lat,
          lng: recentLocationUpdate.lng,
        };

        // Check if update is recent (within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 1000 * 60 * 5);
        if (recentLocationUpdate.createdAt > fiveMinutesAgo) {
          diagnostics.realTimeFlow.driverToAdmin = true;
        }
      }
    } catch (locationError) {
      console.error('❌ Location update check failed:', locationError);
    }

    // 5. Generate Recommendations
    if (diagnostics.database.activeBookings === 0) {
      diagnostics.recommendations.push('No active bookings found - admin tracking needs active jobs to show updates');
    }

    if (diagnostics.database.driversWithLocations === 0) {
      diagnostics.recommendations.push('No drivers currently assigned to active bookings');
    }

    if (diagnostics.database.recentTrackingPings === 0) {
      diagnostics.recommendations.push('No recent location pings in last 15 minutes - drivers may not be sending location updates');
    }

    if (!diagnostics.realTimeFlow.driverToAdmin) {
      diagnostics.recommendations.push('No recent real-time location updates detected - check if drivers have location permission and are actively tracking');
    }

    if (!diagnostics.pusher.configured) {
      diagnostics.recommendations.push('Pusher not properly configured - real-time updates will not work');
    }

    console.log('📋 Final diagnostics report:', diagnostics);

    return NextResponse.json({
      success: true,
      diagnostics,
      summary: {
        status: diagnostics.recommendations.length === 0 ? 'healthy' : 'issues_detected',
        issuesCount: diagnostics.recommendations.length,
        criticalIssues: diagnostics.recommendations.filter(r => 
          r.includes('Database') || r.includes('Pusher')
        ).length,
      }
    });

  } catch (error) {
    console.error('❌ Admin tracking diagnostics failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Diagnostics failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'test-admin-channel':
        return await testAdminChannel();
      case 'simulate-location-update':
        return await simulateLocationUpdate();
      case 'check-active-drivers':
        return await checkActiveDrivers();
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ Admin tracking diagnostic action failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Action failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function testAdminChannel() {
  try {
    const pusher = getPusherServer();
    
    await pusher.trigger('admin-tracking', 'test-update', {
      type: 'test',
      timestamp: new Date().toISOString(),
      message: 'Admin channel test - if you see this in the admin dashboard, real-time is working!',
      testData: {
        bookingId: 'test-booking',
        driverId: 'test-driver',
        lat: 51.5074,
        lng: -0.1278,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test message sent to admin-tracking channel',
      instructions: 'Check the admin tracking dashboard for the test message'
    });
  } catch (error) {
    console.error('❌ Admin channel test failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send test message' },
      { status: 500 }
    );
  }
}

async function simulateLocationUpdate() {
  try {
    // Find an active booking to simulate update for
    const activeBooking = await prisma.booking.findFirst({
      where: {
        status: 'CONFIRMED',
        driverId: { not: null }
      }
    });

    if (!activeBooking) {
      return NextResponse.json({
        success: false,
        error: 'No active bookings with assigned drivers found'
      });
    }

    // Get driver info separately
    const driver = await prisma.driver.findUnique({
      where: { id: activeBooking.driverId! },
      include: {
        User: {
          select: { name: true, email: true }
        }
      }
    });
    const pusher = getPusherServer();

    // Simulate location update
    await pusher.trigger('admin-tracking', 'location-update', {
      driverId: driver?.id,
      bookingId: activeBooking.id,
      bookingReference: activeBooking.reference,
      lat: 51.5074 + (Math.random() - 0.5) * 0.01, // Small random offset
      lng: -0.1278 + (Math.random() - 0.5) * 0.01,
      timestamp: new Date().toISOString(),
      customerName: activeBooking.customerName,
      simulated: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Simulated location update sent',
      booking: {
        reference: activeBooking.reference,
        driverName: driver?.User?.name,
        customerName: activeBooking.customerName,
      }
    });
  } catch (error) {
    console.error('❌ Location update simulation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to simulate location update' },
      { status: 500 }
    );
  }
}

async function checkActiveDrivers() {
  try {
    const activeDrivers = await prisma.driverAvailability.findMany({
      where: {
        status: 'online',
        lastSeenAt: {
          gte: new Date(Date.now() - 1000 * 60 * 30) // Last 30 minutes
        }
      }
    });

    const driversWithJobs = await prisma.assignment.findMany({
      where: {
        status: 'accepted',
      },
      include: {
        Booking: {
          select: {
            reference: true,
            status: true,
          }
        }
      }
    });

    // Get driver names separately
    const driverIds = [...new Set([...activeDrivers.map((d: any) => d.driverId), ...driversWithJobs.map((a: any) => a.driverId)])];
    const drivers = await prisma.driver.findMany({
      where: { id: { in: driverIds } },
      include: {
        User: {
          select: { name: true, email: true }
        }
      }
    });

    const driverMap = new Map(drivers.map((d: any) => [d.id, d]));

    return NextResponse.json({
      success: true,
      data: {
        onlineDrivers: activeDrivers.length,
        driversWithJobs: driversWithJobs.length,
        activeDriversList: activeDrivers.map((d: any) => {
          const driver = driverMap.get(d.driverId);
          return {
            id: d.driverId,
            name: (driver as any)?.User?.name || 'Unknown',
            lastSeen: d.lastSeenAt,
            hasLocation: !!(d.lastLat && d.lastLng),
            lastLocation: d.lastLat && d.lastLng ? { lat: d.lastLat, lng: d.lastLng } : null,
          };
        }),
        driversWithJobsList: driversWithJobs.map((a: any) => {
          const driver = driverMap.get(a.driverId);
          return {
            driverId: a.driverId,
            driverName: (driver as any)?.User?.name || 'Unknown',
            bookingReference: a.Booking.reference,
            bookingStatus: a.Booking.status,
          };
        }),
      }
    });
  } catch (error) {
    console.error('❌ Active drivers check failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check active drivers' },
      { status: 500 }
    );
  }
}