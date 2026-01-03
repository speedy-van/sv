import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const take = Math.min(parseInt(searchParams.get('take') || '200', 10), 500);
  const skip = parseInt(searchParams.get('skip') || '0', 10);

  try {
    const [items, total] = await Promise.all([
      prisma.contactInquiry.findMany({
        where: { source: 'call_me_back' },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.contactInquiry.count({ where: { source: 'call_me_back' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        total,
        take,
        skip,
      },
    });
  } catch (error) {
    console.error('❌ Failed to fetch callback requests', error);
    return NextResponse.json({ error: 'Failed to fetch callback requests' }, { status: 500 });
  }
}

