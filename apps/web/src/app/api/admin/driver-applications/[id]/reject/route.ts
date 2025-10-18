import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id: applicationId } = await params;
    const adminUserId = (session.user as any).id;
    const body = await request.json();
    const { rejectionReason } = body;

    // Get the application
    const application = await prisma.driverApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status !== 'pending' && application.status !== 'under_review') {
      return NextResponse.json(
        { 
          error: 'Application cannot be rejected',
          details: `Application status is ${application.status}. Only pending or under_review applications can be rejected.`
        },
        { status: 400 }
      );
    }

    // Update application status to rejected
    const updatedApplication = await prisma.driverApplication.update({
      where: { id: applicationId },
      data: {
        status: 'rejected',
        // Using reviewNotes instead of rejectionReason
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    });

    console.log('❌ Driver application rejected:', {
      applicationId,
      email: application.email,
      fullName: (application as any).fullName || 'Unknown Driver',
      reviewNotes: rejectionReason || 'No reason provided',
      rejectedBy: adminUserId,
    });

    // Send rejection email
    try {
      const emailResult = await unifiedEmailService.sendDriverApplicationStatus({
        driverEmail: application.email,
        driverName: (application as any).fullName || 'Unknown Driver',
        applicationId: application.id,
        status: 'rejected',
        rejectionReason: rejectionReason || 'Application rejected by admin',
        reviewedAt: new Date().toISOString(),
      });

      if (emailResult.success) {
        console.log('✅ Driver application rejection email sent:', {
          applicationId: application.id,
          email: application.email,
          messageId: emailResult.messageId,
          provider: emailResult.provider,
        });
      } else {
        console.warn('⚠️ Failed to send driver application rejection email:', {
          applicationId: application.id,
          email: application.email,
          error: emailResult.error,
        });
      }
    } catch (emailError) {
      console.error('❌ Error sending driver application rejection email:', emailError);
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Driver application rejected successfully',
      data: {
        applicationId,
        status: 'rejected',
        reviewNotes: rejectionReason || 'Application rejected by admin',
        rejectedAt: updatedApplication.reviewedAt,
        rejectedBy: adminUserId,
      },
    });

  } catch (error) {
    console.error('❌ Error rejecting driver application:', error);
    return NextResponse.json(
      {
        error: 'Failed to reject application',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
