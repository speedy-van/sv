import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Get all contact inquiries
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where = status !== 'all' ? { status } : {};

    try {
      const [inquiries, total] = await Promise.all([
        prisma.contactInquiry.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.contactInquiry.count({ where }),
      ]);

      return NextResponse.json({
        inquiries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (dbError) {
      console.error('Database error in contact inquiries:', dbError);
      
      // Return empty result if table doesn't exist
      if (dbError instanceof Error && (
        dbError.message.includes('does not exist') ||
        dbError.message.includes('relation') ||
        dbError.message.includes('table')
      )) {
        console.warn('ContactInquiry table does not exist. Returning empty result.');
        return NextResponse.json({
          inquiries: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
          },
          warning: 'ContactInquiry table not found in database',
        });
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching contact inquiries:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch contact inquiries',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

// Update contact inquiry status
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    try {
      const inquiry = await prisma.contactInquiry.update({
        where: { id },
        data: { status },
      });

      return NextResponse.json(inquiry);
    } catch (dbError) {
      console.error('Database error updating contact inquiry:', dbError);
      
      if (dbError instanceof Error && (
        dbError.message.includes('does not exist') ||
        dbError.message.includes('relation') ||
        dbError.message.includes('table')
      )) {
        return NextResponse.json(
          { error: 'ContactInquiry table not found in database' },
          { status: 404 }
        );
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating contact inquiry:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update contact inquiry',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}
