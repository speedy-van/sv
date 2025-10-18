import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { UnifiedEmailService } from '@/lib/email/UnifiedEmailService';

export const dynamic = 'force-dynamic';

// POST /api/admin/drivers/applications/[id]/reject - Reject driver application
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { id } = await params;
    const body = await request.json();
    const { rejectionReason } = body;

    // Update application status to rejected
    const updatedApplication = await prisma.driverApplication.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewNotes: rejectionReason || 'Application rejected by admin',
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

    // Deactivate the user account
    if (updatedApplication.userId) {
      await prisma.user.update({
        where: { id: updatedApplication.userId },
        data: { isActive: false },
      });
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
            title: 'Application Update',
            message: `Your driver application has been reviewed. Reason: ${rejectionReason || 'Application rejected by admin'}`,
            read: false,
          },
        });
        console.log('🔧 [REJECT DEBUG] Driver notification created for driverId:', driverRecord.id);
      } else {
        console.log('🔧 [REJECT DEBUG] No driver record found for userId:', updatedApplication.userId);
        // For rejected applications, we don't create a Driver record
      }
    }

    // Send rejection email via ZeptoMail
    try {
      await UnifiedEmailService.sendDriverApplicationConfirmation({
        driverName: `${updatedApplication.firstName} ${updatedApplication.lastName}`,
        driverEmail: updatedApplication.email,
        applicationId: updatedApplication.id,
        appliedAt: new Date().toISOString(),
      });
      console.log('✅ Driver rejection email sent successfully');
    } catch (emailError) {
      console.error('⚠️ Failed to send driver rejection email:', emailError);
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({
      message: 'Application rejected successfully',
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Driver application reject error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}