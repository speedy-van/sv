import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { code: reference } = params;

    // Get booking with all related data
    const booking = await prisma.booking.findFirst({
      where: { reference },
      include: {
        BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
        BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
        Driver: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                isActive: true
              }
            }
          }
        },
        Assignment: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found', reference },
        { status: 404 }
      );
    }

    // Check driver jobs eligibility
    const now = new Date();
    const isConfirmed = booking.status === 'CONFIRMED';
    const hasNoDriver = booking.driverId === null;
    const isInFuture = booking.scheduledAt > now;
    const hasNoAssignment = !booking.Assignment;

    const shouldAppearInJobs = isConfirmed && hasNoDriver && isInFuture && hasNoAssignment;

    // Count total eligible jobs
    const totalEligibleJobs = await prisma.booking.count({
      where: {
        status: 'CONFIRMED',
        driverId: null,
        scheduledAt: { gte: now }
      }
    });

    // Get recent eligible jobs for comparison
    const recentEligibleJobs = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        driverId: null,
        scheduledAt: { gte: now }
      },
      select: {
        id: true,
        reference: true,
        customerName: true,
        scheduledAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        driverId: booking.driverId,
        scheduledAt: booking.scheduledAt,
        createdAt: booking.createdAt,
        paidAt: booking.paidAt,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        driverName: booking.Driver?.User?.name || null,
        hasAssignment: !!booking.Assignment,
        assignmentStatus: booking.Assignment?.status || null,
        pickupAddress: booking.BookingAddress_Booking_pickupAddressIdToBookingAddress?.label,
        dropoffAddress: booking.BookingAddress_Booking_dropoffAddressIdToBookingAddress?.label
      },
      eligibility: {
        isConfirmed,
        hasNoDriver,
        isInFuture,
        hasNoAssignment,
        shouldAppearInJobs,
        reasons: [
          !isConfirmed && `Status is ${booking.status}, not CONFIRMED`,
          !hasNoDriver && `Already assigned to driver: ${booking.Driver?.User?.name}`,
          !isInFuture && `Scheduled time is in the past: ${booking.scheduledAt}`,
          !hasNoAssignment && `Has assignment record with status: ${booking.Assignment?.status}`
        ].filter(Boolean)
      },
      context: {
        totalEligibleJobs,
        currentTime: now,
        recentEligibleJobs
      },
      recommendations: shouldAppearInJobs 
        ? ['Booking should appear in driver jobs - check driver dashboard']
        : [
            !isConfirmed && 'Update booking status to CONFIRMED',
            !hasNoDriver && 'Remove driver assignment',
            !isInFuture && 'Update scheduled time to future date',
            !hasNoAssignment && 'Remove assignment record'
          ].filter(Boolean)
    });

  } catch (error) {
    console.error('❌ Diagnostic API error:', error);
    return NextResponse.json(
      { error: 'Diagnostic failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}