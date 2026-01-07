/**
 * Admin Company Detail API
 * 
 * GET /api/admin/companies/[id] - Get company details
 * PUT /api/admin/companies/[id] - Update company
 * DELETE /api/admin/companies/[id] - Suspend/Close company
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { companyService } from '@/lib/b2b';
import { CompanyStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const UpdateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  legalName: z.string().optional(),
  vatNumber: z.string().optional(),
  companyNumber: z.string().optional(),
  billingAddressLine1: z.string().optional(),
  billingAddressLine2: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostcode: z.string().optional(),
  billingCountry: z.string().optional(),
  creditLimitGBP: z.number().min(0).optional(),
  paymentTermsDays: z.number().min(0).max(90).optional(),
  status: z.nativeEnum(CompanyStatus).optional(),
  industry: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
  riskScore: z.number().min(0).max(100).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const company = await companyService.getById(id);

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get additional statistics
    const statistics = await companyService.getStatistics(id);

    return NextResponse.json({
      success: true,
      data: {
        ...company,
        statistics,
      },
    });
  } catch (error: any) {
    console.error('[Admin Company] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get company' },
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

    const { id } = await params;
    const body = await request.json();
    const data = UpdateCompanySchema.parse(body);

    // Check if company exists
    const existing = await companyService.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check for duplicate VAT number if changing
    if (data.vatNumber && data.vatNumber !== existing.vatNumber) {
      const vatExists = await companyService.getByVatNumber(data.vatNumber);
      if (vatExists) {
        return NextResponse.json(
          { success: false, error: 'A company with this VAT number already exists' },
          { status: 409 }
        );
      }
    }

    const company = await companyService.update(id, data, authResult.id);

    return NextResponse.json({
      success: true,
      data: company,
      message: 'Company updated successfully',
    });
  } catch (error: any) {
    console.error('[Admin Company] PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update company' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'suspend';
    const reason = searchParams.get('reason') || 'Admin action';

    const existing = await companyService.getById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    let company;
    if (action === 'close') {
      company = await companyService.update(
        id,
        { status: CompanyStatus.CLOSED },
        authResult.id
      );
    } else {
      company = await companyService.suspend(id, reason, authResult.id);
    }

    return NextResponse.json({
      success: true,
      data: company,
      message: `Company ${action === 'close' ? 'closed' : 'suspended'} successfully`,
    });
  } catch (error: any) {
    console.error('[Admin Company] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to suspend company' },
      { status: 500 }
    );
  }
}
