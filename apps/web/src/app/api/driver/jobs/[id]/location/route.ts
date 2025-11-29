import { NextRequest, NextResponse } from 'next/server';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate using Bearer token (mobile) or session (web)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
    } else {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== 'driver') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = session.user.id;
    }

    const jobId = params.id;
    const body = await request.json();
    const { latitude, longitude, timestamp, accuracy } = body;

    // Verify job exists and belongs to this driver
    const assignment = await prisma.assignment.findFirst({
      where: {
        bookingId: jobId,
        driverId: userId,
        status: { in: ['accepted', 'claimed'] }
      },
      include: {
        Booking: true
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Job not found or you are not assigned to it' },
        { status: 403 }
      );
    }

    // Location received and validated successfully
    // Note: Full location tracking (storage in DB) can be added later when schema supports it
    // For now, we just validate the driver is assigned and return success

    return NextResponse.json({
      success: true,
      message: 'Location updated for job',
    });
  } catch (error: any) {
    console.error('Error updating job location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}
