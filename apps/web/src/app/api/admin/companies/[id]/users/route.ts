/**
 * Admin Company Users API
 * 
 * GET /api/admin/companies/[id]/users - List company users
 * POST /api/admin/companies/[id]/users - Invite user to company
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { companyService } from '@/lib/b2b';
import { CompanyRole } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const InviteUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.nativeEnum(CompanyRole).default(CompanyRole.MEMBER),
});

const UpdateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(CompanyRole),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const users = await companyService.getUsers(params.id);

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    console.error('[Admin Company Users] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list users' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const data = InviteUserSchema.parse(body);

    // Check if company exists
    const company = await companyService.getById(params.id);
    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Create invitation
    const invitation = await companyService.createInvitation({
      companyId: params.id,
      email: data.email,
      role: data.role,
      invitedBy: authResult.id,
    });

    // TODO: Send invitation email

    return NextResponse.json({
      success: true,
      data: invitation,
      message: 'Invitation sent successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Admin Company Users] POST error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to invite user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const data = UpdateUserRoleSchema.parse(body);

    const companyUser = await companyService.updateUserRole(
      params.id,
      data.userId,
      data.role,
      authResult.id
    );

    return NextResponse.json({
      success: true,
      data: companyUser,
      message: 'User role updated successfully',
    });
  } catch (error: any) {
    console.error('[Admin Company Users] PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user role' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await companyService.removeUser(params.id, userId, authResult.id);

    return NextResponse.json({
      success: true,
      message: 'User removed from company successfully',
    });
  } catch (error: any) {
    console.error('[Admin Company Users] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove user' },
      { status: 500 }
    );
  }
}
