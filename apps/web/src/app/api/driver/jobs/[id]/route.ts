import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCrewRecommendation } from '@/lib/driver-notifications';
import { authenticateBearerToken } from '@/lib/bearer-auth';
// Fast mobile calculation - removed slow PerformanceTrackingService import
import { penceToPounds } from '@/lib/utils/currency';

// Helper function to derive timeSlot from scheduledAt
function getTimeSlotFromDate(scheduledAt: Date): string {
  const hour = scheduledAt.getHours();
  if (hour < 12) return '09:00-12:00'; // AM slot
  if (hour < 17) return '12:00-17:00'; // PM slot
  return '17:00-21:00'; // Evening slot
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: bookingId } = await params;

    // ✅ Get driver record FIRST (needed for earnings calculation)
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404 }
      );
    }

    // Get the complete booking data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        pickupProperty: true,
        dropoffProperty: true,
        BookingItem: true,
        Assignment: {
          include: {
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
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if the driver is assigned to this job (Assignment is an array)
    const isAssigned = booking.Assignment?.[0]?.Driver?.User?.id === userId;

    if (!isAssigned) {
      return NextResponse.json(
        { error: 'Access denied - You are not assigned to this job' },
        { status: 403 }
      );
    }

    // Generate crew recommendation (with timeout protection)
    let crewRecommendation = {
      recommendedDrivers: [],
      reasoning: 'Crew recommendation system placeholder',
      jobId: booking.id,
      requirements: null,
    };
    
    try {
      const crewPromise = generateCrewRecommendation(booking.id, booking);
      const crewTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Crew recommendation timeout')), 1000);
      });
      crewRecommendation = await Promise.race([crewPromise, crewTimeout]);
    } catch (crewError) {
      console.warn('⚠️ Crew recommendation failed or timed out, using placeholder:', crewError instanceof Error ? crewError.message : String(crewError));
      // Continue with placeholder - don't fail the request
    }

    const pickupAddress = booking.pickupAddress;
    const dropoffAddress = booking.dropoffAddress;
    const pickupProperty = booking.pickupProperty;
    const dropoffProperty = booking.dropoffProperty;

    // Calculate distance for pricing (using proper haversine formula)
    const lat1 = pickupAddress?.lat || 0;
    const lon1 = pickupAddress?.lng || 0;
    const lat2 = dropoffAddress?.lat || 0;
    const lon2 = dropoffAddress?.lng || 0;
    
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // ✅ Calculate actual earnings using driverEarningsService
    const { driverEarningsService } = await import('@/lib/services/driver-earnings-service');
    const earningsResult = await driverEarningsService.calculateEarnings({
      driverId: driver.id,
      bookingId: booking.id,
      assignmentId: booking.Assignment?.[0]?.id || `temp_${booking.id}`,
      customerPaymentPence: booking.totalGBP,
      distanceMiles: distance,
      durationMinutes: booking.estimatedDurationMinutes || 60,
      dropCount: 1,
      hasHelper: false,
      urgencyLevel: 'standard',
      onTimeDelivery: true,
    });
    const estimatedEarnings = earningsResult.breakdown.netEarnings / 100; // Convert to GBP
    
    console.log('📊 Job retrieved for driver:', {
      bookingId: booking.id,
      reference: booking.reference,
      distance: distance.toFixed(2),
      estimatedEarnings: estimatedEarnings.toFixed(2),
      note: 'Actual earnings calculated on completion',
    });

    // Format the response for the driver (excluding customer email)
    const jobDetails = {
      id: booking.id,
      reference: booking.reference,
      unifiedBookingId: booking.reference, // Using reference as unified ID
      customer: {
        name: booking.customerName,
        phone: booking.customerPhone,
        // Email is intentionally excluded for driver privacy
      },
      addresses: {
        pickup: {
          line1: pickupAddress?.label,
          postcode: pickupAddress?.postcode,
          coordinates: {
            lat: pickupAddress?.lat,
            lng: pickupAddress?.lng,
          },
        },
        dropoff: {
          line1: dropoffAddress?.label,
          postcode: dropoffAddress?.postcode,
          coordinates: {
            lat: dropoffAddress?.lat,
            lng: dropoffAddress?.lng,
          },
        },
      },
      properties: {
        pickup: {
          type: pickupProperty?.propertyType,
          floors: pickupProperty?.floors,
          hasElevator: pickupProperty?.accessType === 'WITH_LIFT',
          hasParking: true, // Default value
          accessType: pickupProperty?.accessType,
          buildingTypeDisplay: pickupProperty?.propertyType?.toLowerCase().replace('_', ' ') || 'house'
        },
        dropoff: {
          type: dropoffProperty?.propertyType,
          floors: dropoffProperty?.floors,
          hasElevator: dropoffProperty?.accessType === 'WITH_LIFT',
          hasParking: true, // Default value
          accessType: dropoffProperty?.accessType,
          buildingTypeDisplay: dropoffProperty?.propertyType?.toLowerCase().replace('_', ' ') || 'house'
        },
      },
      schedule: {
        date: booking.scheduledAt,
        timeSlot: booking.pickupTimeSlot || getTimeSlotFromDate(booking.scheduledAt),
        urgency: booking.urgency || 'scheduled',
        estimatedDuration: booking.estimatedDurationMinutes,
      },
      items: booking.BookingItem.map(item => ({
        name: item.name,
        quantity: item.quantity,
        volumeM3: item.volumeM3,
      })),
      // ✅ Include driver earnings calculated above
      driverPayout: earningsResult.breakdown.netEarnings, // Driver net pay in pence
      pricing: {
        driverPayout: penceToPounds(earningsResult.breakdown.netEarnings),
        driverPayoutPence: earningsResult.breakdown.netEarnings,
        estimatedEarnings: penceToPounds(earningsResult.breakdown.netEarnings),
        currency: 'GBP',
        isEstimate: false, // Using fast calculation
        calculationNote: 'Fast mobile calculation optimized for driver app performance'
      },
      // Pricing information is not exposed to drivers for privacy reasons
      // Drivers only see their earnings, not customer payment amounts
      crewRecommendation,
      specialRequirements: '',
      status: booking.status,
      assignment: booking.Assignment && booking.Assignment[0]
        ? {
            id: booking.Assignment[0].id,
            status: booking.Assignment[0].status,
            claimedAt: booking.Assignment[0].claimedAt,
            driver: {
              id: booking.Assignment[0].Driver?.id,
              name: booking.Assignment[0].Driver?.User?.name || 'Unknown',
            },
          }
        : null,
    };

    return NextResponse.json({
      success: true,
      job: jobDetails,
    });
  } catch (error) {
    console.error('❌ Error fetching driver job details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: bookingId } = await params;
    const { action } = await request.json();

    // Get the booking and assignment
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        Assignment: {
          include: {
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
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check if the driver is assigned to this job (Assignment is an array)
    const isAssigned = booking.Assignment?.[0]?.Driver?.User?.id === userId;
    if (!isAssigned) {
      return NextResponse.json(
        { error: 'Access denied - You are not assigned to this job' },
        { status: 403 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'accept':
        updateData = {
          status: 'claimed',
          claimedAt: new Date(),
        };
        break;

      case 'start':
        updateData = {
          status: 'in_progress',
          startedAt: new Date(),
        };
        break;

      case 'complete':
        updateData = {
          status: 'completed',
          completedAt: new Date(),
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update the assignment (Assignment is an array)
    const updatedAssignment = await prisma.assignment.update({
      where: { id: booking.Assignment![0].id },
      data: updateData,
    });

    // Create a job event log
    await prisma.jobEvent.create({
      data: {
        id: `je_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assignmentId: booking.Assignment![0].id,
        step:
          action === 'accept'
            ? 'navigate_to_pickup'
            : action === 'start'
              ? 'loading_started'
              : 'job_completed',
        createdBy: userId,
        notes: `Driver ${action}ed the job`,
        payload: {
          action,
          timestamp: new Date().toISOString(),
          driverId: userId,
        },
        mediaUrls: [],
      },
    });

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error('❌ Error updating driver job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}
