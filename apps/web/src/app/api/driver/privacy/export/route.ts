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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            isActive: true
          }
        },
        vehicles: true,
        checks: true,
        documents: true,
        availability: true,
        shifts: true,
        earnings: true,
        tips: true,
        payoutSettings: true,
        payouts: true,
        ratings: true,
        incidents: true,
        performance: true,
        notifications: true,
        notificationPrefs: true,
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
        id: driver.user.id,
        email: driver.user.email,
        name: driver.user.name,
        createdAt: driver.user.createdAt,
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
      vehicles: driver.vehicles.map(v => ({
        id: v.id,
        make: v.make,
        model: v.model,
        reg: v.reg,
        weightClass: v.weightClass,
        motExpiry: v.motExpiry,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      })),
      checks: driver.checks
        ? {
            id: driver.checks.id,
            rtwMethod: driver.checks.rtwMethod,
            rtwResultRef: driver.checks.rtwResultRef,
            rtwExpiresAt: driver.checks.rtwExpiresAt,
            dvlaCheckRef: driver.checks.dvlaCheckRef,
            licenceCategories: driver.checks.licenceCategories,
            points: driver.checks.points,
            licenceExpiry: driver.checks.licenceExpiry,
            dbsType: driver.checks.dbsType,
            dbsCheckRef: driver.checks.dbsCheckRef,
            dbsCheckedAt: driver.checks.dbsCheckedAt,
            dbsRetentionUntil: driver.checks.dbsRetentionUntil,
            insurancePolicyNo: driver.checks.insurancePolicyNo,
            insurer: driver.checks.insurer,
            coverType: driver.checks.coverType,
            goodsInTransit: driver.checks.goodsInTransit,
            publicLiability: driver.checks.publicLiability,
            policyStart: driver.checks.policyStart,
            policyEnd: driver.checks.policyEnd,
            createdAt: driver.checks.createdAt,
            updatedAt: driver.checks.updatedAt,
          }
        : null,
      documents: driver.documents.map(d => ({
        id: d.id,
        category: d.category,
        uploadedAt: d.uploadedAt,
        verifiedAt: d.verifiedAt,
        expiresAt: d.expiresAt,
        status: d.status,
        // Exclude fileUrl for security
      })),
      availability: driver.availability
        ? {
            id: driver.availability.id,
            lastSeenAt: driver.availability.lastSeenAt,
            locationConsent: driver.availability.locationConsent,
            createdAt: driver.availability.createdAt,
            updatedAt: driver.availability.updatedAt,
          }
        : null,
      shifts: driver.shifts.map(s => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: s.isActive,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      earnings: driver.earnings.map(e => ({
        id: e.id,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        currency: e.currency,
        baseAmountPence: e.baseAmountPence,
        surgeAmountPence: e.surgeAmountPence,
        tipAmountPence: e.tipAmountPence,
      })),
      tips: driver.tips.map(t => ({
        id: t.id,
        amountPence: t.amountPence,
        method: t.method,
        createdAt: t.createdAt,
      })),
      payoutSettings: driver.payoutSettings
        ? {
            id: driver.payoutSettings.id,
            accountName: driver.payoutSettings.accountName,
            accountNumber: driver.payoutSettings.accountNumber,
            sortCode: driver.payoutSettings.sortCode,
            autoPayout: driver.payoutSettings.autoPayout,
            minPayoutAmountPence: driver.payoutSettings.minPayoutAmountPence,
            verified: driver.payoutSettings.verified,
            verifiedAt: driver.payoutSettings.verifiedAt,
            createdAt: driver.payoutSettings.createdAt,
            updatedAt: driver.payoutSettings.updatedAt,
          }
        : null,
      payouts: driver.payouts.map(p => ({
        id: p.id,
        totalAmountPence: p.totalAmountPence,
        status: p.status,
        processedAt: p.processedAt,
        createdAt: p.createdAt,
      })),
      ratings: driver.ratings.map(r => ({
        id: r.id,
        rating: r.rating,
        category: r.category,
        createdAt: r.createdAt,
      })),
      incidents: driver.incidents.map(i => ({
        id: i.id,
        type: i.type,
        description: i.description,
        severity: i.severity,
        reportedAt: i.reportedAt,
        createdAt: i.createdAt,
      })),
      performance: driver.performance
        ? {
            id: driver.performance.id,
            averageRating: driver.performance.averageRating,
            totalJobs: driver.performance.totalJobs,
            completionRate: driver.performance.completionRate,
            acceptanceRate: driver.performance.acceptanceRate,
            onTimeRate: driver.performance.onTimeRate,
            createdAt: driver.performance.createdAt,
            updatedAt: driver.performance.updatedAt,
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

