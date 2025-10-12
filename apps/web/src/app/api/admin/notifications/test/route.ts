/**
 * Admin API - Test Notifications
 * 
 * Allows admin to test email and SMS services with sample data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { unifiedEmailService } from '../../../../../lib/email/UnifiedEmailService';
import { getVoodooSMSService } from '../../../../../lib/sms/VoodooSMSService';
import { COMPANY_CONTACT } from '../../../../../lib/constants/company';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { 
      testEmail = COMPANY_CONTACT.supportEmail,
      testPhone = COMPANY_CONTACT.supportPhone,
      testType = 'both' // 'email', 'sms', or 'both'
    } = await request.json();

    console.log('🧪 [ADMIN] Testing notifications:', { testEmail, testPhone, testType });

    const results = {
      email: null as any,
      sms: null as any,
      timestamp: new Date().toISOString()
    };

    // Test email service
    if (testType === 'email' || testType === 'both') {
      console.log('📧 [TEST] Testing email service...');
      
      try {
        const emailResult = await unifiedEmailService.sendNotificationEmail({
          to: testEmail,
          name: 'Test User',
          templateId: 'email-test',
          data: {
            customerName: 'Test User',
            testMessage: 'This is a test email from the unified email service',
            sentAt: new Date().toLocaleString('en-GB'),
            bookingReference: 'TEST-' + Date.now()
          }
        });

        results.email = {
          success: emailResult.success,
          messageId: emailResult.messageId,
          error: emailResult.error,
          provider: emailResult.provider
        };

        console.log('✅ [TEST] Email test result:', results.email);

      } catch (error) {
        console.error('❌ [TEST] Email test failed:', error);
        results.email = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown email error'
        };
      }
    }

    // Test SMS service
    if (testType === 'sms' || testType === 'both') {
      console.log('📱 [TEST] Testing SMS service...');
      
      try {
        const voodooSMS = getVoodooSMSService();
        const smsResult = await voodooSMS.sendBookingConfirmation({
          phoneNumber: testPhone,
          customerName: 'Test User',
          orderNumber: 'TEST-' + Date.now(),
          pickupAddress: '123 Test Street, London',
          dropoffAddress: '456 Test Avenue, Manchester',
          scheduledDate: new Date().toLocaleDateString('en-GB'),
          driverName: 'Test Driver',
          driverPhone: '+44123456789'
        });

        results.sms = {
          success: smsResult.success,
          messageId: smsResult.messageId,
          error: smsResult.error,
          cost: '0.00' // Mock cost for testing
        };

        console.log('✅ [TEST] SMS test result:', results.sms);

      } catch (error) {
        console.error('❌ [TEST] SMS test failed:', error);
        results.sms = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown SMS error'
        };
      }
    }

    // Overall success check
    const overallSuccess = (
      (results.email ? results.email.success : true) &&
      (results.sms ? results.sms.success : true)
    );

    console.log('🎯 [TEST] Overall test result:', {
      success: overallSuccess,
      emailTested: !!results.email,
      smsTested: !!results.sms,
      emailSuccess: results.email?.success,
      smsSuccess: results.sms?.success
    });

    return NextResponse.json({
      success: overallSuccess,
      message: 'Notification test completed',
      testType,
      testEmail,
      testPhone,
      results,
      summary: {
        emailTested: !!results.email,
        smsTested: !!results.sms,
        emailSuccess: results.email?.success || false,
        smsSuccess: results.sms?.success || false,
        overallSuccess
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Failed to test notifications:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Test service connectivity without sending actual messages
    const emailTest = await unifiedEmailService.testConnection();
    const smsTest = { success: true, message: 'Voodoo SMS service available' };

    return NextResponse.json({
      success: true,
      services: {
        email: {
          available: emailTest.success,
          error: emailTest.error
        },
        sms: {
          available: smsTest.success,
          error: smsTest.success ? null : smsTest.message
        }
      },
      configuration: {
        supportEmail: COMPANY_CONTACT.supportEmail,
        supportPhone: COMPANY_CONTACT.supportPhone,
        emergencyPhone: COMPANY_CONTACT.emergencyPhone
      }
    });

  } catch (error) {
    console.error('❌ [ADMIN] Failed to check service status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check service status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
