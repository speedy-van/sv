import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getJobsMarketMeta, setJobsMarketMeta, withJobsMarketOfferExpiry } from '@/lib/jobsMarket';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as string | undefined;
    if (!userRole || !['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await request.json();
    const driverId = typeof body?.driverId === 'string' ? body.driverId : '';

    if (!driverId) {
      return NextResponse.json({ error: 'driverId is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: orderId },
        select: { id: true, customerPreferences: true },
      });

      if (!booking) {
        return { ok: false, status: 404, error: 'Order not found' } as const;
      }

      const jobsMarketRaw = getJobsMarketMeta(booking.customerPreferences);
      const jobsMarket = jobsMarketRaw ? withJobsMarketOfferExpiry(jobsMarketRaw, new Date()) : null;

      if (!jobsMarket) {
        return { ok: false, status: 400, error: 'Jobs market data not found' } as const;
      }

      const offers = jobsMarket.offers ?? [];
      const offerIndex = offers.findIndex((entry) => entry.driverId === driverId);
      if (offerIndex < 0) {
        return { ok: false, status: 404, error: 'Offer not found' } as const;
      }

      if (offers[offerIndex].status === 'APPROVED') {
        return { ok: false, status: 400, error: 'Approved offer cannot be rejected' } as const;
      }

      const now = new Date().toISOString();
      const updatedOffers = offers.map((entry, index) =>
        index === offerIndex
          ? { ...entry, status: 'REJECTED' as const, updatedAt: now }
          : entry
      );

      const updatedPreferences = setJobsMarketMeta(booking.customerPreferences, {
        ...jobsMarket,
        offers: updatedOffers,
      });

      await tx.booking.update({
        where: { id: orderId },
        data: {
          customerPreferences: updatedPreferences as any,
        },
      });

      return { ok: true } as const;
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Jobs Market reject offer error:', error);
    return NextResponse.json({ error: 'Failed to reject offer' }, { status: 500 });
  }
}
