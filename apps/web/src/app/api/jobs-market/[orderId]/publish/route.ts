import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getJobsMarketMeta, setJobsMarketMeta } from '@/lib/jobsMarket';

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

    const booking = await prisma.booking.findUnique({
      where: { id: orderId },
      select: { id: true, customerPreferences: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentMeta = getJobsMarketMeta(booking.customerPreferences);

    if (!currentMeta || currentMeta.driverPricePence <= 0) {
      return NextResponse.json({ error: 'Set driver price and currency before publishing' }, { status: 400 });
    }

    const publishedAt = currentMeta?.publishedAt ?? new Date().toISOString();

    const updatedPreferences = setJobsMarketMeta(booking.customerPreferences, {
      ...currentMeta,
      isPublished: true,
      publishedAt,
      publishedBy: session.user.id,
      offerWindowMinutes: 5,
      offers: [],
      approvedOffer: null,
    });

    await prisma.booking.update({
      where: { id: orderId },
      data: {
        customerPreferences: updatedPreferences as any,
      },
    });

    return NextResponse.json({ success: true, published: true });
  } catch (error) {
    console.error('❌ Jobs Market publish error:', error);
    return NextResponse.json({ error: 'Failed to update publish state' }, { status: 500 });
  }
}
