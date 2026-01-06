/**
 * B2B Quotes API
 * 
 * GET /api/b2b/quotes - List quotes (API key or session auth)
 * POST /api/b2b/quotes - Create a new quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { companyQuoteService } from '@/lib/b2b';
import { validateApiKeyAuth, requireApiScope } from '@/lib/b2b/middleware';
import { CompanyQuoteStatus } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const CreateQuoteSchema = z.object({
  // Pickup
  pickupAddressLine1: z.string().min(1, 'Pickup address is required'),
  pickupAddressLine2: z.string().optional(),
  pickupCity: z.string().min(1, 'Pickup city is required'),
  pickupPostcode: z.string().min(1, 'Pickup postcode is required'),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  pickupNotes: z.string().optional(),
  
  // Dropoff
  dropoffAddressLine1: z.string().min(1, 'Dropoff address is required'),
  dropoffAddressLine2: z.string().optional(),
  dropoffCity: z.string().min(1, 'Dropoff city is required'),
  dropoffPostcode: z.string().min(1, 'Dropoff postcode is required'),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  dropoffNotes: z.string().optional(),
  
  // Service
  scheduledDate: z.string().datetime().optional(),
  serviceType: z.string().optional(),
  vehicleType: z.string().optional(),
  crewSize: z.number().min(1).max(4).default(2),
  items: z.array(z.any()).optional(),
  specialRequirements: z.string().optional(),
  
  // Validity
  validDays: z.number().min(1).max(30).default(7),
});

const ListQuotesSchema = z.object({
  status: z.nativeEnum(CompanyQuoteStatus).optional(),
  search: z.string().optional(),
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
    const scopeCheck = requireApiScope(authResult.apiKey!.scopes, 'quotes:read');
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { success: false, error: scopeCheck.error },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = ListQuotesSchema.parse({
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    const result = await companyQuoteService.list({
      companyId: authResult.apiKey!.companyId,
      ...params,
    });

    return NextResponse.json({
      success: true,
      data: result.quotes,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('[B2B Quotes] GET error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list quotes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const scopeCheck = requireApiScope(authResult.apiKey!.scopes, 'quotes:write');
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { success: false, error: scopeCheck.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = CreateQuoteSchema.parse(body);

    const quote = await companyQuoteService.create({
      companyId: authResult.apiKey!.companyId,
      ...data,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      createdBy: `api:${authResult.apiKey!.id}`,
    });

    return NextResponse.json({
      success: true,
      data: quote,
      message: 'Quote created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[B2B Quotes] POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create quote' },
      { status: 500 }
    );
  }
}
