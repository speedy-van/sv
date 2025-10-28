import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticateBearerToken } from '@/lib/bearer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// CORS headers for mobile app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params first (Next.js 15 requirement)
    const { id } = await params;
    console.log('🚗 Driver Job Accept API - Starting request for job:', id);
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        console.log('❌ Driver Job Accept API - No session found');
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        );
      }
      userId = session.user.id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    // Get user role from bearer auth or session
    const session = bearerAuth.success ? null : await getServerSession(authOptions);
    const userRole = bearerAuth.success ? bearerAuth.user.role : (session?.user as any)?.role;
    if (userRole !== 'driver') {
      console.log('❌ Driver Job Accept API - Invalid role:', userRole);
      return NextResponse.json(
        { error: 'Forbidden - Driver access required' },
        { status: 403 }
      );
    }

    console.log('🚗 Driver Job Accept API - Processing for user:', userId);

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { id: true, status: true, onboardingStatus: true }
    });

    if (!driver) {
      console.log('❌ Driver Job Accept API - Driver profile not found');
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404 }
      );
    }

    if (driver.status !== 'active' || driver.onboardingStatus !== 'approved') {
      console.log('❌ Driver Job Accept API - Driver not active or approved');
      return NextResponse.json(
        { error: 'Driver account not active or not approved' },
        { status: 403 }
      );
    }

    const { id: bookingId } = await params;

    // Check if the booking exists and is available
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        Assignment: true
      }
    });

    if (!booking) {
      console.log('❌ Driver Job Accept API - Booking not found:', bookingId);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status !== 'CONFIRMED') {
      console.log('❌ Driver Job Accept API - Booking not confirmed:', booking.status);
      return NextResponse.json(
        { error: 'Booking is not available for acceptance' },
        { status: 400 }
      );
    }

    // Check if there's an invitation for this driver
    const invitation = await prisma.assignment.findFirst({
      where: {
        bookingId: bookingId,
        driverId: driver.id,
        status: 'invited'
      }
    });

    // Check if already assigned to another driver
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        bookingId: bookingId,
        driverId: { not: driver.id }, // Another driver
        status: { in: ['accepted', 'invited'] }
      }
    });

    if (existingAssignment && !invitation) {
      console.log('❌ Driver Job Accept API - Booking already assigned to another driver');
      return NextResponse.json(
        { error: 'This job has already been assigned to another driver' },
        { status: 400 }
      );
    }

    console.log('✅ Driver Job Accept API - Processing acceptance');

    // Get driver name for notifications
    const driverUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });

    // Create or update assignment and update booking
    await prisma.$transaction(async (tx) => {
      if (invitation) {
        // Update existing invitation to accepted
        await tx.assignment.update({
          where: { id: invitation.id },
          data: {
            status: 'accepted',
            claimedAt: new Date(),
            updatedAt: new Date()
          }
        });
      } else {
        // Find existing assignment or create new one
        const existingAssignment = await tx.assignment.findFirst({
          where: { bookingId: bookingId }
        });
        
        if (existingAssignment) {
          await tx.assignment.update({
            where: { id: existingAssignment.id },
            data: {
              driverId: driver.id,
              status: 'accepted',
              claimedAt: new Date(),
              updatedAt: new Date()
            }
          });
        } else {
          await tx.assignment.create({
            data: {
              id: `assign_${bookingId}_${driver.id}_${Date.now()}`,
              driverId: driver.id,
              bookingId: bookingId,
              status: 'accepted',
              claimedAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }

      // Update the booking to assign it to the driver
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          driverId: driver.id,
          status: 'CONFIRMED'
        }
      });
    });

    console.log('✅ Driver Job Accept API - Successfully accepted job:', bookingId);

    // Send real-time notifications
    try {
      const { getPusherServer } = await import('@/lib/pusher');
      const pusher = getPusherServer();

      const timestamp = new Date().toISOString();

      console.log('📡 Sending admin notifications for job acceptance...');

      // Get booking details for richer notifications
      const fullBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          pickupAddress: true,
          dropoffAddress: true,
        }
      });

      // 1. Notify admin-notifications channel for immediate alert (GREEN NOTIFICATION)
      await pusher.trigger('admin-notifications', 'driver-accepted-job', {
        type: 'job_accepted',
        severity: 'success',
        jobId: bookingId,
        bookingReference: booking.reference,
        driverId: driver.id,
        driverName: driverUser?.name || 'Unknown Driver',
        driverEmail: driverUser?.email,
        estimatedEarnings: fullBooking?.totalGBP ? `£${(fullBooking.totalGBP / 100).toFixed(2)}` : 'N/A',
        pickupAddress: fullBooking?.pickupAddress?.label || 'Unknown',
        dropoffAddress: fullBooking?.dropoffAddress?.label || 'Unknown',
        message: `${driverUser?.name || 'Driver'} accepted job ${booking.reference}`,
        acceptedAt: timestamp,
        timestamp
      });

      // 2. Notify admin-orders channel - order accepted
      await pusher.trigger('admin-orders', 'order-accepted', {
        jobId: bookingId,
        bookingReference: booking.reference,
        driverId: driver.id,
        driverName: driverUser?.name || 'Unknown Driver',
        estimatedEarnings: fullBooking?.totalGBP ? `£${(fullBooking.totalGBP / 100).toFixed(2)}` : 'N/A',
        acceptedAt: timestamp,
        timestamp
      });

      // 3. Notify admin-routes channel (in case job is part of route planning)
      await pusher.trigger('admin-routes', 'job-accepted', {
        jobId: bookingId,
        bookingReference: booking.reference,
        driverId: driver.id,
        driverName: driverUser?.name || 'Unknown Driver',
        timestamp
      });

      // 4. Notify admin drivers panel
      await pusher.trigger('admin-drivers', 'driver-accepted-job', {
        driverId: driver.id,
        driverName: driverUser?.name || 'Unknown Driver',
        jobId: bookingId,
        bookingReference: booking.reference,
        timestamp
      });

      // 5. Notify driver's other devices (sync across devices)
      await pusher.trigger(`driver-${driver.id}`, 'job-accepted-confirmed', {
        jobId: bookingId,
        bookingReference: booking.reference,
        status: 'accepted',
        timestamp
      });

      // 6. Notify customer tracking page
      await pusher.trigger(`booking-${booking.reference}`, 'driver-accepted', {
        driverName: driverUser?.name || 'Unknown Driver',
        acceptedAt: timestamp,
        message: 'Your driver has accepted the job and will contact you soon'
      });

      console.log('✅ Real-time notifications sent for job acceptance');
    } catch (pusherError) {
      console.error('⚠️ Failed to send Pusher notifications:', pusherError);
      console.error('⚠️ Error details:', pusherError instanceof Error ? pusherError.message : 'Unknown');
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({
      success: true,
      message: 'Job accepted successfully'
    });

  } catch (error) {
    console.error('❌ Driver Job Accept API - Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}