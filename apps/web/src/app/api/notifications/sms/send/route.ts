import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVoodooSMSService } from '@/lib/sms/VoodooSMSService';

// Validation schema for SMS sending
const smsSendSchema = z.object({
  to: z.string().min(10).max(15),
  message: z.string().min(1).max(1600), // Allow for multi-part messages
  sender: z.string().optional().default('SpeedyVan'),
});

/**
 * Send SMS via Voodoo SMS
 * Replaced UK SMS WORK completely
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message } = smsSendSchema.parse(body);

    console.log('=== NOTIFICATION SMS REQUEST ===');
    console.log('To:', to);
    console.log('Message:', message);

    // Get Voodoo SMS service
    const voodooSMS = getVoodooSMSService();

    // Send SMS via Voodoo SMS
    const result = await voodooSMS.sendSMS({
      to,
      message,
    });

    if (!result.success) {
      console.error('Failed to send SMS:', result.error);
      return NextResponse.json(
        { error: 'Failed to send SMS', details: result.error },
        { status: 500 }
      );
    }

    console.log('✅ SMS sent successfully via Voodoo SMS');

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'SMS sent successfully via Voodoo SMS',
      creditsUsed: result.credits || 1,
    });

  } catch (error) {
    console.error('SMS sending error:', error);
    
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

// Batch SMS sending
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = z.object({
      messages: z.array(z.object({
        to: z.string().min(10).max(15),
        message: z.string().min(1).max(1600),
      })),
    }).parse(body);

    const voodooSMS = getVoodooSMSService();
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const msg of messages) {
      const result = await voodooSMS.sendSMS({
        to: msg.to,
        message: msg.message,
      });

      results.push(result);
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return NextResponse.json({
      success: failureCount === 0,
      totalSent: successCount,
      totalFailed: failureCount,
      results,
    });

  } catch (error) {
    console.error('Batch SMS sending error:', error);
    
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
