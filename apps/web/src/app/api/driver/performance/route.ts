import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/driver/performance
 * 
 * Fetch driver performance metrics including:
 * - Acceptance rate
 * - Total jobs (all time)
 * - Completed jobs
 * - Total earnings
 * - Average rating
 * - Jobs this week
 * - Jobs this month
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Driver Performance API - Starting request');
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    let userRole: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      userRole = bearerAuth.user.role;
      console.log('🔑 Bearer token authenticated for user:', userId, 'role:', userRole);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        console.log('❌ Driver Performance API - Unauthorized access');
        return NextResponse.json(
          { error: 'Unauthorized - Driver access required' },
          { status: 401 }
        );
      }
      userId = (session.user as any).id;
      userRole = (session.user as any).role;
      console.log('🌐 NextAuth session authenticated for user:', userId, 'role:', userRole);
    }
    
    // Check role after getting it from both sources
    if (userRole !== 'driver') {
      console.log('❌ Driver Performance API - Invalid role:', userRole);
      return NextResponse.json(
        { error: 'Forbidden - Driver access required' },
        { status: 403 }
      );
    }

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      select: { 
        id: true,
        rating: true,
        status: true,
        onboardingStatus: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver record not found' },
        { status: 404 }
      );
    }

    // Get driver performance record
    const performance = await prisma.driverPerformance.findUnique({
      where: { driverId: driver.id },
      select: {
        acceptanceRate: true,
        onTimeRate: true,
        completionRate: true,
        averageRating: true,
        totalJobs: true,
        completedJobs: true,
        cancelledJobs: true,
        lastCalculated: true,
      }
    });

    // Calculate date ranges
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get jobs count for this week
    const jobsThisWeek = await prisma.booking.count({
      where: {
        driverId: driver.id,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        createdAt: { gte: startOfWeek },
      },
    });

    // Get jobs count for this month
    const jobsThisMonth = await prisma.booking.count({
      where: {
        driverId: driver.id,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        createdAt: { gte: startOfMonth },
      },
    });

    // Get active jobs count (currently in progress)
    const activeJobs = await prisma.booking.count({
      where: {
        driverId: driver.id,
        status: 'CONFIRMED', // Use CONFIRMED instead of IN_PROGRESS
      },
    });

    // Get total earnings from DriverEarnings table
    const earnings = await prisma.driverEarnings.aggregate({
      where: {
        driverId: driver.id,
      },
      _sum: {
        netAmountPence: true,
      },
    });

    const totalEarningsPence = earnings._sum.netAmountPence || 0;

    // Build response
    const response = {
      success: true,
      data: {
        // Performance metrics
        acceptanceRate: performance?.acceptanceRate || 100,
        onTimeRate: performance?.onTimeRate || 100,
        completionRate: performance?.completionRate || 100,
        averageRating: performance?.averageRating || driver.rating || 5.0,
        
        // Job counts
        totalJobs: performance?.totalJobs || 0,
        completedJobs: performance?.completedJobs || 0,
        cancelledJobs: performance?.cancelledJobs || 0,
        activeJobs: activeJobs,
        jobsThisWeek: jobsThisWeek,
        jobsThisMonth: jobsThisMonth,
        
        // Earnings
        totalEarnings: (totalEarningsPence / 100).toFixed(2), // Convert pence to GBP
        totalEarningsGBP: (totalEarningsPence / 100).toFixed(2),
        
        // Status
        status: driver.status,
        onboardingStatus: driver.onboardingStatus,
        
        // Metadata
        lastCalculated: performance?.lastCalculated || new Date(),
      },
    };

    console.log(`📊 Driver performance fetched for driver ${driver.id}:`, {
      acceptanceRate: response.data.acceptanceRate,
      totalJobs: response.data.totalJobs,
      totalEarnings: response.data.totalEarnings,
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching driver performance:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch driver performance',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
