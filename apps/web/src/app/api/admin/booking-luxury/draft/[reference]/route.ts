import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) {
    return admin;
  }

  const reference = decodeURIComponent(params.reference);

  try {
    const draft = await prisma.bookingDraft.findUnique({
      where: { reference },
    });

    if (!draft) {
      return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    console.error('❌ Admin draft lookup failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch draft' }, { status: 500 });
  }
}

