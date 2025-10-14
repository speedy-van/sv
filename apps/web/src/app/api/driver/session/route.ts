import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { assertDriver } from '@/lib/guards';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await auth();
  try {
    assertDriver(session!);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }

  return NextResponse.json({
    isAuthenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
    driver: (session.user as any).driver || null,
  });
}
