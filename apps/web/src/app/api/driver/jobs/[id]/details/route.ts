import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSmartSuggestions } from '@/lib/utils/smart-suggestions';
import { penceToPounds } from '@/lib/utils/currency';

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in miles
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Helper function to derive timeSlot from scheduledAt
function getTimeSlotFromDate(scheduledAt: Date): string {
  const hour = scheduledAt.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 Job details API called:', {
      jobId: params.id,
      url: request.url
    });

    // Check driver authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'driver') {
      console.log('❌ User is not a driver:', { userRole, userId: session.user.id });
      return NextResponse.json(
        { error: 'Forbidden - Driver access required' },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const bookingId = params.id;

    console.log('✅ Driver authenticated:', { userId, userRole, bookingId });

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { id: true }
    });

    console.log('🔍 Driver lookup result:', { driver, userId });

    if (!driver) {
      console.log('❌ Driver profile not found for user:', userId);
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404 }
      );
    }

    // Get booking with complete details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        pickupProperty: true,
        dropoffProperty: true,
        BookingItem: true,
        customer: {
          select: { id: true, name: true, email: true }
        },
        Assignment: {
          include: {
            JobEvent: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    });

    console.log('🔍 Booking lookup result:', { 
      bookingId, 
      found: !!booking,
      bookingDriverId: booking?.driverId,
      bookingStatus: booking?.status,
      hasAssignment: !!booking?.Assignment
    });

    if (!booking) {
      console.log('❌ Booking not found:', bookingId);
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check if driver has access to this job
    const isAssignedToDriver = booking.driverId === driver.id;
    const hasAssignment = !!booking.Assignment;
    
    // Check if this is an available job (matches the logic in available jobs API)
    const isAvailableJob = (() => {
      if (booking.status === 'CONFIRMED' && !booking.driverId) {
        return true;
      }
      if (booking.status === 'PENDING_PAYMENT' && !booking.driverId) {
        // Check if created within last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return booking.createdAt >= fiveMinutesAgo;
      }
      return false;
    })();

    console.log('🔍 Job access check:', {
      bookingId,
      driverId: driver.id,
      bookingDriverId: booking.driverId,
      bookingStatus: booking.status,
      hasAssignment: !!booking.Assignment,
      isAssignedToDriver,
      isAvailableJob,
      createdAt: booking.createdAt,
      fiveMinutesAgo: new Date(Date.now() - 5 * 60 * 1000),
      driverIdType: typeof driver.id,
      bookingDriverIdType: typeof booking.driverId,
      idsMatch: driver.id === booking.driverId
    });

    if (!isAssignedToDriver && !isAvailableJob) {
      console.log('❌ Access denied for job:', bookingId);
      return NextResponse.json(
        { 
          error: 'You do not have access to this job',
          details: {
            jobId: bookingId,
            driverId: driver.id,
            bookingDriverId: booking.driverId,
            bookingStatus: booking.status,
            isAssignedToDriver,
            isAvailableJob
          }
        },
        { status: 403 }
      );
    }

    // Calculate distance
    const pickupAddr = booking.pickupAddress;
    const dropoffAddr = booking.dropoffAddress;
    const pickupProp = booking.pickupProperty;
    const dropoffProp = booking.dropoffProperty;
    const items = booking.BookingItem || [];

    // 🚨 CRITICAL: Validate coordinates before calculating distance
    const pickupLat = pickupAddr?.lat;
    const pickupLng = pickupAddr?.lng;
    const dropoffLat = dropoffAddr?.lat;
    const dropoffLng = dropoffAddr?.lng;
    
    // Check for valid UK coordinates (rough bounds)
    const isValidUKCoord = (lat: number, lng: number) => {
      return Number.isFinite(lat) && Number.isFinite(lng) && 
             lat >= 49 && lat <= 61 && lng >= -8 && lng <= 2;
    };
    
    let distance = 0;
    if (isValidUKCoord(pickupLat, pickupLng) && isValidUKCoord(dropoffLat, dropoffLng)) {
      distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng);
      
      // ✅ Validate distance - no fallback, use actual value
      if (distance > 1000) {
        console.warn(`⚠️ Large distance detected: ${distance} miles`);
      }
      if (distance <= 0) {
        console.warn(`⚠️ Invalid distance: ${distance} miles - using 0`);
        distance = 0;
      }
    } else {
      console.error('❌ INVALID COORDINATES:', { pickupLat, pickupLng, dropoffLat, dropoffLng });
      distance = 0;
    }

    // ✅ Calculate actual earnings using driverEarningsService
    const { driverEarningsService } = await import('@/lib/services/driver-earnings-service');
    const earningsResult = await driverEarningsService.calculateEarnings({
      driverId: driver.id,
      bookingId: booking.id,
      assignmentId: booking.Assignment?.id || `temp_${booking.id}`,
      customerPaymentPence: booking.totalGBP,
      distanceMiles: distance,
      durationMinutes: booking.estimatedDurationMinutes || 60,
      dropCount: 1,
      hasHelper: false,
      urgencyLevel: 'standard',
      onTimeDelivery: true,
    });
    const estimatedEarnings = earningsResult.breakdown.netEarnings / 100; // Convert to GBP
    
    console.log('📊 Job details retrieved:', {
      bookingId: booking.id,
      distance: distance,
      estimatedEarnings: estimatedEarnings,
      note: 'Actual earnings calculated on completion',
    });

    // Calculate required workers based on items
    const totalVolume = items.reduce((sum, item) => sum + (item.volumeM3 * item.quantity), 0);
    const heavyItems = items.filter(item => item.volumeM3 > 0.5).length;
    const requiredWorkers = totalVolume > 10 || heavyItems > 3 ? 2 : 1;

    // Generate smart suggestions
    const smartSuggestions = generateSmartSuggestions(
      items,
      pickupProp,
      dropoffProp,
      booking.scheduledAt,
      pickupAddr?.postcode,
      dropoffAddr?.postcode
    );

    // Format job details
    const jobDetails = {
      // Basic job info
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      
      // Assignment info
      assignment: booking.Assignment ? {
        id: booking.Assignment.id,
        status: booking.Assignment.status,
        acceptedAt: booking.Assignment.claimedAt,
        expiresAt: booking.Assignment.expiresAt,
        events: booking.Assignment.JobEvent ? booking.Assignment.JobEvent.map((event: any) => ({
          step: event.step,
          completedAt: event.createdAt,
          notes: event.notes,
          payload: event.payload
        })) : [],
        currentStep: booking.Assignment.JobEvent && booking.Assignment.JobEvent.length > 0 
          ? booking.Assignment.JobEvent[booking.Assignment.JobEvent.length - 1].step 
          : 'navigate_to_pickup'
      } : null,
      
      // Customer information
      customer: {
        name: booking.customer?.name || booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone,
        canContact: true
      },
      
      // Addresses and properties
      pickup: {
        address: pickupAddr?.label || 'Pickup address not specified',
        postcode: pickupAddr?.postcode,
        coordinates: {
          lat: pickupAddr?.lat,
          lng: pickupAddr?.lng
        },
        property: {
          type: pickupProp?.propertyType,
          floors: pickupProp?.floors || 0,
          hasElevator: pickupProp?.accessType === 'WITH_LIFT',
          hasParking: true, // Default value, could be added to schema later
          accessType: pickupProp?.accessType,
          buildingTypeDisplay: pickupProp?.propertyType?.toLowerCase().replace('_', ' ') || 'house',
          flatNumber: (pickupProp as any)?.flatNumber || null, // Check if available in extended schema
          parkingDetails: (pickupProp as any)?.parkingDetails || 'Please check with customer',
          accessNotes: pickupProp?.accessType === 'WITH_LIFT' ? 
            'Lift access available' : 
            pickupProp?.floors > 0 ? 
              `Stair access only - ${pickupProp.floors} floor${pickupProp.floors > 1 ? 's' : ''}` :
              'Ground floor access'
        },
        zones: {
          isULEZ: ['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2', 'SE1', 'E1'].some(prefix => 
            pickupAddr?.postcode?.toUpperCase().startsWith(prefix) || false
          ),
          isLEZ: ['N1', 'E2', 'E8', 'SE11'].some(prefix => 
            pickupAddr?.postcode?.toUpperCase().startsWith(prefix) || false
          ),
          hasCongestionCharge: ['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2'].some(prefix => 
            pickupAddr?.postcode?.toUpperCase().startsWith(prefix) || false
          )
        }
      },
      
      dropoff: {
        address: dropoffAddr?.label || 'Dropoff address not specified',
        postcode: dropoffAddr?.postcode,
        coordinates: {
          lat: dropoffAddr?.lat,
          lng: dropoffAddr?.lng
        },
        property: {
          type: dropoffProp?.propertyType,
          floors: dropoffProp?.floors || 0,
          hasElevator: dropoffProp?.accessType === 'WITH_LIFT',
          hasParking: true, // Default value, could be added to schema later
          accessType: dropoffProp?.accessType,
          buildingTypeDisplay: dropoffProp?.propertyType?.toLowerCase().replace('_', ' ') || 'house',
          flatNumber: (dropoffProp as any)?.flatNumber || null, // Check if available in extended schema
          parkingDetails: (dropoffProp as any)?.parkingDetails || 'Please check with customer',
          accessNotes: dropoffProp?.accessType === 'WITH_LIFT' ? 
            'Lift access available' : 
            dropoffProp?.floors > 0 ? 
              `Stair access only - ${dropoffProp.floors} floor${dropoffProp.floors > 1 ? 's' : ''}` :
              'Ground floor access'
        },
        zones: {
          isULEZ: ['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2', 'SE1', 'E1'].some(prefix => 
            dropoffAddr?.postcode?.toUpperCase().startsWith(prefix) || false
          ),
          isLEZ: ['N1', 'E2', 'E8', 'SE11'].some(prefix => 
            dropoffAddr?.postcode?.toUpperCase().startsWith(prefix) || false
          ),
          hasCongestionCharge: ['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2'].some(prefix => 
            dropoffAddr?.postcode?.toUpperCase().startsWith(prefix) || false
          )
        }
      },
      
      // Schedule
      schedule: {
        scheduledAt: booking.scheduledAt,
        pickupTimeSlot: booking.pickupTimeSlot || getTimeSlotFromDate(booking.scheduledAt),
        urgency: booking.urgency || 'scheduled',
        estimatedDuration: booking.estimatedDurationMinutes,
        crewSize: booking.crewSize
      },
      
      // Items to move with pictures
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        volume: item.volumeM3,
        volumeDisplay: `${item.volumeM3.toFixed(2)} m³`,
        // Item pictures if available (from JSON field or separate table)
        pictures: (item as any).pictures || (item as any).images || []
      })),
      
      // Financial details - REAL DRIVER EARNINGS (not customer price)
      driverPayout: earningsResult.breakdown.netEarnings, // Driver net pay in pence
      pricing: {
        // ✅ Driver's actual earnings (what they receive)
        driverPayout: penceToPounds(earningsResult.breakdown.netEarnings),
        driverPayoutPence: earningsResult.breakdown.netEarnings,
        estimatedEarnings: penceToPounds(earningsResult.breakdown.netEarnings),
        currency: 'GBP',
        // No extended breakdown available here; using primary breakdown only
        earningsBreakdown: null,
        warnings: [],
        
        // Customer payment (for reference only - NOT what driver receives)
        customerPaidTotal: penceToPounds(booking.totalGBP),
        customerPaidTotalPence: booking.totalGBP,
      },
      
      // Logistics with warnings
      logistics: {
        distance: distance,
        distanceDisplay: `${distance.toFixed(1)} miles`,
        estimatedDuration: Math.ceil(distance / 20),
        estimatedDurationDisplay: `${Math.ceil(distance / 20)}h ${Math.ceil((distance % 20) * 3)}m`,
        requiredWorkers: requiredWorkers,
        recommendedWorkers: requiredWorkers === 2 ? '2 workers recommended due to heavy items or volume' : '1 worker sufficient',
        crewSize: booking.crewSize || 'TWO',
        // Road warnings
        warnings: []
      },
      
      // Additional info
      metadata: {
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        baseDistance: booking.baseDistanceMiles,
        isAssignedToYou: isAssignedToDriver,
        isAvailable: isAvailableJob
      },
      
      // Smart suggestions for driver
      smartSuggestions: smartSuggestions,
      
      // Additional driver notes
      notes: {
        customerNotes: (booking as any).notes || null,
        cameraNote: (booking as any).cameraNote || null, // Camera/video notes if available
        specialInstructions: (booking as any).specialRequirements || null
      },
      
      // Comprehensive road warnings
      roadWarnings: {
        warnings: [
          ...((['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2', 'SE1', 'E1'].some(prefix => 
            pickupAddr?.postcode?.toUpperCase().startsWith(prefix) || 
            dropoffAddr?.postcode?.toUpperCase().startsWith(prefix)
          )) ? ['⚠️ ULEZ Zone - Ultra Low Emission Zone charges may apply'] : []),
          
          ...((['N1', 'E1', 'E2', 'E3', 'E8', 'E9', 'E14', 'SE1', 'SE5', 'SE8', 'SE10', 'SE11', 'SE15', 'SE16', 'SE17'].some(prefix => 
            pickupAddr?.postcode?.toUpperCase().startsWith(prefix) || 
            dropoffAddr?.postcode?.toUpperCase().startsWith(prefix)
          )) ? ['⚠️ LEZ Zone - Low Emission Zone charges may apply for older vehicles'] : []),
          
          ...((['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2'].some(prefix => 
            pickupAddr?.postcode?.toUpperCase().startsWith(prefix) || 
            dropoffAddr?.postcode?.toUpperCase().startsWith(prefix)
          )) ? ['⚠️ Congestion Charge Zone - £15 daily charge (Mon-Fri 7am-6pm, excluding bank holidays)'] : [])
        ],
        hasWarnings: (
          (['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2', 'SE1', 'E1'].some(prefix => 
            pickupAddr?.postcode?.toUpperCase().startsWith(prefix) || 
            dropoffAddr?.postcode?.toUpperCase().startsWith(prefix)
          )) ||
          (['N1', 'E1', 'E2', 'E3', 'E8', 'E9', 'E14', 'SE1'].some(prefix => 
            pickupAddr?.postcode?.toUpperCase().startsWith(prefix) || 
            dropoffAddr?.postcode?.toUpperCase().startsWith(prefix)
          )) ||
          (['EC1', 'EC2', 'EC3', 'EC4', 'WC1', 'WC2'].some(prefix => 
            pickupAddr?.postcode?.toUpperCase().startsWith(prefix) || 
            dropoffAddr?.postcode?.toUpperCase().startsWith(prefix)
          ))
        )
      }
    };

    console.log(`✅ Job details loaded for driver ${driver.id}:`, {
      bookingId,
      reference: booking.reference,
      isAssigned: isAssignedToDriver,
      estimatedEarnings: earningsResult.breakdown.netEarnings
    });

    return NextResponse.json({
      success: true,
      data: jobDetails
    });

  } catch (error) {
    console.error('❌ Error loading job details:', error);
    return NextResponse.json(
      {
        error: 'Failed to load job details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
