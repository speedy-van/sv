import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Update a booking draft with incremental data from the client.
 * Keeps reference stable; does not finalize the booking.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: draftId } = await params;

  try {
    const body = await request.json().catch(() => ({}));

    const draft = await prisma.bookingDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });
    }

    const updated = await prisma.bookingDraft.update({
      where: { id: draftId },
      data: {
        formStep1: body.formStep1 ?? draft.formStep1,
        formStep2: body.formStep2 ?? draft.formStep2,
        pickupAddress: body.pickupAddress ?? draft.pickupAddress,
        dropoffAddress: body.dropoffAddress ?? draft.dropoffAddress,
        items: body.items ?? draft.items,
        pricing: body.pricing ?? draft.pricing,
        capacityCheck: body.capacityCheck ?? draft.capacityCheck,
        serviceType: body.serviceType ?? draft.serviceType,
        crewSize: body.crewSize ?? draft.crewSize,
        scheduledDate: body.scheduledDate ?? draft.scheduledDate,
        notes: body.notes ?? draft.notes,
        status: body.status ?? draft.status,
      },
    });

    return NextResponse.json({ success: true, draft: { id: updated.id, reference: updated.reference } });
  } catch (error) {
    console.error('❌ Failed to update booking draft:', error);
    return NextResponse.json({ success: false, error: 'Failed to update booking draft' }, { status: 500 });
  }
}

