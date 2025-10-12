import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics-service-v2';

export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics/customers
 * 
 * Get customer analytics for a given time period
 * Query parameters:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - limit: number of customers to return (default: 50, max: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');

    // Default to last 30 days if no dates provided
    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Parse limit with validation
    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;
    if (limitParam && (isNaN(limit) || limit < 1)) {
      return NextResponse.json(
        { error: 'Limit must be a positive number, maximum 100.' },
        { status: 400 }
      );
    }

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO date strings.' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date.' },
        { status: 400 }
      );
    }

    const customers = await AnalyticsService.getCustomerAnalytics(startDate, endDate, limit);

    return NextResponse.json({
      success: true,
      data: customers,
      meta: {
        requestedAt: new Date().toISOString(),
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        },
        pagination: {
          limit,
          returned: customers.length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}