import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVoodooSMSService } from '@/lib/sms/VoodooSMSService';

// Validation schema for SMS sending
const smsSendSchema = z.object({
  to: z.string().min(10).max(20),
  message: z.string().min(1).max(1600),
  sender: z.string().optional().default('SpeedyVan'),
});

/**
 * Send SMS using Voodoo SMS API
 * Replaced UK SMS WORK completely
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { to, message } = smsSendSchema.parse(body);

    console.log('=== ADMIN SMS SEND REQUEST ===');
    console.log('DISABLE_SMS:', process.env.DISABLE_SMS);
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
        { 
          error: 'Failed to send SMS',
          details: result.error
        },
        { status: 500 }
      );
    }

    console.log('✅ SMS sent successfully via Voodoo SMS');
    console.log('Message ID:', result.messageId);

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'SMS sent successfully via Voodoo SMS',
      creditsUsed: result.credits || 1,
      destination: to,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('=== SMS SEND ERROR ===');
    console.error('Error:', error);
    
    if (error instanceof z.ZodError) {
      console.error('Validation Error:', error.issues);
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

