import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Convert a draft into a booking by calling the main booking endpoint.
 * Requires the draft to have customer details, items, pickup/dropoff addresses.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { reference: string } }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const reference = decodeURIComponent(params.reference);

  try {
    const draft = await prisma.bookingDraft.findUnique({ where: { reference } });
    if (!draft) {
      return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });
    }

    const step1 = draft.formStep1 as any;
    const step2 = draft.formStep2 as any;

    const hasCustomer =
      step2?.customerDetails?.email &&
      step2?.customerDetails?.firstName &&
      step2?.customerDetails?.lastName &&
      step2?.customerDetails?.phone;

    if (!hasCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Draft is missing customer details (name/email/phone). Cannot convert.',
        },
        { status: 400 }
      );
    }

    const pickupAddress = draft.pickupAddress || step1?.pickupAddress;
    const dropoffAddress = draft.dropoffAddress || step1?.dropoffAddress;
    const items = draft.items || step1?.items || [];
    const pricing = draft.pricing || step1?.pricing;

    if (!pickupAddress || !dropoffAddress || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Draft missing addresses or items. Cannot convert.' },
        { status: 400 }
      );
    }

    const body = {
      bookingDraftId: draft.id,
      reference,
      customer: {
        name: `${step2.customerDetails.firstName} ${step2.customerDetails.lastName}`.trim(),
        email: step2.customerDetails.email,
        phone: step2.customerDetails.phone,
      },
      pickupAddress,
      dropoffAddress,
      pickupDetails: step1?.pickupProperty || {},
      dropoffDetails: step1?.dropoffProperty || {},
      items,
      pricing: pricing || { total: 0 },
      serviceType: step1?.serviceType || 'standard',
      crewSize: step1?.crewSize || '2',
      pickupDate: step1?.pickupDate,
      pickupTimeSlot: step1?.pickupTimeSlot,
      urgency: step1?.urgency || 'scheduled',
      metadata: {
        source: 'admin-convert-draft',
      },
    };

    const res = await fetch(`${request.nextUrl.origin}/api/booking-luxury`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: json?.error || 'Failed to convert draft', details: json?.details },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      booking: json.booking,
      message: 'Draft converted to booking',
    });
  } catch (error) {
    console.error('❌ Admin convert draft failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to convert draft' }, { status: 500 });
  }
}

