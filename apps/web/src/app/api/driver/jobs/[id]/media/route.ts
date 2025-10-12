import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertDriver } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  try {
    assertDriver(session!);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }

  const userId = session.user.id;
  const assignmentId = params.id;

  try {
    // Get driver
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Verify assignment belongs to driver and is active
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        driverId: driver.id,
        status: 'accepted',
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or not active' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { mediaUrls, step, notes } = body;

    if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
      return NextResponse.json(
        { error: 'Media URLs are required' },
        { status: 400 }
      );
    }

    if (!step) {
      return NextResponse.json({ error: 'Step is required' }, { status: 400 });
    }

    // Validate step
    const validSteps = [
      'navigate_to_pickup',
      'arrived_at_pickup',
      'loading_started',
      'loading_completed',
      'en_route_to_dropoff',
      'arrived_at_dropoff',
      'unloading_started',
      'unloading_completed',
      'job_completed',
      'customer_signature',
      'damage_notes',
      'item_count_verification',
    ];

    if (!validSteps.includes(step)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    // Create job event with media
    const jobEvent = await prisma.jobEvent.create({
      data: {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assignmentId,
        step,
        mediaUrls,
        notes: notes || null,
        createdBy: driver.id,
      },
    });

    // If job is completed, update assignment status
    if (step === 'job_completed') {
      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { status: 'completed' },
      });
    }

    return NextResponse.json({
      success: true,
      event: {
        id: jobEvent.id,
        step: jobEvent.step,
        mediaUrls: jobEvent.mediaUrls,
        notes: jobEvent.notes,
        createdAt: jobEvent.createdAt,
      },
    });
  } catch (error) {
    console.error('Job media API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
