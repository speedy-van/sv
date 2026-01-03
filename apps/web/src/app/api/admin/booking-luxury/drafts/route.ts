import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/booking-luxury/drafts
 * Query params:
 * - search: reference (partial), postcode, status
 * - status: DRAFT/COMPLETED
 * - page, take
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim() || '';
  const status = searchParams.get('status')?.trim() || '';
  const from = searchParams.get('from')?.trim() || '';
  const to = searchParams.get('to')?.trim() || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const take = parseInt(searchParams.get('take') || '50', 10);
  const skip = (page - 1) * take;

  const where: any = {};

  if (status) {
    where.status = status.toUpperCase();
  }

  if (search) {
    where.OR = [
      { reference: { contains: search, mode: 'insensitive' } },
      { pickupAddress: { path: ['postcode'], string_contains: search } as any },
      { dropoffAddress: { path: ['postcode'], string_contains: search } as any },
    ];
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  try {
    const [drafts, total] = await Promise.all([
      prisma.bookingDraft.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      prisma.bookingDraft.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      drafts,
      pagination: {
        page,
        take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('❌ Admin drafts list failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

