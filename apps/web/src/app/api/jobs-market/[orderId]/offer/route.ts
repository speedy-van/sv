import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getJobsMarketMeta,
  getJobsMarketDriverOffer,
  getJobsMarketOfferBounds,
  isOfferWindowOpen,
  setJobsMarketMeta,
  upsertJobsMarketOffer,
  withJobsMarketOfferExpiry,
} from '@/lib/jobsMarket';
import { assignJobToDriver, shouldAutoApproveOffer } from '@/lib/jobsMarketAutoApprove';

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
    if (!userRole || userRole !== 'driver') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await request.json();
    const offerPence = Number(body?.offerPence);

    if (!Number.isFinite(offerPence) || offerPence <= 0) {
      return NextResponse.json({ error: 'offerPence must be a positive number' }, { status: 400 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
      select: { id: true, status: true, onboardingStatus: true, rating: true },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    if (driver.status !== 'active' || driver.onboardingStatus !== 'approved') {
      return NextResponse.json({ error: 'Driver account not active or approved' }, { status: 403 });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          reference: true,
          status: true,
          driverId: true,
          customerPreferences: true,
        },
      });

      if (!booking) {
        return { ok: false, status: 404, error: 'Order not found' } as const;
      }

      if (!['PENDING_MATCH', 'NO_DRIVER_AVAILABLE'].includes(booking.status)) {
        return { ok: false, status: 400, error: 'Order is not eligible for jobs market' } as const;
      }

      if (booking.driverId) {
        return { ok: false, status: 409, error: 'Order already assigned' } as const;
      }

      const existingAssignment = await tx.assignment.findFirst({
        where: {
          bookingId: orderId,
          status: { in: ['invited', 'claimed', 'accepted'] },
        },
        select: { id: true },
      });

      if (existingAssignment) {
        return { ok: false, status: 409, error: 'Job already taken' } as const;
      }

      const jobsMarketRaw = getJobsMarketMeta(booking.customerPreferences);
      const jobsMarket = jobsMarketRaw ? withJobsMarketOfferExpiry(jobsMarketRaw, now) : null;

      if (!jobsMarket || !jobsMarket.isPublished || jobsMarket.driverPricePence <= 0) {
        return { ok: false, status: 403, error: 'Job is not available for offers' } as const;
      }

      const windowOpen = isOfferWindowOpen(jobsMarket.publishedAt, jobsMarket.offerWindowMinutes, now);
      if (!windowOpen) {
        return { ok: false, status: 400, error: 'Offer window expired' } as const;
      }

      const { minOfferPence, maxOfferPence } = getJobsMarketOfferBounds(jobsMarket.driverPricePence);

      if (offerPence < minOfferPence) {
        return { ok: false, status: 400, error: 'Offer must be at least the base price' } as const;
      }

      if (offerPence > maxOfferPence) {
        return { ok: false, status: 400, error: 'Offer exceeds the allowed maximum' } as const;
      }

      const existingOffer = getJobsMarketDriverOffer(jobsMarket, driver.id);
      if (existingOffer?.status === 'APPROVED') {
        return { ok: false, status: 409, error: 'Offer already approved' } as const;
      }

      const updatedMeta = upsertJobsMarketOffer(jobsMarket, {
        driverId: driver.id,
        driverName: typeof session.user.name === 'string' ? session.user.name : undefined,
        offerPence,
        currency: 'gbp',
        now,
      });

      const updatedPreferences = setJobsMarketMeta(booking.customerPreferences, updatedMeta);

      await tx.booking.update({
        where: { id: orderId },
        data: {
          customerPreferences: updatedPreferences as any,
        },
      });

      return {
        ok: true,
        bookingReference: booking.reference,
        bookingStatus: booking.status,
        bookingDriverId: booking.driverId,
        offer: {
          offerPence,
          currency: 'gbp' as const,
          status: 'PENDING' as const,
          updatedAt: now.toISOString(),
        },
        offersCount: updatedMeta.offers ? updatedMeta.offers.length : 0,
        jobsMarket: updatedMeta,
      } as const;
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const autoApproveDecision = shouldAutoApproveOffer({
      booking: {
        status: result.bookingStatus,
        driverId: result.bookingDriverId,
      },
      driver: {
        status: driver.status,
        onboardingStatus: driver.onboardingStatus,
        rating: driver.rating ?? undefined,
      },
      jobsMarket: result.jobsMarket,
      offerPence,
      now,
    });

    if (autoApproveDecision.ok) {
      const assignResult = await assignJobToDriver({
        bookingId: orderId,
        driverId: driver.id,
        approvedPricePence: offerPence,
        approvedBy: 'system',
        now,
      });

      if (!assignResult.ok) {
        return NextResponse.json({ error: assignResult.error }, { status: assignResult.status });
      }

      console.log('[AUTO-APPROVE] offer', {
        bookingReference: assignResult.bookingReference,
        driverId: assignResult.driverId,
        approvedPricePence: assignResult.approvedPricePence,
      });

      return NextResponse.json({
        success: true,
        autoApproved: true,
        assignmentId: assignResult.assignmentId,
        offer: {
          offerPence,
          currency: 'gbp' as const,
          status: 'APPROVED' as const,
          updatedAt: now.toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      autoApproved: false,
      offersCount: result.offersCount,
      offer: result.offer,
    });
  } catch (error) {
    console.error('❌ Jobs Market offer error:', error);
    return NextResponse.json({ error: 'Failed to submit offer' }, { status: 500 });
  }
}
