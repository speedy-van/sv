import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
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

    const { code } = await params;

    // Fetch booking with property details
    const booking = await prisma.booking.findUnique({
      where: { reference: code },
      include: {
        pickupProperty: true,
        dropoffProperty: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order needs floor warning
    const hasPickupFloorIssue = !booking.pickupProperty?.floors || booking.pickupProperty.floors === 0;
    const hasDropoffFloorIssue = !booking.dropoffProperty?.floors || booking.dropoffProperty.floors === 0;

    if (!hasPickupFloorIssue && !hasDropoffFloorIssue) {
      return NextResponse.json({
        success: true,
        message: 'No floor warnings needed for this order',
        sent: false,
      });
    }

    // Send floor warning email
    const result = await unifiedEmailService.sendFloorWarningIfNeeded({
      reference: booking.reference,
      customerEmail: booking.customerEmail,
      customerName: booking.customerName,
      pickupProperty: booking.pickupProperty || undefined,
      dropoffProperty: booking.dropoffProperty || undefined,
    });

    if (result.success && result.sent) {
      console.log('✅ Floor warning email sent successfully:', {
        orderRef: booking.reference,
        email: booking.customerEmail,
        pickupFloorIssue: hasPickupFloorIssue,
        dropoffFloorIssue: hasDropoffFloorIssue,
        sentBy: session.user.email,
      });

      return NextResponse.json({
        success: true,
        message: 'Floor warning email sent successfully',
        sent: true,
        details: {
          pickupFloorIssue: hasPickupFloorIssue,
          dropoffFloorIssue: hasDropoffFloorIssue,
        },
      });
    } else {
      console.error('❌ Failed to send floor warning email:', result.error);

      return NextResponse.json({
        success: false,
        error: result.message || 'Failed to send floor warning email',
        sent: false,
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error sending floor warning email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send floor warning email',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
