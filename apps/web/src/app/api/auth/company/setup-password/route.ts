/**
 * Company Password Setup API
 * 
 * POST /api/auth/company/setup-password
 * 
 * Allows company owner to set their password using a secure token sent via email.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { hash } from 'bcrypt';

const setupPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = setupPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { token, password } = validation.data;

    // Find company by token
    const company = await prisma.company.findUnique({
      where: { passwordSetupToken: token },
      include: {
        CompanyUser: {
          where: { role: 'OWNER' },
          include: { User: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired setup token' },
        { status: 400 }
      );
    }

    // Check token expiry
    if (company.passwordSetupExpiresAt && new Date() > company.passwordSetupExpiresAt) {
      return NextResponse.json(
        { success: false, error: 'Setup token has expired. Please contact support.' },
        { status: 400 }
      );
    }

    // Get owner user
    const owner = company.CompanyUser.find((cu) => cu.role === 'OWNER');
    if (!owner) {
      return NextResponse.json(
        { success: false, error: 'Company owner not found' },
        { status: 500 }
      );
    }

    // Hash password with bcrypt (cost factor 12 for production-grade security)
    const hashedPassword = await hash(password, 12);

    // Update user password and invalidate token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: owner.userId },
        data: {
          password: hashedPassword,
        },
      }),
      prisma.company.update({
        where: { id: company.id },
        data: {
          passwordSetupToken: null,
          passwordSetupExpiresAt: null,
          firstLoginAt: new Date(),
        },
      }),
      prisma.companyAuditLog.create({
        data: {
          companyId: company.id,
          action: 'PASSWORD_SETUP_COMPLETED',
          actorId: owner.userId,
          actorType: 'USER',
          targetType: 'company',
          targetId: company.id,
          metadata: { completedAt: new Date().toISOString() },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Password set successfully',
        companyId: company.id,
        userId: owner.userId,
        email: owner.User.email,
      },
    });
  } catch (error) {
    console.error('Password setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup password' },
      { status: 500 }
    );
  }
}
