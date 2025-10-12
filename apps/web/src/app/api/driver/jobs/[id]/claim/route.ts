import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to session auth (for web)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Login required' },
          { status: 401 }
        );
      }
      userId = (session.user as any).id;
    }

    const jobId = params.id;
    // Get driver data
    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        Document: true,
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Check if driver is approved
    if (driver.onboardingStatus !== 'approved') {
      return NextResponse.json(
        {
          error: 'Driver not approved',
          reason: 'onboarding_incomplete',
        },
        { status: 403 }
      );
    }

    // Check for expired documents
    const now = new Date();
    const expiredDocs = driver.Document?.filter(
      doc => doc.expiresAt && doc.expiresAt < now
    ) || [];

    if (expiredDocs.length > 0) {
      return NextResponse.json(
        {
          error: 'Documents expired',
          reason: 'expired_documents',
          expiredDocs: expiredDocs.map(doc => doc.category),
        },
        { status: 403 }
      );
    }

    // Skip checks that don't exist in schema for now
    // TODO: Add proper validation when fields are available

    // Use a transaction to handle race conditions
    const result = await prisma.$transaction(async tx => {
      // Check if job exists and is available
      const job = await tx.booking.findUnique({
        where: { id: jobId },
        include: {
          Assignment: true,
        },
      });

      if (!job) {
        throw new Error('Job not found');
      }

      if (job.status !== 'CONFIRMED') {
        throw new Error('Job is not available for claiming');
      }

      if (job.driverId) {
        throw new Error('Job already has a driver assigned');
      }

      if (job.Assignment) {
        throw new Error('Job already has an assignment');
      }

      // Check if driver already has an active job
      const activeAssignment = await tx.assignment.findFirst({
        where: {
          driverId: driver.id,
          status: {
            in: ['accepted'],
          },
        },
      });

      if (activeAssignment) {
        throw new Error('Driver already has an active job');
      }

      // Create assignment with atomic operation
      const assignment = await tx.assignment.create({
        data: {
          id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          bookingId: jobId,
          driverId: driver.id,
          status: 'claimed',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes to accept
          score: job.totalGBP, // Store the job amount as score
          updatedAt: new Date(),
        },
      });

      // Update booking to assign driver
      await tx.booking.update({
        where: { id: jobId },
        data: {
          driverId: driver.id,
          status: 'CONFIRMED',
        },
      });

      return assignment;
    });

    return NextResponse.json({
      success: true,
      assignment: {
        id: result.id,
        status: result.status,
        expiresAt: result.expiresAt,
        jobId: jobId,
      },
      message:
        'Job claimed successfully. You have 5 minutes to accept or decline.',
    });
  } catch (error: any) {
    console.error('Job claim API error:', error);

    if (error.message === 'Job not found') {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (error.message === 'Job is not available for claiming') {
      return NextResponse.json(
        { error: 'Job is not available for claiming' },
        { status: 409 }
      );
    }

    if (error.message === 'Job already has a driver assigned') {
      return NextResponse.json(
        { error: 'Job already claimed by another driver' },
        { status: 409 }
      );
    }

    if (error.message === 'Job already has an assignment') {
      return NextResponse.json(
        { error: 'Job already claimed by another driver' },
        { status: 409 }
      );
    }

    if (error.message === 'Driver already has an active job') {
      return NextResponse.json(
        { error: 'You already have an active job' },
        { status: 409 }
      );
    }

    if (error.message === 'Driver must be online to claim jobs') {
      return NextResponse.json(
        { error: 'You must be online to claim jobs' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
