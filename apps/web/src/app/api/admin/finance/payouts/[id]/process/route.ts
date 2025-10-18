import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: payoutId } = await params;

    // Get payout details
    const payout = await prisma.driverPayout.findUnique({
      where: { id: payoutId },
      include: {
        Driver: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                isActive: true
              }
            },
            DriverPayoutSettings: true,
          },
        },
        DriverEarnings: {
          include: {
            Assignment: {
              include: {
                Booking: true,
              },
            },
          },
        },
      },
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    if (payout.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Payout is not in pending status',
        },
        { status: 400 }
      );
    }

    // Check if driver has payout settings
    if (!payout.Driver?.DriverPayoutSettings) {
      return NextResponse.json(
        {
          error: 'Driver has no payout settings configured',
        },
        { status: 400 }
      );
    }

    // Process payout through Stripe (if using Stripe Connect)
    let stripeTransferId = null;
    let failureReason = null;

    try {
      if (payout.Driver?.DriverPayoutSettings?.stripeAccountId) {
        // Process through Stripe Connect
        const transfer = await stripe.transfers.create({
          amount: payout.totalAmountPence,
          currency: payout.currency,
          destination: payout.Driver.DriverPayoutSettings.stripeAccountId,
          description: `Payout for ${payout.Driver.User?.name || 'Unknown Driver'}`,
          metadata: {
            payoutId: payout.id,
            driverId: payout.driverId,
            earningsCount: payout.DriverEarnings?.length.toString() || '0',
          },
        });
        stripeTransferId = transfer.id;
      } else {
        // Manual payout processing (bank transfer, etc.)
        // This would integrate with your bank's API or manual process
        console.log(
          `Manual payout processing required for driver ${payout.Driver?.User?.name || 'Unknown Driver'}`
        );
      }
    } catch (stripeError: any) {
      console.error('Stripe transfer error:', stripeError);
      failureReason = `Stripe transfer failed: ${stripeError.message}`;

      // Update payout as failed
      await prisma.driverPayout.update({
        where: { id: payoutId },
        data: {
          status: 'failed',
          failedAt: new Date(),
          failureReason: failureReason,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorRole: 'admin',
          action: 'payout_failed',
          targetType: 'driver_payout',
          targetId: payoutId,
          after: {
            previousStatus: 'pending',
            newStatus: 'failed',
            failureReason: failureReason,
            stripeTransferId: stripeTransferId,
          },
          ip:
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      return NextResponse.json(
        {
          error: failureReason,
        },
        { status: 400 }
      );
    }

    // Update payout as processed
    const updatedPayout = await prisma.driverPayout.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        processedAt: new Date(),
        stripeTransferId: stripeTransferId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: 'admin',
        action: 'payout_processed',
        targetType: 'driver_payout',
        targetId: payoutId,
        after: {
          previousStatus: 'pending',
          newStatus: 'completed',
          stripeTransferId: stripeTransferId,
          processedAt: updatedPayout.processedAt,
        },
        ip:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Send notification to driver
    try {
      const { notifyPayoutProcessed } = await import('@/lib/notifications');
      await notifyPayoutProcessed(payout.driverId, {
        id: payout.id,
        amount: payout.totalAmountPence,
      });
    } catch (notificationError) {
      console.error('Failed to send payout notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: updatedPayout.id,
        driverName: payout.Driver?.User?.name || 'Unknown',
        totalAmountPence: updatedPayout.totalAmountPence,
        status: updatedPayout.status,
        processedAt: updatedPayout.processedAt,
        stripeTransferId: updatedPayout.stripeTransferId,
      },
    });
  } catch (error) {
    console.error('Payout processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
