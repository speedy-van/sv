/**
 * B2B Bookings API
 * 
 * GET /api/b2b/bookings - List company bookings
 * POST /api/b2b/bookings - Create a new booking (direct or from quote)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKeyAuth, requireApiScope } from '@/lib/b2b/middleware';
import { companyQuoteService, companyService } from '@/lib/b2b';
import { z } from 'zod';

// Validation schema
const CreateBookingSchema = z.object({
  // From quote
  quoteId: z.string().optional(),
  
  // Or direct booking details
  pickupAddressLine1: z.string().optional(),
  pickupAddressLine2: z.string().optional(),
  pickupCity: z.string().optional(),
  pickupPostcode: z.string().optional(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  pickupNotes: z.string().optional(),
  
  dropoffAddressLine1: z.string().optional(),
  dropoffAddressLine2: z.string().optional(),
  dropoffCity: z.string().optional(),
  dropoffPostcode: z.string().optional(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  dropoffNotes: z.string().optional(),
  
  scheduledDate: z.string().datetime(),
  serviceType: z.string().optional(),
  vehicleType: z.string().optional(),
  crewSize: z.number().min(1).max(4).default(2),
  items: z.array(z.any()).optional(),
  specialRequirements: z.string().optional(),
  
  // B2B specific
  poNumber: z.string().optional(),
  costCenter: z.string().optional(),
  projectCode: z.string().optional(),
  notes: z.string().optional(),
});

const ListBookingsSchema = z.object({
  status: z.string().optional(),
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
    const scopeCheck = requireApiScope(authResult.apiKey!.scopes, 'bookings:read');
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { success: false, error: scopeCheck.error },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = ListBookingsSchema.parse({
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    // Get company bookings
    const where: any = {
      companyId: authResult.apiKey!.companyId,
    };

    if (params.status) {
      where.Booking = { status: params.status };
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    const [bookings, total] = await Promise.all([
      prisma.companyBooking.findMany({
        where,
        include: {
          Booking: {
            select: {
              id: true,
              reference: true,
              status: true,
              scheduledAt: true,
              totalGBP: true,
              pickupLat: true,
              pickupLng: true,
              dropoffLat: true,
              dropoffLng: true,
              customerName: true,
              customerEmail: true,
              customerPhone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.companyBooking.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: bookings.map(cb => ({
        id: cb.id,
        bookingId: cb.bookingId,
        reference: cb.Booking.reference,
        status: cb.Booking.status,
        scheduledAt: cb.Booking.scheduledAt,
        totalGBP: cb.Booking.totalGBP,
        poNumber: cb.poNumber,
        costCenter: cb.costCenter,
        projectCode: cb.projectCode,
        createdAt: cb.createdAt,
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error: any) {
    console.error('[B2B Bookings] GET error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list bookings' },
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
    const scopeCheck = requireApiScope(authResult.apiKey!.scopes, 'bookings:write');
    if (!scopeCheck.allowed) {
      return NextResponse.json(
        { success: false, error: scopeCheck.error },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = CreateBookingSchema.parse(body);

    const companyId = authResult.apiKey!.companyId;

    // Check company credit
    const company = await companyService.getById(companyId);
    if (!company || company.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Company account is not active' },
        { status: 403 }
      );
    }

    // If from quote, convert quote to booking
    if (data.quoteId) {
      const quote = await companyQuoteService.getById(data.quoteId);
      if (!quote || quote.companyId !== companyId) {
        return NextResponse.json(
          { success: false, error: 'Quote not found' },
          { status: 404 }
        );
      }

      // Check credit availability
      const hasCredit = await companyService.hasAvailableCredit(companyId, quote.totalGBP);
      if (!hasCredit) {
        return NextResponse.json(
          { success: false, error: 'Insufficient credit limit' },
          { status: 402 }
        );
      }

      // Convert quote to booking
      const result = await companyQuoteService.convertToBooking(
        data.quoteId,
        `api:${authResult.apiKey!.id}`,
        {
          poNumber: data.poNumber,
          costCenter: data.costCenter,
          projectCode: data.projectCode,
          notes: data.notes,
        }
      );

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Booking created from quote successfully',
      }, { status: 201 });
    }

    // Direct booking - validate required fields
    if (!data.pickupAddressLine1 || !data.pickupPostcode || !data.dropoffAddressLine1 || !data.dropoffPostcode) {
      return NextResponse.json(
        { success: false, error: 'Pickup and dropoff addresses are required for direct booking' },
        { status: 400 }
      );
    }

    // TODO: Create direct booking using booking service
    // For now, return a placeholder response
    return NextResponse.json({
      success: false,
      error: 'Direct booking not yet implemented. Please create a quote first.',
    }, { status: 501 });
  } catch (error: any) {
    console.error('[B2B Bookings] POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}
