import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
