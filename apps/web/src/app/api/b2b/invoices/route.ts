/**
 * B2B Invoices API
 * 
 * GET /api/b2b/invoices - List company invoices
 */

import { NextRequest, NextResponse } from 'next/server';
import { companyInvoiceService } from '@/lib/b2b';
import { validateApiKeyAuth, requireApiScope } from '@/lib/b2b/middleware';
import { CompanyInvoiceStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const ListInvoicesSchema = z.object({
  status: z.nativeEnum(CompanyInvoiceStatus).optional(),
  overdueOnly: z.coerce.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    // Validate API key authentication
    const authResult = await validateApiKeyAuth(request);
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    // Check scope
    const scopeCheck = requireApiScope(authResult.apiKey!.scopes, 'invoices:read');
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { success: false, error: scopeCheck.error },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = ListInvoicesSchema.parse({
      status: searchParams.get('status') || undefined,
      overdueOnly: searchParams.get('overdueOnly') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const result = await companyInvoiceService.list({
      companyId: authResult.apiKey!.companyId,
      status: params.status,
      overdueOnly: params.overdueOnly,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      page: params.page,
      limit: params.limit,
    });

    return NextResponse.json({
      success: true,
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('[B2B Invoices] GET error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list invoices' },
      { status: 500 }
    );
  }
}
