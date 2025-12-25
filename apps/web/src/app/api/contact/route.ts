import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UnifiedEmailService } from '@/lib/email/UnifiedEmailService';
import { getPusherServer } from '@/lib/pusher';

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

    let contactInquiryId: string | null = null;
    let submittedAt = new Date().toISOString();

    // Try to save to database (optional - won't block email)
    try {
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
      contactInquiryId = contactInquiry.id;
      submittedAt = contactInquiry.createdAt.toISOString();
      console.log('✅ Contact inquiry saved to database:', contactInquiryId);
      
      // ✅ Send admin notification for new contact inquiry
      try {
        const { notifyNewContact } = await import('@/lib/services/admin-notification-service');
        await notifyNewContact(contactInquiry.id, name, email);
        console.log('📢 Admin notified of new contact inquiry');
      } catch (notifError) {
        console.error('⚠️ Failed to send admin notification:', notifError);
      }
      
      // Send Pusher notification for Live Chat messages
      if (body.source === 'live-chat') {
        try {
          const pusher = getPusherServer();
          await pusher.trigger('admin-notifications', 'live-chat-message', {
            type: 'live-chat-message',
            data: {
              inquiryId: contactInquiry.id,
              customerName: name,
              customerEmail: email,
              message: message,
              timestamp: submittedAt,
              chatSessionId: body.chatSessionId || null,
            },
          });
          console.log('✅ Live chat notification sent to admin');
        } catch (pusherError) {
          console.error('⚠️ Failed to send live chat notification:', pusherError);
          // Don't fail the request if Pusher fails
        }
      }
    } catch (dbError) {
      // Log database error but continue to send email
      console.error('⚠️ Database error (non-critical) - inquiry logged to console:', {
        name,
        email,
        phone,
        service,
        message,
        timestamp: submittedAt,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }

    // Always send confirmation email (regardless of database status)
    try {
      await UnifiedEmailService.sendContactInquiryConfirmation({
        customerEmail: email,
        customerName: name,
        service: service || undefined,
        message,
        submittedAt,
      });
      console.log('✅ Contact confirmation email sent to:', email);
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('⚠️ Failed to send confirmation email:', emailError);
    }

    // Always return success to user
    return NextResponse.json({
      success: true,
      message: 'Your message has been received. We\'ll get back to you within 2 hours.',
      id: contactInquiryId,
    });
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
