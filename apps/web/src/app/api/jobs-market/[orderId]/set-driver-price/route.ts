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
    const body = await request.json();
    const driverPricePence = Number(body?.driverPricePence);
    const currency = typeof body?.currency === 'string' ? body.currency.toLowerCase() : '';

    if (!Number.isFinite(driverPricePence) || driverPricePence <= 0) {
      return NextResponse.json({ error: 'driverPricePence must be a positive number' }, { status: 400 });
    }

    if (currency !== 'gbp') {
      return NextResponse.json({ error: 'Only GBP is supported' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: orderId },
      select: { id: true, customerPreferences: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const existingMeta = getJobsMarketMeta(booking.customerPreferences);
    const updatedPreferences = setJobsMarketMeta(booking.customerPreferences, {
      driverPricePence,
      driverPriceCurrency: 'gbp',
      isPublished: existingMeta?.isPublished ?? false,
      publishedAt: existingMeta?.publishedAt,
      publishedBy: existingMeta?.publishedBy,
    });

    await prisma.booking.update({
      where: { id: orderId },
      data: {
        customerPreferences: updatedPreferences as any,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Jobs Market set driver price error:', error);
    return NextResponse.json({ error: 'Failed to set driver price' }, { status: 500 });
  }
}
