import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('🚪 Logout requested');
  
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
  
  console.log('✅ Auth token cleared');
  
  return NextResponse.json({ success: true });
}
