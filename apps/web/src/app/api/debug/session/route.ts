import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  const headersList = await headers();
  const rawCookies = headersList.get('cookie') || '';

  console.log('🐞 /api/debug/session:', {
    hasSession: !!session,
    sessionUser: session?.user,
    rawCookies,
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    hasSession: !!session,
    session,
    rawCookiesLength: rawCookies.length,
  });
}
