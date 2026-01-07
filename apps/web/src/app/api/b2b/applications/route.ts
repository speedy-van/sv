/**
 * B2B Applications API
 * 
 * Handles company applications to join the B2B program
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const applicationSchema = z.object({
  // Company Details
  companyName: z.string().min(1, 'Company name is required'),
  legalName: z.string().min(1, 'Legal name is required'),
  registrationNumber: z.string().optional(),
  vatNumber: z.string().optional(),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.string().min(1, 'Company size is required'),
  website: z.string().optional(),
  
  // Contact Person
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(1, 'Phone number is required'),
  contactRole: z.string().min(1, 'Role is required'),
  
  // Address
  addressLine1: z.string().min(1, 'Address is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  country: z.string().default('United Kingdom'),
  
  // Business Requirements
  estimatedMonthlyBookings: z.string().min(1, 'Estimated volume is required'),
  primaryUseCase: z.string().min(1, 'Use case is required'),
  additionalNotes: z.string().optional(),
  
  // Agreement
  acceptTerms: z.boolean().refine((v) => v === true, 'You must accept the terms'),
  acceptPrivacy: z.boolean().refine((v) => v === true, 'You must accept the privacy policy'),
});

// POST: Submit a new B2B application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = applicationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if email already exists in applications
    const existingApplication = await prisma.b2BApplication.findFirst({
      where: { 
        contactEmail: data.contactEmail,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'An application with this email is already pending review',
        },
        { status: 400 }
      );
    }

    // Check if company already exists
    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [
          { name: data.companyName },
          { legalName: data.legalName },
          { email: data.contactEmail },
        ],
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'A company with this name or email already exists. Please contact support.',
        },
        { status: 400 }
      );
    }

    // Create the application
    const application = await prisma.b2BApplication.create({
      data: {
        // Company Details
        companyName: data.companyName,
        legalName: data.legalName,
        registrationNumber: data.registrationNumber || null,
        vatNumber: data.vatNumber || null,
        industry: data.industry,
        companySize: data.companySize,
        website: data.website || null,
        
        // Contact Person
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactRole: data.contactRole,
        
        // Address
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        postcode: data.postcode,
        country: data.country,
        
        // Business Requirements
        estimatedMonthlyBookings: data.estimatedMonthlyBookings,
        primaryUseCase: data.primaryUseCase,
        additionalNotes: data.additionalNotes || null,
        
        // Status
        status: 'PENDING',
        acceptedTermsAt: new Date(),
        acceptedPrivacyAt: new Date(),
      },
    });

    // TODO: Send email notification to admin
    // TODO: Send confirmation email to applicant

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        message: 'Application submitted successfully',
      },
    });
  } catch (error) {
    console.error('B2B Application error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

// GET: List applications (admin only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.b2BApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.b2BApplication.count({ where }),
    ]);

    // Get stats
    const stats = await prisma.b2BApplication.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const statsMap = {
      pending: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
    };

    stats.forEach((s) => {
      if (s.status === 'PENDING') statsMap.pending = s._count.status;
      if (s.status === 'UNDER_REVIEW') statsMap.underReview = s._count.status;
      if (s.status === 'APPROVED') statsMap.approved = s._count.status;
      if (s.status === 'REJECTED') statsMap.rejected = s._count.status;
    });

    return NextResponse.json({
      success: true,
      data: applications,
      stats: statsMap,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
