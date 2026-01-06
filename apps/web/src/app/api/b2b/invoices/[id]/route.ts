/**
 * B2B Invoice Detail API
 * 
 * GET /api/b2b/invoices/[id] - Get invoice details
 * GET /api/b2b/invoices/[id]/pdf - Download invoice PDF
 */

import { NextRequest, NextResponse } from 'next/server';
import { companyInvoiceService } from '@/lib/b2b';
import { validateApiKeyAuth, requireApiScope } from '@/lib/b2b/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const invoice = await companyInvoiceService.getById(params.id);

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Verify invoice belongs to the company
    if (invoice.companyId !== authResult.apiKey!.companyId) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error: any) {
    console.error('[B2B Invoice] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get invoice' },
      { status: 500 }
    );
  }
}
