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
  const startTime = Date.now();
  let email = '';
  
  try {
    const body = await request.json();
    email = body.email;
    const password = body.password;

    console.log(`[Driver Login] Attempt for email: ${email}`);

    if (!email || !password) {
      console.warn(`[Driver Login] Missing credentials for ${email}`);
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find user - try multiple methods to find by email
    const emailTrimmed = email.trim();
    
    console.log(`[Driver Login] Searching for user: ${emailTrimmed}`);
    
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
    
    console.log(`[Driver Login] User found: ${!!user}, Role: ${user?.role}, Has driver: ${!!user?.driver}`);
    
    // Must be a driver
    if (!user || user.role !== 'driver') {
      console.warn(`[Driver Login] Invalid user or not a driver: ${emailTrimmed}`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.warn(`[Driver Login] Invalid password for: ${emailTrimmed}`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check if driver is approved
    if (user.driver?.onboardingStatus !== 'approved') {
      console.warn(`[Driver Login] Driver not approved: ${emailTrimmed}, Status: ${user.driver?.onboardingStatus}`);
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

    const duration = Date.now() - startTime;
    console.log(`[Driver Login] SUCCESS for ${emailTrimmed} in ${duration}ms`);

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
    const duration = Date.now() - startTime;
    console.error(`[Driver Login] ERROR for ${email} after ${duration}ms:`, error);
    console.error('[Driver Login] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

