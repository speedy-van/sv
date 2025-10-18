/**
 * Individual Quote API Routes
 * GET /api/quotes/[id] - Get quote by ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { QuoteService } from '@/lib/services/quote-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    
    if (!quoteId) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    const quote = await QuoteService.getQuote(quoteId);

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote
    });

  } catch (error) {
    console.error('Quote retrieval error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const body = await request.json();
    
    if (body.action === 'refresh') {
      const refreshedQuote = await QuoteService.refreshQuote(quoteId);
      
      if (!refreshedQuote) {
        return NextResponse.json(
          { error: 'Could not refresh quote' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: refreshedQuote
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Quote action error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}