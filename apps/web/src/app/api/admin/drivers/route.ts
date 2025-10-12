import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { User: { name: { contains: search, mode: 'insensitive' } } },
        { User: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get drivers with all related data
    const drivers = await prisma.driver.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        DriverProfile: {
          select: {
            phone: true,
            address: true,
            dob: true,
          },
        },
        DriverVehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            reg: true,
            weightClass: true,
            motExpiry: true,
          },
        },
        DriverChecks: {
          select: {
            rtwMethod: true,
            rtwExpiresAt: true,
            licenceCategories: true,
            points: true,
            licenceExpiry: true,
            dbsType: true,
            dbsCheckedAt: true,
            insurancePolicyNo: true,
            insurer: true,
            policyEnd: true,
          },
        },
        DriverRating: {
          select: {
            rating: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        Booking: {
          select: {
            id: true,
            status: true,
            totalGBP: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        DriverAvailability: {
          select: {
            status: true,
            lastSeenAt: true,
            lastLat: true,
            lastLng: true,
          },
        },
        DriverPerformance: {
          select: {
            acceptanceRate: true,
            completionRate: true,
            onTimeRate: true,
            averageRating: true,
            totalJobs: true,
            completedJobs: true,
            lateJobs: true,
            totalRatings: true,
          },
        },
        DriverIncident: {
          select: {
            id: true,
            type: true,
            severity: true,
            description: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    // Transform data and calculate metrics
    const transformedDrivers = drivers.map(driver => {
      // Calculate average rating
      const avgRating =
        driver.DriverRating?.length > 0
          ? driver.DriverRating.reduce((sum: number, r: any) => sum + r.rating, 0) /
            driver.DriverRating.length
          : 0;

      // Calculate job metrics
      const totalJobs = driver.Booking?.length || 0;
      const completedJobs =
        driver.Booking?.filter(b => b.status === 'COMPLETED').length || 0;
      const onTimeJobs =
        driver.Booking?.filter(b => b.status === 'COMPLETED').length || 0; // Simplified - no completedAt field
      const totalEarnings =
        driver.Booking?.reduce((sum, b) => sum + (b.totalGBP || 0), 0) || 0;

      // Calculate performance metrics
      const acceptanceRate =
        totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
      const completionRate =
        totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
      const onTimeRate =
        completedJobs > 0 ? Math.round((onTimeJobs / completedJobs) * 100) : 0;

      // Check for compliance issues
      const complianceIssues = [];

      if (
        driver.DriverChecks?.licenceExpiry &&
        new Date(driver.DriverChecks.licenceExpiry) < new Date()
      ) {
        complianceIssues.push('License expired');
      }

      if (
        driver.DriverChecks?.rtwExpiresAt &&
        new Date(driver.DriverChecks.rtwExpiresAt) < new Date()
      ) {
        complianceIssues.push('Right to work expired');
      }

      if (
        driver.DriverChecks?.policyEnd &&
        new Date(driver.DriverChecks.policyEnd) < new Date()
      ) {
        complianceIssues.push('Insurance expired');
      }

      if (
        driver.DriverVehicle[0]?.motExpiry &&
        new Date(driver.DriverVehicle[0].motExpiry) < new Date()
      ) {
        complianceIssues.push('MOT expired');
      }

      if (driver.DriverChecks?.points && driver.DriverChecks.points > 6) {
        complianceIssues.push('Too many license points');
      }

      // Document expiries
      const documentExpiries = {
        license: driver.DriverChecks?.licenceExpiry?.toISOString() || null,
        insurance: driver.DriverChecks?.policyEnd?.toISOString() || null,
        mot: driver.DriverVehicle[0]?.motExpiry?.toISOString() || null,
        rtw: driver.DriverChecks?.rtwExpiresAt?.toISOString() || null,
      };

      return {
        id: driver.id,
        name: driver.User.name || 'Unknown',
        email: driver.User.email,
        phone: driver.DriverProfile?.phone || 'Not provided',
        onboardingStatus: driver.onboardingStatus,
        status: driver.status,
        approvedAt: driver.approvedAt?.toISOString() || null,
        createdAt: driver.User.createdAt.toISOString(),
        updatedAt: driver.updatedAt.toISOString(),
        basePostcode: driver.basePostcode || 'Not provided',
        vehicleType: driver.vehicleType || 'Unknown',
        rating: avgRating,
        totalJobs,
        completedJobs,
        onTimeJobs,
        totalEarnings,
        DriverAvailability: driver.DriverAvailability?.status || 'offline',
        lastSeen: driver.DriverAvailability?.lastSeenAt?.toISOString() || null,
        complianceIssues,
        documentExpiries,
        kpis: {
          acceptanceRate,
          completionRate,
          onTimeRate,
          avgRating,
        },
        incidents: driver.DriverIncident.map(incident => ({
          id: incident.id,
          type: incident.type,
          severity: incident.severity,
          description: incident.description,
          createdAt: incident.createdAt.toISOString(),
          resolved: incident.status === 'resolved',
        })),
        DriverPerformance: driver.DriverPerformance || {
          acceptanceRate,
          completionRate,
          onTimeRate,
          averageRating: avgRating,
          totalJobs,
          completedJobs,
          lateJobs: 0,
          totalRatings: driver.DriverRating?.length || 0,
        },
      };
    });

    // Get total count for pagination
    const total = await prisma.driver.count({ where });

    return NextResponse.json({
      drivers: transformedDrivers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin drivers GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
