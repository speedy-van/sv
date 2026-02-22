import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
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
    const payload = {
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
    } as const;

    // If client sends a reference, treat it as an idempotent create/read key.
    if (providedReference && providedReference.length > 0) {
      const existingDraft = await prisma.bookingDraft.findUnique({
        where: { reference: providedReference },
      });
      if (existingDraft) {
        return NextResponse.json({
          success: true,
          draft: { id: existingDraft.id, reference: existingDraft.reference },
        });
      }
    }

    // Generate robustly under concurrency. Retry on P2002 collisions.
    const maxAttempts = 5;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const reference =
        attempt === 0 && providedReference && providedReference.length > 0
          ? providedReference
          : attempt === 0
            ? await getNextReferenceNumber()
            : await createUniqueReference('booking');

      const existingBooking = await prisma.booking.findUnique({ where: { reference } });
      if (existingBooking) {
        continue;
      }

      try {
        const draft = await prisma.bookingDraft.create({
          data: {
            reference,
            ...payload,
          },
        });

        return NextResponse.json({ success: true, draft: { id: draft.id, reference: draft.reference } });
      } catch (error) {
        const isUniqueConstraint =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

        if (isUniqueConstraint) {
          if (providedReference && providedReference.length > 0) {
            const existingDraft = await prisma.bookingDraft.findUnique({
              where: { reference: providedReference },
            });
            if (existingDraft) {
              return NextResponse.json({
                success: true,
                draft: { id: existingDraft.id, reference: existingDraft.reference },
              });
            }
          }
          lastError = error;
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new Error('Unable to allocate unique booking draft reference');

  } catch (error) {
    console.error('❌ Failed to create booking draft:', error);
    return NextResponse.json({ success: false, error: 'Failed to create booking draft' }, { status: 500 });
  }
}

