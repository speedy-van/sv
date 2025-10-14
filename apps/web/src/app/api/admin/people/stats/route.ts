import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Get date boundaries for this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get all people statistics in parallel
    const [
      totalDrivers,
      activeDrivers,
      pendingApplications,
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
    ] = await Promise.all([
      // Total drivers
      prisma.driver.count(),
      
      // Active drivers (online in last 24 hours)
      prisma.driver.count({
        where: {
          status: 'active',
          onboardingStatus: 'approved',
        },
      }),
      
      // Pending driver applications
      prisma.driverApplication.count({
        where: {
          status: 'pending',
        },
      }),
      
      // Total customers
      prisma.user.count({
        where: {
          role: 'customer',
        },
      }),
      
      // Active customers (made booking in last 30 days)
      prisma.user.count({
        where: {
          role: 'customer',
          Booking: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      }),
      
      // New customers this month
      prisma.user.count({
        where: {
          role: 'customer',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
    ]);

    const stats = {
      totalDrivers,
      activeDrivers,
      pendingApplications,
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
    };

    console.log('✅ People stats loaded:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ Error loading people stats:', error);
    return NextResponse.json(
      { error: 'Failed to load people statistics' },
      { status: 500 }
    );
  }
}
