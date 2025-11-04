import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Test email configuration
    const { default: UnifiedEmailService } = await import('@/lib/email/UnifiedEmailService');
    
    console.log('🧪 Testing email configuration...');
    
    // Check environment variables
    const hasResend = !!process.env.RESEND_API_KEY;
    const hasSendGrid = !!process.env.SENDGRID_API_KEY;
    const mailFrom = process.env.MAIL_FROM || 'noreply@speedy-van.co.uk';
    
    console.log('📧 Email Configuration:', {
      hasResend,
      hasSendGrid,
      mailFrom,
      resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
      sendgridKeyLength: process.env.SENDGRID_API_KEY?.length || 0,
    });

    // Try to send a test email
    const testEmail = 'test@speedy-van.co.uk'; // Replace with admin email
    const testResult = await UnifiedEmailService.sendCustomEmail(
      testEmail,
      'Test Email from Speedy Van',
      `
        <html>
          <body>
            <h2>🧪 Email Service Test</h2>
            <p>This is a test email sent at ${new Date().toISOString()}</p>
            <p>If you receive this, your email service is working correctly!</p>
          </body>
        </html>
      `
    );

    console.log('✅ Test email result:', testResult);

    return NextResponse.json({
      success: true,
      configuration: {
        hasResend,
        hasSendGrid,
        mailFrom,
      },
      testEmailResult: testResult,
      message: testResult.success 
        ? `✅ Email sent successfully via ${testResult.provider}!` 
        : `❌ Email failed: ${testResult.error}`
    });

  } catch (error) {
    console.error('❌ Test email error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

