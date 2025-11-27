import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'ZV6xh/oJhYk9wwrjX5RA5JgjC9uCSuWZHpIprjYs2LA='
);

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ session: null, user: null });
    }

    // Verify and decode JWT
    const { payload } = await jwtVerify(token, JWT_SECRET);

    const session = {
      user: {
        id: payload.id as string,
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as string,
        adminRole: payload.adminRole as string | null,
      },
    };

    return NextResponse.json(session);
  } catch (error) {
    console.error('Session verification failed:', error);
    // Clear invalid token
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    return NextResponse.json({ session: null, user: null });
  }
}
