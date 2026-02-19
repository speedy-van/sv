import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getJobsMarketMeta, getJobsMarketOfferBounds, isOfferWindowOpen, withJobsMarketOfferExpiry } from '@/lib/jobsMarket';
import { assignJobToDriver } from '@/lib/jobsMarketAutoApprove';

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

    const booking = await prisma.booking.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, customerPreferences: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const jobsMarketRaw = getJobsMarketMeta(booking.customerPreferences);
    const jobsMarket = jobsMarketRaw ? withJobsMarketOfferExpiry(jobsMarketRaw, new Date()) : null;

    if (!jobsMarket || !jobsMarket.isPublished || jobsMarket.driverPricePence <= 0) {
      return NextResponse.json({ error: 'Job is not available for approval' }, { status: 403 });
    }

    const now = new Date();
    const windowOpen = isOfferWindowOpen(jobsMarket.publishedAt, jobsMarket.offerWindowMinutes, now);
    if (!windowOpen) {
      return NextResponse.json({ error: 'Offer window expired' }, { status: 400 });
    }

    const offer = (jobsMarket.offers ?? []).find((entry) => entry.driverId === driverId);
    if (!offer || offer.status !== 'PENDING') {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const { minOfferPence, maxOfferPence } = getJobsMarketOfferBounds(jobsMarket.driverPricePence);
    if (offer.offerPence < minOfferPence) {
      return NextResponse.json({ error: 'Offer is below base price' }, { status: 400 });
    }

    if (offer.offerPence > maxOfferPence) {
      return NextResponse.json({ error: 'Offer exceeds the allowed maximum' }, { status: 400 });
    }

    const result = await assignJobToDriver({
      bookingId: orderId,
      driverId,
      approvedPricePence: offer.offerPence,
      approvedBy: session.user.id,
      now,
      requirePendingOffer: true,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      assignmentId: result.assignmentId,
      driverId: result.driverId,
      offerPence: result.approvedPricePence,
    });
  } catch (error) {
    console.error('❌ Jobs Market approve offer error:', error);
    return NextResponse.json({ error: 'Failed to approve offer' }, { status: 500 });
  }
}
