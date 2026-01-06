/**
 * Admin Companies API
 * 
 * GET /api/admin/companies - List all companies
 * POST /api/admin/companies - Create a new company
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { companyService } from '@/lib/b2b';
import { CompanyStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const CreateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  legalName: z.string().optional(),
  vatNumber: z.string().optional(),
  companyNumber: z.string().optional(),
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostcode: z.string().optional(),
  billingCountry: z.string().default('UK'),
  creditLimitGBP: z.number().min(0).optional(),
  paymentTermsDays: z.number().min(0).max(90).optional(),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

const ListCompaniesSchema = z.object({
  status: z.nativeEnum(CompanyStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'createdAt', 'creditLimitGBP']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const params = ListCompaniesSchema.parse({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    });

    const result = await companyService.list(params);

    return NextResponse.json({
      success: true,
      data: result.companies,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('[Admin Companies] GET error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list companies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const data = CreateCompanySchema.parse(body);

    // Check for duplicate VAT number
    if (data.vatNumber) {
      const existing = await companyService.getByVatNumber(data.vatNumber);
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'A company with this VAT number already exists' },
          { status: 409 }
        );
      }
    }

    const company = await companyService.create({
      ...data,
      createdBy: authResult.id,
    });

    return NextResponse.json({
      success: true,
      data: company,
      message: 'Company created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Companies] POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create company' },
      { status: 500 }
    );
  }
}
