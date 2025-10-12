import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { unifiedEmailService, type OrderCancellationData } from '@/lib/email/UnifiedEmailService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { code } = params;
    const { reason } = await request.json();

    // Fetch booking before cancellation
    const booking = await prisma.booking.findUnique({
      where: { reference: code },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        items: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order can be cancelled
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      );
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel completed order' },
        { status: 400 }
      );
    }

    // Update booking status to CANCELLED
    const cancelledOrder = await prisma.booking.update({
      where: { reference: code },
      data: {
        status: 'CANCELLED',
        // Add cancellation fields when available in schema
      },
    });

    // Log audit trail
    await logAudit((session.user as any).id, 'cancel_order', booking.id, { targetType: 'booking', before: { status: booking.status }, after: { status: 'CANCELLED', reason } });

    // Send cancellation email to customer
    try {
      const emailData: OrderCancellationData = {
        customerEmail: booking.customerEmail,
        orderNumber: booking.reference,
        customerName: booking.customerName,
        reason: reason || 'Cancelled by admin',
        refundAmount: booking.paidAt ? booking.totalGBP / 100 : undefined,
        currency: 'GBP',
      };

      const emailResult = await unifiedEmailService.sendOrderCancellation(emailData);
      
      if (emailResult.success) {
        console.log('✅ Order cancellation email sent successfully:', {
          orderRef: booking.reference,
          email: booking.customerEmail,
        });
      } else {
        console.error('❌ Failed to send order cancellation email:', emailResult.error);
      }

    } catch (emailError) {
      console.error('❌ Error sending cancellation email:', emailError);
      // Continue with cancellation even if email fails
    }

    // Notify drivers about cancellation
    const pusher = require('@/lib/pusher').default;
    
    try {
      // Notify all drivers about cancellation
      await pusher.trigger('driver-notifications', 'job-cancelled', {
        jobId: booking.id
      });
      
      // If a driver was assigned, send specific notification
      if (booking.driverId) {
        await pusher.trigger(`driver-${booking.driverId}`, 'job-cancelled', {
          jobId: booking.id,
          message: `Job ${booking.reference} has been cancelled by admin. Reason: ${reason || 'No reason provided'}`
        });
      }
      
      console.log('✅ Order cancelled successfully:', {
        reference: booking.reference,
        previousStatus: booking.status,
        reason,
        adminUser: session.user.email,
        notificationSent: true
      });
    } catch (pusherError) {
      console.error('❌ Error sending cancellation notification:', pusherError);
      // Continue even if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        id: cancelledOrder.id,
        reference: cancelledOrder.reference,
        status: cancelledOrder.status,
        customerName: cancelledOrder.customerName,
      },
    });

  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
