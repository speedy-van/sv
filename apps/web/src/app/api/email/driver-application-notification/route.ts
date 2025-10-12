import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

export async function POST(request: NextRequest) {
  try {
    const { applicationData } = await request.json();

    if (!applicationData) {
      return NextResponse.json(
        { error: 'Application data is required' },
        { status: 400 }
      );
    }

    // Send driver application notification email
    console.log('📧 Sending driver application notification...');
    const emailResult = await unifiedEmailService.sendDriverApplicationConfirmation(applicationData);

    console.log('📧 Driver Application Email Result:', {
      success: emailResult.success,
      messageId: emailResult.messageId,
      provider: emailResult.provider,
      applicationId: applicationData.applicationId,
      driverName: applicationData.driverName,
    });

    // Create email record in database for tracking
    const emailRecord = await prisma.adminNotification.create({
      data: {
        type: 'driver_application_email_sent',
        title: 'Driver Application Email Sent',
        message: `Email notification sent for ${applicationData.driverName}`,
        priority: 'medium',
        data: {
          applicationId: applicationData.applicationId,
          driverName: applicationData.driverName,
          emailSent: true,
          sentAt: new Date().toISOString(),
        },
        actionUrl: `/admin/drivers/applications/${applicationData.applicationId}`,
        actorId: applicationData.userId,
        actorRole: 'system',
        isRead: false,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: emailResult.success,
      message: emailResult.success 
        ? 'Driver application email notification sent successfully'
        : 'Failed to send driver application email notification',
      emailId: emailRecord.id,
      emailResult: {
        success: emailResult.success,
        messageId: emailResult.messageId,
        provider: emailResult.provider,
        error: emailResult.error,
      },
    });
  } catch (error) {
    console.error('❌ Error generating driver application email:', error);
    return NextResponse.json(
      { error: 'Failed to generate email notification' },
      { status: 500 }
    );
  }
}
