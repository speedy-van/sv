import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'ZV6xh/oJhYk9wwrjX5RA5JgjC9uCSuWZHpIprjYs2LA='
);

/**
 * Login endpoint - Validates credentials and returns JWT token
 * Client will store token and include it in Authorization header
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login endpoint called');
    
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('📧 Looking up user:', normalizedEmail);
    
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        adminRole: true,
        isActive: true,
      },
    });

    if (!user || !user.password) {
      console.log('❌ User not found');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      console.log('❌ Account inactive');
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
      adminRole: user.adminRole,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(JWT_SECRET);

    console.log('✅ Login successful:', user.email);

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role,
        adminRole: user.adminRole,
      },
    });

    // Set cookie using Next.js cookies() API for proper handling
    const maxAge = 60 * 60 * 24 * 30; // 30 days in seconds
    const isProduction = process.env.NODE_ENV === 'production';
    
    // CRITICAL: Cookie settings for proper authentication
    // - Development: secure=false for HTTP localhost
    // - Production: secure=true for HTTPS
    // - sameSite='lax' allows cookie on same-site navigation (including after redirect)
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: maxAge,
      path: '/',
      // Do NOT set domain in development (defaults to exact host)
      // In production, omit domain to use current host
    };
    
    response.cookies.set('auth-token', token, cookieOptions);

    // Get request details for debugging
    const host = request.headers.get('host');
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    
    console.log('🍪 Cookie set successfully:', {
      tokenPreview: token.substring(0, 30) + '...',
      environment: process.env.NODE_ENV,
      cookieSettings: {
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        maxAge: cookieOptions.maxAge,
        path: cookieOptions.path,
      },
      requestInfo: {
        host: host,
        origin: origin,
        referer: referer,
      },
    });
    
    console.log('🚨 CRITICAL: Make sure you access the app via http://localhost:3000');
    console.log('   ❌ DO NOT use: http://0.0.0.0:3000 (cookies won\'t work!)');
    console.log('   ✅ USE: http://localhost:3000');

    return response;
  } catch (error: any) {
    console.error('❌ Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { 
        error: 'Authentication failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
