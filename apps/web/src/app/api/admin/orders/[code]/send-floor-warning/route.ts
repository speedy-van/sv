import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { code } = await params;

    // Fetch booking with property details using current Prisma relation names
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

    // Property details
    const pickupProperty = booking.pickupProperty;
    const dropoffProperty = booking.dropoffProperty;

    // Check if order needs floor warning
    // Only warn if floors is explicitly 0, null, or undefined
    // If floors > 0, customer provided floor number, so no warning needed
    const pickupFloors = pickupProperty?.floors;
    const dropoffFloors = dropoffProperty?.floors;
    let hasPickupFloorIssue = pickupFloors === null || pickupFloors === undefined || pickupFloors === 0;
    let hasDropoffFloorIssue = dropoffFloors === null || dropoffFloors === undefined || dropoffFloors === 0;

    const preferences = (booking.customerPreferences as any) || {};
    const pickupMeta = preferences?.pickupAddressMeta || {};
    const dropoffMeta = preferences?.dropoffAddressMeta || {};

    const hasPickupFlatNumber = typeof pickupMeta.flatNumber === 'string' && pickupMeta.flatNumber.trim().length > 0;
    const hasDropoffFlatNumber = typeof dropoffMeta.flatNumber === 'string' && dropoffMeta.flatNumber.trim().length > 0;

    const parseFloorValue = (value: unknown): number | undefined => {
      if (typeof value === 'number') {
        return Number.isNaN(value) ? undefined : value;
      }
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    };

    const pickupFloorMeta = parseFloorValue(pickupMeta.floorNumber);
    const dropoffFloorMeta = parseFloorValue(dropoffMeta.floorNumber);

    if (pickupFloorMeta && pickupFloorMeta > 0) {
      hasPickupFloorIssue = false;
    }
    if (dropoffFloorMeta && dropoffFloorMeta > 0) {
      hasDropoffFloorIssue = false;
    }

    if (hasPickupFlatNumber) {
      hasPickupFloorIssue = false;
    }
    if (hasDropoffFlatNumber) {
      hasDropoffFloorIssue = false;
    }

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
      pickupProperty: pickupProperty || undefined,
      dropoffProperty: dropoffProperty || undefined,
      pickupAddressMeta: pickupMeta,
      dropoffAddressMeta: dropoffMeta,
    });

    if (result.success && result.sent) {
      console.log('✅ Floor warning email sent successfully:', {
        orderRef: booking.reference,
        email: booking.customerEmail,
        pickupFloorIssue: hasPickupFloorIssue,
        dropoffFloorIssue: hasDropoffFloorIssue,
        sentBy: user.email,
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
