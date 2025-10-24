import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      address,
      postcode,
      vehicleInfo,
      bankAccount,
      taxInfo,
    } = body;

    // Validate required fields
    if (!fullName || !email || !phone || !address || !postcode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!vehicleInfo || !bankAccount) {
      return NextResponse.json(
        { error: 'Vehicle and bank information are required' },
        { status: 400 }
      );
    }

    // Check if email already exists in applications or drivers
    const existingApplication = await prisma.driverApplication.findUnique({
      where: { email },
    });

    if (existingApplication) {
      return NextResponse.json(
        { 
          error: 'Application already exists',
          details: 'An application with this email already exists',
          applicationId: existingApplication.id,
          status: existingApplication.status,
        },
        { status: 409 }
      );
    }

    // Check if user is already a driver
    const existingDriver = await prisma.driver.findFirst({
      where: {
        User: {
          email: email,
        },
      },
    });

    if (existingDriver) {
      return NextResponse.json(
        { 
          error: 'Already a driver',
          details: 'This email is already registered as a driver',
        },
        { status: 409 }
      );
    }

    // Create driver application
    const application = await prisma.driverApplication.create({
      data: {
        firstName: 'Unknown',
        lastName: 'User',
        email,
        phone,
        dateOfBirth: new Date('1990-01-01'),
        addressLine1: address || 'Unknown Address',
        addressLine2: null,
        city: 'Unknown',
        postcode,
        county: 'Unknown',
        nationalInsuranceNumber: 'AB123456C',
        drivingLicenseNumber: 'Unknown',
        drivingLicenseExpiry: new Date('2030-01-01'),
        drivingLicenseFrontImage: null,
        drivingLicenseBackImage: null,
        insuranceProvider: 'Unknown',
        insurancePolicyNumber: 'Unknown',
        insuranceExpiry: new Date('2030-01-01'),
        insuranceDocument: null,
        bankName: 'Unknown Bank',
        accountHolderName: 'Unknown',
        sortCode: '000000',
        accountNumber: '00000000',
        rightToWorkShareCode: 'Unknown',
        rightToWorkDocument: null,
        emergencyContactName: 'Unknown',
        emergencyContactPhone: '0000000000',
        emergencyContactRelationship: 'Unknown',
        agreeToTerms: true,
        agreeToDataProcessing: true,
        agreeToBackgroundCheck: true,
        status: 'pending',
      },
    });

    console.log('📝 New driver application created:', {
      id: application.id,
      email: application.email,
      fullName: `${application.firstName} ${application.lastName}`,
      status: application.status,
    });

    // Send confirmation email
    try {
      const emailResult = await unifiedEmailService.sendDriverApplicationConfirmation({
        driverEmail: application.email,
        driverName: `${application.firstName} ${application.lastName}`,
        applicationId: application.id,
        appliedAt: new Date().toISOString(),
      });

      if (emailResult.success) {
        console.log('✅ Driver application confirmation email sent:', {
          applicationId: application.id,
          email: application.email,
          messageId: emailResult.messageId,
          provider: emailResult.provider,
        });
      } else {
        console.warn('⚠️ Failed to send driver application confirmation email:', {
          applicationId: application.id,
          email: application.email,
          error: emailResult.error,
        });
      }
    } catch (emailError) {
      console.error('❌ Error sending driver application confirmation email:', emailError);
      // Don't fail the application if email fails
    }

    // Send SMS confirmation to the driver
    console.log('📱 Sending driver application confirmation SMS...');
    try {
      const { getVoodooSMSService } = await import('@/lib/sms/VoodooSMSService');
      const smsService = getVoodooSMSService();
      
      const smsMessage = `Hi ${application.firstName}, your Speedy Van driver application has been received! We'll review it within 24-48 hours and notify you of the status. Application ID: ${application.id}. Call 07901846297 for support.`;
      
      const smsResult = await smsService.sendSMS({
        to: application.phone,
        message: smsMessage
      });

      if (smsResult.success) {
        console.log(`✅ Driver application confirmation SMS sent to ${application.phone}`);
      } else {
        console.error('❌ Driver application confirmation SMS failed:', smsResult.error);
      }
    } catch (smsError) {
      console.error('❌ SMS service error for driver application:', smsError);
      // Don't fail the application submission if SMS fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: application.id,
        status: application.status,
        nextSteps: [
          'We will review your application within 24-48 hours',
          'You will receive an email notification about the status',
          'If approved, you will receive login credentials to access the driver portal',
        ],
      },
    });

  } catch (error) {
    console.error('❌ Error creating driver application:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
