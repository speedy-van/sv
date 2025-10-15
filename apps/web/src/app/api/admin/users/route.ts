import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { withApiHandler, requireRole, httpJson } from '@/lib/api/guard';
import { parseJson, parseQueryParams } from '@/lib/validation/helpers';
import {
  adminUserCreate,
  paginationQuery,
  searchQuery,
} from '@/lib/validation/schemas';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

// GET /api/admin/users - Get all admin users
export const GET = withApiHandler(async (request: NextRequest) => {
  let user;
  try {
    user = await requireRole(request, 'admin');
  } catch (error: any) {
    return httpJson(401, { error: error.message || 'Authentication required' });
  }

  const queryParams = parseQueryParams(
    request.url,
    paginationQuery.merge(searchQuery)
  );
  if (!queryParams.ok) return queryParams.error;

  const { page, limit, search } = queryParams.data;
  const skip = ((page || 1) - 1) * (limit || 10);

  // Build where clause
  const where: any = { role: 'admin' };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { adminRole: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        isActive: true,
        lastLogin: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return httpJson(200, {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / (limit || 10)),
    },
  });
});

// POST /api/admin/users - Create new admin user
export const POST = withApiHandler(async (request: NextRequest) => {
  let user;
  try {
    user = await requireRole(request, 'admin');
  } catch (error: any) {
    return httpJson(401, { error: error.message || 'Authentication required' });
  }

  const parsed = await parseJson(request, adminUserCreate);
  if (!parsed.ok) {
    return parsed.error;
  }

  const { name, email, password, adminRole, isActive } = parsed.data;

  // Normalize email to avoid case/whitespace collisions
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    return httpJson(409, { error: 'User with this email already exists' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create admin user (catch unique-constraint race)
  let newUser;
  try {
    newUser = await prisma.user.create({
      data: {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'admin',
        adminRole,
        isActive,
        twoFactorEnabled: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        isActive: true,
        lastLogin: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });
  } catch (e: any) {
    // Handle Prisma unique constraint (race condition)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return httpJson(409, { error: 'User with this email already exists' });
    }
    throw e;
  }

  // Send welcome email to the new admin
  try {
    const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speedy-van.co.uk'}/admin`;
    const welcomeEmailData = {
      adminEmail: normalizedEmail, // Use normalized email for consistency
      adminName: name,
      adminRole: adminRole,
      loginUrl: loginUrl,
      createdBy: user.name || user.email || 'System Administrator',
      createdAt: newUser.createdAt.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const emailResult = await unifiedEmailService.sendAdminWelcome(welcomeEmailData);
    
    if (emailResult.success) {
      console.log('✅ Admin welcome email sent successfully:', {
        to: normalizedEmail,
        messageId: emailResult.messageId,
        provider: emailResult.provider
      });
    } else {
      console.error('❌ Failed to send admin welcome email:', emailResult.error);
      // Don't fail the user creation if email fails
    }
  } catch (emailError) {
    console.error('❌ Error sending admin welcome email:', emailError);
    // Don't fail the user creation if email fails
  }

  return httpJson(201, newUser);
});
