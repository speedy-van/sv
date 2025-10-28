import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, action } = await request.json();

    console.log('👤 Customer auth request:', { email, action });

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user with customer role (case-insensitive email search)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        role: 'customer',
      },
    });

    if (!user) {
      console.log('❌ Customer not found:', email);
      return NextResponse.json(
        { 
          message: 'Customer account not found. Please create an account first.',
          redirect: '/customer/register'
        },
        { status: 404 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log('❌ Invalid password for customer:', email);
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('✅ Customer authentication successful:', email);

    return NextResponse.json({
      success: true,
      message: 'Customer authenticated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('❌ Customer auth error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
