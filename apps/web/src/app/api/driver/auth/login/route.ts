import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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
        driver: true,
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
    if (user.driver?.onboardingStatus !== 'approved') {
      return NextResponse.json(
        {
          error: 'Account not yet approved',
          onboardingStatus: user.driver?.onboardingStatus,
        },
        { status: 403 }
      );
    }

    // Log successful login
    await logAudit(user.id, 'driver_login_success', user.id, { targetType: 'auth', before: null, after: { email: user.email, role: user.role, driverId: user.driver?.id } });

    // Generate secure JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      console.error('❌ CRITICAL: JWT_SECRET or NEXTAUTH_SECRET not found in environment');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create JWT token with 30 days expiration
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        driverId: user.driver?.id,
      },
      jwtSecret,
      { 
        expiresIn: '30d',
        algorithm: 'HS256'
      }
    );

    return NextResponse.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      driver: {
        id: user.driver?.id,
        userId: user.id,
        status: user.driver?.status || 'active',
        onboardingStatus: user.driver?.onboardingStatus,
        basePostcode: user.driver?.basePostcode,
        vehicleType: user.driver?.vehicleType,
        rating: user.driver?.rating,
        strikes: user.driver?.strikes || 0,
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

