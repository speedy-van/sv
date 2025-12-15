import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, service, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Check if Prisma is available
    if (!prisma) {
      console.error('Prisma client is not initialized');
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }

    try {
      // Create a contact inquiry record
      const contactInquiry = await prisma.contactInquiry.create({
        data: {
          name,
          email,
          phone: phone || null,
          service: service || null,
          message,
          status: 'pending',
          source: 'contact_form',
        },
      });

      // TODO: Send notification to admin
      // TODO: Send confirmation email to customer

      return NextResponse.json({
        success: true,
        message: 'Your message has been received. We\'ll get back to you within 2 hours.',
        id: contactInquiry.id,
      });
    } catch (dbError) {
      // If database operation fails, log the inquiry to console
      // This is a fallback to ensure we don't lose customer inquiries
      console.error('Database error - logging contact inquiry:', {
        name,
        email,
        phone,
        service,
        message,
        timestamp: new Date().toISOString(),
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });

      // Still return success to user (inquiry is logged)
      return NextResponse.json({
        success: true,
        message: 'Your message has been received. We\'ll get back to you within 2 hours.',
        fallback: true,
      });
    }
  } catch (error) {
    console.error('Contact form submission error:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to submit contact form',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}
