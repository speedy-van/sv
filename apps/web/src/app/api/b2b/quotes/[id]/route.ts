/**
 * B2B Quote Detail API
 * 
 * GET /api/b2b/quotes/[id] - Get quote details
 * PUT /api/b2b/quotes/[id] - Accept or reject quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { companyQuoteService } from '@/lib/b2b';
import { validateApiKeyAuth, requireApiScope } from '@/lib/b2b/middleware';
import { z } from 'zod';

// Validation schema
const UpdateQuoteSchema = z.object({
  action: z.enum(['accept', 'reject']),
  reason: z.string().optional(), // Required for rejection
});

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
    const scopeCheck = requireApiScope(authResult.apiKey!.scopes, 'quotes:read');
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { success: false, error: scopeCheck.error },
        { status: 403 }
      );
    }

    const quote = await companyQuoteService.getById(params.id);

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Verify quote belongs to the company
    if (quote.companyId !== authResult.apiKey!.companyId) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Mark as viewed if sent
    await companyQuoteService.markViewed(params.id);

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    console.error('[B2B Quote] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get quote' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const scopeCheck = requireApiScope(authResult.apiKey!.scopes, 'quotes:accept');
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { success: false, error: scopeCheck.error },
        { status: 403 }
      );
    }

    // Get quote and verify ownership
    const quote = await companyQuoteService.getById(params.id);
    if (!quote || quote.companyId !== authResult.apiKey!.companyId) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = UpdateQuoteSchema.parse(body);

    let updatedQuote;
    const actorId = `api:${authResult.apiKey!.id}`;

    if (data.action === 'accept') {
      updatedQuote = await companyQuoteService.accept(params.id, actorId);
    } else {
      if (!data.reason) {
        return NextResponse.json(
          { success: false, error: 'Reason is required for rejection' },
          { status: 400 }
        );
      }
      updatedQuote = await companyQuoteService.reject(params.id, data.reason, actorId);
    }

    return NextResponse.json({
      success: true,
      data: updatedQuote,
      message: `Quote ${data.action}ed successfully`,
    });
  } catch (error: any) {
    console.error('[B2B Quote] PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update quote' },
      { status: 500 }
    );
  }
}
