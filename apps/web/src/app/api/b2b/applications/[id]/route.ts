/**
 * B2B Application Detail API
 * 
 * Handle individual application actions (approve, reject, review)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { apiKeyService } from '@/lib/b2b/api-key.service';
import { randomBytes } from 'crypto';
import { generateCompanyWelcomeEmail } from '@/lib/email/templates/company-welcome';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get application details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const application = await prisma.b2BApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

// Action schema
const actionSchema = z.object({
  action: z.enum(['approve', 'reject', 'review']),
  notes: z.string().optional(),
  creditLimitGBP: z.number().optional(), // For approval
  paymentTermsDays: z.number().optional(), // For approval
  approvedMonthlyOrderLimit: z.number().optional(), // For approval (0 = unlimited)
  rejectionReason: z.string().optional(), // For rejection
});

// PUT: Update application status
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validationResult = actionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { action, notes, creditLimitGBP, paymentTermsDays, approvedMonthlyOrderLimit, rejectionReason } = validationResult.data;

    // Get the application
    const application = await prisma.b2BApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status === 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Application has already been approved' },
        { status: 400 }
      );
    }

    if (application.status === 'REJECTED') {
      return NextResponse.json(
        { success: false, error: 'Application has already been rejected' },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'review':
        await prisma.b2BApplication.update({
          where: { id },
          data: {
            status: 'UNDER_REVIEW',
            reviewNotes: notes,
            reviewedAt: new Date(),
          },
        });
        break;

      case 'reject':
        await prisma.b2BApplication.update({
          where: { id },
          data: {
            status: 'REJECTED',
            rejectionReason: rejectionReason || notes,
            processedAt: new Date(),
          },
        });
        // TODO: Send rejection email to applicant
        break;

      case 'approve':
        // Generate password setup token
        const setupToken = randomBytes(32).toString('hex');
        const setupTokenExpiry = new Date();
        setupTokenExpiry.setDate(setupTokenExpiry.getDate() + 7); // 7 days

        // Create the company
        const company = await prisma.company.create({
          data: {
            name: application.companyName,
            legalName: application.legalName,
            companyNumber: application.registrationNumber,
            vatNumber: application.vatNumber,
            industry: application.industry,
            email: application.contactEmail,
            phone: application.contactPhone,
            website: application.website,
            billingAddressLine1: application.addressLine1,
            billingAddressLine2: application.addressLine2,
            billingCity: application.city,
            billingPostcode: application.postcode,
            billingCountry: application.country,
            creditLimitGBP: creditLimitGBP ? creditLimitGBP * 100 : 100000, // Default £1000
            currentBalanceGBP: 0,
            paymentTermsDays: paymentTermsDays || 30,
            monthlyOrderLimit: approvedMonthlyOrderLimit || application.requestedMonthlyOrderLimit || 10,
            status: 'ACTIVE',
            passwordSetupToken: setupToken,
            passwordSetupExpiresAt: setupTokenExpiry,
          },
        });

        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email: application.contactEmail },
        });

        // Create user if doesn't exist
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: application.contactEmail,
              name: application.contactName,
              phone: application.contactPhone,
              role: 'customer',
              // Password will be set via setup link
            },
          });
        }

        // Link user to company as Owner
        await prisma.companyUser.create({
          data: {
            companyId: company.id,
            userId: user.id,
            role: 'OWNER',
            joinedAt: new Date(),
          },
        });

        // Auto-generate API key with default scopes
        const apiKey = await apiKeyService.generate(
          company.id,
          'Production API Key',
          [
            'bookings:read',
            'bookings:write',
            'bookings:cancel',
            'quotes:read',
            'quotes:write',
            'quotes:accept',
            'invoices:read',
            'invoices:download',
            'company:read',
            'tracking:read',
          ],
          'system', // Created by system on approval
          {
            description: 'Auto-generated on company approval',
            rateLimitPerMin: 60,
            rateLimitPerDay: 10000,
          }
        );

        // Update application
        await prisma.b2BApplication.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedMonthlyOrderLimit: company.monthlyOrderLimit,
            processedAt: new Date(),
            companyId: company.id,
          },
        });

        // Send welcome email
        const setupUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.speedy-van.co.uk'}/company/setup-password?token=${setupToken}`;
        
        const emailData = generateCompanyWelcomeEmail({
          companyName: company.name,
          ownerName: application.contactName,
          ownerEmail: application.contactEmail,
          apiKeyPreview: apiKey.keyPrefix,
          setupUrl,
          orderLimit: company.monthlyOrderLimit,
          supportEmail: process.env.SUPPORT_EMAIL || 'support@speedy-van.co.uk',
        });

        // Send email via UnifiedEmailService
        console.log('📧 Sending welcome email to:', application.contactEmail);
        const emailResult = await unifiedEmailService.sendEmail({
          to: application.contactEmail,
          subject: emailData.subject,
          html: emailData.html,
        });

        if (emailResult.success) {
          console.log('✅ Welcome email sent successfully:', emailResult.messageId);
        } else {
          console.error('❌ Failed to send welcome email:', emailResult.error);
          // Don't fail approval, just log error
        }

        console.log('Setup URL:', setupUrl);
        console.log('API Key Preview:', apiKey.keyPrefix);

        return NextResponse.json({
          success: true,
          data: {
            applicationId: id,
            companyId: company.id,
            apiKey: {
              id: apiKey.id,
              key: apiKey.rawKey, // SHOW ONCE ONLY
              keyPreview: apiKey.keyPrefix + '...',
            },
            setupUrl,
            emailSent: emailResult.success,
            message: 'Application approved, company created, and API key generated',
          },
        });
    }

    return NextResponse.json({
      success: true,
      data: { message: `Application ${action}ed successfully` },
    });
  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process application' },
      { status: 500 }
    );
  }
}

// DELETE: Delete application (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    const application = await prisma.b2BApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status === 'APPROVED') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete approved applications' },
        { status: 400 }
      );
    }

    await prisma.b2BApplication.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Application deleted successfully' },
    });
  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}
