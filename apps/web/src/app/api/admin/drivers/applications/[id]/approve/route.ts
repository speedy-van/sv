import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { UnifiedEmailService } from '@/lib/email/UnifiedEmailService';

export const dynamic = 'force-dynamic';

// POST /api/admin/drivers/applications/[id]/approve - Approve driver application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔧 [APPROVE DEBUG] Starting approval process for ID:', (await params).id);
    
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { id } = await params;
    console.log('🔧 [APPROVE DEBUG] Application ID:', id);
    
    const body = await request.json();
    console.log('🔧 [APPROVE DEBUG] Approving application');

    // Update application status to approved
    const updatedApplication = await prisma.driverApplication.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: user.name || user.email,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userId: true,
        status: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('🔧 [APPROVE DEBUG] Application updated:', updatedApplication.id);

    // Activate the user account
    if (updatedApplication.userId) {
      await prisma.user.update({
        where: { id: updatedApplication.userId },
        data: { isActive: true },
      });
      console.log('🔧 [APPROVE DEBUG] User account activated:', updatedApplication.userId);
    }

    // Create notification for the driver
    if (updatedApplication.userId) {
      // Find the Driver record associated with this User
      const driverRecord = await prisma.driver.findUnique({
        where: { userId: updatedApplication.userId },
        select: { id: true },
      });

      if (driverRecord) {
        await prisma.driverNotification.create({
          data: {
            driverId: driverRecord.id,
            type: 'system_alert',
            title: 'Application Approved! 🎉',
            message: 'Congratulations! Your driver application has been approved. You can now start accepting jobs.',
            read: false,
          },
        });
        console.log('🔧 [APPROVE DEBUG] Driver notification created for driverId:', driverRecord.id);
      } else {
        // Create Driver record if it doesn't exist (for new approved drivers)
        const newDriver = await prisma.driver.create({
          data: {
            userId: updatedApplication.userId,
            status: 'active',
            onboardingStatus: 'approved',
          },
        });

        // Create driver availability record - Default to online
        await prisma.driverAvailability.create({
          data: {
            driverId: newDriver.id,
            status: 'online',
            locationConsent: false,
          },
        });
        
        await prisma.driverNotification.create({
          data: {
            driverId: newDriver.id,
            type: 'system_alert',
            title: 'Application Approved! 🎉',
            message: 'Congratulations! Your driver application has been approved. You can now start accepting jobs.',
            read: false,
          },
        });
        console.log('🔧 [APPROVE DEBUG] New driver record created and notification sent:', newDriver.id);
      }
    }

    // Send approval email via ZeptoMail
    try {
      console.log('🔧 [APPROVE DEBUG] Sending approval email to:', updatedApplication.email);
      await UnifiedEmailService.sendDriverApplicationConfirmation({
        driverName: `${updatedApplication.firstName} ${updatedApplication.lastName}`,
        driverEmail: updatedApplication.email,
        applicationId: updatedApplication.id,
        appliedAt: new Date().toISOString(),
      });
      console.log('✅ Driver approval email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send driver approval email:', emailError);
      // Don't fail the approval if email fails - continue with success response
    }

    return NextResponse.json({
      message: 'Application approved successfully',
      application: updatedApplication,
    });
  } catch (error) {
    console.error('❌ [APPROVE ERROR] Driver application approve error:', error);
    console.error('❌ [APPROVE ERROR] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      applicationId: (await params).id,
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}