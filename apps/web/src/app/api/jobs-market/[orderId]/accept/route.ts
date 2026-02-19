import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getJobsMarketMeta } from '@/lib/jobsMarket';
import { assignJobToDriver, shouldAutoApproveAccept } from '@/lib/jobsMarketAutoApprove';

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

    const booking = await prisma.booking.findUnique({
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
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const jobsMarket = getJobsMarketMeta(booking.customerPreferences);

    if (!jobsMarket || !jobsMarket.isPublished || jobsMarket.driverPricePence <= 0) {
      return NextResponse.json({ error: 'Job is not available for acceptance' }, { status: 403 });
    }

    const now = new Date();
    const canAutoApprove = shouldAutoApproveAccept({
      booking: {
        status: booking.status,
        driverId: booking.driverId,
      },
      driver: {
        status: driver.status,
        onboardingStatus: driver.onboardingStatus,
        rating: driver.rating ?? undefined,
      },
      jobsMarket,
      now,
    });

    if (!canAutoApprove) {
      return NextResponse.json({ error: 'Job is not eligible for auto-approve' }, { status: 400 });
    }

    const result = await assignJobToDriver({
      bookingId: orderId,
      driverId: driver.id,
      approvedPricePence: jobsMarket.driverPricePence,
      approvedBy: 'system',
      now,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    console.log('[AUTO-APPROVE] accept', {
      bookingReference: result.bookingReference,
      driverId: result.driverId,
      approvedPricePence: result.approvedPricePence,
    });

    return NextResponse.json({ success: true, assignmentId: result.assignmentId, autoApproved: true });
  } catch (error) {
    console.error('❌ Jobs Market accept error:', error);
    return NextResponse.json({ error: 'Failed to accept job' }, { status: 500 });
  }
}
