import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const applicationId = params.id;
    const adminUserId = (session.user as any).id;
    const body = await request.json();
    const { additionalInfoRequired, nextSteps } = body;

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
          error: 'Application cannot be updated',
          details: `Application status is ${application.status}. Only pending or under_review applications can be updated.`
        },
        { status: 400 }
      );
    }

    // Update application status to requires_additional_info
    const updatedApplication = await prisma.driverApplication.update({
      where: { id: applicationId },
      data: {
        status: 'requires_additional_info',
        reviewNotes: additionalInfoRequired || 'Additional information required',
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      } as any,
    });

    console.log('⚠️ Driver application requires additional info:', {
      applicationId,
      email: application.email,
      fullName: (application as any).fullName,
      additionalInfoRequired: additionalInfoRequired || 'No specific details provided',
      requestedBy: adminUserId,
    });

    // Send request for additional info email
    try {
      const emailResult = await unifiedEmailService.sendDriverApplicationStatus({
        driverEmail: application.email,
        driverName: `${application.firstName} ${application.lastName}`,
        applicationId: application.id,
        status: 'requires_additional_info',
        rejectionReason: additionalInfoRequired || 'Additional information required',
        reviewedAt: new Date().toISOString(),
        nextSteps: nextSteps || [
          'Please provide the requested additional information',
          'Ensure all documents are clear and legible',
          'Contact us if you have any questions about the requirements',
          'We\'ll review your updated application within 24-48 hours',
        ],
      });

      if (emailResult.success) {
        console.log('✅ Driver application info request email sent:', {
          applicationId: application.id,
          email: application.email,
          messageId: emailResult.messageId,
          provider: emailResult.provider,
        });
      } else {
        console.warn('⚠️ Failed to send driver application info request email:', {
          applicationId: application.id,
          email: application.email,
          error: emailResult.error,
        });
      }
    } catch (emailError) {
      console.error('❌ Error sending driver application info request email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Driver application updated - additional information requested',
      data: {
        applicationId,
        status: 'requires_additional_info',
        additionalInfoRequired: additionalInfoRequired || 'Additional information required',
        requestedAt: updatedApplication.reviewedAt,
        requestedBy: adminUserId,
        nextSteps: nextSteps || [
          'Please provide the requested additional information',
          'Ensure all documents are clear and legible',
          'Contact us if you have any questions about the requirements',
          'We\'ll review your updated application within 24-48 hours',
        ],
      },
    });

  } catch (error) {
    console.error('❌ Error requesting additional info for driver application:', error);
    return NextResponse.json(
      {
        error: 'Failed to request additional information',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
