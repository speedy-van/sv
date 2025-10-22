import { NextRequest, NextResponse } from 'next/server';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing email service configuration...');
    
    // Test email service connection
    const testResult = await unifiedEmailService.testConnection();
    
    console.log('📧 Email service test result:', testResult);
    
    return NextResponse.json({
      success: true,
      message: 'Email service test completed',
      result: testResult,
      environment: {
        hasSendGrid: !!process.env.SENDGRID_API_KEY,
        hasResend: !!process.env.RESEND_API_KEY,
        mailFrom: process.env.MAIL_FROM,
      }
    });
  } catch (error) {
    console.error('❌ Email service test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: {
          hasSendGrid: !!process.env.SENDGRID_API_KEY,
          hasResend: !!process.env.RESEND_API_KEY,
          mailFrom: process.env.MAIL_FROM,
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, testType = 'password-reset' } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    console.log(`🧪 Sending test ${testType} email to:`, email);
    
    let result;
    
    if (testType === 'password-reset') {
      result = await unifiedEmailService.sendDriverPasswordReset({
        email,
        driverName: 'Test Driver',
        resetUrl: 'https://speedy-van.co.uk/driver/reset?token=test-token-123',
        resetToken: 'test-token-123'
      });
    } else {
      return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
    }
    
    console.log('📧 Test email result:', result);
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Test email failed',
      result
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}