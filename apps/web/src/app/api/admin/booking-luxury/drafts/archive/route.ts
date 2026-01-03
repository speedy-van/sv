import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/booking-luxury/drafts/archive
 * Body: { days: number, hardDelete?: boolean }
 * Marks drafts older than N days as ARCHIVED, or deletes if hardDelete=true.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const days = typeof body?.days === 'number' && body.days > 0 ? body.days : 30;
    const hardDelete = body?.hardDelete === true;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    let result;
    if (hardDelete) {
      result = await prisma.bookingDraft.deleteMany({
        where: {
          createdAt: { lte: cutoff },
          status: 'DRAFT',
        },
      });
    } else {
      result = await prisma.bookingDraft.updateMany({
        where: {
          createdAt: { lte: cutoff },
          status: 'DRAFT',
        },
        data: { status: 'ARCHIVED' },
      });
    }

    return NextResponse.json({
      success: true,
      archived: result.count,
      hardDelete,
      days,
    });
  } catch (error) {
    console.error('❌ Archive drafts failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to archive drafts' }, { status: 500 });
  }
}

