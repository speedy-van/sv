import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

// Validation schema for email sending
const emailSendSchema = z.object({
  to: z.string().email(),
  templateId: z.string(),
  data: z.record(z.string(), z.any()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, templateId, data } = emailSendSchema.parse(body);

    console.log('📧 Sending notification email via unified service:', { to, templateId });

    // Send email using unified service
    const result = await unifiedEmailService.sendNotificationEmail({
      email: to,
      customerName: data.customerName || 'Customer',
      templateId,
      data
    });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      provider: result.provider,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Email sending error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
