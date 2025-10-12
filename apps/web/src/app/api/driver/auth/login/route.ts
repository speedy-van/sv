import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signIn } from 'next-auth/react';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user with driver role
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        role: 'driver',
      },
      include: {
        Driver: true,
      },
    });

    if (!user) {
      await logAudit('anonymous', 'driver_login_failed', undefined, { targetType: 'auth', before: { email }, after: null });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      await logAudit(user.id, 'driver_login_failed', user.id, { targetType: 'auth', before: { email }, after: null });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if driver is approved
    if (user.Driver?.onboardingStatus !== 'approved') {
      return NextResponse.json(
        {
          error: 'Account not yet approved',
          onboardingStatus: user.Driver?.onboardingStatus,
        },
        { status: 403 }
      );
    }

    // Log successful login
    await logAudit(user.id, 'driver_login_success', user.id, { targetType: 'auth', before: null, after: { email: user.email, role: user.role, driverId: user.Driver?.id } });

    // Generate a simple token (for mobile app compatibility)
    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        driver: {
          id: user.Driver?.id,
          userId: user.id,
          onboardingStatus: user.Driver?.onboardingStatus,
          basePostcode: user.Driver?.basePostcode,
          vehicleType: user.Driver?.vehicleType,
          status: user.Driver?.status,
          rating: user.Driver?.rating,
        },
      },
    });
  } catch (error) {
    console.error('Driver login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

