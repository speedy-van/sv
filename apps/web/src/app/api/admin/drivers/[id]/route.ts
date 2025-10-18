import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { id: driverId } = await params;

    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
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
        Document: {
          select: {
            id: true,
            category: true,
            fileUrl: true,
            status: true,
            uploadedAt: true,
            expiresAt: true,
            verifiedAt: true,
            verifiedBy: true,
          },
        },
        DriverRating: {
          select: {
            rating: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
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
          take: 20,
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
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Calculate KPIs
    const totalJobs = driver.Booking?.length || 0;
    const completedJobs =
      driver.Booking?.filter(b => b.status === 'COMPLETED').length || 0;
    const onTimeJobs =
      driver.Booking?.filter(b => b.status === 'COMPLETED').length || 0; // Simplified - no completedAt field
    const totalEarnings =
      driver.Booking?.reduce((sum, b) => sum + (b.totalGBP || 0), 0) || 0;

    const avgRating =
      driver.DriverRating.length > 0
        ? driver.DriverRating.reduce((sum, r) => sum + r.rating, 0) /
          driver.DriverRating.length
        : 0;

    // Calculate performance metrics
    const acceptanceRate =
      totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
    const completionRate =
      totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0;
    const onTimeRate =
      completedJobs > 0 ? Math.round((onTimeJobs / completedJobs) * 100) : 0;

    // Check compliance issues
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

    const transformedDriver = {
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
      DriverIncident: driver.DriverIncident.map(incident => ({
        id: incident.id,
        type: incident.type,
        severity: incident.severity,
        description: incident.description,
        createdAt: incident.createdAt.toISOString(),
        status: incident.status,
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

    return NextResponse.json(transformedDriver);
  } catch (error) {
    console.error('Admin driver GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { id: driverId } = await params;
    const { status, autoAssignLimit, notes } = await request.json();

    // Get current driver data for audit
    const currentDriver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!currentDriver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Update driver
    const updateData: any = {};
    if (status) updateData.status = status;
    if (autoAssignLimit !== undefined) {
      // This would typically be stored in a separate table or field
      // For now, we'll just log it
      console.log(
        `Auto-assign limit set to ${autoAssignLimit} for driver ${driverId}`
      );
    }

    await prisma.driver.update({
      where: { id: driverId },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: 'admin',
        action: 'driver_updated',
        targetType: 'Driver',
        targetId: driverId,
        after: {
          previousStatus: currentDriver.status,
          newStatus: status,
          autoAssignLimit,
          notes,
          updatedBy: user.email,
          updatedAt: new Date().toISOString(),
        },
        ip:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Driver updated successfully',
      driver: {
        id: driverId,
        status,
        autoAssignLimit,
      },
    });
  } catch (error) {
    console.error('Admin driver PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
