import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
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
        DriverVehicle: true,
        DriverChecks: true,
        Document: true,
        DriverAvailability: true,
        DriverShift: true,
        DriverEarnings: true,
        DriverTip: true,
        DriverPayoutSettings: true,
        DriverPayout: true,
        DriverRating: true,
        DriverIncident: true,
        DriverPerformance: true,
        DriverNotification: true,
        DriverNotificationPreferences: true,
        Assignment: {
          include: {
            Booking: {
              include: {
                pickupAddress: true,
                dropoffAddress: true,
              },
            },
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Create data export object
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: driver.User.id,
        email: driver.User.email,
        name: driver.User.name,
        createdAt: driver.User.createdAt,
        // Exclude sensitive fields like password, 2FA secrets
      },
      driver: {
        id: driver.id,
        status: driver.status,
        onboardingStatus: driver.onboardingStatus,
        basePostcode: driver.basePostcode,
        vehicleType: driver.vehicleType,
        rightToWorkType: driver.rightToWorkType,
        approvedAt: driver.approvedAt,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
      },
      vehicles: driver.DriverVehicle.map(v => ({
        id: v.id,
        make: v.make,
        model: v.model,
        reg: v.reg,
        weightClass: v.weightClass,
        motExpiry: v.motExpiry,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      checks: driver.DriverChecks
        ? {
            id: driver.DriverChecks.id,
            rtwMethod: driver.DriverChecks.rtwMethod,
            rtwResultRef: driver.DriverChecks.rtwResultRef,
            rtwExpiresAt: driver.DriverChecks.rtwExpiresAt,
            dvlaCheckRef: driver.DriverChecks.dvlaCheckRef,
            licenceCategories: driver.DriverChecks.licenceCategories,
            points: driver.DriverChecks.points,
            licenceExpiry: driver.DriverChecks.licenceExpiry,
            dbsType: driver.DriverChecks.dbsType,
            dbsCheckRef: driver.DriverChecks.dbsCheckRef,
            dbsCheckedAt: driver.DriverChecks.dbsCheckedAt,
            dbsRetentionUntil: driver.DriverChecks.dbsRetentionUntil,
            insurancePolicyNo: driver.DriverChecks.insurancePolicyNo,
            insurer: driver.DriverChecks.insurer,
            coverType: driver.DriverChecks.coverType,
            goodsInTransit: driver.DriverChecks.goodsInTransit,
            publicLiability: driver.DriverChecks.publicLiability,
            policyStart: driver.DriverChecks.policyStart,
            policyEnd: driver.DriverChecks.policyEnd,
            createdAt: driver.DriverChecks.createdAt,
            updatedAt: driver.DriverChecks.updatedAt,
          }
        : null,
      documents: driver.Document.map(d => ({
        id: d.id,
        category: d.category,
        uploadedAt: d.uploadedAt,
        verifiedAt: d.verifiedAt,
        expiresAt: d.expiresAt,
        status: d.status,
        // Exclude fileUrl for security
      })),
      availability: driver.DriverAvailability
        ? {
            id: driver.DriverAvailability.id,
            lastSeenAt: driver.DriverAvailability.lastSeenAt,
            locationConsent: driver.DriverAvailability.locationConsent,
            createdAt: driver.DriverAvailability.createdAt,
            updatedAt: driver.DriverAvailability.updatedAt,
          }
        : null,
      shifts: driver.DriverShift.map(s => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      earnings: driver.DriverEarnings.map(e => ({
        id: e.id,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        currency: e.currency,
        baseAmountPence: e.baseAmountPence,
        surgeAmountPence: e.surgeAmountPence,
        tipAmountPence: e.tipAmountPence,
      })),
      tips: driver.DriverTip.map(t => ({
        id: t.id,
        amountPence: t.amountPence,
        method: t.method,
        createdAt: t.createdAt,
      })),
      payoutSettings: driver.DriverPayoutSettings
        ? {
            id: driver.DriverPayoutSettings.id,
            accountName: driver.DriverPayoutSettings.accountName,
            accountNumber: driver.DriverPayoutSettings.accountNumber,
            sortCode: driver.DriverPayoutSettings.sortCode,
            autoPayout: driver.DriverPayoutSettings.autoPayout,
            minPayoutAmountPence: driver.DriverPayoutSettings.minPayoutAmountPence,
            verified: driver.DriverPayoutSettings.verified,
            verifiedAt: driver.DriverPayoutSettings.verifiedAt,
            createdAt: driver.DriverPayoutSettings.createdAt,
            updatedAt: driver.DriverPayoutSettings.updatedAt,
          }
        : null,
      payouts: driver.DriverPayout.map(p => ({
        id: p.id,
        totalAmountPence: p.totalAmountPence,
        status: p.status,
        processedAt: p.processedAt,
        createdAt: p.createdAt,
      })),
      ratings: driver.DriverRating.map(r => ({
        id: r.id,
        rating: r.rating,
        category: r.category,
        createdAt: r.createdAt,
      })),
      incidents: driver.DriverIncident.map(i => ({
        id: i.id,
        type: i.type,
        description: i.description,
        severity: i.severity,
        reportedAt: i.reportedAt,
        createdAt: i.createdAt,
      })),
      performance: driver.DriverPerformance
        ? {
            id: driver.DriverPerformance.id,
            averageRating: driver.DriverPerformance.averageRating,
            totalJobs: driver.DriverPerformance.totalJobs,
            completionRate: driver.DriverPerformance.completionRate,
            acceptanceRate: driver.DriverPerformance.acceptanceRate,
            onTimeRate: driver.DriverPerformance.onTimeRate,
            createdAt: driver.DriverPerformance.createdAt,
            updatedAt: driver.DriverPerformance.updatedAt,
          }
        : null,
      Assignment: driver.Assignment.map(a => ({
        id: a.id,
        status: a.status,
        claimedAt: a.claimedAt,
        createdAt: a.createdAt,
        Booking: {
          id: a.Booking.id,
          reference: a.Booking.reference,
          pickupAddress: a.Booking.pickupAddress?.label || '',
          dropoffAddress: a.Booking.dropoffAddress?.label || '',
          totalGBP: a.Booking.totalGBP,
          status: a.Booking.status,
          scheduledAt: a.Booking.scheduledAt,
          createdAt: a.Booking.createdAt,
        },
      })),
    };

    // Log the export request for audit purposes
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: 'driver',
        action: 'DATA_EXPORT_REQUESTED',
        targetType: 'data_export',
        targetId: driver.id,
        before: undefined,
        after: {
          driverId: driver.id,
          exportDate: new Date().toISOString(),
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
      data: exportData,
      message: 'Data export generated successfully',
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

