import { prisma } from '@/lib/prisma';
import {
  getJobsMarketMeta,
  isOfferWindowOpen,
  setJobsMarketMeta,
  withJobsMarketOfferExpiry,
  type JobsMarketMeta,
  type JobsMarketOffer,
} from '@/lib/jobsMarket';

const ELIGIBLE_STATUSES = ['PENDING_MATCH', 'NO_DRIVER_AVAILABLE'] as const;

export type AutoApproveAcceptInput = {
  booking: {
    status: string;
    driverId: string | null;
    requiresAdminReview?: boolean | null;
  };
  driver: {
    status: string;
    onboardingStatus: string;
    rating?: number | null;
  };
  jobsMarket: JobsMarketMeta;
  now: Date;
};

export type AutoApproveOfferInput = AutoApproveAcceptInput & {
  offerPence: number;
  driverDistanceToPickupMiles?: number | null;
};

export type AutoApproveOfferResult = { ok: true } | { ok: false; reason: string };

export type AssignJobInput = {
  bookingId: string;
  driverId: string;
  approvedPricePence: number;
  approvedBy: string;
  now?: Date;
  requirePendingOffer?: boolean;
};

export type AssignJobResult =
  | {
      ok: true;
      assignmentId: string;
      bookingId: string;
      bookingReference: string;
      driverId: string;
      approvedPricePence: number;
    }
  | { ok: false; status: number; error: string };

export function computeAutoApproveOfferCap(basePricePence: number): number {
  if (!Number.isFinite(basePricePence) || basePricePence <= 0) {
    return 0;
  }
  return basePricePence + Math.min(500, Math.round(basePricePence * 0.1));
}

export function shouldAutoApproveAccept(input: AutoApproveAcceptInput): boolean {
  const { booking, driver, jobsMarket, now } = input;

  if (!jobsMarket.isPublished || jobsMarket.driverPricePence <= 0) {
    return false;
  }

  if (!isOfferWindowOpen(jobsMarket.publishedAt, jobsMarket.offerWindowMinutes, now)) {
    return false;
  }

  if (!ELIGIBLE_STATUSES.includes(booking.status as (typeof ELIGIBLE_STATUSES)[number])) {
    return false;
  }

  if (booking.driverId) {
    return false;
  }

  if (booking.requiresAdminReview === true) {
    return false;
  }

  if (driver.status !== 'active' || driver.onboardingStatus !== 'approved') {
    return false;
  }

  return true;
}

export function shouldAutoApproveOffer(input: AutoApproveOfferInput): AutoApproveOfferResult {
  const { booking, driver, jobsMarket, offerPence, now, driverDistanceToPickupMiles } = input;

  if (!shouldAutoApproveAccept({ booking, driver, jobsMarket, now })) {
    return { ok: false, reason: 'Base eligibility failed' };
  }

  if (jobsMarket.approvedOffer && jobsMarket.approvedOffer.driverId) {
    return { ok: false, reason: 'Offer already approved' };
  }

  const cap = computeAutoApproveOfferCap(jobsMarket.driverPricePence);
  if (offerPence > cap) {
    return { ok: false, reason: 'Offer exceeds auto-approve cap' };
  }

  const rating = driver.rating;
  if (typeof rating === 'number' && rating > 0 && rating < 4.6) {
    return { ok: false, reason: 'Driver rating below threshold' };
  }

  if (typeof driverDistanceToPickupMiles === 'number' && driverDistanceToPickupMiles > 10) {
    return { ok: false, reason: 'Driver distance too high' };
  }

  return { ok: true };
}

function upsertApprovedOffer(
  offers: JobsMarketOffer[],
  driverId: string,
  approvedPricePence: number,
  now: Date
): JobsMarketOffer[] {
  const updated = offers.map((offer) => {
    if (offer.driverId === driverId) {
      return {
        ...offer,
        offerPence: approvedPricePence,
        status: 'APPROVED',
        updatedAt: now.toISOString(),
      };
    }
    if (offer.status === 'PENDING') {
      return { ...offer, status: 'REJECTED', updatedAt: now.toISOString() };
    }
    return offer;
  });

  const exists = updated.some((offer) => offer.driverId === driverId);
  if (!exists) {
    updated.push({
      driverId,
      offerPence: approvedPricePence,
      currency: 'gbp',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      status: 'APPROVED',
    });
  }

  return updated;
}

export async function assignJobToDriver(input: AssignJobInput): Promise<AssignJobResult> {
  const now = input.now ?? new Date();

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: input.bookingId },
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

    if (!ELIGIBLE_STATUSES.includes(booking.status as (typeof ELIGIBLE_STATUSES)[number])) {
      return { ok: false, status: 400, error: 'Order is not eligible for jobs market' } as const;
    }

    if (booking.driverId) {
      return { ok: false, status: 409, error: 'Order already assigned' } as const;
    }

    const existingAssignment = await tx.assignment.findFirst({
      where: {
        bookingId: input.bookingId,
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
      return { ok: false, status: 403, error: 'Job is not available for assignment' } as const;
    }

    if (!isOfferWindowOpen(jobsMarket.publishedAt, jobsMarket.offerWindowMinutes, now)) {
      return { ok: false, status: 400, error: 'Offer window expired' } as const;
    }

    if (jobsMarket.approvedOffer && jobsMarket.approvedOffer.driverId && jobsMarket.approvedOffer.driverId !== input.driverId) {
      return { ok: false, status: 409, error: 'Offer already approved' } as const;
    }

    const offers = jobsMarket.offers ?? [];
    const existingOffer = offers.find((offer) => offer.driverId === input.driverId);
    if (input.requirePendingOffer && (!existingOffer || existingOffer.status !== 'PENDING')) {
      return { ok: false, status: 404, error: 'Offer not found' } as const;
    }

    const assignment = await tx.assignment.create({
      data: {
        id: `assign_${input.bookingId}_${input.driverId}_${Date.now()}`,
        driverId: input.driverId,
        bookingId: input.bookingId,
        status: 'accepted',
        claimedAt: now,
      },
      select: { id: true },
    });

    const updatedOffers = upsertApprovedOffer(offers, input.driverId, input.approvedPricePence, now);

    const updatedPreferences = setJobsMarketMeta(booking.customerPreferences, {
      ...jobsMarket,
      isPublished: false,
      offers: updatedOffers,
      approvedOffer: {
        driverId: input.driverId,
        offerPence: input.approvedPricePence,
        approvedAt: now.toISOString(),
        approvedBy: input.approvedBy,
      },
      assignmentPendingCapture: true,
    });

    await tx.booking.update({
      where: { id: input.bookingId },
      data: {
        driverId: input.driverId,
        customerPreferences: updatedPreferences as any,
      },
    });

    return {
      ok: true,
      assignmentId: assignment.id,
      bookingId: booking.id,
      bookingReference: booking.reference,
      driverId: input.driverId,
      approvedPricePence: input.approvedPricePence,
    } as const;
  });
}
