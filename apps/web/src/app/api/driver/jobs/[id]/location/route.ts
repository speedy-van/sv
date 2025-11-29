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
    const booking = await prisma.booking.findUnique({
      where: { id: jobId },
      include: {
        Assignment: {
          where: {
            driverId: userId,
            status: { in: ['accepted', 'in_progress'] }
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (booking.Assignment.length === 0) {
      return NextResponse.json(
        { error: 'You are not assigned to this job' },
        { status: 403 }
      );
    }

    // Update driver's current location
    await prisma.driver.update({
      where: { userId },
      data: {
        currentLat: latitude.toString(),
        currentLng: longitude.toString(),
        lastLocationUpdate: new Date(timestamp),
      },
    });

    // Store location history for this job
    await prisma.driverLocationHistory.create({
      data: {
        driverId: userId,
        bookingId: jobId,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        accuracy: accuracy || 0,
        timestamp: new Date(timestamp),
      },
    });

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
