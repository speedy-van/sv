import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Driver access required' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      select: { id: true },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver record not found' },
        { status: 404 }
      );
    }

    // Get driver's assigned jobs
    const myAssignments = await prisma.assignment.findMany({
      where: {
        driverId: driver.id,
        status: {
          in: ['accepted', 'completed'] // Removed 'in_progress' since it's not in enum
        }
      },
      include: {
        Booking: {
          include: {
            BookingAddress_Booking_pickupAddressIdToBookingAddress: {
              select: {
                label: true,
                postcode: true,
                lat: true,
                lng: true,
              }
            },
            BookingAddress_Booking_dropoffAddressIdToBookingAddress: {
              select: {
                label: true,
                postcode: true,
                lat: true,
                lng: true,
              }
            },
            PropertyDetails_Booking_pickupPropertyIdToPropertyDetails: {
              select: {
                propertyType: true,
                accessType: true,
                floors: true,
              }
            },
            PropertyDetails_Booking_dropoffPropertyIdToPropertyDetails: {
              select: {
                propertyType: true,
                accessType: true,
                floors: true,
              }
            },
            BookingItem: {
              select: {
                name: true,
                quantity: true,
                volumeM3: true,
              }
            },
            User: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        JobEvent: {
          select: {
            step: true,
            createdAt: true,
            notes: true,
            payload: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Transform assignments to match frontend interface
    const transformedJobs = myAssignments.map(assignment => {
      const booking = assignment.Booking;
      
      if (!booking) return null;

      // Get addresses with correct field names
      const pickupAddr = booking.BookingAddress_Booking_pickupAddressIdToBookingAddress;
      const dropoffAddr = booking.BookingAddress_Booking_dropoffAddressIdToBookingAddress;
      
      // Calculate distance - fix the calculation
      const distance = calculateDistance(
        pickupAddr?.lat || 0,
        pickupAddr?.lng || 0,
        dropoffAddr?.lat || 0,
        dropoffAddr?.lng || 0
      );

      // TEMPORARY: Use simple calculation until Prisma includes are fixed
      // ✅ Rough estimate for display - actual calculated on completion
      const totalAmount = booking.totalGBP;
      const estimatedEarnings = Math.floor(totalAmount * 0.85); // Rough estimate

      // Calculate required workers based on items
      const totalVolume = booking.BookingItem.reduce((sum, item) => sum + (item.volumeM3 * item.quantity), 0);
      const heavyItems = booking.BookingItem.filter(item => item.volumeM3 > 0.5).length;
      const requiredWorkers = totalVolume > 10 || heavyItems > 3 ? 2 : 1;

      // Get latest job event
      const latestEvent = assignment.JobEvent?.[0];

      return {
        id: booking.id,
        assignmentId: assignment.id,
        bookingReference: booking.reference,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone || '',
        pickupAddress: {
          label: pickupAddr?.label || '',
          postcode: pickupAddr?.postcode || '',
          lat: pickupAddr?.lat || 0,
          lng: pickupAddr?.lng || 0,
        },
        dropoffAddress: {
          label: dropoffAddr?.label || '',
          postcode: dropoffAddr?.postcode || '',
          lat: dropoffAddr?.lat || 0,
          lng: dropoffAddr?.lng || 0,
        },
        pickupProperty: {
          type: booking.PropertyDetails_Booking_pickupPropertyIdToPropertyDetails?.propertyType || 'Unknown',
          accessType: booking.PropertyDetails_Booking_pickupPropertyIdToPropertyDetails?.accessType || 'Unknown',
          floors: booking.PropertyDetails_Booking_pickupPropertyIdToPropertyDetails?.floors || 0,
        },
        dropoffProperty: {
          type: booking.PropertyDetails_Booking_dropoffPropertyIdToPropertyDetails?.propertyType || 'Unknown',
          accessType: booking.PropertyDetails_Booking_dropoffPropertyIdToPropertyDetails?.accessType || 'Unknown',
          floors: booking.PropertyDetails_Booking_dropoffPropertyIdToPropertyDetails?.floors || 0,
        },
        scheduledDate: booking.scheduledAt?.toISOString() || new Date().toISOString(),
        timeSlot: booking.pickupTimeSlot || 'Flexible',
        estimatedDuration: Math.ceil(distance / 20),
        distance: distance,
        // Only show driver payout - never expose customer total
        estimatedEarnings: estimatedEarnings,
        items: booking.BookingItem.map(item => ({
          name: item.name,
          quantity: item.quantity,
          volumeM3: item.volumeM3,
        })),
        requiredWorkers: requiredWorkers,
        crewSize: booking.crewSize || 'TWO',
        specialInstructions: '', // notes field doesn't exist
        priority: determinePriority(booking),
        status: assignment.status,
        currentStep: latestEvent?.step || null,
        lastStepCompleted: latestEvent?.createdAt?.toISOString(),
        expiresAt: assignment.expiresAt?.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        acceptedAt: assignment.claimedAt?.toISOString(),
        updatedAt: assignment.updatedAt.toISOString(),
      };
    }).filter(job => job !== null);

    console.log('✅ My jobs loaded for driver:', driver.id, 'Jobs count:', transformedJobs.length);

    return NextResponse.json({
      success: true,
      data: transformedJobs,
    });

  } catch (error) {
    console.error('❌ Error fetching my jobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch my jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions (same as in available jobs)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

function determinePriority(booking: any): 'normal' | 'high' | 'urgent' {
  const scheduledDate = booking.scheduledAt ? new Date(booking.scheduledAt) : new Date();
  const now = new Date();
  const hoursUntilScheduled = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilScheduled < 2) return 'urgent';
  if (hoursUntilScheduled < 6) return 'high';
  return 'normal';
}
