import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signIn } from 'next-auth/react';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

// CORS headers for mobile app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find user - try multiple methods to find by email
    const emailTrimmed = email.trim();
    
    // Try exact match first
    let user = await prisma.user.findUnique({
      where: { email: emailTrimmed },
      include: { driver: true },
    });
    
    // Try lowercase
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: emailTrimmed.toLowerCase() },
        include: { driver: true },
      });
    }
    
    // Try case-insensitive
    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: { equals: emailTrimmed, mode: 'insensitive' } },
        include: { driver: true },
      });
    }
    
    // Must be a driver
    if (!user || user.role !== 'driver') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if driver is approved
    if (user.driver?.onboardingStatus !== 'approved') {
      return NextResponse.json(
        {
          error: 'Account not yet approved',
          onboardingStatus: user.driver?.onboardingStatus,
        },
        { status: 403, headers: corsHeaders }
      );
    }

    // Log successful login (non-blocking - don't wait for it)
    logAudit(user.id, 'driver_login_success', user.id, { targetType: 'auth', before: null, after: { email: user.email, role: user.role, driverId: user.driver?.id } }).catch(() => {});

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
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Driver login error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

