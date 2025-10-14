import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  createSuccessResponse, 
  createAuthErrorResponse,
  createErrorResponse,
  generateRequestId 
} from '@/lib/api-response';

interface CustomerStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalSpent: number;
  nextBooking?: {
    id: string;
    scheduledFor: string;
    status: string;
    pickupLocation: string;
    dropoffLocation: string;
    totalGBP: number;
  };
  recentBookings: Array<{
    id: string;
    createdAt: string;
    status: string;
    pickupLocation: string;
    dropoffLocation: string;
    totalGBP: number;
    driver?: {
      name: string;
      phone: string;
    };
  }>;
}

async function getCustomerDashboard(request: NextRequest): Promise<NextResponse> {
  const requestId = generateRequestId();
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(createAuthErrorResponse('Authentication required', requestId));
  }

  const userId = session.user.id;

  try {
    // Get customer stats in parallel for better performance
    const [
      totalBookings,
      activeBookings,
      completedBookings,
      totalSpentResult,
      nextBooking,
      recentBookings
    ] = await Promise.all([
      // Total bookings count
      prisma.booking.count({
        where: { customerId: userId }
      }),

      // Active bookings (confirmed, in progress)
      prisma.booking.count({
        where: { 
          customerId: userId,
          status: { in: ['CONFIRMED'] }
        }
      }),

      // Completed bookings
      prisma.booking.count({
        where: { 
          customerId: userId,
          status: 'COMPLETED'
        }
      }),

      // Total amount spent
      prisma.booking.aggregate({
        _sum: { totalGBP: true },
        where: { 
          customerId: userId,
          status: 'COMPLETED'
        }
      }),

      // Next upcoming booking
      prisma.booking.findFirst({
        where: { 
          customerId: userId,
          status: { in: ['CONFIRMED', 'DRAFT'] },
          scheduledAt: { gte: new Date() }
        },
        orderBy: { scheduledAt: 'asc' },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          reference: true,
          totalGBP: true,
          pickupAddress: {
            select: {
              label: true,
              postcode: true
            }
          },
          dropoffAddress: {
            select: {
              label: true,
              postcode: true
            }
          }
        }
      }),

      // Recent bookings (last 10)
      prisma.booking.findMany({
        where: { customerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          createdAt: true,
          status: true,
          pickupAddress: {
            select: {
              label: true,
              postcode: true
            }
          },
          dropoffAddress: {
            select: {
              label: true,
              postcode: true
            }
          },
          totalGBP: true,
          driver: {
            select: {
              id: true,
              User: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })
    ]);

    const stats: CustomerStats = {
      totalBookings,
      activeBookings,
      completedBookings,
      totalSpent: totalSpentResult._sum.totalGBP || 0,
      nextBooking: nextBooking ? {
        id: nextBooking.id,
        scheduledFor: nextBooking.scheduledAt?.toISOString() || new Date().toISOString(),
        status: nextBooking.status,
        pickupLocation: nextBooking.pickupAddress?.label || '',
        dropoffLocation: nextBooking.dropoffAddress?.label || '',
        totalGBP: nextBooking.totalGBP || 0
      } : undefined,
      recentBookings: recentBookings.map(booking => ({
        id: booking.id,
        createdAt: booking.createdAt.toISOString(),
        status: booking.status,
        pickupLocation: booking.pickupAddress?.label || '',
        dropoffLocation: booking.dropoffAddress?.label || '',
        totalGBP: booking.totalGBP || 0,
        driver: booking.driver ? {
          name: (booking.driver as any).User?.name || '',
          phone: (booking.driver as any).User?.email || ''
        } : undefined
      }))
    };

    return NextResponse.json(createSuccessResponse(stats, 'Customer dashboard data retrieved successfully', requestId));

  } catch (error) {
    console.error(`[${requestId}] Customer dashboard API error:`, error);
    return NextResponse.json(createErrorResponse(
      'Failed to fetch customer dashboard data',
      'INTERNAL_ERROR',
      requestId,
      undefined,
      500
    ));
  }
}

export const GET = getCustomerDashboard;
