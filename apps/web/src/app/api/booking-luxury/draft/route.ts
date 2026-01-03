import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createUniqueReference, getNextReferenceNumber } from '@/lib/ref';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Create a booking draft with a unique reference.
 * Does not require customer PII; stores partial data as provided.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const providedReference = typeof body.reference === 'string' ? body.reference.trim() : undefined;

    let reference = providedReference && providedReference.length > 0
      ? providedReference
      : await getNextReferenceNumber();

    // Ensure uniqueness across both drafts and bookings
    const [existingDraft, existingBooking] = await Promise.all([
      prisma.bookingDraft.findUnique({ where: { reference } }),
      prisma.booking.findUnique({ where: { reference } }),
    ]);
    
    if (existingDraft || existingBooking) {
      reference = await createUniqueReference('booking');
    }

    // Use upsert to handle race conditions - if reference exists, return existing draft
    const draft = await prisma.bookingDraft.upsert({
      where: { reference },
      update: {}, // Don't update anything if it exists
      create: {
        reference,
        status: 'DRAFT',
        formStep1: body.formStep1 ?? null,
        formStep2: body.formStep2 ?? null,
        pickupAddress: body.pickupAddress ?? null,
        dropoffAddress: body.dropoffAddress ?? null,
        items: body.items ?? null,
        pricing: body.pricing ?? null,
        capacityCheck: body.capacityCheck ?? null,
        serviceType: body.serviceType ?? null,
        crewSize: body.crewSize ?? null,
        scheduledDate: body.scheduledDate ?? null,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json({ success: true, draft: { id: draft.id, reference: draft.reference } });
  } catch (error) {
    console.error('❌ Failed to create booking draft:', error);
    return NextResponse.json({ success: false, error: 'Failed to create booking draft' }, { status: 500 });
  }
}

