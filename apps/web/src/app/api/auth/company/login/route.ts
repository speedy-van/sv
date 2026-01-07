/**
 * Company Login API
 * 
 * POST /api/auth/company/login
 * 
 * Authenticates company users and creates a session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { compare } from 'bcrypt';
import { SignJWT } from 'jose';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

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

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        CompanyUser: {
          include: {
            Company: true,
          },
        },
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user belongs to a company
    if (user.CompanyUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No company associated with this account' },
        { status: 403 }
      );
    }

    const companyUser = user.CompanyUser[0]; // Use first company (support multi-company later)
    const company = companyUser.Company;

    // Check company status
    if (company.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: `Company account is ${company.status.toLowerCase()}. Please contact support.`,
        },
        { status: 403 }
      );
    }

    // Create JWT token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      companyId: company.id,
      role: companyUser.role,
      type: 'company',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Log login
    await prisma.companyAuditLog.create({
      data: {
        companyId: company.id,
        action: 'USER_LOGIN',
        actorId: user.id,
        actorType: 'USER',
        targetType: 'user',
        targetId: user.id,
        metadata: {
          email: user.email,
          role: companyUser.role,
        },
      },
    });

    // Create response with HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        company: {
          id: company.id,
          name: company.name,
          status: company.status,
        },
        role: companyUser.role,
        permissions: this.getRolePermissions(companyUser.role),
      },
    });

    // Set secure HttpOnly cookie
    response.cookies.set('company-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Company login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Get permissions based on company role
 */
function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    OWNER: ['*'], // Full access
    ADMIN: ['bookings:*', 'quotes:*', 'invoices:*', 'users:read', 'users:invite'],
    FINANCE: ['bookings:read', 'quotes:read', 'invoices:*'],
    DISPATCHER: ['bookings:*', 'quotes:read'],
    MEMBER: ['bookings:create', 'bookings:read', 'quotes:create', 'quotes:read'],
    READ_ONLY: ['bookings:read', 'quotes:read', 'invoices:read'],
  };

  return permissions[role] || [];
}
