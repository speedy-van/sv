import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected, under_review, requires_additional_info
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    // Build where clause
    const whereClause: any = {};
    
    if (status) {
      whereClause.status = status;
    }
    
     if (search) {
       whereClause.OR = [
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

    // Get applications with pagination
    const [applications, totalCount] = await Promise.all([
      prisma.driverApplication.findMany({
        where: whereClause,
        orderBy: { applicationDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.driverApplication.count({ where: whereClause }),
    ]);

    // Get status counts for summary
    const statusCounts = await prisma.driverApplication.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const statusSummary = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const response = {
      success: true,
      data: {
        applications: applications.map(app => ({
          id: app.id,
          fullName: `${app.firstName} ${app.lastName}`,
          firstName: app.firstName,
          lastName: app.lastName,
          email: app.email,
          phone: app.phone,
          address: `${app.addressLine1}${app.addressLine2 ? ', ' + app.addressLine2 : ''}, ${app.city}, ${app.postcode}`,
          addressLine1: app.addressLine1,
          addressLine2: app.addressLine2,
          city: app.city,
          county: app.county,
          postcode: app.postcode,
          dateOfBirth: app.dateOfBirth,
          nationalInsuranceNumber: app.nationalInsuranceNumber,
          drivingLicenseNumber: app.drivingLicenseNumber,
          drivingLicenseExpiry: app.drivingLicenseExpiry,

          // Bank Information
          bankName: app.bankName,
          accountHolderName: app.accountHolderName,
          sortCode: app.sortCode,
          accountNumber: app.accountNumber,

          // Documents and Files
          drivingLicenseFrontImage: app.drivingLicenseFrontImage,
          drivingLicenseBackImage: app.drivingLicenseBackImage,
          insuranceDocument: app.insuranceDocument,
          rightToWorkDocument: app.rightToWorkDocument,

          // Insurance Details
          insuranceProvider: app.insuranceProvider,
          insurancePolicyNumber: app.insurancePolicyNumber,
          insuranceExpiry: app.insuranceExpiry,

          // Right to Work Details
          rightToWorkShareCode: app.rightToWorkShareCode,

          // Application Status and Review
          status: app.status,
          reviewNotes: app.reviewNotes,
          reviewedBy: app.reviewedBy,
          reviewedAt: app.reviewedAt,
          applicationDate: app.applicationDate,

          // Metadata
          userId: app.userId,
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
        summary: {
          total: totalCount,
          statusCounts: statusSummary,
        },
      },
    };

    console.log(`📋 Admin fetched driver applications:`, {
      total: totalCount,
      page,
      status,
      search,
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching driver applications:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch driver applications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
