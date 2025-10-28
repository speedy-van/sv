import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { reason } = rejectSchema.parse(body);

    // Find application
    const application = await prisma.careerApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Update application status
    const updatedApplication = await prisma.careerApplication.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedBy: session.user.name || session.user.email,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Send rejection email to applicant
    await sendEmail({
      to: application.email,
      subject: 'Application Update - Speedy Van Careers',
      html: `
        <h2>Application Update</h2>
        <p>Dear ${application.fullName},</p>
        <p>Thank you for your interest in the <strong>${application.position}</strong> position at Speedy Van.</p>
        <p>After careful consideration, we regret to inform you that we have decided to move forward with other candidates for this position.</p>
        ${reason ? `<p><strong>Feedback:</strong> ${reason}</p>` : ''}
        <p>We appreciate the time you took to apply and wish you the best in your job search.</p>
        <br>
        <p>Please feel free to apply for future opportunities at Speedy Van.</p>
        <br>
        <p>Best regards,<br>Speedy Van HR Team</p>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Application rejected successfully',
      data: updatedApplication,
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reject application' },
      { status: 500 }
    );
  }
}

