import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { generateEmploymentContract } from '@/lib/contractGenerator';

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

    if (application.status === 'approved' || application.status === 'contract_sent') {
      return NextResponse.json(
        { success: false, error: 'Application already approved' },
        { status: 400 }
      );
    }

    // Update application status
    const updatedApplication = await prisma.careerApplication.update({
      where: { id },
      data: {
        status: 'approved',
        reviewedBy: session.user.name || session.user.email,
        reviewedAt: new Date(),
      },
    });

    // Generate employment contract PDF
    const contractPdf = await generateEmploymentContract({
      applicantName: application.fullName,
      applicantEmail: application.email,
      position: application.position,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    });

    // Send contract email to applicant
    await sendEmail({
      to: application.email,
      subject: 'Congratulations! Employment Contract - Speedy Van',
      html: `
        <h2>Congratulations, ${application.fullName}!</h2>
        <p>We are pleased to inform you that your application for the <strong>${application.position}</strong> position has been approved.</p>
        <p>Please find attached your employment contract. Please review it carefully and sign it at your earliest convenience.</p>
        <br>
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Review the attached employment contract</li>
          <li>Sign and return the contract within 7 days</li>
          <li>Complete any required onboarding paperwork</li>
        </ol>
        <br>
        <p>If you have any questions, please don't hesitate to contact us at careers@speedy-van.co.uk</p>
        <br>
        <p>We look forward to welcoming you to the Speedy Van team!</p>
        <br>
        <p>Best regards,<br>Speedy Van HR Team</p>
      `,
      attachments: [
        {
          filename: `Employment_Contract_${application.fullName.replace(/\s/g, '_')}.pdf`,
          content: contractPdf,
          contentType: 'application/pdf',
        },
      ],
    });

    // Update contract sent status
    await prisma.careerApplication.update({
      where: { id },
      data: {
        contractSent: true,
        contractSentAt: new Date(),
        status: 'contract_sent',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Application approved and contract sent successfully',
      data: updatedApplication,
    });
  } catch (error) {
    console.error('Error approving application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to approve application' },
      { status: 500 }
    );
  }
}

