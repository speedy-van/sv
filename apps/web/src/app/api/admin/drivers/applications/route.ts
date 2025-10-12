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

    // Build where clause for DriverApplication table
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { addressLine1: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { postcode: { contains: search, mode: 'insensitive' } },
        { nationalInsuranceNumber: { contains: search, mode: 'insensitive' } },
        { drivingLicenseNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get driver applications with all related data
    const applications = await prisma.driverApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { applicationDate: 'desc' },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.driverApplication.count({ where });

    // Transform data and calculate comprehensive scores
    const transformedApplications = applications.map(app => {
      // Calculate comprehensive score based on application completeness
      let score = 0;
      let maxScore = 100;

      // Personal information completeness (25 points)
      if (app.firstName && app.lastName) score += 10;
      if (app.phone) score += 5;
      if (app.email) score += 5;
      if (app.addressLine1) score += 5;

      // Additional information completeness (20 points)
      if (app.drivingLicenseNumber) score += 10;
      if (app.bankName && app.accountNumber) score += 5;
      if (app.nationalInsuranceNumber) score += 5;

      // Document completeness (25 points)
      if (app.drivingLicenseFrontImage) score += 15;
      if (app.drivingLicenseBackImage) score += 10;

      // Status and review information (30 points)
      if (app.status) score += 10;
      if (app.reviewedAt) score += 10;
      if (app.reviewedBy) score += 10;

      // Document status mapping
      const documentStatus = {
        license: {
          status: app.drivingLicenseFrontImage ? 'complete' : 'incomplete',
          url: app.drivingLicenseFrontImage,
        },
        id: {
          status: app.drivingLicenseBackImage ? 'complete' : 'incomplete',
          url: app.drivingLicenseBackImage,
        },
      };

      // Check for compliance issues and warnings
      const complianceIssues = [];
      const complianceWarnings = [];

      if (!app.drivingLicenseFrontImage) {
        complianceIssues.push('License front image missing');
      }

      if (!app.drivingLicenseBackImage) {
        complianceIssues.push('License back image missing');
      }

      if (!app.drivingLicenseNumber) {
        complianceWarnings.push('Driving license number missing');
      }

      if (!app.bankName || !app.accountNumber) {
        complianceWarnings.push('Bank account information missing');
      }

      // Auto-approve eligibility with stricter criteria
      const autoApproveEligible =
        score >= 90 &&
        Object.values(documentStatus)
          .filter(doc => doc.status !== 'not_required')
          .every(doc => doc.status === 'complete') &&
        complianceIssues.length === 0 &&
        complianceWarnings.length === 0;

      // Calculate application age
      const applicationAge = Math.floor(
        (Date.now() - app.applicationDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: app.id,
        name: `${app.firstName} ${app.lastName}`,
        email: app.email,
        phone: app.phone,
        score: Math.min(100, score),
        maxScore,
        scorePercentage: Math.round((score / maxScore) * 100),
        status: app.status,
        documents: documentStatus,

        // Address information
        address: `${app.addressLine1}${app.addressLine2 ? ', ' + app.addressLine2 : ''}, ${app.city}, ${app.postcode}`,
        postcode: app.postcode,

        // Additional information
        bankName: app.bankName,
        accountHolderName: app.accountHolderName,
        sortCode: app.sortCode,
        accountNumber: app.accountNumber,
        nationalInsuranceNumber: app.nationalInsuranceNumber,
        drivingLicenseNumber: app.drivingLicenseNumber,

        // Vehicle information (placeholder for future enhancement)
        vehicle: {
          type: 'Not specified',
          make: 'Not specified',
          model: 'Not specified',
          year: 'Not specified',
          reg: 'Not specified',
        },
        experience: '0 years',
        rating: 0,

        // Application metadata
        appliedAt: app.applicationDate.toISOString(),
        applicationAge,
        basePostcode: app.postcode,
        rightToWorkType: 'Not specified',

        // Compliance information
        complianceIssues,
        complianceWarnings,
        autoApproveEligible,

        // Approval tracking fields
        approvedAt:
          app.reviewedAt && app.status === 'approved'
            ? app.reviewedAt.toISOString()
            : undefined,
        approvedBy:
          app.reviewedBy && app.status === 'approved'
            ? app.reviewedBy
            : undefined,
        reviewedAt: app.reviewedAt ? app.reviewedAt.toISOString() : undefined,
        reviewedBy: app.reviewedBy,

        // User relationship
        userId: app.userId,
        user: app.user,
      };
    });

    return NextResponse.json({
      applications: transformedApplications,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Admin driver applications GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
