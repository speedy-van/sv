import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/drivers/applications/[id] - Get driver application details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = params;

    // Get driver application with all details
    const application = await prisma.driverApplication.findUnique({
      where: { id },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Calculate comprehensive score
    let score = 0;
    let maxScore = 100;

    // Personal information completeness (40 points)
    if (application.firstName && application.lastName) score += 15;
    if (application.phone) score += 10;
    if (application.email) score += 10;
    if (application.addressLine1) score += 5;

    // Additional information completeness (30 points)
    if (application.drivingLicenseNumber) score += 15;
    if (application.bankName && application.accountNumber) score += 10;
    if (application.nationalInsuranceNumber) score += 5;

    // Document completeness (20 points)
    if (application.drivingLicenseFrontImage) score += 10;
    if (application.drivingLicenseBackImage) score += 10;

    // Status and review information (10 points)
    if (application.status) score += 5;
    if (application.reviewedAt) score += 5;

    // Document status
    const documentStatus = {
      license: {
        status: application.drivingLicenseFrontImage ? 'complete' : 'incomplete',
        url: application.drivingLicenseFrontImage,
      },
      insurance: {
        status: application.insuranceDocument ? 'complete' : 'incomplete',
        url: application.insuranceDocument,
      },
      rightToWork: {
        status: application.rightToWorkDocument ? 'complete' : 'incomplete',
        url: application.rightToWorkDocument,
      },
    };

    // Check for compliance issues
    const complianceIssues = [];
    const complianceWarnings = [];

    // Basic compliance checks based on available fields
    if (!application.drivingLicenseFrontImage) {
      complianceIssues.push('License front image missing');
    }

    if (!application.drivingLicenseBackImage) {
      complianceIssues.push('License back image missing');
    }

    if (!application.insuranceDocument) {
      complianceWarnings.push('Insurance document missing');
    }

    if (!application.rightToWorkDocument) {
      complianceWarnings.push('Right to work document missing');
    }

    if (!application.drivingLicenseNumber) {
      complianceWarnings.push('Driving license number missing');
    }

    if (!application.bankName || !application.accountNumber) {
      complianceWarnings.push('Bank account information missing');
    }

    // Auto-approve eligibility
    const autoApproveEligible =
      score >= 90 &&
      Object.values(documentStatus).every(doc => doc.status === 'complete') &&
      complianceIssues.length === 0 &&
      complianceWarnings.length === 0;

    // Calculate application age
    const applicationAge = Math.floor(
      (Date.now() - application.applicationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Transform response
    const transformedApplication = {
      id: application.id,
      name: `${application.firstName} ${application.lastName}`,
      email: application.email,
      phone: application.phone,
      dateOfBirth: application.dateOfBirth,
      score: Math.min(100, score),
      maxScore,
      scorePercentage: Math.round((score / maxScore) * 100),
      status: application.status,
      documents: documentStatus,

      // Address information structured for the frontend
      address: {
        line1: application.addressLine1,
        line2: application.addressLine2 || '',
        city: application.city,
        county: application.county || '',
        postcode: application.postcode,
        fullAddress: `${application.addressLine1}${application.addressLine2 ? ', ' + application.addressLine2 : ''}, ${application.city}, ${application.postcode}`,
      },

      // Driving information structured
      driving: {
        licenseNumber: application.drivingLicenseNumber,
        licenseExpiry: application.drivingLicenseExpiry,
        licenseFrontImage: application.drivingLicenseFrontImage,
        licenseBackImage: application.drivingLicenseBackImage,
      },

      // Insurance information structured
      insurance: {
        provider: application.insuranceProvider,
        policyNumber: application.insurancePolicyNumber,
        expiry: application.insuranceExpiry,
        document: application.insuranceDocument,
      },

      // Banking information structured
      banking: {
        bankName: application.bankName,
        accountHolderName: application.accountHolderName,
        sortCode: application.sortCode,
        accountNumber: application.accountNumber,
      },

      // Right to work information structured
      rightToWork: {
        shareCode: application.rightToWorkShareCode,
        document: application.rightToWorkDocument,
      },

      // Emergency contact structured
      emergencyContact: {
        name: application.emergencyContactName,
        phone: application.emergencyContactPhone,
        relationship: application.emergencyContactRelationship,
      },

      // Terms agreement
      terms: {
        agreeToTerms: application.agreeToTerms,
        agreeToDataProcessing: application.agreeToDataProcessing,
        agreeToBackgroundCheck: application.agreeToBackgroundCheck,
      },

      nationalInsuranceNumber: application.nationalInsuranceNumber,

      // Application metadata
      appliedAt: application.applicationDate.toISOString(),
      applicationAge,
      complianceIssues,
      complianceWarnings,
      autoApproveEligible,
      reviewedAt: application.reviewedAt?.toISOString(),
      reviewedBy: application.reviewedBy,
      reviewNotes: application.reviewNotes,

      // User relationship
      userId: application.userId,
      user: application.User,
    };

    return NextResponse.json(transformedApplication);
  } catch (error) {
    console.error('Admin driver application details GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/drivers/applications/[id] - Update driver application status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Update application
    const updatedApplication = await prisma.driverApplication.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: user.name || user.email,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If approved, activate the user account
    if (status === 'approved' && updatedApplication.userId) {
      await prisma.user.update({
        where: { id: updatedApplication.userId },
        data: { isActive: true },
      });
    }

    // If rejected, deactivate the user account
    if (status === 'rejected' && updatedApplication.userId) {
      await prisma.user.update({
        where: { id: updatedApplication.userId },
        data: { isActive: false },
      });
    }

    return NextResponse.json({
      message: 'Application updated successfully',
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Admin driver application update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
