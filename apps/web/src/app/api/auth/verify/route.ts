import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'ZV6xh/oJhYk9wwrjX5RA5JgjC9uCSuWZHpIprjYs2LA='
);

export const dynamic = 'force-dynamic';

/**
 * Verify session token from Authorization header
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'No token' }, { status: 401 });
    }

    // Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return NextResponse.json({
      valid: true,
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        adminRole: payload.adminRole,
      },
    });
  } catch (error) {
    console.error('Token verification failed:', error);
    return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 });
  }
}
