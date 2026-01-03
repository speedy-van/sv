import { NextResponse } from 'next/server';
import { getNextReferenceNumber } from '@/lib/ref';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reference = await getNextReferenceNumber();
    return NextResponse.json({ reference });
  } catch (error) {
    console.error('❌ Failed to fetch next reference:', error);
    return NextResponse.json({ error: 'Failed to fetch next reference' }, { status: 500 });
  }
}

