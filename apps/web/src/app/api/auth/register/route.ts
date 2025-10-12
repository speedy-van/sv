import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
// import { linkExistingBookingsToCustomer } from '@/lib/customer-bookings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, name, password, role = 'customer' } = await request.json();

    // Validate required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user account
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        password: hashedPassword,
        role: role as any, // Type assertion for role
        emailVerified: true, // Auto-verify since they just made a payment
        isActive: true,
      },
    });

    // Link existing bookings to the new account
    let linkingResult = null;
    try {
      // TODO: Implement booking linking
      linkingResult = 0;
    } catch (linkingError) {
      console.warn(
        'Failed to link existing bookings during registration:',
        linkingError
      );
      // Don't fail the registration if linking fails
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorRole: 'customer',
        action: 'account_created',
        targetType: 'user',
        targetId: user.id,
        userId: user.id,
        details: {
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: new Date().toISOString(),
          linkedBookings: linkingResult || 0,
          source: 'post_payment_registration',
        },
      },
    });

    console.log('✅ User account created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      linkedBookings: linkingResult || 0,
    });

    // Return success response (without password)
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      linkingResult: linkingResult
        ? {
            linkedBookings: linkingResult,
            message: typeof linkingResult === 'object' && linkingResult && 'message' in linkingResult ? (linkingResult as any).message : 'Bookings linked successfully',
          }
        : null,
    });
  } catch (error) {
    console.error('❌ Error creating user account:', error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
