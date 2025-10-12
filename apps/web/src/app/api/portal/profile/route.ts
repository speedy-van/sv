import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertRole } from '@/lib/guards';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  timezone: z.string().max(50, 'Timezone too long').optional(),
  language: z.string().max(10, 'Language code too long').optional(),
});

// POST /api/portal/profile (update)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    assertRole(session!, ['customer']);
    const customerId = session.user.id;

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email address is already in use' },
          { status: 400 }
        );
      }
    }

    const updateData = { ...validatedData };
    if (validatedData.email && validatedData.email !== session.user.email) {
      // Handle email verification separately since it's not in the schema
      await prisma.user.update({
        where: { id: customerId },
        data: { emailVerified: false },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: customerId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// GET /api/portal/profile - Get current profile
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    assertRole(session!, ['customer']);

    const profile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

