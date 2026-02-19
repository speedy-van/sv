import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getJobsMarketMeta, getJobsMarketDriverOffer, getJobsMarketMaxOfferPence, getJobsMarketOfferWindowRemainingSeconds, withJobsMarketOfferExpiry } from '@/lib/jobsMarket';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getPostcodeArea(postcode?: string | null): string {
  if (!postcode) return '';
  return postcode.split(' ')[0] || postcode;
}

function getDistanceMiles(booking: { distanceMeters?: number | null; baseDistanceMiles?: number | null }): number | null {
  if (booking.distanceMeters && booking.distanceMeters > 0) {
    return Number((booking.distanceMeters / 1609.34).toFixed(1));
  }
  if (booking.baseDistanceMiles && booking.baseDistanceMiles > 0) {
    return Number(booking.baseDistanceMiles.toFixed(1));
  }
  return null;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userRole = (session.user as any)?.role as string | undefined;
    if (!userRole || !['admin', 'superadmin', 'driver'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const eligibleStatuses = ['PENDING_MATCH', 'NO_DRIVER_AVAILABLE'] as const;

    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: eligibleStatuses as unknown as string[] },
        driverId: null,
        Assignment: {
          none: { status: { in: ['invited', 'claimed', 'accepted'] } }
        }
      },
      select: {
        id: true,
        reference: true,
        status: true,
        scheduledAt: true,
        pickupTimeSlot: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        totalGBP: true,
        paidAt: true,
        stripePaymentIntentId: true,
        distanceMeters: true,
        baseDistanceMiles: true,
        pickupAddress: { select: { label: true, postcode: true } },
        dropoffAddress: { select: { label: true, postcode: true } },
        BookingItem: { select: { name: true, quantity: true } },
        customerPreferences: true,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 200,
    });

    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const now = new Date();

    if (isAdmin) {
      const adminData = bookings.map((booking) => {
        const jobsMarketRaw = getJobsMarketMeta(booking.customerPreferences);
        const jobsMarket = jobsMarketRaw ? withJobsMarketOfferExpiry(jobsMarketRaw, now) : null;

        return {
          id: booking.id,
          reference: booking.reference,
          status: booking.status,
          scheduledAt: booking.scheduledAt,
          pickupTimeSlot: booking.pickupTimeSlot,
          pickupAddress: booking.pickupAddress?.label || '',
          pickupPostcode: booking.pickupAddress?.postcode || '',
          dropoffAddress: booking.dropoffAddress?.label || '',
          dropoffPostcode: booking.dropoffAddress?.postcode || '',
          items: booking.BookingItem?.map((item) => ({
            name: item.name,
            quantity: item.quantity,
          })) || [],
          itemsCount: booking.BookingItem?.length || 0,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          totalGBP: booking.totalGBP,
          paymentCaptured: Boolean(booking.paidAt),
          stripePaymentIntentId: booking.stripePaymentIntentId,
          driverPricePence: jobsMarket?.driverPricePence ?? null,
          driverPriceCurrency: jobsMarket?.driverPriceCurrency ?? null,
          isPublished: Boolean(jobsMarket?.isPublished),
          publishedAt: jobsMarket?.publishedAt ?? null,
          publishedBy: jobsMarket?.publishedBy ?? null,
          offerWindowRemainingSeconds: jobsMarket ? getJobsMarketOfferWindowRemainingSeconds(jobsMarket, now) : 0,
          offers: jobsMarket?.offers ?? [],
          approvedOffer: jobsMarket?.approvedOffer ?? null,
          assignmentPendingCapture: Boolean(jobsMarket?.assignmentPendingCapture),
          distanceMiles: getDistanceMiles(booking),
        };
      });

      return NextResponse.json({ role: 'admin', jobs: adminData });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const driverData = bookings
      .map((booking) => {
        const jobsMarketRaw = getJobsMarketMeta(booking.customerPreferences);
        const jobsMarket = jobsMarketRaw ? withJobsMarketOfferExpiry(jobsMarketRaw, now) : null;

        if (!jobsMarket || !jobsMarket.isPublished || jobsMarket.driverPricePence <= 0) {
          return null;
        }

        const driverOffer = getJobsMarketDriverOffer(jobsMarket, driver.id);

        return {
          id: booking.id,
          reference: booking.reference,
          status: booking.status,
          scheduledAt: booking.scheduledAt,
          pickupTimeSlot: booking.pickupTimeSlot,
          pickupPostcodeArea: getPostcodeArea(booking.pickupAddress?.postcode),
          dropoffPostcodeArea: getPostcodeArea(booking.dropoffAddress?.postcode),
          itemsCount: booking.BookingItem?.length || 0,
          driverPricePence: jobsMarket.driverPricePence,
          driverPriceCurrency: jobsMarket.driverPriceCurrency,
          maxOfferPence: getJobsMarketMaxOfferPence(jobsMarket.driverPricePence),
          offerWindowRemainingSeconds: getJobsMarketOfferWindowRemainingSeconds(jobsMarket, now),
          driverOffer: driverOffer
            ? {
                offerPence: driverOffer.offerPence,
                currency: driverOffer.currency,
                status: driverOffer.status,
                updatedAt: driverOffer.updatedAt,
              }
            : null,
          distanceMiles: getDistanceMiles(booking),
        };
      })
      .filter((job): job is NonNullable<typeof job> => job !== null);

    return NextResponse.json({ role: 'driver', jobs: driverData });
  } catch (error) {
    console.error('❌ Jobs Market API error:', error);
    return NextResponse.json({ error: 'Failed to load jobs market' }, { status: 500 });
  }
}
