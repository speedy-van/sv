import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { unifiedEmailService, type OrderConfirmationData } from '@/lib/email/UnifiedEmailService';

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

    // Fetch booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { reference: code },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        pickupProperty: true,
        dropoffProperty: true,
        items: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is in a valid state for confirmation email
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot send confirmation for cancelled order' },
        { status: 400 }
      );
    }

    // Check for floor number issues
    const hasPickupFloorIssue = !booking.pickupProperty?.floors || booking.pickupProperty.floors === 0;
    const hasDropoffFloorIssue = !booking.dropoffProperty?.floors || booking.dropoffProperty.floors === 0;

    // Prepare email data
    const emailData: OrderConfirmationData = {
      customerEmail: booking.customerEmail,
      orderNumber: booking.reference,
      customerName: booking.customerName,
      pickupAddress: booking.pickupAddress?.label || 'Address not specified',
      dropoffAddress: booking.dropoffAddress?.label || 'Address not specified',
      scheduledDate: booking.scheduledAt.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      totalAmount: booking.totalGBP / 100,
      currency: 'GBP',
    };

    // Send confirmation email
    const emailResult = await unifiedEmailService.sendOrderConfirmation(emailData);
    
    if (!emailResult.success) {
      console.error('Email send failed:', emailResult.error);
      return NextResponse.json(
        { 
          error: 'Failed to send confirmation email',
          details: emailResult.error 
        },
        { status: 500 }
      );
    }

    // Log audit trail
    await logAudit((session.user as any).id, 'send_confirmation_email', booking.id, { targetType: 'booking', before: null, after: { recipient: booking.customerEmail, hasFloorWarnings: hasPickupFloorIssue || hasDropoffFloorIssue, sentBy: (session.user as any).email } });

    console.log('✅ Manual confirmation email sent successfully:', {
      orderRef: booking.reference,
      email: booking.customerEmail,
      hasFloorWarnings: hasPickupFloorIssue || hasDropoffFloorIssue,
      sentBy: session.user.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Confirmation email sent successfully',
      emailSent: true,
      hasFloorWarnings: hasPickupFloorIssue || hasDropoffFloorIssue,
    });

  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send confirmation email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
